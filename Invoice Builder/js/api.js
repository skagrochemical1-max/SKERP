// ─── PRODUCT API ─────────────────────────────────────────
async function getProducts() {
  return await _apiFetch({ action: 'getProducts' });
}
async function addProduct(product) {
  return await _apiFetch({ action: 'addProduct' }, product);
}
async function updateProduct(product) {
  return await _apiFetch({ action: 'updateProduct' }, product);
}
async function deleteProduct(productName) {
  return await _apiFetch({ action: 'deleteProduct', productName });
}
async function searchProduct(query) {
  return await _apiFetch({ action: 'searchProduct', query });
}

// ─── CLIENT API ──────────────────────────────────────────
async function getClients() {
  return await _apiFetch({ action: 'getClients' });
}
async function addClient(client) {
  return await _apiFetch({ action: 'addClient' }, client);
}
async function updateClient(client) {
  return await _apiFetch({ action: 'updateClient' }, client);
}
async function deleteClient(phone) {
  return await _apiFetch({ action: 'deleteClient', phone });
}
async function searchClient(query) {
  return await _apiFetch({ action: 'searchClient', query });
}

// Export API
const api = {
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  searchProduct,
  getClients,
  addClient,
  updateClient,
  deleteClient,
  searchClient,
  apiGetInvoices,
  apiGetInvoice,
  apiSaveInvoice,
  apiUpdateInvoice,
  apiDeleteInvoice,
  apiGetNextInvoiceNumber,
};
/* ==========================================================================
   api.js  —  Google Apps Script backend communication layer
   Invoice System
   All API calls go through this single file.
   To change backend: only update APPS_SCRIPT_URL below.
   ========================================================================== */

'use strict';

// Safe localStorage wrapper to prevent crashes in private windows / disabled cookies
window.safeStorage = {
  getItem(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn('localStorage.getItem failed for key: ' + key, e);
      return window['__fs_' + key] || null;
    }
  },
  setItem(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn('localStorage.setItem failed for key: ' + key, e);
      window['__fs_' + key] = String(value);
    }
  },
  removeItem(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn('localStorage.removeItem failed for key: ' + key, e);
      delete window['__fs_' + key];
    }
  }
};

// ─── CONFIGURATION ────────────────────────────────────────────────────────────
const APPS_SCRIPT_URL = window.location.origin.includes(':7890') ? 'http://localhost:8000/api' : window.location.origin + '/api';
const API_SECRET = 'sk_agro_secure_key_2026'; // Added Security Token

// Request timeout in milliseconds
const API_TIMEOUT_MS = 25000;

// ─── CORE FETCH WRAPPER ───────────────────────────────────────────────────────
/**
 * Internal helper: fetch with timeout + JSON parse + error normalization.
 * GET requests: pass params as URLSearchParams.
 * POST requests: pass body as plain JS object (will be JSON-stringified).
 */
async function _apiFetch(params = {}, body = null) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const url = new URL(APPS_SCRIPT_URL);
    // Attach the security token to every request alongside other params
    url.searchParams.set('apiKey', API_SECRET);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

    const options = { signal: controller.signal };

    if (body !== null) {
      // POST — Apps Script doesn't support real PUT/DELETE easily,
      // so we tunnel the HTTP method via ?action param.
      options.method = 'POST';
      // To bypass CORS preflight OPTIONS, we use text/plain
      options.headers = { 'Content-Type': 'text/plain;charset=utf-8' };
      options.body = JSON.stringify(body);
    } else {
      options.method = 'GET';
    }

    const res = await fetch(url.toString(), options);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);

    const json = await res.json();

    if (json.error) throw new Error(json.error);
    return json;

  } catch (err) {
    if (err.name === 'AbortError') throw new Error('Request timed out. Check your internet connection.');
    throw err;
  } finally {
    clearTimeout(timer);
  }
}


// ─── PUBLIC API FUNCTIONS ─────────────────────────────────────────────────────

