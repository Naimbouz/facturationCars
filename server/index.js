/* eslint-env node */
/* global process */
import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const app = express();
app.use(cors());
app.use(express.json());

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


