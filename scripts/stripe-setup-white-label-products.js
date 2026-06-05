#!/usr/bin/env node
/**
 * Create Stripe Products + monthly Prices for Cochran Films white-label packages.
 *
 * Usage (from repo root):
 *   cp .env.example .env   # if you have not already
 *   # Set STRIPE_SECRET_KEY=sk_test_... in .env
 *   npm run stripe:setup-white-label
 *
 * Safe to re-run — skips products that already exist (matched by metadata catalog_id).
 */

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Stripe = require('stripe');

const PACKAGE_SOURCE = 'cochran-films-landing-service-builder';

const WHITE_LABEL_PACKAGES = [
  {
    envKey: 'STRIPE_PRICE_WHITE_LABEL_LAUNCH',
    catalogId: 'white-label-launch',
    name: 'White-Label Launch System',
    description:
      'White-label agency partner plan — $2,500 setup, then $199/mo. 3-page site, funnel, lead capture, and essential automations.',
    amountCents: 19900,
  },
  {
    envKey: 'STRIPE_PRICE_WHITE_LABEL_GROWTH',
    catalogId: 'white-label-growth',
    name: 'White-Label Growth System',
    description:
      'White-label agency partner plan — $4,500 setup, then $349/mo. CMS, member area, CRM pipeline, and advanced analytics.',
    amountCents: 34900,
  },
  {
    envKey: 'STRIPE_PRICE_WHITE_LABEL_DOMINATION',
    catalogId: 'white-label-domination',
    name: 'White-Label Domination System',
    description:
      'White-label agency partner plan — $8,500 setup, then $699/mo. SaaS-lite features, billing setup, dashboards, and API integrations.',
    amountCents: 69900,
  },
];

async function findProductByCatalogId(stripe, catalogId) {
  const result = await stripe.products.search({
    query: `metadata['catalog_id']:'${catalogId}' AND active:'true'`,
    limit: 1,
  });
  return result.data[0] || null;
}

async function findMonthlyPrice(stripe, productId) {
  const prices = await stripe.prices.list({
    product: productId,
    active: true,
    limit: 20,
  });
  return (
    prices.data.find(
      (p) =>
        p.type === 'recurring' &&
        p.recurring?.interval === 'month' &&
        p.recurring?.interval_count === 1
    ) || null
  );
}

async function ensureWhiteLabel(stripe, def) {
  let product = await findProductByCatalogId(stripe, def.catalogId);

  if (!product) {
    product = await stripe.products.create({
      name: def.name,
      description: def.description,
      metadata: {
        catalog_id: def.catalogId,
        source: PACKAGE_SOURCE,
        category: 'white-label',
        billing_model: 'setup_then_monthly',
      },
    });
    console.log(`✓ Created product: ${product.name} (${product.id})`);
  } else {
    product = await stripe.products.update(product.id, {
      name: def.name,
      description: def.description,
      metadata: {
        catalog_id: def.catalogId,
        source: PACKAGE_SOURCE,
        category: 'white-label',
        billing_model: 'setup_then_monthly',
      },
    });
    console.log(`• Product exists: ${product.name} (${product.id})`);
  }

  let price = await findMonthlyPrice(stripe, product.id);

  if (!price) {
    price = await stripe.prices.create({
      product: product.id,
      currency: 'usd',
      unit_amount: def.amountCents,
      recurring: { interval: 'month', interval_count: 1 },
      metadata: {
        catalog_id: def.catalogId,
        billing_model: 'setup_then_monthly',
      },
    });
    await stripe.products.update(product.id, { default_price: price.id });
    console.log(`  ✓ Created monthly price: ${price.id} ($${(def.amountCents / 100).toFixed(2)}/mo)`);
  } else if (price.unit_amount !== def.amountCents) {
    console.warn(
      `  ⚠ Price ${price.id} amount is $${(price.unit_amount / 100).toFixed(2)} — expected $${(def.amountCents / 100).toFixed(2)}. Archive old price in Dashboard and re-run if you need a new amount.`
    );
  } else {
    console.log(`  • Monthly price exists: ${price.id} ($${(def.amountCents / 100).toFixed(2)}/mo)`);
  }

  return { def, product, price };
}

async function main() {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret || secret.includes('your_') || secret.includes('...')) {
    console.error('\nMissing STRIPE_SECRET_KEY in .env\n');
    console.error('1. cp .env.example .env');
    console.error('2. Set STRIPE_SECRET_KEY=sk_test_... (or sk_live_...)');
    console.error('3. npm run stripe:setup-white-label\n');
    process.exit(1);
  }

  const stripe = new Stripe(secret);
  const mode = secret.startsWith('sk_live') ? 'LIVE' : 'TEST';
  console.log(`\nStripe white-label setup (${mode})\n`);

  const results = [];
  for (const def of WHITE_LABEL_PACKAGES) {
    results.push(await ensureWhiteLabel(stripe, def));
  }

  console.log('\n--- Add to .env and Vercel ---\n');
  for (const { def, price } of results) {
    console.log(`${def.envKey}=${price.id}`);
  }

  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    let envText = fs.readFileSync(envPath, 'utf8');
    let addedHeader = envText.includes('# White-label Stripe Price IDs');
    for (const { def, price } of results) {
      const line = `${def.envKey}=${price.id}`;
      const re = new RegExp(`^${def.envKey}=.*$`, 'm');
      if (re.test(envText)) {
        envText = envText.replace(re, line);
      } else {
        if (!addedHeader) {
          envText += envText.endsWith('\n') ? '' : '\n';
          envText += '\n# White-label Stripe Price IDs (npm run stripe:setup-white-label)\n';
          addedHeader = true;
        }
        envText += `${line}\n`;
      }
    }
    fs.writeFileSync(envPath, envText);
    console.log('\n✓ Updated .env with price IDs (file is gitignored)\n');
  } else {
    console.log('\nTip: create .env from .env.example — re-run to auto-append price IDs.\n');
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
