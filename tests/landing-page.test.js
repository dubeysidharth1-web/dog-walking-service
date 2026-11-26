import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const indexPath = path.join(projectRoot, 'index.html');
const stylesPath = path.join(projectRoot, 'styles.css');
const appPath = path.join(projectRoot, 'app.js');

function readRequiredFile(filePath, friendlyName) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing implementation file: ${friendlyName} (${filePath})`);
  }
  return fs.readFileSync(filePath, 'utf8');
}

async function loadAppModule() {
  if (!fs.existsSync(appPath)) {
    throw new Error(`Missing implementation file: app.js (${appPath})`);
  }
  const moduleUrl = `${pathToFileURL(appPath).href}?cacheBust=${Date.now()}-${Math.random()}`;
  return import(moduleUrl);
}

async function setupLandingPage(options = {}) {
  const html = readRequiredFile(indexPath, 'index.html');
  document.documentElement.innerHTML = html;
  const appModule = await loadAppModule();
  if (typeof appModule.initApp !== 'function') {
    throw new Error('Expected app.js to export an initApp(doc, options) function');
  }
  const controller = appModule.initApp(document, options);
  return { appModule, controller };
}

function fillValidBookingForm(doc, overrides = {}) {
  const values = {
    ownerName: 'Demo Owner',
    ownerEmail: 'owner@example.com',
    dogName: 'Bruno',
    serviceTier: 'solo-walk',
    walkDate: '2026-12-01',
    notes: 'Prefers shaded park trails.',
    ...overrides
  };

  doc.querySelector('#owner-name').value = values.ownerName;
  doc.querySelector('#owner-email').value = values.ownerEmail;
  doc.querySelector('#dog-name').value = values.dogName;
  doc.querySelector('#service-tier').value = values.serviceTier;
  doc.querySelector('#walk-date').value = values.walkDate;
  doc.querySelector('#walk-notes').value = values.notes;
}

describe('ENG-11833: Static Landing Page — Files & Pure Stack Constraints', () => {
  it('provides index.html, styles.css, and app.js at the project root', () => {
    expect(fs.existsSync(indexPath)).toBe(true);
    expect(fs.existsSync(stylesPath)).toBe(true);
    expect(fs.existsSync(appPath)).toBe(true);
  });

  it('uses pure HTML5 and vanilla CSS without React, Tailwind, Bootstrap, or external UI frameworks', () => {
    const html = readRequiredFile(indexPath, 'index.html');
    const forbiddenPatterns = [
      /react/i,
      /next\.js|__next/i,
      /tailwindcss|cdn\.tailwindcss\.com/i,
      /bootstrap/i,
      /material-ui|mui/i,
      /chakra-ui/i
    ];

    for (const pattern of forbiddenPatterns) {
      expect(html).not.toMatch(pattern);
    }
    expect(html).toMatch(/<link[^>]+href=["']\.?\/?styles\.css["']/i);
    expect(html).toMatch(/<script[^>]+src=["']\.?\/?app\.js["']/i);
  });

  it('defines a monochromatic corporate CSS system with 16px/32px spacing, responsive rules, and focus styles', () => {
    const css = readRequiredFile(stylesPath, 'styles.css');
    expect(css).toMatch(/16px/);
    expect(css).toMatch(/32px/);
    expect(css).toMatch(/@media\s*\(/);
    expect(css).toMatch(/:focus-visible/);
  });
});

describe('ENG-11833: Semantic HTML5 & Accessibility', () => {
  beforeEach(async () => {
    await setupLandingPage({ submitDelayMs: 10 });
  });

  afterEach(() => {
    document.documentElement.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('uses semantic landmarks (header, nav, main, section, footer) and a single h1 heading', () => {
    expect(document.querySelector('header')).not.toBeNull();
    expect(document.querySelector('nav')).not.toBeNull();
    expect(document.querySelector('main')).not.toBeNull();
    expect(document.querySelectorAll('section').length).toBeGreaterThanOrEqual(3);
    expect(document.querySelector('footer')).not.toBeNull();
    expect(document.querySelectorAll('h1')).toHaveLength(1);
  });

  it('provides a skip link and appropriate ARIA labels on navigation and form regions', () => {
    const skipLink = document.querySelector('a[href="#main-content"]');
    expect(skipLink).not.toBeNull();

    const nav = document.querySelector('nav');
    expect(nav?.getAttribute('aria-label')).toBeTruthy();

    const form = document.querySelector('#booking-form');
    expect(form).not.toBeNull();
    expect(
      form?.getAttribute('aria-label') || form?.getAttribute('aria-labelledby')
    ).toBeTruthy();
  });

  it('associates every form control with a visible label and includes a polite live region', () => {
    const requiredIds = [
      'owner-name',
      'owner-email',
      'dog-name',
      'service-tier',
      'walk-date',
      'walk-notes'
    ];

    for (const id of requiredIds) {
      const input = document.getElementById(id);
      const label = document.querySelector(`label[for="${id}"]`);
      expect(input).not.toBeNull();
      expect(label).not.toBeNull();
      expect(label?.textContent?.trim().length).toBeGreaterThan(0);
    }

    const liveRegion = document.querySelector('[aria-live="polite"]');
    expect(liveRegion).not.toBeNull();
  });

  it('uses native keyboard-accessible controls for navigation and form submission', () => {
    const submitBtn = document.querySelector('#booking-form button[type="submit"]');
    expect(submitBtn).not.toBeNull();
    expect(submitBtn?.tagName).toBe('BUTTON');
    expect(document.querySelectorAll('div[role="button"], span[role="button"]')).toHaveLength(0);
  });
});

describe('ENG-11833: Empty State, Form Validation & Edge Cases', () => {
  beforeEach(async () => {
    await setupLandingPage({ submitDelayMs: 10 });
  });

  afterEach(() => {
    document.documentElement.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('renders an informative empty state before any walk requests are submitted', () => {
    const emptyState = document.querySelector('[data-testid="empty-state"]');
    expect(emptyState).not.toBeNull();
    expect(emptyState?.hidden).toBe(false);
    expect(emptyState?.textContent?.trim().length).toBeGreaterThan(0);
  });

  it('blocks empty form submission, marks invalid fields with aria-invalid, and does not log analytics', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const form = document.querySelector('#booking-form');

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await new Promise((resolve) => setTimeout(resolve, 25));

    expect(document.querySelector('#owner-name')?.getAttribute('aria-invalid')).toBe('true');
    expect(document.querySelector('#owner-email')?.getAttribute('aria-invalid')).toBe('true');
    expect(document.querySelector('#dog-name')?.getAttribute('aria-invalid')).toBe('true');
    expect(document.querySelector('#walk-date')?.getAttribute('aria-invalid')).toBe('true');

    const errorMessages = Array.from(document.querySelectorAll('[data-error-for]'))
      .map((el) => el.textContent?.trim())
      .filter(Boolean);
    expect(errorMessages.length).toBeGreaterThanOrEqual(4);

    expect(logSpy).not.toHaveBeenCalledWith('[Analytics] User interacted with Static Landing Page');
  });

  it('treats whitespace-only text inputs as empty and rejects invalid email formats', async () => {
    fillValidBookingForm(document, {
      ownerName: '   ',
      ownerEmail: 'not-a-valid-email',
      dogName: '   '
    });

    const form = document.querySelector('#booking-form');
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await new Promise((resolve) => setTimeout(resolve, 25));

    expect(document.querySelector('#owner-name')?.getAttribute('aria-invalid')).toBe('true');
    expect(document.querySelector('#owner-email')?.getAttribute('aria-invalid')).toBe('true');
    expect(document.querySelector('#dog-name')?.getAttribute('aria-invalid')).toBe('true');
  });

  it('clears previous validation errors and aria-invalid attributes once valid inputs are submitted', async () => {
    const form = document.querySelector('#booking-form');
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    expect(document.querySelector('#owner-name')?.getAttribute('aria-invalid')).toBe('true');

    fillValidBookingForm(document);
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await new Promise((resolve) => setTimeout(resolve, 30));

    expect(document.querySelector('#owner-name')?.getAttribute('aria-invalid')).not.toBe('true');
    expect(document.querySelector('#owner-email')?.getAttribute('aria-invalid')).not.toBe('true');
    expect(document.querySelector('#dog-name')?.getAttribute('aria-invalid')).not.toBe('true');
  });
});

describe('ENG-11833: Input Sanitization & Safe State Storage', () => {
  let appModule;
  let controller;

  beforeEach(async () => {
    const setup = await setupLandingPage({ submitDelayMs: 10 });
    appModule = setup.appModule;
    controller = setup.controller;
  });

  afterEach(() => {
    document.documentElement.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('exports a sanitizeInput helper that trims whitespace and neutralizes HTML/script characters', () => {
    expect(typeof appModule.sanitizeInput).toBe('function');

    const dirty = '  <script>alert("xss")</script> & <b>Bruno</b>  ';
    const cleaned = appModule.sanitizeInput(dirty);

    expect(cleaned.startsWith(' ')).toBe(false);
    expect(cleaned.endsWith(' ')).toBe(false);
    expect(cleaned).not.toContain('<script>');
    expect(cleaned).not.toContain('</script>');
    expect(cleaned).not.toContain('<');
    expect(cleaned).not.toContain('>');
  });

  it('sanitizes text inputs before storing them in application state and prevents DOM injection', async () => {
    fillValidBookingForm(document, {
      ownerName: '  <img src=x onerror=alert(1)>Alex Mercer  ',
      dogName: '  <b>Rex</b>  ',
      notes: '  <script>stealCookies()</script>Needs water break  '
    });

    const form = document.querySelector('#booking-form');
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await new Promise((resolve) => setTimeout(resolve, 30));

    const requests = controller.getState().requests;
    expect(requests).toHaveLength(1);
    expect(requests[0].ownerName).not.toContain('<img');
    expect(requests[0].dogName).not.toContain('<b>');
    expect(requests[0].notes).not.toContain('<script>');

    const listEl = document.querySelector('[data-testid="request-list"]');
    expect(listEl?.querySelector('img')).toBeNull();
    expect(listEl?.querySelector('script')).toBeNull();
    expect(listEl?.querySelector('b')).toBeNull();
  });
});

describe('ENG-11833: Loading Indicator, State Updates & Exact Analytics Logging', () => {
  let controller;

  beforeEach(async () => {
    const setup = await setupLandingPage({ submitDelayMs: 60 });
    controller = setup.controller;
  });

  afterEach(() => {
    document.documentElement.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('displays a loading indicator, disables submit, and prevents duplicate submissions while async work is pending', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    fillValidBookingForm(document);

    const form = document.querySelector('#booking-form');
    const submitBtn = form.querySelector('button[type="submit"]');
    const loadingIndicator = document.querySelector('[data-testid="loading-indicator"]');

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    expect(submitBtn.disabled).toBe(true);
    expect(form.getAttribute('aria-busy')).toBe('true');
    expect(loadingIndicator?.hidden).toBe(false);

    // Attempt a duplicate submission while pending
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    await new Promise((resolve) => setTimeout(resolve, 90));

    expect(submitBtn.disabled).toBe(false);
    expect(form.getAttribute('aria-busy')).toBe('false');
    expect(loadingIndicator?.hidden).toBe(true);

    expect(controller.getState().requests).toHaveLength(1);
    const analyticsCalls = logSpy.mock.calls.filter(
      ([msg]) => msg === '[Analytics] User interacted with Static Landing Page'
    );
    expect(analyticsCalls).toHaveLength(1);
  });

  it('replaces the empty state with the submitted request and logs the exact analytics message upon completion', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    fillValidBookingForm(document);

    const form = document.querySelector('#booking-form');
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    await new Promise((resolve) => setTimeout(resolve, 90));

    const emptyState = document.querySelector('[data-testid="empty-state"]');
    const items = document.querySelectorAll('[data-testid="request-list"] li');

    expect(emptyState?.hidden).toBe(true);
    expect(items).toHaveLength(1);
    expect(items[0].textContent).toContain('Bruno');
    expect(logSpy).toHaveBeenCalledWith('[Analytics] User interacted with Static Landing Page');
  });
});
