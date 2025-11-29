/* eslint-env node */
/* global process */
import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx';
import puppeteer from 'puppeteer';

// Small helper: convert integer (0..999999) to French words (basic)
const numberToFrenchWords = (n) => {
  const units = ['zéro','un','deux','trois','quatre','cinq','six','sept','huit','neuf','dix','onze','douze','treize','quatorze','quinze','seize'];
  const tens = ['', '', 'vingt','trente','quarante','cinquante','soixante','soixante','quatre-vingt','quatre-vingt'];

  if (n < 0) return 'moins ' + numberToFrenchWords(-n);
  if (n <= 16) return units[n];
  if (n < 20) return 'dix-' + units[n - 10];
  if (n < 100) {
    const u = n % 10;
    const t = Math.floor(n / 10);
    if (t === 7 || t === 9) {
      // 70..79 = soixante-dix..soixante-dix-neuf ; 90..99 = quatre-vingt-dix..quatre-vingt-dix-neuf
      const base = t === 7 ? 60 : 80;
      const rem = n - base;
      return numberToFrenchWords(base) + '-' + numberToFrenchWords(rem);
    }
    if (u === 1 && (t === 1 || t === 3 || t === 4 || t === 5 || t === 6 || t === 8)) return tens[t] + '-et-un';
    return tens[t] + (u ? '-' + units[u] : '');
  }
  if (n < 1000) {
    const h = Math.floor(n / 100);
    const rem = n % 100;
    const hText = h === 1 ? 'cent' : units[h] + ' cent';
    return hText + (rem ? ' ' + numberToFrenchWords(rem) : '');
  }
  if (n < 1000000) {
    const th = Math.floor(n / 1000);
    const rem = n % 1000;
    const thText = th === 1 ? 'mille' : numberToFrenchWords(th) + ' mille';
    return thText + (rem ? ' ' + numberToFrenchWords(rem) : '');
  }
  return String(n);
};

