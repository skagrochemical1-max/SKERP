const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');
const { deductStockFIFO, reverseStockDeductions } = require('../backend/utils/stockHelper');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8000;
const API_SECRET = process.env.API_SECRET || 'sk_agro_secure_key_2026';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.text({ type: '*/*' })); // To handle text/plain content-type with JSON body (like Google Apps Script bypass)

// Database Connection Pool
// Database Connection Pool
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'invoice_builder',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let realPool;
let useLocalDb = false;

try {
  realPool = mysql.createPool(dbConfig);
  console.log(`MySQL connection pool created for database "${dbConfig.database}" at ${dbConfig.host}:${dbConfig.port}`);
} catch (error) {
  console.error('CRITICAL: Failed to initialize MySQL connection pool.');
  console.error(error);
  useLocalDb = true;
}

// Local DB JSON fallback helper
const fs = require('fs');
const DB_FILE = path.resolve(__dirname, 'db.json');

function initLocalDb() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({
      products: [],
      clients: [],
      invoices: []
    }, null, 2));
  }
}

async function queryLocalDb(sql, params) {
  initLocalDb();
  let db;
  try {
    db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (e) {
    db = { products: [], clients: [], invoices: [] };
  }

  const sqlNormalized = sql.trim().replace(/\s+/g, ' ');

  // 1. PRODUCTS
  if (sqlNormalized.startsWith('SELECT * FROM products')) {
    const data = [...db.products].sort((a, b) => new Date(b.LastUpdated) - new Date(a.LastUpdated));
    return [data];
  }
  if (sqlNormalized.startsWith('INSERT INTO products')) {
    const [ProductID, BrandName, ProductName, PackagingSize, UnitPrice, LastUpdated] = params;
    db.products = db.products.filter(p => p.ProductID !== ProductID);
    db.products.push({ ProductID, BrandName, ProductName, PackagingSize, UnitPrice: parseFloat(UnitPrice), LastUpdated });
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
    return [{ affectedRows: 1 }];
  }
  if (sqlNormalized.startsWith('UPDATE products SET')) {
    const [BrandName, ProductName, PackagingSize, UnitPrice, LastUpdated, ProductID] = params;
    const item = db.products.find(p => p.ProductID === ProductID);
    if (!item) return [{ affectedRows: 0 }];
    Object.assign(item, { BrandName, ProductName, PackagingSize, UnitPrice: parseFloat(UnitPrice), LastUpdated });
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
    return [{ affectedRows: 1 }];
  }
  if (sqlNormalized.startsWith('DELETE FROM products')) {
    const [ProductID] = params;
    const initialLen = db.products.length;
    db.products = db.products.filter(p => p.ProductID !== ProductID);
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
    return [{ affectedRows: initialLen - db.products.length }];
  }

  // 2. CLIENTS
  if (sqlNormalized.startsWith('SELECT * FROM clients')) {
    const data = [...db.clients].sort((a, b) => new Date(b.LastUpdated) - new Date(a.LastUpdated));
    return [data];
  }
  if (sqlNormalized.startsWith('INSERT INTO clients')) {
    const [ClientID, ClientName, Address, Phone, GSTIN, DueAmount, LastUpdated] = params;
    db.clients = db.clients.filter(c => c.ClientID !== ClientID);
    db.clients.push({ ClientID, ClientName, Address, Phone, GSTIN, DueAmount: parseFloat(DueAmount), LastUpdated });
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
    return [{ affectedRows: 1 }];
  }
  if (sqlNormalized.startsWith('UPDATE clients SET')) {
    const [ClientName, Address, Phone, GSTIN, DueAmount, LastUpdated, ClientID] = params;
    const item = db.clients.find(c => c.ClientID === ClientID);
    if (!item) return [{ affectedRows: 0 }];
    Object.assign(item, { ClientName, Address, Phone, GSTIN, DueAmount: parseFloat(DueAmount), LastUpdated });
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
    return [{ affectedRows: 1 }];
  }
  if (sqlNormalized.startsWith('DELETE FROM clients')) {
    const [ClientID] = params;
    const initialLen = db.clients.length;
    db.clients = db.clients.filter(c => c.ClientID !== ClientID);
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
    return [{ affectedRows: initialLen - db.clients.length }];
  }
  if (sqlNormalized.startsWith('UPDATE clients SET DueAmount =')) {
    const [DueAmount, LastUpdated, ClientName] = params;
    const targetName = String(ClientName || '').trim().toLowerCase();
    const item = db.clients.find(c => String(c.ClientName || '').trim().toLowerCase() === targetName);
    if (!item) return [{ affectedRows: 0 }];
    Object.assign(item, { DueAmount: parseFloat(DueAmount), LastUpdated });
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
    return [{ affectedRows: 1 }];
  }

  // 3. INVOICES
  if (sqlNormalized.startsWith('SELECT InvoiceNumber, UniqueID,')) {
    const data = [...db.invoices].sort((a, b) => new Date(b.LastUpdated) - new Date(a.LastUpdated));
    return [data];
  }
  if (sqlNormalized.startsWith('SELECT * FROM invoices WHERE UniqueID = ? OR InvoiceNumber = ?') || sqlNormalized.startsWith('SELECT * FROM invoices WHERE UniqueID =')) {
    const [id] = params;
    const match = db.invoices.find(inv => inv.UniqueID === id || inv.InvoiceNumber === id);
    return match ? [[match]] : [[]];
  }
  if (sqlNormalized.startsWith('SELECT * FROM invoices WHERE InvoiceNumber = ?')) {
    const [num] = params;
    const match = db.invoices.find(inv => inv.InvoiceNumber === num);
    return match ? [[match]] : [[]];
  }
  if (sqlNormalized.startsWith('SELECT InvoiceNumber FROM invoices')) {
    return [db.invoices.map(inv => ({ InvoiceNumber: inv.InvoiceNumber }))];
  }
  if (sqlNormalized.startsWith('UPDATE invoices SET')) {
    const [
      InvoiceNumber, InvoiceType, DateVal, DueDate, ClientName, ClientAddress,
      ClientPhone, ClientGSTIN, ClientState, ClientStateCode, PlaceOfSupply,
      Subtotal, TaxableAmount, Tax, CGST, SGST, IGST, TotalTax,
      GrandTotal, DueAmount, NonGstTaxType, CompanyName, FromAddress,
      FromPhone, FromEmail, FromGSTIN, Signatory, BankName, BankAcc,
      BankIFSC, UPI, Intro, Terms, ItemsJSON, LastUpdated, UniqueID
    ] = params;
    const item = db.invoices.find(inv => inv.UniqueID === UniqueID);
    if (!item) return [{ affectedRows: 0 }];
    Object.assign(item, {
      InvoiceNumber, InvoiceType, Date: DateVal, DueDate, ClientName, ClientAddress,
      ClientPhone, ClientGSTIN, ClientState, ClientStateCode, PlaceOfSupply,
      Subtotal, TaxableAmount, Tax, CGST, SGST, IGST, TotalTax,
      GrandTotal, DueAmount, NonGstTaxType, CompanyName, FromAddress,
      FromPhone, FromEmail, FromGSTIN, Signatory, BankName, BankAcc,
      BankIFSC, UPI, Intro, Terms, ItemsJSON, LastUpdated
    });
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
    return [{ affectedRows: 1 }];
  }
  if (sqlNormalized.startsWith('INSERT INTO invoices')) {
    const [
      InvoiceNumber, InvoiceType, DateVal, DueDate, ClientName, ClientAddress,
      ClientPhone, ClientGSTIN, ClientState, ClientStateCode, PlaceOfSupply,
      Subtotal, TaxableAmount, Tax, CGST, SGST, IGST, TotalTax,
      GrandTotal, DueAmount, NonGstTaxType, CompanyName, FromAddress,
      FromPhone, FromEmail, FromGSTIN, Signatory, BankName, BankAcc,
      BankIFSC, UPI, Intro, Terms, ItemsJSON, LastUpdated, UniqueID
    ] = params;
    db.invoices = db.invoices.filter(inv => inv.UniqueID !== UniqueID);
    db.invoices.push({
      InvoiceNumber, InvoiceType, Date: DateVal, DueDate, ClientName, ClientAddress,
      ClientPhone, ClientGSTIN, ClientState, ClientStateCode, PlaceOfSupply,
      Subtotal, TaxableAmount, Tax, CGST, SGST, IGST, TotalTax,
      GrandTotal, DueAmount, NonGstTaxType, CompanyName, FromAddress,
      FromPhone, FromEmail, FromGSTIN, Signatory, BankName, BankAcc,
      BankIFSC, UPI, Intro, Terms, ItemsJSON, LastUpdated, UniqueID
    });
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
    return [{ affectedRows: 1 }];
  }
  if (sqlNormalized.startsWith('DELETE FROM invoices')) {
    const [val] = params;
    const initialLen = db.invoices.length;
    db.invoices = db.invoices.filter(inv => inv.InvoiceNumber !== val && inv.UniqueID !== val);
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
    return [{ affectedRows: initialLen - db.invoices.length }];
  }

  console.warn('Unhandled SQL in mock local DB:', sql);
  return [[]];
}

const pool = {
  async query(sql, params = []) {
    if (!useLocalDb) {
      try {
        return await realPool.query(sql, params);
      } catch (err) {
        console.error('MySQL query failed, falling back to local JSON DB:', err.message);
        useLocalDb = true;
      }
    }
    return await queryLocalDb(sql, params);
  },
  async getConnection() {
    if (!useLocalDb) {
      try {
        return await realPool.getConnection();
      } catch (err) {
        console.error('MySQL connection failed, using local DB:', err.message);
        useLocalDb = true;
      }
    }
    throw new Error('Local fallback database active');
  }
};

// Helper: Check database connection
async function checkDbConnection() {
  try {
    if (useLocalDb) {
      console.log('Using local fallback database (JSON file) because MySQL setup failed.');
      return false;
    }
    const conn = await realPool.getConnection();
    console.log('Successfully connected to MySQL database.');
    conn.release();
    return true;
  } catch (err) {
    console.error('\n========================================================================');
    console.error('WARNING: Could not connect to MySQL database.');
    console.error('Please make sure MySQL is running and your .env credentials are correct.');
    console.error(`Error Code: ${err.code}`);
    console.error(`Error Message: ${err.message}`);
    console.log('-> Seamlessly falling back to local database file (db.json)');
    console.error('========================================================================\n');
    useLocalDb = true;
    return false;
  }
}

// Verify API Key
function verifyApiKey(req) {
  // Try parameter from query
  const queryKey = req.query.apiKey || req.query.token;
  if (queryKey === API_SECRET) return true;

  // Try parameter from body (JSON or parsed text body)
  try {
    let body = req.body;
    if (typeof body === 'string') {
      body = JSON.parse(body);
    }
    const bodyKey = body.apiKey || body.token;
    if (bodyKey === API_SECRET) return true;
  } catch (e) {
    // Ignore parse errors
  }

  return false;
}

// Get request parameters and action
function getRequestData(req) {
  let action = req.query.action;
  let payload = {};

  if (req.method === 'POST') {
    try {
      let body = req.body;
      if (typeof body === 'string') {
        body = JSON.parse(body);
      }
      action = body.action || action;
      payload = body.data || body;
    } catch (e) {
      console.warn('Failed to parse POST body:', e.message);
    }
  }

  return { action, payload };
}

async function syncInvoiceToOrder(conn, targetInvoiceNumber, inv, isDelete = false) {
  try {
    const orderNo = String(targetInvoiceNumber);

    // 1. Fetch existing order (if any)
    const [existing] = await conn.query('SELECT * FROM orders WHERE order_no = ?', [orderNo]);
    
    // If delete
    if (isDelete) {
      if (existing.length === 0) return;
      const order = existing[0];
      const orderId = order.id;
      const pendingAmount = parseFloat(order.total_amount) - parseFloat(order.paid_amount);

      // Revert client balance
      if (order.client_id) {
        await conn.query('UPDATE clients SET balance = balance - ? WHERE id = ?', [pendingAmount, order.client_id]);
      }

      // Delete receipt transactions
      await conn.query(
        `DELETE FROM transactions WHERE type = 'Receipt' AND ref_type = 'Order' AND ref_no LIKE ?`,
        [`%${order.order_no}%`]
      );

      // Restore stock
      await reverseStockDeductions('Sale', orderId, conn);

      // Delete order
      await conn.query('DELETE FROM orders WHERE id = ?', [orderId]);
      return;
    }

    // It is an insert/update
    const clientName = inv.customer?.name || inv.ClientName || '';
    const date = inv.meta?.date || inv.Date || new Date().toISOString().split('T')[0];
    const dueDate = inv.meta?.dueDate || inv.DueDate || null;
    const status = 'Delivered'; // Default status for invoices
    const total = parseFloat(inv.calculations?.grandTotal || inv.GrandTotal || 0);
    const dueAmount = parseFloat(inv.customer?.dueAmount || inv.DueAmount || 0);
    const paid = total - dueAmount;
    const pendingAmount = total - paid;
    const discount = 0.00;
    const tax = parseFloat(inv.calculations?.totalTax || inv.TotalTax || 0);
    const notes = 'Synced from Invoice Builder';

    // Look up client_id from clientName
    let clientId = null;
    if (clientName) {
      const [cRows] = await conn.query('SELECT id FROM clients WHERE TRIM(name) = TRIM(?) LIMIT 1', [clientName]);
      if (cRows.length > 0) {
        clientId = cRows[0].id;
      }
    }

    let orderId;
    if (existing.length > 0) {
      // UPDATE
      const orig = existing[0];
      orderId = orig.id;
      const origPending = parseFloat(orig.total_amount) - parseFloat(orig.paid_amount);

      // Revert Client Balance
      if (orig.client_id) {
        await conn.query('UPDATE clients SET balance = balance - ? WHERE id = ?', [origPending, orig.client_id]);
      }

      // Delete ledger entries
      await conn.query(
        `DELETE FROM transactions WHERE type = 'Receipt' AND ref_type = 'Order' AND ref_no LIKE ?`,
        [`%${orig.order_no}%`]
      );

      // Restore Stock
      await reverseStockDeductions('Sale', orderId, conn);

      // Delete order items
      await conn.query('DELETE FROM order_items WHERE order_id = ?', [orderId]);

      // Update Order Header
      await conn.query(
        `UPDATE orders SET 
           client_id = ?, client_name = ?, date = ?, due_date = ?, status = ?, 
           total_amount = ?, paid_amount = ?, discount = ?, tax = ?, notes = ? 
         WHERE id = ?`,
        [clientId, clientName, date, dueDate, status, total, paid, discount, tax, notes, orderId]
      );
    } else {
      // INSERT
      const [ordResult] = await conn.query(
        `INSERT INTO orders (order_no, client_id, client_name, date, due_date, status, total_amount, paid_amount, discount, tax, notes) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [orderNo, clientId, clientName, date, dueDate, status, total, paid, discount, tax, notes]
      );
      orderId = ordResult.insertId;
    }

    // Now insert items and deduct stock
    const items = inv.rows || [];
    for (const item of items) {
      const qty = parseFloat(item.qty) || 0;
      const price = parseFloat(item.price) || 0;
      const lineTotal = parseFloat(item.total) || (qty * price);

      // Look up product ID from products table by name
      let productId = null;
      if (item.name) {
        const [pRows] = await conn.query('SELECT id FROM products WHERE TRIM(name) = TRIM(?) LIMIT 1', [item.name]);
        if (pRows.length > 0) {
          productId = pRows[0].id;
        }
      }

      // Insert Order Item
      await conn.query(
        `INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, discount, total) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [orderId, productId, item.name, qty, price, 0, lineTotal]
      );

      // Deduct Finished Goods Stock using FIFO
      if (productId) {
        try {
          await deductStockFIFO(productId, 'Catalog', qty, 'Sale', orderId, conn);
        } catch (stockErr) {
          console.warn(`Stock deduction warning for product ID ${productId}:`, stockErr.message);
        }
      }
    }

    // Update Client Balance
    if (clientId) {
      await conn.query('UPDATE clients SET balance = balance + ? WHERE id = ?', [pendingAmount, clientId]);
    }

    // Create Payment Receipt transaction if paid > 0
    if (paid > 0) {
      await conn.query(
        `INSERT INTO transactions (type, ref_no, ref_type, party_id, party_name, amount, mode, date, notes) 
         VALUES ('Receipt', ?, 'Order', ?, ?, ?, 'Cash', ?, ?)`,
        [`Order Ref: ${orderNo}`, clientId, clientName, paid, date, `Payment for order ${orderNo}`]
      );
    }
  } catch (syncErr) {
    console.error('Error syncing invoice to order:', syncErr);
  }
}