/**
 * GET /invoices — Load invoice list (summary only, no full JSON for performance).
 * @param {object} filters  Optional: { customer, dateFrom, dateTo, status, limit }
 * @returns {Promise<Array>} Array of invoice summary objects.
 */
async function apiGetInvoices(filters = {}) {
  const params = { action: 'getInvoiceHistory', ...filters };
  const result = await _apiFetch(params);
  const data = result.data || [];
  // Ensure we map the invoice number from different possible DB keys
  return data.map(inv => {
    // Coerce to string to avoid comparison errors later
    const invNumStr = String(inv.InvoiceNumber || inv.invoiceNumber || inv.inv_num || inv.Number || inv['Invoice #'] || '—').trim();
    // Normalize dates (strip time like T00:00:00Z) to YYYY-MM-DD for HTML input boxes
    const rawDate = String(inv.date || inv.Date || '');
    const cleanDate = rawDate.match(/^\d{4}-\d{2}-\d{2}/) ? rawDate.substring(0, 10) : rawDate;

    const rawDue = String(inv.dueDate || inv.DueDate || '');
    const cleanDue = rawDue.match(/^\d{4}-\d{2}-\d{2}/) ? rawDue.substring(0, 10) : rawDue;

    return {
      ...inv,
      invoiceNumber: invNumStr,
      uniqueId: String(inv.uniqueId || invNumStr),
      customerName: String(inv.customerName || inv.ClientName || 'Unknown'),
      date: cleanDate || '—',
      dueDate: cleanDue || '',
      totalAmount: parseFloat(inv.totalAmount || inv.GrandTotal || 0),
      mobile: String(inv.mobile || inv.Phone || inv.ClientPhone || '')
    };
  });
}


/**
 * GET /invoice?id=xxx — Load a single invoice with full JSON.
 * @param {string} uniqueId  The invoice's uniqueId (e.g. "INV-20250317-A3F2")
 * @returns {Promise<object>} Full invoice JSON object.
 */
async function apiGetInvoice(uniqueId) {
  if (!uniqueId) throw new Error('Invoice ID is required.');
  let lastError;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const result = await _apiFetch({ action: 'getInvoice', id: uniqueId });
      if (!result.data) throw new Error('Invoice data empty in response');
      return result.data;
    } catch (err) {
      lastError = err;
      try {
        const history = await apiGetInvoices();
        const tid = String(uniqueId).trim();
        const match = history.find(i =>
          String(i.uniqueId).trim() === tid ||
          String(i.invoiceNumber).trim() === tid ||
          String(i.InvoiceNumber).trim() === tid
        );
        if (match) {
          return {
            meta: {
              uniqueId: match.uniqueId || uniqueId,
              invoiceNumber: match.invoiceNumber || match.InvoiceNumber,
              date: match.date || match.Date,
              dueDate: match.dueDate || match.DueDate || ''
            },
            customer: {
              name: match.customerName || match.ClientName || '',
              address: match.customerAddress || match.Address || '',
              phone: match.customerPhone || match.Phone || match.mobile || '',
              gstin: match.customerGstin || match.GSTIN || match.Gstin || '',
              dueAmount: parseFloat(match.dueAmount || match.DueAmount || 0)
            },
            rows: match.ItemsJSON ? JSON.parse(match.ItemsJSON) : [],
            calculations: {
              subtotal: parseFloat(match.Subtotal || 0),
              tax: parseFloat(match.Tax || 0),
              grandTotal: parseFloat(match.GrandTotal || match.totalAmount || 0)
            }
          };
        }
      } catch (e) {
        console.warn('History fallback failed:', e);
      }
      if (attempt === 0) {
        await new Promise(r => setTimeout(r, 1200));
      }
    }
  }
  throw lastError;
}


/**
 * POST /invoice — Save a new invoice.
 * @param {object} invoiceData  Full invoice JSON (see storage.js → buildInvoiceJSON).
 * @returns {Promise<object>} { success, uniqueId, invoiceNumber, row }
 */