// Helper: build an invoice HTML for PDF generation with improved layout fidelity
const buildInvoiceHtml = (invoice, cssInline = '') => {
  const subtotal = (invoice.serviceLines || []).reduce((s, l) => s + (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0), 0);
  const tva = +(subtotal * 0.19).toFixed(2);
  const timbreFiscal = 1.0;
  const totalTTC = +(subtotal + tva + timbreFiscal).toFixed(2);

  const rowsHtml = (invoice.serviceLines || []).map(l => `
    <tr>
      <td class="desc">${(l.service || '')}</td>
      <td class="qty">${l.quantity || 0}</td>
      <td class="pu">${(Number(l.unitPrice) || 0).toFixed(2)}</td>
      <td class="line">${((Number(l.quantity) || 0) * (Number(l.unitPrice) || 0)).toFixed(2)}</td>
    </tr>
  `).join('');

  const amountInWords = numberToFrenchWords(Math.round(totalTTC));

  return `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8"/>
      <title>Facture - ${invoice.clientName || ''}</title>
      <style>
        /* inline client CSS (if provided) */
        ${cssInline}
        /* Template-specific print layout to match provided example */
        @page { size: A4; margin: 18mm; }
        body { font-family: 'DejaVu Sans', Arial, Helvetica, sans-serif; font-size:12px; color:#111; }
        .header { display:flex; justify-content:space-between; align-items:flex-start; }
        .company { font-weight:700; font-size:18px; }
        .company small { display:block; font-weight:400; font-size:11px; }
        .hr { border-top:2px solid #000; margin:10px 0; }
        .meta { text-align:right; font-size:11px; }
        .client-vehicle { display:flex; justify-content:space-between; margin-top:8px; }
        .section-title { margin-top:14px; font-weight:700; }
        table.services { width:100%; border-collapse:collapse; margin-top:8px; }
        table.services thead th { background:#fff; border:1px solid #111; padding:8px; }
        table.services tbody td { border:1px solid #ddd; padding:10px; }
        td.desc { width:60%; }
        td.qty, td.pu, td.line { text-align:right; width:13%; }
        .totals-box { width:360px; margin-top:12px; float:right; border:1px solid #111; padding:8px; }
        .totals-box table { width:100%; border-collapse:collapse; }
        .totals-box td { padding:4px 6px; }
        .totals-box .total { font-weight:700; font-size:16px; border-top:2px solid #111; padding-top:6px; }
        .footer { clear:both; margin-top:18px; font-style:italic; font-size:11px; }
        .currency { margin-left:6px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="company">STE AJK PERFECT AUTO</div>
          <div class="company-info">
            <small>171 Mostapha Mohsen-Borj Louzir 2073</small>
            <small>Tel: 98 201 461</small>
            <small>RIB: 05203000072300271066</small>
          </div>
        </div>
        <div class="meta">
          <div>Date de facturation</div>
          <div>${invoice.createdAt || new Date().toLocaleString('fr-FR')}</div>
        </div>
      </div>

      <div class="hr"></div>

      <div class="client-vehicle">
        <div class="client">
          <div><strong>Nom du Client</strong></div>
          <div>${invoice.clientName || ''}</div>
          <div style="margin-top:8px;"><strong>Immatriculation</strong></div>
          <div>${invoice.registration || ''}</div>
        </div>
        <div class="vehicle">
          <div><strong>Voiture</strong></div>
          <div>${invoice.car || ''}</div>
        </div>
      </div>

      <div class="hr"></div>

      <div class="section-title">Services</div>
      <table class="services" role="table">
        <thead>
          <tr>
            <th style="text-align:left;">Désignation Service</th>
            <th style="text-align:right;">Quantité</th>
            <th style="text-align:right;">P.U. HT (TND) <span class="currency">د.ت</span></th>
            <th style="text-align:right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <div class="totals-box">
        <table>
          <tr><td>Sous-total HT</td><td style="text-align:right;">${subtotal.toFixed(2)} <span class="currency">د.ت</span></td></tr>
          <tr><td>TOTAL TVA (19%)</td><td style="text-align:right;">${tva.toFixed(2)} <span class="currency">د.ت</span></td></tr>
          <tr><td>TIMBRE FISCAL</td><td style="text-align:right;">${timbreFiscal.toFixed(2)} <span class="currency">د.ت</span></td></tr>
          <tr class="total"><td>TOTAL TTC</td><td style="text-align:right;">${totalTTC.toFixed(2)} <span class="currency">د.ت</span></td></tr>
        </table>
      </div>

      <div class="footer">
        Arrêtée la présente facture à la somme de: ${amountInWords} <span class="currency">د.ت</span>
      </div>

    </body>
  </html>`;
};

const app = express();
app.use(cors());
app.use(express.json());

// Serve built frontend if present (for packaged app)
try {
  const distPath = path.resolve(__dirname, '..', 'dist');
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }
} catch (e) {
  console.warn('Error checking for dist folder', e.message);
}

// Reuse a single SQLite connection via sqlite/open
const dbPromise = open({
  filename: './invoices.db',
  driver: sqlite3.Database
});

const ensureSchema = async () => {
  const db = await dbPromise;
  await db.exec('PRAGMA foreign_keys = ON');
  await db.exec(`
    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      clientName TEXT,
      registration TEXT,
      car TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS service_lines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoiceId INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
      service TEXT,
      quantity INTEGER,
      unitPrice REAL
    )
  `);
};

ensureSchema().catch((err) => {
  console.error('Failed to ensure SQLite schema', err);
  process.exit(1);
});

app.post('/api/invoices', async (req, res) => {
  try {
    const { clientName, registration, car, serviceLines = [] } = req.body;
    if (!clientName?.trim()) {
      return res.status(400).json({ message: 'clientName is required' });
    }

    const db = await dbPromise;
    const result = await db.run(
      `INSERT INTO invoices (clientName, registration, car) VALUES (?, ?, ?)`,
      [clientName, registration, car]
    );

    const invoiceId = result.lastID;
    if (Array.isArray(serviceLines) && serviceLines.length > 0) {
      const stmt = await db.prepare(
        `INSERT INTO service_lines (invoiceId, service, quantity, unitPrice) VALUES (?, ?, ?, ?)`
      );
      try {
        for (const line of serviceLines) {
          await stmt.run(
            invoiceId,
            line.service ?? '',
            Number(line.quantity) || 0,
            Number(line.unitPrice) || 0
          );
        }
      } finally {
        await stmt.finalize();
      }
    }

    res.status(201).json({ id: invoiceId });
  } catch (error) {
    console.error('Failed to create invoice', error);
    res.status(500).json({ message: 'Failed to create invoice' });
  }
});