// API router path
app.all('/api', async (req, res) => {
  if (!verifyApiKey(req)) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const { action, payload } = getRequestData(req);

  if (!action) {
    return res.status(400).json({ success: false, error: 'Missing action parameter' });
  }

  try {
    switch (action) {
      // ─── PRODUCTS ──────────────────────────────────────────
      case 'getProducts': {
        const [rows] = await pool.query(`
          SELECT 
            CONCAT(p.id, '-', pk.id) AS ProductID, 
            p.brand AS BrandName, 
            p.name AS ProductName, 
            pk.packaging_size AS PackagingSize, 
            pk.sell_price AS UnitPrice, 
            DATE_FORMAT(pk.created_at, '%Y-%m-%dT%H:%i:%s.000Z') AS LastUpdated 
          FROM product_packaging pk
          JOIN products p ON pk.product_id = p.id
          ORDER BY p.name ASC
        `);
        return res.json({ success: true, data: rows });
      }

      case 'addProduct': {
        const item = payload;
        let productId;
        const [existingProds] = await pool.query(
          'SELECT id FROM products WHERE LOWER(TRIM(name)) = LOWER(TRIM(?)) AND LOWER(TRIM(brand)) = LOWER(TRIM(?))',
          [item.ProductName, item.BrandName]
        );
        if (existingProds.length > 0) {
          productId = existingProds[0].id;
        } else {
          const [insertResult] = await pool.query(
            'INSERT INTO products (name, brand, category, item_type, unit, sell_price, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [item.ProductName, item.BrandName, 'Finished Good', 'Finished Good', 'Kg', item.UnitPrice, 'Active']
          );
          productId = insertResult.insertId;
        }
        await pool.query(
          'INSERT INTO product_packaging (product_id, packaging_size, sell_price) VALUES (?, ?, ?)',
          [productId, item.PackagingSize, item.UnitPrice]
        );
        return res.json({ success: true, message: 'Added to Products' });
      }

      case 'updateProduct': {
        const item = payload;
        const [prodId, pkgId] = String(item.ProductID).split('-');
        if (!pkgId) {
          return res.json({ success: false, error: 'Invalid Product ID format' });
        }
        await pool.query(
          'UPDATE product_packaging SET packaging_size = ?, sell_price = ? WHERE id = ?',
          [item.PackagingSize, item.UnitPrice, pkgId]
        );
        await pool.query(
          'UPDATE products SET name = ?, brand = ? WHERE id = ?',
          [item.ProductName, item.BrandName, prodId]
        );
        return res.json({ success: true, message: 'Updated row in Products' });
      }

      case 'deleteProduct': {
        const [prodId, pkgId] = String(payload.ProductID).split('-');
        if (!pkgId) {
          await pool.query('DELETE FROM product_packaging WHERE id = ?', [payload.ProductID]);
          return res.json({ success: true, message: 'Deleted row from Products' });
        }
        await pool.query('DELETE FROM product_packaging WHERE id = ?', [pkgId]);
        const [remaining] = await pool.query('SELECT id FROM product_packaging WHERE product_id = ?', [prodId]);
        if (remaining.length === 0) {
          await pool.query('DELETE FROM products WHERE id = ?', [prodId]);
        }
        return res.json({ success: true, message: 'Deleted row from Products' });
      }

      // ─── CLIENTS ───────────────────────────────────────────
      case 'getClients': {
        const [rows] = await pool.query(`
          SELECT 
            CAST(id AS CHAR) AS ClientID, 
            name AS ClientName, 
            address AS Address, 
            contact AS Phone, 
            gst AS GSTIN, 
            balance AS DueAmount, 
            DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%s.000Z') AS LastUpdated 
          FROM clients 
          ORDER BY name ASC
        `);
        return res.json({ success: true, data: rows });
      }

      case 'addClient': {
        const item = payload;
        await pool.query(
          'INSERT INTO clients (name, address, contact, gst, balance) VALUES (?, ?, ?, ?, ?)',
          [item.ClientName, item.Address || '', item.Phone || '', item.GSTIN || '', item.DueAmount || 0]
        );
        return res.json({ success: true, message: 'Added to Clients' });
      }

      case 'updateClient': {
        const item = payload;
        const [result] = await pool.query(
          'UPDATE clients SET name = ?, address = ?, contact = ?, gst = ?, balance = ? WHERE id = ?',
          [item.ClientName, item.Address || '', item.Phone || '', item.GSTIN || '', item.DueAmount || 0, item.ClientID]
        );
        if (result.affectedRows === 0) {
          return res.json({ success: false, error: 'Record not found for update' });
        }
        return res.json({ success: true, message: 'Updated row in Clients' });
      }

      case 'deleteClient': {
        const [result] = await pool.query('DELETE FROM clients WHERE id = ?', [payload.ClientID]);
        if (result.affectedRows === 0) {
          return res.json({ success: false, error: 'Record not found for deletion' });
        }
        return res.json({ success: true, message: 'Deleted row from Clients' });
      }

      case 'updateClientDue': {
        const { clientName, dueAmount } = payload;
        const [result] = await pool.query(
          'UPDATE clients SET balance = ? WHERE LOWER(TRIM(name)) = LOWER(TRIM(?))',
          [dueAmount || 0, clientName]
        );
        if (result.affectedRows === 0) {
          return res.json({ success: false, error: `Client "${clientName}" not found` });
        }
        return res.json({ success: true, message: `DueAmount updated for ${clientName}` });
      }

      // ─── INVOICES ──────────────────────────────────────────
      case 'getInvoiceHistory': {
        // Return summary details, omit heavy ItemsJSON
        const [rows] = await pool.query(
          'SELECT InvoiceNumber, UniqueID, InvoiceType, Date, DueDate, ClientName, ClientAddress, ClientPhone, ClientGSTIN, ClientState, ClientStateCode, PlaceOfSupply, Subtotal, TaxableAmount, Tax, CGST, SGST, IGST, TotalTax, GrandTotal, DueAmount, NonGstTaxType, CompanyName, FromAddress, FromPhone, FromEmail, FromGSTIN, Signatory, BankName, BankAcc, BankIFSC, UPI, Intro, Terms, LastUpdated FROM invoices ORDER BY LastUpdated DESC'
        );
        return res.json({ success: true, data: rows });
      }

      case 'getInvoice': {
        const id = req.query.id;
        const [rows] = await pool.query(
          'SELECT * FROM invoices WHERE UniqueID = ? OR InvoiceNumber = ?',
          [id, id]
        );
        if (rows.length === 0) {
          return res.json({ success: false, error: `Invoice '${id}' not found` });
        }
        const row = rows[0];
        
        // Try parsing ItemsJSON as full payload
        let structuredData = null;
        if (row.ItemsJSON) {
          try {
            structuredData = JSON.parse(row.ItemsJSON);
          } catch (e) {
            console.error('Failed to parse ItemsJSON for invoice:', id, e.message);
          }
        }

        if (structuredData && structuredData.meta) {
          // Ensure keys are matched from the DB row if there were updates
          structuredData.meta.uniqueId = row.UniqueID;
          structuredData.meta.invoiceNumber = row.InvoiceNumber;
          structuredData.InvoiceNumber = row.InvoiceNumber;
          structuredData.UniqueID = row.UniqueID;
          return res.json({ success: true, data: structuredData });
        }

        // Fallback reconstructed nested structure
        let productRows = [];
        if (row.ItemsJSON) {
          try {
            const parsed = JSON.parse(row.ItemsJSON);
            productRows = Array.isArray(parsed) ? parsed : [];
          } catch (e) {}
        }

        const structured = {
          InvoiceNumber: row.InvoiceNumber,
          UniqueID: row.UniqueID,
          meta: {
            uniqueId: row.UniqueID,
            invoiceNumber: row.InvoiceNumber,
            date: row.Date,
            dueDate: row.DueDate
          },
          business: {
            company: row.CompanyName || '',
            address: row.FromAddress || '',
            phone: row.FromPhone || '',
            email: row.FromEmail || '',
            gstin: row.FromGSTIN || '',
            signatory: row.Signatory || ''
          },
          bank: {
            name: row.BankName || '',
            account: row.BankAcc || '',
            ifsc: row.BankIFSC || '',
            upi: row.UPI || ''
          },
          customer: {
            name: row.ClientName || '',
            address: row.ClientAddress || '',
            phone: row.ClientPhone || '',
            gstin: row.ClientGSTIN || '',
            dueAmount: parseFloat(row.DueAmount || 0)
          },
          settings: {
            intro: row.Intro || '',
            terms: row.Terms || '',
            gstRate: parseFloat(row.Tax || 0) > 0 ? 18.00 : 0.00, // Default heuristic
            taxType: row.InvoiceType === 'GST' ? 'GST18' : 'NONE',
            showQR: false
          },
          rows: productRows,
          calculations: {
            subtotal: parseFloat(row.Subtotal || 0),
            tax: parseFloat(row.Tax || 0),
            grandTotal: parseFloat(row.GrandTotal || 0)
          }
        };

        return res.json({ success: true, data: structured });
      }

      case 'saveInvoice': {
        const inv = payload;
        if (!inv.InvoiceNumber) {
          return res.status(400).json({ success: false, error: 'InvoiceNumber is required' });
        }

        const incomingUniqueId = String(inv.meta?.uniqueId || inv.UniqueID || '').trim();
        const itemsJSON = JSON.stringify(inv);
        const lastUpdated = new Date().toISOString();

        // Check if invoice exists by UniqueID
        let existingInvoice = null;
        if (incomingUniqueId) {
          const [rows] = await pool.query('SELECT * FROM invoices WHERE UniqueID = ?', [incomingUniqueId]);
          if (rows.length > 0) {
            existingInvoice = rows[0];
          }
        }

        // Also check by InvoiceNumber to detect collisions
        const [numberCollisions] = await pool.query('SELECT * FROM invoices WHERE InvoiceNumber = ?', [inv.InvoiceNumber]);
        
        let targetInvoiceNumber = inv.InvoiceNumber;

        // If it's a new invoice, but invoice number collides, we auto-generate next invoice number
        if (!existingInvoice && numberCollisions.length > 0) {
          targetInvoiceNumber = await getNextInvoiceNumberInternal();
          if (inv.meta) inv.meta.invoiceNumber = targetInvoiceNumber;
          inv.InvoiceNumber = targetInvoiceNumber;
        }

        // Flatten payload fields
        const isGst = inv.InvoiceType === 'GST';
        const date = inv.meta?.date || inv.Date || '';
        const dueDate = inv.meta?.dueDate || inv.DueDate || '';
        const clientName = inv.customer?.name || inv.ClientName || '';
        const clientAddress = inv.customer?.address || inv.ClientAddress || '';
        const clientPhone = inv.customer?.phone || inv.ClientPhone || '';
        const clientGSTIN = inv.customer?.gstin || inv.ClientGSTIN || '';
        const clientState = inv.customer?.state || inv.ClientState || 'Gujarat';
        const clientStateCode = inv.customer?.stateCode || inv.ClientStateCode || '24';
        const placeOfSupply = inv.customer?.placeOfSupply || inv.PlaceOfSupply || 'Gujarat';
        
        const subtotal = parseFloat(inv.calculations?.subtotal || inv.Subtotal || 0);
        const taxableAmount = parseFloat(inv.calculations?.subtotal || inv.TaxableAmount || 0);
        const tax = parseFloat(inv.calculations?.totalTax || inv.Tax || 0);
        const cgst = parseFloat(inv.calculations?.cgstAmount || inv.CGST || 0);
        const sgst = parseFloat(inv.calculations?.sgstAmount || inv.SGST || 0);
        const igst = parseFloat(inv.calculations?.igstAmount || inv.IGST || 0);
        const totalTax = parseFloat(inv.calculations?.totalTax || inv.TotalTax || 0);
        const grandTotal = parseFloat(inv.calculations?.grandTotal || inv.GrandTotal || 0);
        const dueAmount = parseFloat(inv.customer?.dueAmount || inv.DueAmount || 0);
        
        const nonGstTaxType = inv.settings?.taxType || inv.NonGstTaxType || '';
        const companyName = inv.business?.company || inv.CompanyName || '';
        const fromAddress = inv.business?.address || inv.FromAddress || '';
        const fromPhone = inv.business?.phone || inv.FromPhone || '';
        const fromEmail = inv.business?.email || inv.FromEmail || '';
        const fromGSTIN = inv.business?.gstin || inv.FromGSTIN || '';
        const signatory = inv.business?.signatory || inv.Signatory || '';
        
        const bankName = inv.bank?.name || inv.BankName || '';
        const bankAcc = inv.bank?.account || inv.BankAcc || '';
        const bankIFSC = inv.bank?.ifsc || inv.BankIFSC || '';
        const upi = inv.bank?.upi || inv.UPI || '';
        const intro = inv.settings?.intro || inv.Intro || '';
        const terms = inv.settings?.terms || inv.Terms || '';

        const dbParams = [
          targetInvoiceNumber,
          inv.InvoiceType || 'Non-GST',
          date,
          dueDate,
          clientName,
          clientAddress,
          clientPhone,
          clientGSTIN,
          clientState,
          clientStateCode,
          placeOfSupply,
          subtotal,
          taxableAmount,
          tax,
          cgst,
          sgst,
          igst,
          totalTax,
          grandTotal,
          dueAmount,
          nonGstTaxType,
          companyName,
          fromAddress,
          fromPhone,
          fromEmail,
          fromGSTIN,
          signatory,
          bankName,
          bankAcc,
          bankIFSC,
          upi,
          intro,
          terms,
          JSON.stringify(inv), // Re-stringify current payload with updated invoice number
          lastUpdated,
          incomingUniqueId
        ];

        if (existingInvoice) {
          // UPDATE
          await pool.query(
            `UPDATE invoices SET 
              InvoiceNumber = ?, InvoiceType = ?, Date = ?, DueDate = ?, ClientName = ?, ClientAddress = ?, 
              ClientPhone = ?, ClientGSTIN = ?, ClientState = ?, ClientStateCode = ?, PlaceOfSupply = ?, 
              Subtotal = ?, TaxableAmount = ?, Tax = ?, CGST = ?, SGST = ?, IGST = ?, TotalTax = ?, 
              GrandTotal = ?, DueAmount = ?, NonGstTaxType = ?, CompanyName = ?, FromAddress = ?, 
              FromPhone = ?, FromEmail = ?, FromGSTIN = ?, Signatory = ?, BankName = ?, BankAcc = ?, 
              BankIFSC = ?, UPI = ?, Intro = ?, Terms = ?, ItemsJSON = ?, LastUpdated = ? 
             WHERE UniqueID = ?`,
            dbParams
          );

          return res.json({
            success: true,
            message: 'Invoice updated',
            uniqueId: incomingUniqueId,
            invoiceNumber: targetInvoiceNumber,
            action: 'updated'
          });
        } else {
          // INSERT
          await pool.query(
            `INSERT INTO invoices (
              InvoiceNumber, InvoiceType, Date, DueDate, ClientName, ClientAddress, 
              ClientPhone, ClientGSTIN, ClientState, ClientStateCode, PlaceOfSupply, 
              Subtotal, TaxableAmount, Tax, CGST, SGST, IGST, TotalTax, 
              GrandTotal, DueAmount, NonGstTaxType, CompanyName, FromAddress, 
              FromPhone, FromEmail, FromGSTIN, Signatory, BankName, BankAcc, 
              BankIFSC, UPI, Intro, Terms, ItemsJSON, LastUpdated, UniqueID
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            dbParams
          );

          return res.json({
            success: true,
            message: 'Invoice created',
            uniqueId: incomingUniqueId,
            invoiceNumber: targetInvoiceNumber,
            action: 'created'
          });
        }
      }

      case 'deleteInvoice': {
        const [result] = await pool.query('DELETE FROM invoices WHERE InvoiceNumber = ? OR UniqueID = ?', [payload.InvoiceNumber, payload.InvoiceNumber]);
        if (result.affectedRows === 0) {
          return res.json({ success: false, error: 'Record not found for deletion' });
        }
        return res.json({ success: true, message: 'Deleted row from history' });
      }

      case 'getNextInvoiceNumber': {
        const num = await getNextInvoiceNumberInternal();
        return res.json({ success: true, data: num });
      }

      default:
        return res.status(400).json({ success: false, error: `Invalid action: ${action}` });
    }
  } catch (error) {
    console.error(`Error executing action "${action}":`, error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Helper: Get next invoice number
async function getNextInvoiceNumberInternal() {
  try {
    const [rows] = await pool.query('SELECT InvoiceNumber FROM invoices');
    if (rows.length === 0) return '100';

    let maxNum = 99;
    for (const row of rows) {
      const raw = String(row.InvoiceNumber || '');
      const num = parseInt(raw.replace(/[^0-9]/g, ''), 10) || 0;
      if (num > maxNum) maxNum = num;
    }

    return String(maxNum + 1).padStart(3, '0');
  } catch (err) {
    console.error('Error in getNextInvoiceNumberInternal:', err.message);
    return '100';
  }
}

// Serve Frontend Static Files
app.use(express.static(path.resolve(__dirname)));

// Fallback for SPA routing if needed
app.get('*', (req, res, next) => {
  if (req.url.startsWith('/api')) return next();
  res.sendFile(path.resolve(__dirname, 'index.html'));
});

// Start Server
app.listen(PORT, async () => {
  console.log(`\n========================================================================`);
  console.log(`SK Agro Chemicals Invoice Server listening on http://localhost:${PORT}`);
  console.log(`Serving static files from: ${path.resolve(__dirname)}`);
  console.log(`========================================================================\n`);
  
  await checkDbConnection();
});