async function apiSaveInvoice(invoiceData) {
  _validateInvoicePayload(invoiceData);
  const result = await _apiFetch({ action: 'saveInvoice' }, invoiceData);
  return result;
}


/**
 * POST /invoice (update) — Update an existing invoice.
 * @param {object} invoiceData  Full invoice JSON including meta.uniqueId.
 * @returns {Promise<object>} { success, uniqueId }
 */
async function apiUpdateInvoice(invoiceData) {
  _validateInvoicePayload(invoiceData);
  if (!invoiceData || !invoiceData.meta.uniqueId) {
    throw new Error('Invalid payload: uniqueId missing.');
  }
  const result = await _apiFetch({ action: 'saveInvoice' }, invoiceData);
  return result;
}


/**
 * POST /invoice?action=deleteInvoice — Delete an invoice.
 * @param {string} uniqueId The ID to delete.
 */
async function apiDeleteInvoice(uniqueId) {
  if (!uniqueId) throw new Error('Invoice ID is required for deletion.');
  // Map to InvoiceNumber as backend uses that for identification
  const result = await _apiFetch({ action: 'deleteInvoice' }, { InvoiceNumber: uniqueId });
  return result;
}


/**
 * POST ?action=updateClientDue — Sync a client's DueAmount in the Clients sheet.
 * Called automatically after every invoice save so the Clients sheet always
 * reflects the latest outstanding balance.
 * @param {string} clientName  Exact client name (case-insensitive match on backend)
 * @param {number} dueAmount   New due amount (0 means fully paid / no due)
 */
async function apiUpdateClientDue(clientName, dueAmount) {
  if (!clientName) return; // no client, skip silently
  try {
    const result = await _apiFetch({ action: 'updateClientDue' }, {
      clientName: clientName.trim(),
      dueAmount: parseFloat(dueAmount) || 0,
    });
    return result;
  } catch (err) {
    // Non-critical — don't surface to user, just log
    console.warn('updateClientDue failed (non-critical):', err.message);
  }
}


/**
 * GET /nextInvoiceNumber — Fetch the next auto-incremented invoice number from sheet.
 * @returns {Promise<string>}  e.g. "INV-042"
 */
async function apiGetNextInvoiceNumber() {
  try {
    const result = await _apiFetch({ action: 'getNextInvoiceNumber' });
    return result.data;
  } catch (err) {
    // Local fallback if GAS is not yet updated
    const cached = safeStorage.getItem('invoice_history_cache');
    if (cached) {
      const list = JSON.parse(cached);
      const nums = list.map(i => parseInt(String(i.invoiceNumber || 0).replace(/[^0-9]/g, ''), 10) || 0);
      const max = Math.max(99, ...nums);
      return String(max + 1).padStart(3, '0');
    }
    return '100';
  }
}


// ─── PRIVATE VALIDATION ───────────────────────────────────────────────────────
function _validateInvoicePayload(data) {
  if (!data || typeof data !== 'object') throw new Error('Invalid invoice payload.');
  if (!data.meta) throw new Error('Invoice is missing meta block.');
  if (!data.customer) throw new Error('Invoice is missing customer block.');
  if (!Array.isArray(data.rows) || data.rows.length === 0) throw new Error('Invoice must have at least one product row.');
}

// ─── SHARED UI HELPERS (Theme & Profile) ──────────────────────────────────────
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  safeStorage.setItem('theme', theme);
  const icon = document.getElementById('theme-icon');
  if (icon) icon.textContent = theme === 'dark' ? 'dark_mode' : 'light_mode';
}

function toggleTheme() {
  const current = safeStorage.getItem('theme') || 'dark';
  applyTheme(current === 'light' ? 'dark' : 'light');
}