// Export invoice: save JSON file (optional) and append row to exports/excel/factures.xlsx
app.post('/api/export-invoice', async (req, res) => {
  try {
    const invoice = req.body;
    if (!invoice || !invoice.clientName) {
      return res.status(400).json({ message: 'Invoice payload invalid' });
    }

    const root = path.resolve('./exports');
    const jsonDir = path.join(root, 'json');
    const excelDir = path.join(root, 'excel');
    if (!fs.existsSync(jsonDir)) fs.mkdirSync(jsonDir, { recursive: true });
    if (!fs.existsSync(excelDir)) fs.mkdirSync(excelDir, { recursive: true });

    // Save invoice JSON named by client (kept in exports/json)
    const safeName = invoice.clientName.replace(/[^a-z0-9-_]/gi, '_');
    const fileName = `${safeName}_${Date.now()}.json`;
    const filePath = path.join(jsonDir, fileName);
    fs.writeFileSync(filePath, JSON.stringify(invoice, null, 2), 'utf8');

    // Prepare row for Excel
    const subtotal = (invoice.serviceLines || []).reduce((s, l) => s + (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0), 0);
    const tva = subtotal * 0.19;
    const timbreFiscal = 1;
    const totalTTC = subtotal + tva + timbreFiscal;

    const servicesText = (invoice.serviceLines || []).map(l => `${l.service || ''} x${l.quantity || 0} @${l.unitPrice || 0}`).join(' ; ');

    const excelPath = path.join(excelDir, 'factures.xlsx');
    let wb;
    let ws;
    if (fs.existsSync(excelPath)) {
      wb = XLSX.readFile(excelPath);
      ws = wb.Sheets[wb.SheetNames[0]];
    } else {
      wb = XLSX.utils.book_new();
      ws = XLSX.utils.aoa_to_sheet([['ID','Client','Immatriculation','Véhicule','Date','Total_TTC','Services']]);
      XLSX.utils.book_append_sheet(wb, ws, 'Factures');
    }

    const existing = XLSX.utils.sheet_to_json(ws, { defval: '' });
    const nextId = existing.length + 1;
    const row = {
      ID: invoice.id || nextId,
      Client: invoice.clientName,
      Immatriculation: invoice.registration || '',
      Vehicule: invoice.car || '',
      Date: invoice.createdAt || new Date().toISOString(),
      Total_TTC: totalTTC,
      Services: servicesText
    };
    existing.push(row);
    const newWs = XLSX.utils.json_to_sheet(existing, { header: ['ID','Client','Immatriculation','Véhicule','Date','Total_TTC','Services'] });
    wb.Sheets[wb.SheetNames[0]] = newWs;
    XLSX.writeFile(wb, excelPath);

    res.json({ message: 'Exported', json: fileName, excel: path.basename(excelPath) });
  } catch (err) {
    console.error('Failed to export invoice', err);
    res.status(500).json({ message: 'Failed to export invoice' });
  }
});

