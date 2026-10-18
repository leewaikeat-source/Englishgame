import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
const browser = await chromium.launch({ ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}), args: ['--no-sandbox'] });
const baseURL = process.env.TEST_URL || 'http://127.0.0.1:5173/';
const answers = ['Open burning','Forest fires','Air pollution','Suffocate','Visibility','Respiratory problems','Eye irritation','Stay indoors','Wear a face mask','Stay hydrated'];
const errors = [];
await mkdir('test-results', { recursive: true });
async function accessible(page, name) { const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze(); assert.deepEqual(results.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) })), [], name + ' has no automated WCAG A/AA violations'); }
async function noOverflow(page) { assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, 'No horizontal page overflow'); }
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, reducedMotion: 'reduce', acceptDownloads: true });
  const page = await context.newPage(); page.on('pageerror', e => errors.push(e.message));
  await page.goto(baseURL);
  await page.getByRole('heading', { name: /Small words/ }).waitFor();
  await noOverflow(page);
  await accessible(page, 'Welcome');
  await page.screenshot({ path: 'test-results/welcome-mobile.png', fullPage: true });
  await page.getByLabel(/Your hero display name/).fill('Aina Hero');
  await page.getByLabel(/Your class/).fill('4 Cemerlang');
  await page.getByRole('radio', { name: /Sunshine Star/ }).check();
  await page.getByRole('button', { name: /Review your mission/ }).click();
  await page.getByRole('heading', { name: 'Ready, Aina Hero?' }).waitFor();
  await page.getByRole('button', { name: 'Start Mission' }).click();
  await accessible(page, 'Question');
  for (let i = 0; i < 10; i++) {
    if (i === 2) {
      await page.waitForTimeout(250);
      await page.reload();
      await page.getByRole('heading', { name: /Let’s clear the air/ }).waitFor();
      assert.match(await page.locator('.game-stats').innerText(), /3\s*\/10/);
    }
    const option = page.getByRole('button', { name: new RegExp('^[ABC] ' + answers[i] + '$') });
    await option.click();
    await page.getByRole('button', { name: i === 9 ? 'See My Results' : 'Next Question' }).waitFor();
    assert.equal(await page.locator('.option:enabled').count(), 0, 'Feedback locks all answer buttons');
    assert.match(await page.locator('.scene-meter').innerText(), new RegExp(`${90 - i * 10}%`));
    if (i === 0) { await accessible(page, 'Feedback'); const score = await page.locator('.game-stats').innerText(); await page.waitForTimeout(1100); assert.equal(await page.locator('.game-stats').innerText(), score, 'Feedback timer pauses'); }
    await noOverflow(page);
    if (i === 4) await page.screenshot({ path: 'test-results/game-mobile.png', fullPage: true });
    await page.getByRole('button', { name: i === 9 ? 'See My Results' : 'Next Question' }).click();
  }
  await page.getByRole('heading', { name: 'THANK YOU, HAZE HERO!' }).waitFor();
  assert.match(await page.locator('.certificate').innerText(), /100% haze cleared/);
  await accessible(page, 'Certificate');
  const certificate = await page.locator('.certificate').boundingBox();
  assert.ok(certificate.height < 700, 'Essential certificate fits a typical phone screenshot');
  await page.screenshot({ path: 'test-results/result-mobile.png', fullPage: true });
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download PNG' }).click();
  const download = await downloadPromise;
  await download.saveAs('test-results/certificate.png');
  assert.ok(download.suggestedFilename().endsWith('.png'));
  await page.reload(); await page.getByRole('heading', { name: 'THANK YOU, HAZE HERO!' }).waitFor();
  assert.match(await page.locator('.certificate').innerText(), /Aina Hero/);
  await page.getByRole('button', { name: /Play Again/ }).click();
  await page.getByLabel(/Your hero display name/).fill('Wind Hero');
  await page.getByRole('button', { name: /Review your mission/ }).click();
  await page.getByRole('button', { name: 'Start Mission' }).click();
  for (let i = 0; i < 10; i++) {
    const opts = page.locator('.option');
    for (let n = 0; n < 3; n++) if (!(await opts.nth(n).innerText()).includes(answers[i])) { await opts.nth(n).click(); break; }
    await page.getByRole('button', { name: i === 9 ? 'See My Results' : 'Next Question' }).click();
  }
  await page.getByRole('heading', { name: 'GOOD EFFORT, HAZE HERO!' }).waitFor();
  assert.match(await page.locator('.certificate').innerText(), /0% haze cleared/);
  assert.match(await page.locator('.scene-meter').innerText(), /100%/);
  await page.goto(baseURL + '#/teacher');
  await page.getByRole('heading', { name: 'Every hero’s progress.' }).waitFor();
  assert.match(await page.locator('.teacher').innerText(), /Online scores not configured/);
  assert.equal(await page.getByRole('table').count(), 0);
  await accessible(page, 'Teacher fallback');
  await noOverflow(page);
  await context.close();
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 1000 } }); desktop.on('pageerror', e => errors.push(e.message));
  await desktop.goto(baseURL); await desktop.getByRole('heading', { name: /Small words/ }).waitFor();
  await noOverflow(desktop); await desktop.screenshot({ path: 'test-results/welcome-desktop.png', fullPage: true });
  for (const width of [320, 768, 1024]) { await desktop.setViewportSize({ width, height: 900 }); await noOverflow(desktop); }
  assert.deepEqual(errors, [], 'No browser JavaScript errors');
  console.log('PASS: perfect and wrong-answer missions, restored progress/results, locked answers, feedback timing, haze, mobile certificate, PNG, teacher fallback, 320–1440px layouts, automated WCAG A/AA scans; no JS errors.');
} finally { await browser.close(); }
