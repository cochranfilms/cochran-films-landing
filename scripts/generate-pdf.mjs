import puppeteer from 'puppeteer';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  const root = resolve(__dirname, '..');
  const htmlPath = resolve(root, 'toolkit-pro.html');
  const html = await readFile(htmlPath, 'utf8');

  const browser = await puppeteer.launch({ headless: 'new', args: ['--font-render-hinting=medium'] });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });

  // Ensure fonts load
  await page.evaluateHandle('document.fonts.ready');

  const pdfPath = resolve(root, 'assets/Production_Toolkit.pdf');

  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '10mm', right: '8mm', bottom: '10mm', left: '8mm' }
  });

  await browser.close();
  console.log('PDF generated at:', pdfPath);
}

main().catch((err) => { console.error(err); process.exit(1); });