// Export invoice as PDF: generate PDF with Puppeteer and save under ./exports
app.post('/api/export-pdf', async (req, res) => {
  try {
    const invoice = req.body;
    if (!invoice || !invoice.clientName) return res.status(400).json({ message: 'Invalid invoice' });

    const root = path.resolve('./exports');
    const pdfDir = path.join(root, 'pdf');
    if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });

    const safeName = invoice.clientName.replace(/[^a-z0-9-_]/gi, '_');
    const fileName = `${safeName}_${Date.now()}.pdf`;
    const filePath = path.join(pdfDir, fileName);

    // Build HTML and inline app print CSS if available
    let cssInline = '';
    try {
      const cssPath = path.resolve('../src/index.css');
      if (fs.existsSync(cssPath)) {
        cssInline = fs.readFileSync(cssPath, 'utf8');
      } else {
        // Try alternate path when server is run from project root
        const altCss = path.resolve('./src/index.css');
        if (fs.existsSync(altCss)) cssInline = fs.readFileSync(altCss, 'utf8');
      }
    } catch (e) {
      console.warn('Could not read client CSS for PDF inlining', e.message);
    }

    // If client sent full HTML (pre-rendered), prefer it for pixel-perfect output
    let html;
    if (typeof invoice.html === 'string' && invoice.html.trim().length > 0) {
      // Wrap fragment into a full document and inject cssInline
      const fragment = invoice.html;
      html = `<!doctype html><html><head><meta charset="utf-8"><title>Facture - ${invoice.clientName || ''}</title><style>${cssInline}</style></head><body>${fragment}</body></html>`;
    } else {
      html = buildInvoiceHtml(invoice, cssInline);
    }

    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    // Set content and wait for the body to render
    await page.setContent(html, { waitUntil: 'networkidle0' });
    try {
      await page.waitForSelector('body', { timeout: 3000 });
    } catch (e) {
      // ignore timeout; continue
    }
    // Emulate print CSS so @media print rules apply
    try { await page.emulateMediaType('print'); } catch (e) { /* ignore if not supported */ }

    // Generate PDF with small scale to try to keep output to a single page
    await page.pdf({ path: filePath, format: 'A4', printBackground: true, margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' }, scale: 0.95, preferCSSPageSize: true });
    await browser.close();

    res.json({ message: 'PDF exported', file: path.join('pdf', fileName) });
  } catch (err) {
    console.error('Failed to export PDF', err);
    res.status(500).json({ message: 'Failed to export PDF' });
  }
});

app.put('/api/invoices/:id', async (req, res) => {
  try {
    const invoiceId = Number(req.params.id);
    if (!invoiceId) {
      return res.status(400).json({ message: 'Identifiant invalide' });
    }

    const { clientName, registration, car, serviceLines = [] } = req.body;
    if (!clientName?.trim()) {
      return res.status(400).json({ message: 'clientName is required' });
    }

    const db = await dbPromise;
    const existing = await db.get(`SELECT id FROM invoices WHERE id = ?`, invoiceId);
    if (!existing) {
      return res.status(404).json({ message: 'Facture introuvable' });
    }

    await db.run(
      `UPDATE invoices SET clientName = ?, registration = ?, car = ? WHERE id = ?`,
      [clientName, registration, car, invoiceId]
    );

    await db.run(`DELETE FROM service_lines WHERE invoiceId = ?`, invoiceId);

    if (Array.isArray(serviceLines) && serviceLines.length > 0) {
      const stmt = await db.prepare(
        `INSERT INTO service_lines (invoiceId, service, quantity, unitPrice) VALUES (?, ?, ?, ?)`
      );
      try {
        for (const line of serviceLines) {
          await stmt.run(
            invoiceId,
            line.service ?? '',
            Number(line.quantity) || 0,
            Number(line.unitPrice) || 0
          );
        }
      } finally {
        await stmt.finalize();
      }
    }

    res.json({ message: 'Facture mise à jour' });
  } catch (error) {
    console.error('Failed to update invoice', error);
    res.status(500).json({ message: 'Failed to update invoice' });
  }
});

app.delete('/api/invoices/:id', async (req, res) => {
  try {
    const invoiceId = Number(req.params.id);
    if (!invoiceId) {
      return res.status(400).json({ message: 'Identifiant invalide' });
    }

    const db = await dbPromise;
    const result = await db.run(`DELETE FROM invoices WHERE id = ?`, invoiceId);
    if (result.changes === 0) {
      // Already removed or never existed; treat as idempotent success
      return res.status(204).send();
    }

    res.status(204).send();
  } catch (error) {
    console.error('Failed to delete invoice', error);
    res.status(500).json({ message: 'Failed to delete invoice' });
  }
});

app.get('/api/invoices', async (_req, res) => {
  try {
    const db = await dbPromise;
    const invoices = await db.all(
      `SELECT * FROM invoices ORDER BY datetime(createdAt) DESC`
    );

    for (const invoice of invoices) {
      invoice.serviceLines = await db.all(
        `SELECT service, quantity, unitPrice FROM service_lines WHERE invoiceId = ?`,
        invoice.id
      );
    }

    res.json(invoices);
  } catch (error) {
    console.error('Failed to list invoices', error);
    res.status(500).json({ message: 'Failed to fetch invoices' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});


