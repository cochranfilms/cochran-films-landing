#!/usr/bin/env node
/**
 * Create Stripe Products + monthly Prices for Cochran Films retainer packages.
 *
 * Usage (from repo root):
 *   cp .env.example .env   # if you have not already
 *   # Set STRIPE_SECRET_KEY=sk_test_... in .env
 *   npm run stripe:setup-retainers
 *
 * Safe to re-run — skips products that already exist (matched by metadata catalog_id).
 */

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Stripe = require('stripe');

const PACKAGE_SOURCE = 'cochran-films-landing-service-builder';

const RETAINERS = [
  {
    envKey: 'STRIPE_PRICE_FAST_FRAME',
    catalogId: 'fast-frame-monthly',
    name: 'Fast Frame (1 Month)',
    description:
      'Monthly content retainer — 4 professionally crafted 30 sec–1 min videos OR 3 podcast episodes per month.',
    amountCents: 250000,
    commitmentMonths: 1,
  },
  {
    envKey: 'STRIPE_PRICE_CINEMATIC_SPOTLIGHT',
    catalogId: 'cinematic-spotlight',
    name: 'Cinematic Spotlight (2 Months)',
    description:
      '2-month content retainer — 6 videos OR 5 podcast episodes. Billed monthly on the same date each month.',
    amountCents: 480000,
    commitmentMonths: 2,
  },
  {
    envKey: 'STRIPE_PRICE_MASTERPIECE',
    catalogId: 'masterpiece-collection',
    name: 'Masterpiece Collection (3 Months)',
    description:
      '3-month content retainer — 9 videos OR 7 podcast episodes. Billed monthly on the same date each month.',
    amountCents: 700000,
    commitmentMonths: 3,
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

async function ensureRetainer(stripe, def) {
  let product = await findProductByCatalogId(stripe, def.catalogId);

  if (!product) {
    product = await stripe.products.create({
      name: def.name,
      description: def.description,
      metadata: {
        catalog_id: def.catalogId,
        source: PACKAGE_SOURCE,
        category: 'retainer',
        commitment_months: String(def.commitmentMonths),
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
        category: 'retainer',
        commitment_months: String(def.commitmentMonths),
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
        commitment_months: String(def.commitmentMonths),
        billing_model: 'subscription_send_invoice',
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
    console.error('3. npm run stripe:setup-retainers\n');
    process.exit(1);
  }

  const stripe = new Stripe(secret);
  const mode = secret.startsWith('sk_live') ? 'LIVE' : 'TEST';
  console.log(`\nStripe retainer setup (${mode})\n`);

  const results = [];
  for (const def of RETAINERS) {
    results.push(await ensureRetainer(stripe, def));
  }

  console.log('\n--- Add to .env and Vercel ---\n');
  for (const { def, price } of results) {
    console.log(`${def.envKey}=${price.id}`);
  }

  console.log('\n--- Catalog IDs (for services-catalog.json billing.stripePriceId) ---\n');
  for (const { def, price } of results) {
    console.log(`${def.catalogId} → ${price.id}`);
  }

  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    let envText = fs.readFileSync(envPath, 'utf8');
    let addedHeader = envText.includes('# Retainer Stripe Price IDs');
    for (const { def, price } of results) {
      const line = `${def.envKey}=${price.id}`;
      const re = new RegExp(`^${def.envKey}=.*$`, 'm');
      if (re.test(envText)) {
        envText = envText.replace(re, line);
      } else {
        if (!addedHeader) {
          envText += envText.endsWith('\n') ? '' : '\n';
          envText += '\n# Retainer Stripe Price IDs (npm run stripe:setup-retainers)\n';
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