function showProfileSymbol() {
  const auth = safeStorage.getItem('inv_auth');
  if (!auth) return;
  const tr = document.getElementById('toolbar-right');
  if (!tr || document.getElementById('profile-symbol')) return;

  const p = document.createElement('div');
  p.id = 'profile-symbol';
  p.className = 'profile-circle';
  p.textContent = auth.charAt(0).toUpperCase();
  const mobile = safeStorage.getItem('inv_user_mobile');
  if (mobile) p.title = `Logged in • ${mobile}`;
  tr.appendChild(p);
}

// Global initialization for all pages
window.addEventListener('DOMContentLoaded', () => {
  applyTheme(safeStorage.getItem('theme') || 'dark');
  showProfileSymbol();
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.onclick = toggleTheme;

  // ─── GLOBAL TEXT FORMATTING ───────────────────────────────────────────────
  // Apply special formatting to all text-like inputs site-wide
  const handleFormatting = (e) => {
    const el = e.target;
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      const skipTypes = ['password', 'date', 'checkbox', 'radio', 'file', 'email'];
      if (skipTypes.includes(el.type)) return;

      // Check if it's a phone field
      const isPhone = el.id.toLowerCase().includes('phone') || (el.placeholder && el.placeholder.toLowerCase().includes('phone'));

      if (el.value) {
        const start = el.selectionStart;
        const end = el.selectionEnd;
        const originalVal = el.value;

        let formatted = originalVal;

        if (isPhone) {
          formatted = formatPhone(originalVal);
          // Prevent cursor jump on phone replace
          if (originalVal !== formatted) {
            el.value = formatted;
            return; // Let user type naturally, phone formatting handles ends
          }
        } else {
          if (el.type !== 'number' && el.type !== 'tel') {
            formatted = formatText(originalVal);
          }
        }

        if (originalVal !== formatted && !isPhone) {
          el.value = formatted;
          // Restore cursor position for 'input' event to prevent jumping
          if (e.type === 'input') {
            try { el.setSelectionRange(start, end); } catch (ex) { }
          }
        }
      }
    }
  };

  document.addEventListener('input', handleFormatting, true);
  document.addEventListener('blur', handleFormatting, true);
  document.addEventListener('change', handleFormatting, true);
});

/**
 * Custom text formatter:
 * 1. Title Case everything BEFORE the '%' character.
 * 2. Force uppercase for specific units (LTR, ML, KG, GM).
 * 3. UPPERCASE everything AFTER the '%' character.
 * Example: "1 ltr water%batch123" -> "1 LTR Water%BATCH123"
 */
function formatText(str) {
  if (!str && str !== 0) return '';
  str = String(str);

  const parts = str.split('%');

  // Step 1: Processing the first part
  let firstPart = parts[0].toLowerCase().split(' ').map(word => {
    if (!word) return '';

    // Default Title Case
    let res = word.charAt(0).toUpperCase() + word.slice(1);

    // If the word IS exactly one of our units (case-insensitive)
    const specialUnits = ['LTR', 'ML', 'KG', 'GM'];
    if (specialUnits.includes(word.toUpperCase())) {
      return word.toUpperCase();
    }

    // Also catch units attached to numbers (e.g., "500ml" or "1ltr")
    // This regex looks for digits followed by one of our units
    const unitRegex = new RegExp('(\\d+)(ltr|ml|kg|gm)', 'i');
    res = res.replace(unitRegex, (match, num, unit) => {
      return num + unit.toUpperCase();
    });

    return res;
  }).join(' ');

  // Step 2: Processing the part after the '%' if it exists
  if (parts.length > 1) {
    const rest = parts.slice(1).join('%').toUpperCase();
    return firstPart + '%' + rest;
  }
  return firstPart;
}

/**
 * Formats a phone number as "99999 99999" taking only the first 10 digits.
 */
function formatPhone(str) {
  if (!str) return '';
  let digits = String(str).replace(/\D/g, '').slice(0, 10);
  if (digits.length > 5) {
    return digits.slice(0, 5) + ' ' + digits.slice(5);
  }
  return digits;
}

