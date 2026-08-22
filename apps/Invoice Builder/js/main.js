/* =============================================================================
   main.js — Invoice System
   Production-ready, full-featured invoice management
   ============================================================================= */

'use strict';

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const INR = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function esc(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeBusinessName(value) {
  return value;
}

function normalizeGSTIN(value) {
  return String(value || '').trim().toUpperCase();
}

function formatClientGSTINForPreview(value) {
  const gstin = normalizeGSTIN(value);
  return gstin ? `GSTIN:\u00A0${gstin}` : '';
}

function formatClientPhoneForPreview(value) {
  const phone = String(value || '').trim();
  if (!phone) return '';
  return /^mo\./i.test(phone) ? phone : `Mo. ${phone}`;
}

function getUniqueBrands() {
  return [...new Set(inventoryData
    .map(item => (item.brand || item.BrandName || '').toString().trim())
    .filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));
}

function getAllProducts() {
  return [...new Set(inventoryData
    .map(item => (item.product || item.ProductName || '').toString().trim())
    .filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));
}

function getProductsForBrand(brand) {
  const brandKey = normalizeText(brand);
  return [...new Set(inventoryData
    .filter(item => normalizeText(item.brand || item.BrandName) === brandKey)
    .map(item => (item.product || item.ProductName || '').toString().trim())
    .filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));
}

function getPackagingForProduct(brand, product) {
  const brandKey = normalizeText(brand);
  const productKey = normalizeText(product);
  return [...new Set(inventoryData
    .filter(item => normalizeText(item.product || item.ProductName) === productKey && (!brandKey || normalizeText(item.brand || item.BrandName) === brandKey))
    .map(item => (item.packaging || item.PackagingSize || '').toString().trim())
    .filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));
}

function getPriceForPackaging(brand, product, packaging) {
  const brandKey = normalizeText(brand);
  const productKey = normalizeText(product);
  const packagingKey = normalizeText(packaging);
  const match = inventoryData.find(item =>
    normalizeText(item.brand || item.BrandName) === brandKey &&
    normalizeText(item.product || item.ProductName) === productKey &&
    normalizeText(item.packaging || item.PackagingSize) === packagingKey
  );
  if (!match) return '';
  return (match.price || match.Price || '').toString().trim();
}

function toast(msg, type = '') {
  const t = $('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = type === 'error' ? 'error show' : 'show';
  if (t._timer) clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.className = ''; }, 2500);
}

let fixedInfoOpen = false;
let lastAddItemClickAt = 0;

function toggleFixedInfo() {
  fixedInfoOpen = !fixedInfoOpen;
  const block = $('fixed-info-block');
  const chevron = $('fixed-chevron');
  const banner = $('fixed-info-banner');
  if (block) block.style.display = fixedInfoOpen ? '' : 'none';
  if (chevron) chevron.classList.toggle('open', fixedInfoOpen);
  if (banner) banner.style.borderBottom = fixedInfoOpen ? '1px solid #10b98140' : '1px solid #1e3a5f';
}

function togglePanel(blockId, chevronId) {
  const block = $(blockId);
  const chevron = $(chevronId);
  if (!block) return;
  const isOpen = block.style.display !== 'none';
  block.style.display = isOpen ? 'none' : '';
  if (chevron) chevron.classList.toggle('open', !isOpen);
}

window.toggleFixedInfo = toggleFixedInfo;
window.togglePanel = togglePanel;

function handleAddItemClick(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  const now = Date.now();
  if (now - lastAddItemClickAt < 250) return;
  lastAddItemClickAt = now;
  addRow();
}

window.handleAddItemClick = handleAddItemClick;

function debounce(fn, delay = 300) {
  let timer;
  return function (...args) { clearTimeout(timer); timer = setTimeout(() => fn.apply(this, args), delay); };
}

function formatDate(iso) {
  if (!iso) return '';
  try {
    const normalized = String(iso).slice(0, 10);
    const date = new Date(`${normalized}T12:00:00+05:30`);
    return date.toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch { return iso; }
}

function getTodayInIndiaISO() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date());
  const map = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

// ─── STATE ────────────────────────────────────────────────────────────────────
const LS_KEY = 'sk_inv_data_v2';
const LS_INV_NUM_KEY = 'sk_inv_num';
var rows = [];
var rowCounter = 0;
let logoDataUrl = null;
let inventoryData = []; // [{brand, product, packaging, price}]
let clientsData = [];   // [{ClientName, Address, Phone, GSTIN}]
let currentAcInput = null;
let qrInstance = null;
window._invoiceSavedOnce = false;
window.currentInvoiceId = null;
window.currentInvoiceFinalized = false;

// Google Sheets CSV URL (Products sheet)
const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1axb8I12FZrcSzdEUKrdlO7kpgQ0-BJ6wYSKv32gPQZI/export?format=csv&gid=1301639597';

// ─── USERS ────────────────────────────────────────────────────────────────────
const USERS = [
  { username: 'Tirth', password: 'Tirth', mobile: '9664675227' },
];

function normalizeProductRow(item) {
  return {
    brand: String(item.brand || item.BrandName || item['Brand Name'] || '').trim(),
    product: String(item.product || item.ProductName || item['Product Name'] || item.name || '').trim(),
    packaging: String(item.packaging || item.PackagingSize || item['Packaging Size'] || item.size || '').trim(),
    price: String(item.price || item.UnitPrice || item['Unit Price'] || '').trim(),
    hsn: String(item.hsn || item.HSN || item['HSN/SAC'] || '').trim(),
  };
}

function normalizeClientRow(item) {
  return {
    ClientID: String(item.ClientID || item.id || '').trim(),
    ClientName: String(item.ClientName || item['Client Name'] || item.client || item.name || '').trim(),
    Address: String(item.Address || item.address || '').trim(),
    Phone: String(item.Phone || item.phone || item.Mobile || item.mobile || '').trim(),
    GSTIN: String(item.GSTIN || item.gstin || '').trim(),
    DueAmount: parseFloat(item.DueAmount || item['Due Amount'] || item.dueAmount || item.due || 0) || 0,
  };
}

function updateQR() {
  const qrToggle = $('qr-toggle');
  const qrBlock = $('qr-block');
  const qrCanvas = $('qr-canvas');
  if (!qrToggle || !qrBlock || !qrCanvas) return;

  const show = !!qrToggle.checked;
  qrBlock.style.display = show ? '' : 'none';
  qrCanvas.innerHTML = '';
  qrInstance = null;

  if (!show) {
    autoSave();
    return;
  }

  const upi = ($('s-upi')?.value || '').trim() || 'business@bank';
  const name = ($('s-company')?.value || '').trim() || 'Business';

  try {
    qrInstance = new QRCode(qrCanvas, {
      text: `upi://pay?pa=${upi}&pn=${encodeURIComponent(name)}`,
      width: 90,
      height: 90,
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.M,
    });
  } catch (err) {
    console.warn('QR render failed:', err);
  }

  autoSave();
}

window.updateQR = updateQR;

function buildQrDataUrl(upi, companyName) {
  if (!window.QRCode) return '';

  const wrap = document.createElement('div');
  wrap.style.position = 'fixed';
  wrap.style.left = '-10000px';
  wrap.style.top = '0';
  wrap.style.width = '90px';
  wrap.style.height = '90px';
  wrap.style.visibility = 'hidden';
  document.body.appendChild(wrap);

  try {
    new QRCode(wrap, {
      text: `upi://pay?pa=${upi}&pn=${encodeURIComponent(companyName)}`,
      width: 90,
      height: 90,
      colorDark: '#000000',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.M,
    });

    const qrCanvas = wrap.querySelector('canvas');
    if (qrCanvas) return qrCanvas.toDataURL('image/png');

    const qrImg = wrap.querySelector('img');
    if (qrImg?.src) return qrImg.src;
  } catch (err) {
    console.warn('QR export failed:', err);
  } finally {
    wrap.remove();
  }

  return '';
}

function savePdfBlob(pdf, filename) {
  if (window.innerWidth <= 768 && typeof pdf.save === 'function') {
    pdf.save(filename);
    return;
  }

  const blob = pdf.output('blob');
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    link.remove();
  }, 1000);
}

async function fetchInventory() {
  try {
    const response = await getProducts();
    const data = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
    inventoryData = data.map(normalizeProductRow).filter(item => item.brand || item.product || item.packaging);
    return inventoryData;
  } catch (err) {
    console.warn('Failed to load products from Google Sheets:', err.message);
    inventoryData = [];
    return [];
  }
}

async function fetchClients() {
  try {
    const response = await getClients();
    const data = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
    clientsData = data.map(normalizeClientRow).filter(item => item.ClientName || item.Phone);
    return clientsData;
  } catch (err) {
    console.warn('Failed to load clients from Google Sheets:', err.message);
    clientsData = [];
    return [];
  }
}

// ─── AUTH ────────────────────────────────────────────────────────────────────
function doLogin() {
  try {
    const u = ($('l-user').value || '').trim();
    const p = $('l-pass').value || '';
    if (!u || !p) {
      toast('Please enter username and password', 'error');
      return;
    }
    const found = USERS.find(x => x.username.toLowerCase() === u.toLowerCase() && x.password === p);
    if (found) {
      if (typeof safeStorage !== 'undefined' && safeStorage?.setItem) {
        safeStorage.setItem('inv_auth', found.username);
        safeStorage.setItem('inv_user_mobile', found.mobile);
      } else {
        localStorage.setItem('inv_auth', found.username);
        localStorage.setItem('inv_user_mobile', found.mobile);
      }

      const loginScreen = $('login-screen');
      const toolbar = $('toolbar');
      const app = $('app');
      if (loginScreen) loginScreen.style.display = 'none';
      if (toolbar) toolbar.classList.remove('hidden');
      if (app) app.classList.remove('hidden');

      if (typeof showProfileSymbol === 'function') showProfileSymbol();
      if (typeof initMobile === 'function') initMobile();
      if (typeof bootApp === 'function') {
        Promise.resolve(bootApp(found.mobile)).catch((err) => {
          console.error('Boot error after login:', err);
          toast('Signed in, but app initialization failed: ' + (err.message || 'Unknown error'), 'error');
        });
      }
    } else {
      toast('Invalid username or password', 'error');
    }
  } catch (err) {
    console.error('Login error:', err);
    toast('Login failed', 'error');
  }
}

function doLogout() {
  try {
    safeStorage.removeItem('inv_auth');
    safeStorage.removeItem('inv_user_mobile');
    safeStorage.removeItem(LS_KEY);
  } catch (err) {
    console.warn('Logout cleanup failed:', err);
  }
  window.location.reload();
}

function togglePasswordVisibility() {
  const input = $('l-pass');
  const icon = $('pass-toggle-icon');
  if (!input) return;
  const isVisible = input.type === 'text';
  input.type = isVisible ? 'password' : 'text';
  if (icon) icon.textContent = isVisible ? 'visibility' : 'visibility_off';
  const btn = $('pass-toggle-btn');
  if (btn) btn.setAttribute('aria-pressed', String(!isVisible));
}

window.doLogin = doLogin;
window.doLogout = doLogout;
window.togglePasswordVisibility = togglePasswordVisibility;

function forceUppercaseValue(el) {
  if (!el) return;
  const apply = () => {
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const upper = normalizeGSTIN(el.value);
    if (el.value !== upper) {
      el.value = upper;
      try { el.setSelectionRange(start, end); } catch (err) { }
    }
  };
  el.addEventListener('input', apply);
  apply();
}

function setUserPhone(mobile) {
  const phone = String(mobile || '').trim();
  const phoneInput = $('s-phone');
  if (phoneInput) phoneInput.value = phone;

  const paperPhone = $('p-phone');
  if (paperPhone) paperPhone.textContent = phone || '—';

  const emailPhoneSep = $('p-email-phone-sep');
  if (emailPhoneSep) emailPhoneSep.style.display = phone ? '' : 'none';
  if (phoneInput && phoneInput.parentNode) {
    let info = document.getElementById('user-mobile-info');
    if (!info) {
      info = document.createElement('div');
      info.id = 'user-mobile-info';
      info.style.fontSize = '12px';
      info.style.color = '#334155';
      info.style.marginTop = '2px';
      phoneInput.parentNode.appendChild(info);
    }
    info.textContent = phone ? `Logged-in Mobile: ${phone}` : '';
  }
}

const SYNC_MAP = {
  's-company': ['p-company', 'p-from-name'],
  's-address': ['p-address', 'p-from-sub'],
  's-phone': ['p-phone'],
  's-email': ['p-email'],
  's-gstin': ['p-gstin'],
  's-signatory': ['p-signatory'],
  's-inv-num': ['p-inv-num'],
  's-bank-name': ['p-bank-name'],
  's-bank-acc': ['p-bank-acc'],
  's-bank-ifsc': ['p-bank-ifsc'],
  's-upi': ['p-upi'],
};

function bindSidebarInputs() {
  Object.keys(SYNC_MAP).forEach((srcId) => {
    const el = $(srcId);
    if (!el) return;
    el.addEventListener('input', () => {
      SYNC_MAP[srcId].forEach((destId) => {
        const dest = $(destId);
        if (dest) dest.textContent = el.value || '—';
      });
      if (srcId === 's-company' || srcId === 's-upi') updateQR();
      autoSave();
    });
  });

  const invDate = $('s-inv-date');
  if (invDate) {
    invDate.addEventListener('change', () => {
      const preview = $('p-inv-date');
      if (preview) preview.textContent = formatDate(invDate.value) || '—';
      autoSave();
    });
  }

  const dueDate = $('s-due-date');
  if (dueDate) {
    dueDate.addEventListener('change', () => {
      const line = $('p-due-line');
      const preview = $('p-due-date');
      const v = dueDate.value;
      if (line) line.style.display = v ? '' : 'none';
      if (preview) preview.textContent = formatDate(v) || '';
      autoSave();
    });
  }

  const syncClientPreview = () => {
    const pName = $('p-client-name');
    const pSub = $('p-client-sub');
    if (pName) pName.textContent = $('s-client-name')?.value || 'Client Name';
    if (pSub) {
      pSub.textContent = [
        $('s-client-addr')?.value || '',
        formatClientPhoneForPreview($('s-client-phone')?.value || ''),
        formatClientGSTINForPreview($('s-client-gstin')?.value || '')
      ].filter(Boolean).join(' | ');
    }
  };

  ['s-client-name', 's-client-addr', 's-client-phone', 's-client-gstin'].forEach((id) => {
    const el = $(id);
    if (!el) return;
    el.addEventListener('input', () => {
      if (id === 's-client-gstin') {
        const up = normalizeGSTIN(el.value);
        if (el.value !== up) el.value = up;
      }
      syncClientPreview();
      autoSave();
    });
  });

  const intro = $('s-intro');
  if (intro) {
    intro.addEventListener('input', () => {
      const target = $('p-intro');
      if (target) target.textContent = intro.value || '';
      autoSave();
    });
  }

  const terms = $('s-terms');
  if (terms) {
    terms.addEventListener('input', () => {
      const target = $('p-terms');
      if (target) {
        const v = terms.value.trim();
        target.textContent = v;
        target.style.display = v ? '' : 'none';
      }
      autoSave();
    });
  }
}

function refreshPaper() {
  Object.keys(SYNC_MAP).forEach((srcId) => {
    const el = $(srcId);
    if (!el) return;
    SYNC_MAP[srcId].forEach((destId) => {
      const dest = $(destId);
      if (dest) dest.textContent = el.value || '—';
    });
  });

  const pInvDate = $('p-inv-date');
  if (pInvDate) pInvDate.textContent = formatDate($('s-inv-date')?.value || '') || '—';

  const due = $('s-due-date')?.value || '';
  const dueLine = $('p-due-line');
  const pDueDate = $('p-due-date');
  if (dueLine) dueLine.style.display = due ? '' : 'none';
  if (pDueDate) pDueDate.textContent = due ? formatDate(due) : '';

  const pClientName = $('p-client-name');
  if (pClientName) pClientName.textContent = $('s-client-name')?.value || 'Client Name';

  const pClientSub = $('p-client-sub');
  if (pClientSub) {
    pClientSub.textContent = [
      $('s-client-addr')?.value || '',
      formatClientPhoneForPreview($('s-client-phone')?.value || ''),
      formatClientGSTINForPreview($('s-client-gstin')?.value || '')
    ].filter(Boolean).join(' | ');
  }

  const gstin = normalizeGSTIN($('s-client-gstin')?.value || '');
  const gstinEl = $('s-client-gstin');
  if (gstinEl && gstinEl.value !== gstin) gstinEl.value = gstin;
  const pIntro = $('p-intro');
  if (pIntro) pIntro.textContent = $('s-intro')?.value || '';

  const pTerms = $('p-terms');
  if (pTerms) {
    const terms = $('s-terms')?.value?.trim() || '';
    pTerms.textContent = terms;
    pTerms.style.display = terms ? '' : 'none';
  }

  const addressPhoneSep = $('p-email-phone-sep');
  const headerPhone = $('p-phone')?.textContent?.trim() || '';
  if (addressPhoneSep) addressPhoneSep.style.display = headerPhone && headerPhone !== '—' ? '' : 'none';

  if (typeof updateQR === 'function') updateQR();
}

function addRow(data = {}) {
  const rid = 'r' + (++rowCounter);
  const isGstMode = document.body.classList.contains('gst-mode');
  rows.push({
    id: rid,
    brand: data.brand || '',
    name: data.name || '',
    desc: data.desc || '',
    packaging: data.packaging || '',
    qty: data.qty != null ? data.qty : '',
    price: data.price || '',
    total: data.total || 0,
    hsn: data.hsn || '',
    gstRate: data.gstRate != null ? data.gstRate : (isGstMode ? 18 : 0)
  });
  renderRows();
  renderMobItems();
}

function ensureOneBlankItem() {
  if (rows.length) return;
  addRow();
}

function removeRow(rid) {
  if (rows.length <= 1) {
    toast('At least one item is required', 'error');
    return;
  }
  rows = rows.filter(r => r.id !== rid);
  renderRows();
  renderMobItems();
  autoSave();
}

function renderRows() {
  const table = $('items-table'); if (!table) return;
  const thead = table.querySelector('thead');
  const tbody = $('items-tbody'); if (!tbody) return;

  const isGst = document.body.classList.contains('gst-mode');
  const taxType = resolveTaxTypeFromInputs();
  const taxConfig = getTaxConfig(taxType);
  const isIgst = taxType.startsWith('IGST');

  tbody.innerHTML = '';

  if (!isGst) {
    thead.innerHTML = 
`
      <tr>
        <th style="width:5%">#</th>
        <th style="width:30%">Brand Name</th>
        <th style="width:35%">Product Name</th>
        <th style="width:8%">Qty</th>
        <th style="width:10%">Price</th>
        <th style="width:12%">Total (&#8377;)</th>
      </tr>
    `;

    rows.forEach((row, i) => {
      const tr = document.createElement('tr');
      tr.innerHTML = 
`
        <td style="text-align:center">${i + 1}</td>
        <td>
          <div style="font-weight:700;color:var(--paper-text)">${esc(row.brand)}</div>
        </td>
        <td>
          <div style="font-weight:600;color:var(--paper-text)">${esc(row.name)}</div>
          ${row.desc ? `<div style="font-size:10px;color:#64748b;margin-top:2px">${esc(row.desc)}</div>` : ''}
        </td>
        <td style="text-align:center">${row.qty || '&mdash;'}</td>
        <td style="text-align:right">${row.price ? '&#8377;' + INR.format(parseFloat(row.price)) : '&mdash;'}</td>
        <td style="text-align:right" id="rt_${row.id}">${row.total > 0 ? '&#8377;' + INR.format(row.total) : '&mdash;'}</td>
      `;
      tbody.appendChild(tr);
    });
  } else {
    thead.innerHTML = 
`
      <tr>
        <th style="width:5%">No.</th>
        <th style="width:39%">Product Name</th>
        <th style="width:14%">HSN/SAC</th>
        <th style="width:10%">Qty</th>
        <th style="width:14%">Rate</th>
        <th style="width:18%">Total (&#8377;)</th>
      </tr>
    `;

    rows.forEach((row, i) => {
      const qty = parseFloat(row.qty) || 0;
      const price = parseFloat(row.price) || 0;
      const taxable = Math.round((qty * price) * 100) / 100;
      const rate = taxConfig.rate;
      const cgstRate = isIgst ? 0 : rate / 2;
      const sgstRate = isIgst ? 0 : rate / 2;
      const igstRate = isIgst ? rate : 0;
      const cgstAmt = isIgst ? 0 : Math.round((taxable * cgstRate / 100) * 100) / 100;
      const sgstAmt = isIgst ? 0 : Math.round((taxable * sgstRate / 100) * 100) / 100;
      const igstAmt = isIgst ? Math.round((taxable * igstRate / 100) * 100) / 100 : 0;
      const rowTotal = Math.round((taxable + cgstAmt + sgstAmt + igstAmt) * 100) / 100;

      const tr = document.createElement('tr');
      tr.innerHTML = 
`
        <td style="text-align:center">${i + 1}</td>
        <td>
          <div style="font-weight:700;color:var(--paper-text)">${esc(row.name)}</div>
          ${row.desc ? `<div style="font-size:9px;color:#64748b;margin-top:1px">${esc(row.desc)}</div>` : ''}
        </td>
        <td style="text-align:center">${esc(row.hsn || '—')}</td>
        <td style="text-align:center">${row.qty || '&mdash;'}</td>
        <td style="text-align:right">${row.price ? '&#8377;' + INR.format(price) : '&mdash;'}</td>
        <td style="text-align:right" id="rt_${row.id}">${rowTotal > 0 ? '&#8377;' + INR.format(rowTotal) : '&mdash;'}</td>
      `;
      tbody.appendChild(tr);
    });
  }
  recalcAll();
}

function renderMobItems() {
  const container = $('mob-items-list'); if (!container) return;
  container.innerHTML = '';
  if (!rows.length) {
    container.innerHTML = '<div style="text-align:center;color:var(--text-muted);font-size:13px;padding:20px 0">No items yet. Tap "Add Item" below.</div>';
    return;
  }
  rows.forEach((row, i) => {
    const pkOptions = getPackagingForProduct(row.brand, row.name);
    const isGst = document.body.classList.contains('gst-mode');
    const card = document.createElement('div');
    card.className = 'mob-item-card';
    card.id = 'mob-card-' + row.id;
    
    card.innerHTML = `
      <div class="mob-item-card-header">
        <span class="mob-item-num">Item ${i + 1}${i === 0 ? ' <span style="color:#ef4444;font-weight:700;margin-left:4px;">*</span>' : ''}</span>
        ${i === 0 ? '<span style="font-size:10px;color:#94a3b8;font-weight:500">(Required)</span>' : `<button class="mob-item-remove" onclick="removeRow('${row.id}')">✕ Remove</button>`}
      </div>

      ${isGst ? '' : `
      <span class="sb-label">Brand Name</span>
      <input class="sb-input" placeholder="Brand name" value="${esc(row.brand)}"
        data-rid="${row.id}" data-field="brand"
        onclick="event.stopPropagation(); showItemAutocomplete(this, 'brand')"
        onfocus="showItemAutocomplete(this, 'brand')"
        oninput="onItemInput(this); showItemAutocomplete(this,'brand')"
        onkeydown="acKeyDown(event, this)" autocomplete="off" />`}

      <span class="sb-label">Product Name</span>
      <input class="sb-input" placeholder="Product name " value="${esc(row.name)}"
        data-rid="${row.id}" data-field="name"
        onclick="event.stopPropagation(); showItemAutocomplete(this, 'name')"
        onfocus="showItemAutocomplete(this, 'name')"
        oninput="onItemInput(this); showItemAutocomplete(this,'name')"
        onkeydown="acKeyDown(event, this)" autocomplete="off" />

      <span class="sb-label">Packaging Size</span>
      <input class="sb-input select-styled" readonly
        placeholder="— Select Packaging —"
        value="${row.packaging ? esc(row.packaging) : ''}"
        data-rid="${row.id}" data-field="packaging"
        onclick="event.stopPropagation(); showPackagingDropdown(this)" />

      <span class="sb-label">Description <span style="font-weight:400;color:var(--text-muted)">(editable)</span></span>
      <input class="sb-input" placeholder="Description" value="${esc(row.desc)}"
        data-rid="${row.id}" data-field="desc"
        oninput="onItemInput(this)" />

      ${isGst ? `
      <span class="sb-label">HSN Code</span>
      <input class="sb-input" placeholder="Enter HSN code" value="${esc(row.hsn || '')}"
        data-rid="${row.id}" data-field="hsn"
        oninput="onItemInput(this)" />` : ''}


      <div class="sb-row" style="gap:10px;margin-top:4px">
        <div style="flex:1">
          <span class="sb-label">Quantity</span>
          <input class="sb-input" type="number" min="0" placeholder="0" value="${row.qty}"
            data-rid="${row.id}" data-field="qty"
            oninput="onQtyPriceInput(this)" onfocus="this.select()" />
        </div>
        <div style="flex:1">
          <span class="sb-label">Unit Price (₹)</span>
          <input class="sb-input" type="number" min="0" step="0.01" placeholder="0.00" value="${row.price}"
            data-rid="${row.id}" data-field="price"
            oninput="onQtyPriceInput(this)" />
        </div>
      </div>
      <div class="mob-item-total">
        <span style="color:var(--text-muted);font-size:12px">Line Total</span>
        <span class="mob-item-total-value" id="mob-rt-${row.id}">${row.total > 0 ? '₹' + INR.format(row.total) : '—'}</span>
      </div>`;
    container.appendChild(card);
  });
}

// ─── ITEM INPUT HANDLERS ──────────────────────────────────────────────────────
function onItemInput(el) {
  const rid = el.dataset.rid, field = el.dataset.field;
  const row = rows.find(r => r.id === rid); if (!row) return;
  row[field] = el.value;

  if (field === 'brand') {
    const exactBrands = getUniqueBrands().filter(b => b.toLowerCase() === row.brand.trim().toLowerCase());
    if (exactBrands.length > 0) {
      row.brand = exactBrands[0];
      const products = getProductsForBrand(row.brand);
      if (products.length > 0) {
        if (!row.name || !products.includes(row.name)) {
          row.name = products[0];
        }
      } else {
        row.name = '';
      }
    } else {
      row.name = '';
    }
    row.packaging = ''; row.price = ''; row.desc = ''; row.total = 0;
  } else if (field === 'name') {
    const allProducts = getAllProducts();
    const exactProducts = allProducts.filter(p => p.toLowerCase() === row.name.trim().toLowerCase());
    if (exactProducts.length > 0) {
      row.name = exactProducts[0];
      const validBrands = inventoryData.filter(x => (x.product || x.ProductName || '').toLowerCase() === row.name.toLowerCase()).map(x => x.brand || x.BrandName || '');
      if (validBrands.length > 0 && (!row.brand || !validBrands.includes(row.brand))) {
        row.brand = validBrands[0];
      }
    }
    row.packaging = ''; row.price = ''; row.desc = ''; row.total = 0;
  }

  if (field === 'brand' || field === 'name') {
    const card = document.getElementById('mob-card-' + rid);
    if (card) {
      const bInp = card.querySelector('[data-field="brand"]');
      if (bInp) bInp.value = row.brand || '';

      const nInp = card.querySelector('[data-field="name"]');
      if (nInp) {
        nInp.value = row.name || '';
        nInp.placeholder = 'Start typing product...';
      }

      const dInp = card.querySelector('[data-field="desc"]');
      if (dInp) dInp.value = row.desc || '';

      const pInp = card.querySelector('[data-field="price"]');
      if (pInp) pInp.value = row.price || '';

      const tSpan = card.querySelector('.mob-item-total-value');
      if (tSpan) tSpan.textContent = '—';

      const packInp = card.querySelector('input[data-field="packaging"]');
      if (packInp) {
        packInp.value = row.packaging || '';
      }
    }
  }

  renderRows();
  autoSave();
}

function onPackagingChange(el, optValue) {
  const rid = el.dataset.rid;
  const row = rows.find(r => r.id === rid); if (!row) return;
  const val = optValue !== undefined ? optValue : el.value;
  row.packaging = val;
  if (val) {
    const price = getPriceForPackaging(row.brand, row.name, val);
    row.price = price !== '' ? price : row.price;
    row.desc = val; // auto-fill description = packaging
  } else {
    row.packaging = '';
  }
  row.total = (parseFloat(row.qty) || 0) * (parseFloat(row.price) || 0);

  const card = document.getElementById('mob-card-' + rid);
  if (card) {
    const pInp = card.querySelector('[data-field="price"]');
    if (pInp) pInp.value = row.price || '';

    const dInp = card.querySelector('[data-field="desc"]');
    if (dInp) dInp.value = row.desc || '';

    const tSpan = card.querySelector('.mob-item-total-value');
    if (tSpan) tSpan.textContent = row.total > 0 ? '₹' + INR.format(row.total) : '—';

    // Also update desktop realtime tags
    const rt = document.getElementById('rt_' + rid);
    if (rt) rt.textContent = row.total > 0 ? '₹' + INR.format(row.total) : '—';
  }
  recalcAll();
  renderRows();
  autoSave();
}

window.addRow = addRow;
window.removeRow = removeRow;
window.onItemInput = onItemInput;
window.onQtyPriceInput = onQtyPriceInput;
window.showItemAutocomplete = showItemAutocomplete;
window.showPackagingDropdown = showPackagingDropdown;
window.acKeyDown = acKeyDown;
window.onPackagingChange = onPackagingChange;

function onQtyPriceInput(el) {
  const rid = el.dataset.rid, field = el.dataset.field;
  const row = rows.find(r => r.id === rid); if (!row) return;
  row[field] = el.value !== '' ? parseFloat(el.value) || 0 : '';
  row.total = (parseFloat(row.qty) || 0) * (parseFloat(row.price) || 0);
  // Update mobile total cell live
  const mt = $('mob-rt-' + rid); if (mt) mt.textContent = row.total > 0 ? '₹' + INR.format(row.total) : '—';
  const rt = $('rt_' + rid); if (rt) rt.textContent = row.total > 0 ? '₹' + INR.format(row.total) : '—';
  // Re-render the full row table for preview paper
  renderRows();
  autoSave();
}

// ─── CALCULATIONS ─────────────────────────────────────────────────────────────
function resolveTaxTypeFromInputs() {
  const taxTypeInput = $('tax-type')?.value || $('gst-rate-display')?.value;
  if (taxTypeInput) return normalizeTaxType(taxTypeInput);
  const gstRate = parseFloat($('gst-rate')?.value) || 0;
  return normalizeTaxType(gstRate);
}

function setTaxType(taxType) {
  const config = getTaxConfig(taxType);
  const display = $('gst-rate-display'); if (display) display.value = config.key;
  const rateInput = $('gst-rate'); if (rateInput) rateInput.value = config.rate;
  const typeInput = $('tax-type'); if (typeInput) typeInput.value = config.key;
  rows.forEach(row => { row.gstRate = config.rate; });
  renderRows();
}
function recalcAll() {
  const isGst = document.body.classList.contains('gst-mode');
  const stateCode = (document.getElementById('s-client-state-code')?.value || '24').trim();
  const isSameState = stateCode === '24';
  const due = parseFloat($('s-client-due')?.value) || 0;

  rows.forEach(r => {
    const qty = parseFloat(r.qty) || 0;
    const price = parseFloat(r.price) || 0;
    const total = Math.round((qty * price) * 100) / 100;
    r.total = total;
    const formatted = total > 0 ? '₹' + INR.format(total) : '—';
    const rt = $('rt_' + r.id); if (rt) rt.textContent = formatted;
    const mt = $('mob-rt-' + r.id); if (mt) mt.textContent = formatted;
  });

  const sub = rows.reduce((s, r) => s + (parseFloat(r.total || 0)), 0);
  const taxType = resolveTaxTypeFromInputs();
  const totals = calculateInvoiceTotals(sub, taxType, due);
  syncTaxPreviewRows(totals);
  const psub = $('p-subtotal'); if (psub) psub.textContent = '₹' + INR.format(totals.subtotal);
  const pcgst = $('p-cgst'); if (pcgst) pcgst.textContent = '₹' + INR.format(totals.cgstAmount);
  const psgst = $('p-sgst'); if (psgst) psgst.textContent = '₹' + INR.format(totals.sgstAmount);
  const pigst = $('p-igst'); if (pigst) pigst.textContent = '₹' + INR.format(totals.igstAmount);
  const ptot = $('p-totalgst'); if (ptot) ptot.textContent = '₹' + INR.format(totals.totalTax);
  const pgr = $('p-grand'); if (pgr) pgr.textContent = '₹' + INR.format(totals.grandTotal);

  const ptaxtypeRow = $('p-taxtype-row');
  const ptaxtypeLabel = $('p-taxtype-label');
  const pcgstRow = $('p-cgst-row');
  const psgstRow = $('p-sgst-row');
  const pigstRow = $('p-igst-row');
  const ptotRow = $('p-totalgst-row');

  const pcgstLabel = $('p-cgst-label');
  const psgstLabel = $('p-sgst-label');
  const pigstLabel = $('p-igst-label');

  const isIgst = resolveTaxTypeFromInputs().startsWith('IGST');

  if (isGst) {
    if (ptaxtypeRow) ptaxtypeRow.style.display = 'none';
    if (pcgstRow) pcgstRow.style.display = 'none';
    if (psgstRow) psgstRow.style.display = 'none';
    if (pigstRow) pigstRow.style.display = 'none';
    if (ptotRow) ptotRow.style.display = 'none';

    if (pcgstLabel) pcgstLabel.textContent = `CGST`;
    if (psgstLabel) psgstLabel.textContent = `SGST`;
    if (pigstLabel) pigstLabel.textContent = `IGST`;
  } else {
    if (ptaxtypeRow) ptaxtypeRow.style.display = totals.taxType !== 'NONE' ? '' : 'none';
    if (ptaxtypeLabel) ptaxtypeLabel.textContent = formatTaxLabel(totals.taxType);

    if (pcgstRow) pcgstRow.style.display = totals.cgstAmount > 0 ? '' : 'none';
    if (psgstRow) psgstRow.style.display = totals.sgstAmount > 0 ? '' : 'none';
    if (pigstRow) pigstRow.style.display = totals.igstAmount > 0 ? '' : 'none';
    if (ptotRow) ptotRow.style.display = totals.taxType !== 'NONE' ? '' : 'none';

    if (pcgstLabel) pcgstLabel.textContent = `CGST (${totals.cgstRate}%)`;
    if (psgstLabel) psgstLabel.textContent = `SGST (${totals.sgstRate}%)`;
    if (pigstLabel) pigstLabel.textContent = `IGST (${totals.igstRate}%)`;
  }

  const pdueRow = $('p-due-row');
  const pdueAmt = $('p-due-amount');
  if (pdueRow && pdueAmt) {
    pdueRow.style.display = due > 0 ? '' : 'none';
    pdueAmt.textContent = '₹' + INR.format(due);
  }

  syncTaxPreviewRows(totals);
}

// ─── AUTOCOMPLETE ─────────────────────────────────────────────────────────────
function syncTaxPreviewRows(totals) {
  const ptaxtypeRow = $('p-taxtype-row');
  const ptaxtypeLabel = $('p-taxtype-label');
  const pcgstRow = $('p-cgst-row');
  const psgstRow = $('p-sgst-row');
  const pigstRow = $('p-igst-row');
  const ptotRow = $('p-totalgst-row');
  const pcgstLabel = $('p-cgst-label');
  const psgstLabel = $('p-sgst-label');
  const pigstLabel = $('p-igst-label');
  const psub = $('p-subtotal');
  const pcgst = $('p-cgst');

  if (psub) psub.textContent = '₹' + INR.format(totals.subtotal || 0);
  if (pcgst) pcgst.textContent = '₹' + INR.format(totals.cgstAmount || 0);
  if (ptaxtypeRow) ptaxtypeRow.style.display = totals.taxType !== 'NONE' ? '' : 'none';
  if (ptaxtypeLabel) ptaxtypeLabel.textContent = formatTaxLabel(totals.taxType);
  if (pcgstRow) pcgstRow.style.display = totals.cgstAmount > 0 ? '' : 'none';
  if (psgstRow) psgstRow.style.display = totals.sgstAmount > 0 ? '' : 'none';
  if (pigstRow) pigstRow.style.display = totals.igstAmount > 0 ? '' : 'none';
  if (ptotRow) ptotRow.style.display = totals.taxType !== 'NONE' ? '' : 'none';
  if (pcgstLabel) pcgstLabel.textContent = `CGST (${totals.cgstRate || 0}%)`;
  if (psgstLabel) psgstLabel.textContent = `SGST (${totals.sgstRate || 0}%)`;
  if (pigstLabel) pigstLabel.textContent = `IGST (${totals.igstRate || 0}%)`;
}

let acDropdown = null;
let acCurrentItems = [];

function getOrCreateDropdown() {
  if (!acDropdown) {
    acDropdown = document.getElementById('autocomplete-dropdown');
    if (!acDropdown) {
      acDropdown = document.createElement('div');
      acDropdown.id = 'autocomplete-dropdown';
      acDropdown.className = 'autocomplete-dropdown';
      document.body.appendChild(acDropdown);
    }
  }
  return acDropdown;
}

function showGstDropdown(inputEl) {
  currentAcInput = inputEl;
  const options = [
    { label: 'None GST 0%', value: 'NONE' },
    { label: 'GST 5%', value: 'GST5' },
    { label: 'GST 18%', value: 'GST18' },
    { label: 'IGST 5%', value: 'IGST5' },
    { label: 'IGST 18%', value: 'IGST18' }
  ];
  const matches = options.map(opt => ({
    label: opt.label,
    data: opt.value,
    onSelect: () => {
      inputEl.value = opt.label;
      setTaxType(opt.value);
      recalcAll();
      autoSave();
    }
  }));
  renderDropdown(matches, inputEl, null);
}

function showPackagingDropdown(inputEl) {
  currentAcInput = inputEl;
  const rid = inputEl.dataset.rid;
  const row = rows.find(r => r.id === rid); if (!row) return;

  const pkOptions = getPackagingForProduct(row.brand, row.name);
  const options = [...new Set([...pkOptions, row.packaging])].filter(Boolean);

  const matches = [
    { label: '— Select Packaging —', value: '' },
    ...options.map(pk => ({ label: pk, value: pk }))
  ].map(opt => ({
    label: opt.label,
    data: opt.value,
    onSelect: () => {
      inputEl.value = opt.label || '— Select Packaging —';
      onPackagingChange(inputEl, opt.value);
    }
  }));
  renderDropdown(matches, inputEl, rid);
}

function showItemAutocomplete(inputEl, fieldType) {
  currentAcInput = inputEl;
  const rid = inputEl.dataset.rid;
  const row = rows.find(r => r.id === rid);
  const val = inputEl.value.toLowerCase().trim();
  let matches = [];

  if (fieldType === 'brand') {
    const brands = getUniqueBrands();
    matches = brands.filter(b => b.toLowerCase().includes(val)).map(b => ({ label: b, type: 'brand', data: { brand: b } }));
  } else if (fieldType === 'name' && row) {
    const products = row.brand ? getProductsForBrand(row.brand) : getAllProducts();
    matches = products.filter(p => p.toLowerCase().includes(val)).map(p => ({ label: p, type: 'name', data: { product: p } }));
  }

  renderDropdown(matches.slice(0, 12), inputEl, rid);
}

function setClientDue(value) {
  const dueInput = $('s-client-due');
  if (dueInput) dueInput.value = value != null && value !== '' ? value : '';
  recalcAll();
}

function applyClientSelection(client) {
  if (!client) return;
  const name = client.ClientName || '';
  const addr = client.Address || '';
  const phone = client.Phone || '';
  const gstin = client.GSTIN || '';
  const due = client.DueAmount != null ? client.DueAmount : 0;

  const nameEl = $('s-client-name');
  const addrEl = $('s-client-addr');
  const phoneEl = $('s-client-phone');
  const gstinEl = $('s-client-gstin');

  if (nameEl) nameEl.value = name;
  if (addrEl) addrEl.value = addr;
  if (phoneEl) phoneEl.value = phone;
  if (gstinEl) gstinEl.value = gstin;
  setClientDue(due);
  syncClientSub();
  refreshPaper();
  autoSave();
}

function tryAutoFillClient(rawValue) {
  const value = String(rawValue || '').trim().toLowerCase();
  if (!value || !Array.isArray(clientsData) || !clientsData.length) return;
  const match = clientsData.find(client => String(client.ClientName || '').trim().toLowerCase() === value);
  if (match) applyClientSelection(match);
}

function showClientAutocomplete(inputEl) {
  currentAcInput = inputEl;
  const value = String(inputEl?.value || '').trim().toLowerCase();
  const matches = (clientsData || [])
    .filter(client => {
      const name = String(client.ClientName || '').toLowerCase();
      const phone = String(client.Phone || '').toLowerCase();
      const gstin = String(client.GSTIN || '').toLowerCase();
      return !value || name.includes(value) || phone.includes(value) || gstin.includes(value);
    })
    .slice(0, 12)
    .map(client => ({
      label: client.ClientName || 'Unnamed Client',
      type: 'client',
      data: client
    }));

  renderDropdown(matches, inputEl, null);
}

let dropPosRAF = null;
let lastRenderSignature = '';

function startDropdownTracker(inputEl, dd) {
  function tracker() {
    if (dd.style.display !== 'none' && currentAcInput === inputEl) {
      const rect = inputEl.getBoundingClientRect();

      // If input scrolls totally out of the viewport on Y axis, auto-close for cleanliness
      if (rect.bottom < 0 || rect.top > window.innerHeight) {
        closeDropdown();
        return;
      }

      // Fixed positioning keeps it attached flawlessly during scroll without lag
      dd.style.position = 'fixed';
      dd.style.left = rect.left + 'px';
      dd.style.top = (rect.bottom + 4) + 'px';
      dd.style.width = rect.width + 'px';

      // Dynamic max-height if near bottom of screen
      const spaceBelow = window.innerHeight - rect.bottom - 10;
      dd.style.maxHeight = Math.max(spaceBelow, 150) + 'px';

      dropPosRAF = requestAnimationFrame(tracker);
    }
  }
  cancelAnimationFrame(dropPosRAF);
  tracker();
}

function renderDropdown(items, inputEl, rid) {
  acCurrentItems = items;
  const dd = getOrCreateDropdown();

  // Signature check prevents duplicate expensive DOM teardowns when tapping rapidly (fixes '2-3 clicks' bug)
  const sig = inputEl.id + '_' + (rid || '') + '_' + items.map(i => i.label).join('|');
  if (dd.style.display === 'block' && currentAcInput === inputEl && lastRenderSignature === sig) {
    return; // Already rendering this exact list for this focused input
  }
  lastRenderSignature = sig;

  dd.innerHTML = '';

  if (!items.length) { dd.style.display = 'none'; return; }

  items.forEach(item => {
    const div = document.createElement('div');
    div.className = 'autocomplete-item';

    // Add nice padding and make touch targets larger for mobile
    div.style.padding = '12px 14px';

    div.innerHTML = `<span class="autocomplete-brand">${esc(item.label)}</span>`;
    if (item.data && item.data.product) {
      // It's a product: let's show pack/price if available
      const price = getPriceForPackaging(item.data.brand, item.label, null) || '';
      if (price) {
        div.innerHTML += `<div class="autocomplete-price">₹${price}</div>`;
      }
    } else if (item.data && item.data.GSTIN) {
      div.innerHTML += `<div class="autocomplete-desc">${esc(item.data.Phone || '')} | ${esc(item.data.GSTIN || '')}</div>`;
    }

    div.addEventListener('mousedown', e => {
      e.preventDefault(); // crucial to prevent the input from losing focus immediately during touch
      selectAutocompleteItem(item, rid);
      closeDropdown();
    });
    dd.appendChild(div);
  });

  dd.classList.add('active');
  dd.style.display = 'block';

  // Attach and start the position tracker
  startDropdownTracker(inputEl, dd);
}

function selectAutocompleteItem(item, rid) {
  if (typeof item.onSelect === 'function') {
    item.onSelect(item);
    return;
  }

  // Handle client sidebar selection
  if (item.type === 'client') {
    applyClientSelection(item.data);
    return;
  }

  const row = rows.find(r => r.id === rid); if (!row) return;

  if (item.type === 'brand') {
    row.brand = item.data.brand;
    const products = getProductsForBrand(row.brand);
    // Auto-fill product even if multiple? Let's check if 1 is best, but user says "automatically fetched"
    // If there's only 1, it's a definite win. If more, let's take the first one or leave it but clear the placeholder.
    if (products.length > 0) {
      // If current row name is not in the new products list, or is empty, pick the first one
      if (!row.name || !products.includes(row.name)) {
        row.name = products[0];
      }

      // After setting product, try to set packaging if it's unique or just pick the first for speed
      const packagings = getPackagingForProduct(row.brand, row.name);
      if (packagings.length === 1) {
        row.packaging = packagings[0];
        row.price = getPriceForPackaging(row.brand, row.name, row.packaging);
        row.desc = row.packaging;
      } else {
        row.packaging = ''; row.price = ''; row.desc = '';
      }
    } else {
      row.name = ''; row.packaging = ''; row.price = ''; row.desc = '';
    }
  } else if (item.type === 'name') {
    row.name = item.data.product;

    const validBrands = inventoryData.filter(x => (x.product || x.ProductName || '').toLowerCase() === row.name.toLowerCase()).map(x => x.brand || x.BrandName || '');
    if (validBrands.length > 0 && (!row.brand || !validBrands.includes(row.brand))) {
      row.brand = validBrands[0];
    }

    row.packaging = ''; row.price = ''; row.desc = '';
    const packagings = getPackagingForProduct(row.brand, row.name);
    if (packagings.length === 1) {
      row.packaging = packagings[0];
      row.price = getPriceForPackaging(row.brand, row.name, row.packaging);
      row.desc = row.packaging;
    }
  }

  row.total = (parseFloat(row.qty) || 0) * (parseFloat(row.price) || 0);

  // Visually update the card elements directly
  const card = document.getElementById('mob-card-' + rid);
  if (card) {
    const brandInp = card.querySelector('[data-field="brand"]');
    if (brandInp) brandInp.value = row.brand || '';

    const nameInp = card.querySelector('[data-field="name"]');
    if (nameInp) {
      nameInp.value = row.name || '';
      nameInp.placeholder = row.brand ? 'Start typing product...' : 'Select brand first...';
    }

    const descInp = card.querySelector('[data-field="desc"]');
    if (descInp) descInp.value = row.desc || '';

    const priceInp = card.querySelector('[data-field="price"]');
    if (priceInp) priceInp.value = row.price || '';

    const tSpan = card.querySelector('.mob-item-total-value');
    if (tSpan) tSpan.textContent = row.total > 0 ? '₹' + INR.format(row.total) : '—';

    const packInp = card.querySelector('input[data-field="packaging"]');
    if (packInp) {
      packInp.value = row.packaging || '';
    }

    const hsnInp = card.querySelector('[data-field="hsn"]');
    if (hsnInp) hsnInp.value = row.hsn || '';

    const gstSel = card.querySelector('[data-field="gstRate"]');
    if (gstSel) gstSel.value = row.gstRate != null ? row.gstRate : '18';
  }

  renderRows(); // Update paper preview only
  autoSave();
}

function closeDropdown() {
  if (acDropdown) {
    acDropdown.style.display = 'none';
    acDropdown.classList.remove('active');
  }
  currentAcInput = null;
  lastRenderSignature = '';
  cancelAnimationFrame(dropPosRAF);
}

document.addEventListener('click', e => {
  if (acDropdown && acDropdown.style.display !== 'none' && !acDropdown.contains(e.target) && e.target !== currentAcInput) {
    closeDropdown();
  }
});

function acKeyDown(e, inputEl) {
  if (e.key === 'Enter') {
    e.preventDefault();
    if (acDropdown && acDropdown.style.display === 'block' && acCurrentItems.length > 0) {
      selectAutocompleteItem(acCurrentItems[0], inputEl.dataset.rid);
      closeDropdown();
      inputEl.blur();
    }
  }
}

// Qty inputs: select on focus for fast editing
function selectQtyInput(input) { input.select(); }
function resetQtyIfEmpty(input) { if (input.value === '' || input.value === '0') { input.value = ''; } }

// ─── STORAGE (localStorage) ───────────────────────────────────────────────────
function getFieldValues() {
  const ids = ['s-company', 's-address', 's-phone', 's-email', 's-gstin', 's-signatory',
    's-inv-num', 's-inv-date', 's-due-date', 'gst-rate', 'tax-type',
    's-client-name', 's-client-addr', 's-client-phone', 's-client-gstin',
    's-bank-name', 's-bank-acc', 's-bank-ifsc', 's-upi', 's-intro', 's-terms'];
  return ids.reduce((obj, id) => { obj[id] = $(id)?.value || ''; return obj; }, {});
}

function setFieldValues(data) {
  if (!data) return;
  Object.entries(data).forEach(([id, val]) => {
    const el = $(id);
    if (!el) return;
    if (id === 's-company' || id === 's-signatory') {
      el.value = normalizeBusinessName(val) || '';
      return;
    }
    if (id === 's-gstin' || id === 's-client-gstin' || id === 'modal-client-gstin') {
      el.value = normalizeGSTIN(val);
      return;
    }
    el.value = val || '';
  });
}

function autoSave() {
  try {
    const payload = {
      fields: getFieldValues(),
      rows: rows,
      qr: $('qr-toggle')?.checked || false,
    };
    safeStorage.setItem(LS_KEY, JSON.stringify(payload));
  } catch { }
}

function loadSaved() {
  try {
    const raw = safeStorage.getItem(LS_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (data.fields) setFieldValues(data.fields);
    if (Array.isArray(data.rows) && data.rows.length) {
      rows = [];
      data.rows.forEach(r => addRow(r));
    }
    const qrToggle = $('qr-toggle');
    if (qrToggle) qrToggle.checked = !!data.qr;
  } catch { }
}

function setInvoiceNumberDisplay(invoiceNumber) {
  const value = String(invoiceNumber || '').trim();
  const invInput = $('s-inv-num');
  const invDisplay = $('s-inv-num-display');
  const invPreview = $('p-inv-num');
  if (invInput) invInput.value = value;
  if (invDisplay) invDisplay.textContent = value || '—';
  if (invPreview) invPreview.textContent = value || '—';
}

async function setAutoInvoiceNumber(force = false) {
  if (window.currentInvoiceId && !force) {
    return $('s-inv-num')?.value || '';
  }

  const currentValue = ($('s-inv-num')?.value || '').trim();
  if (currentValue && !force) {
    setInvoiceNumberDisplay(currentValue);
    return currentValue;
  }

  const nextNumber = await apiGetNextInvoiceNumber();
  setInvoiceNumberDisplay(nextNumber);
  return nextNumber;
}

async function prepareNextInvoiceDraft() {
  const mode = document.body.classList.contains('gst-mode') ? 'gst' : 'nongst';
  rows = [];
  rowCounter = 0;
  window.currentInvoiceId = null;
  window._invoiceSavedOnce = false;
  window.currentInvoiceFinalized = false;

  ['s-client-name', 's-client-addr', 's-client-phone', 's-client-gstin', 's-client-due', 's-due-date'].forEach(id => {
    const el = $(id);
    if (el) el.value = '';
  });

  const clientStateEl = $('s-client-state');
  if (clientStateEl) clientStateEl.value = 'Gujarat';
  const clientStateCodeEl = $('s-client-state-code');
  if (clientStateCodeEl) clientStateCodeEl.value = '24';
  const placeSupplyEl = $('s-place-supply');
  if (placeSupplyEl) placeSupplyEl.value = 'Gujarat';

  const today = getTodayInIndiaISO();
  const dateEl = $('s-inv-date');
  if (dateEl) dateEl.value = today;

  setBillingMode(mode);
  await setAutoInvoiceNumber(true);
  renderRows();
  ensureOneBlankItem();
  renderMobItems();
  refreshPaper();
  recalcAll();
  autoSave();
}

// ─── CLOUD SAVE ───────────────────────────────────────────────────────────────
async function saveToCloud(silent = false) {
  if (!silent) { toast('Saving…', ''); }
  try {
    if (!window.currentInvoiceId && !$('s-inv-num').value) {
      await setAutoInvoiceNumber();
    }
    const payload = extractInvoiceJSON(window.currentInvoiceId);
    let result;
    if (window.currentInvoiceId) {
      result = await apiUpdateInvoice(payload);
    } else {
      result = await apiSaveInvoice(payload);
    }

    if (result && result.uniqueId) {
      window.currentInvoiceId = result.uniqueId;
    }
    if (result && result.invoiceNumber) {
      setInvoiceNumberDisplay(result.invoiceNumber);
    }

    window._invoiceSavedOnce = true;
    try {
      const cache = JSON.parse(safeStorage.getItem('invoice_history_cache') || '[]');
      const existingIdx = cache.findIndex(i => i.uniqueId === window.currentInvoiceId);
      const mappedInvoice = {
        uniqueId: window.currentInvoiceId,
        invoiceNumber: payload.InvoiceNumber,
        date: payload.meta?.date,
        customerName: payload.customer?.name || 'Unknown',
        mobile: payload.customer?.phone || '',
        totalAmount: payload.calculations?.grandTotal || 0,
      };
      if (existingIdx !== -1) cache[existingIdx] = { ...cache[existingIdx], ...mappedInvoice };
      else cache.unshift(mappedInvoice);
      safeStorage.setItem('invoice_history_cache', JSON.stringify(cache));
    } catch(e) {}

    // ── Sync Due Amount back to Clients sheet (fire-and-forget) ──────────────
    // Whenever an invoice is saved, update the client's DueAmount in the Clients
    // sheet so it always reflects the very latest outstanding balance.
    try {
      const clientNameStr = payload.customer?.name || payload.ClientName || '';
      const dueAmtVal = parseFloat($('s-client-due')?.value || payload.dueAmount || 0);
      if (clientNameStr) {
        // Update local clientsData cache immediately so UI reflects new value
        if (Array.isArray(clientsData)) {
          const localMatch = clientsData.find(c =>
            (c.ClientName || '').toLowerCase().trim() === clientNameStr.toLowerCase().trim()
          );
          if (localMatch) localMatch.DueAmount = dueAmtVal;
        }
        // Push to backend asynchronously — does NOT block save
        apiUpdateClientDue(clientNameStr, dueAmtVal);
      }
    } catch(e) { console.warn('Due sync error:', e); }

    if (!silent) toast('Invoice saved ✓');
    return { ...result, payload };
  } catch (err) {
    console.error('Save error:', err);
    if (!silent) toast('Save failed: ' + (err.message || 'Network error'), 'error');
    throw err;
  }
}

// ─── PDF GENERATION ───────────────────────────────────────────────────────────
function pdfMoney(value) {
  return '₹' + INR.format(parseFloat(value) || 0);
}

function pdfWrapLines(pdf, text, maxWidth) {
  const rawLines = String(text || '').split('\n');
  const wrapped = [];
  rawLines.forEach(line => {
    const chunks = pdf.splitTextToSize(line || ' ', maxWidth);
    if (chunks.length) wrapped.push(...chunks);
    else wrapped.push(' ');
  });
  return wrapped;
}

function pdfDrawImageIfReady(pdf, imgEl, format, x, y, w, h) {
  if (!imgEl || imgEl.style.display === 'none') return;
  try {
    pdf.addImage(imgEl, format, x, y, w, h);
  } catch (err) {
    console.warn('Skipping PDF image:', err.message);
  }
}

function drawVectorInvoicePdf(pdf, payload) {
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;
  const rightEdge = pageWidth - margin;
  const isGst = payload.InvoiceType === 'GST';
  const dueAmount = parseFloat(payload.DueAmount || payload.customer?.dueAmount || 0) || 0;
  const totals = payload.calculations || {};
  let y = margin;

  const ensureSpace = needed => {
    if (y + needed <= pageHeight - margin) return;
    pdf.addPage();
    y = margin;
  };

  pdf.setDrawColor(226, 232, 240);
  pdf.setTextColor(30, 41, 59);
  pdf.setFont('helvetica', 'normal');

  pdfDrawImageIfReady(pdf, $('paper-logo'), 'JPEG', margin, y, 28, 18);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.text(payload.business?.company || 'Invoice', 105, y + 6, { align: 'center' });
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  const companyLines = [
    payload.business?.address || '',
    [payload.business?.phone || '', payload.business?.email || ''].filter(Boolean).join(' | '),
    payload.business?.gstin ? `GSTIN: ${payload.business.gstin}` : ''
  ].filter(Boolean);
  companyLines.forEach((line, index) => pdf.text(line, 105, y + 12 + index * 4, { align: 'center' }));

  pdf.setDrawColor(5, 90, 72);
  pdf.setFillColor(5, 90, 72);
  pdf.roundedRect(rightEdge - 48, y, 48, 22, 2, 2, 'S');
  pdf.rect(rightEdge - 48, y, 48, 6, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.text('INVOICE', rightEdge - 24, y + 4.2, { align: 'center' });
  pdf.setTextColor(30, 41, 59);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  pdf.text(`Date: ${formatDate(payload.Date || payload.meta?.date || '')}`, rightEdge - 45, y + 14);
  if (payload.DueDate || payload.meta?.dueDate) {
    pdf.text(`Due: ${formatDate(payload.DueDate || payload.meta?.dueDate || '')}`, rightEdge - 45, y + 18);
  }

  y += 28;
  ensureSpace(26);
  pdf.setDrawColor(226, 232, 240);
  pdf.roundedRect(margin, y, 90, 24, 2, 2);
  pdf.roundedRect(rightEdge - 90, y, 90, 24, 2, 2);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.text('Bill From', margin + 3, y + 5);
  pdf.text('Bill To', rightEdge - 87, y + 5);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  const fromLines = [
    payload.business?.company || '',
    payload.business?.address || '',
    [payload.business?.phone || '', payload.business?.email || ''].filter(Boolean).join(' | '),
    payload.business?.gstin ? `GSTIN: ${payload.business.gstin}` : ''
  ].filter(Boolean);
  const toLines = [
    payload.customer?.name || '',
    payload.customer?.address || '',
    payload.customer?.phone || '',
    payload.customer?.gstin ? `GSTIN: ${payload.customer.gstin}` : '',
    isGst ? [payload.customer?.state || '', payload.customer?.placeOfSupply ? `POS: ${payload.customer.placeOfSupply}` : ''].filter(Boolean).join(' | ') : ''
  ].filter(Boolean);
  fromLines.slice(0, 4).forEach((line, index) => pdf.text(line, margin + 3, y + 10 + index * 3.8));
  toLines.slice(0, 5).forEach((line, index) => pdf.text(line, rightEdge - 87, y + 10 + index * 3.8));

  y += 30;
  const introLines = pdfWrapLines(pdf, $('s-intro')?.value || '', contentWidth);
  if (introLines.length) {
    ensureSpace(introLines.length * 4 + 4);
    pdf.setFontSize(8.8);
    pdf.text(introLines, margin, y);
    y += introLines.length * 4 + 4;
  }

  const columns = isGst ? [
    { title: 'No.', width: 10, align: 'center' },
    { title: 'Product Name', width: 78, align: 'left' },
    { title: 'HSN/SAC', width: 22, align: 'center' },
    { title: 'Qty', width: 16, align: 'center' },
    { title: 'Rate', width: 26, align: 'right' },
    { title: 'Total', width: 32, align: 'right' }
  ] : [
    { title: '#', width: 10, align: 'center' },
    { title: 'Brand Name', width: 40, align: 'left' },
    { title: 'Product Name', width: 56, align: 'left' },
    { title: 'Qty', width: 16, align: 'center' },
    { title: 'Price', width: 26, align: 'right' },
    { title: 'Total', width: 36, align: 'right' }
  ];

  const drawTableHeader = () => {
    pdf.setFillColor(241, 245, 249);
    pdf.setDrawColor(203, 213, 225);
    pdf.rect(margin, y, contentWidth, 8, 'FD');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    let x = margin;
    columns.forEach(col => {
      const tx = col.align === 'right' ? x + col.width - 1.5 : col.align === 'center' ? x + col.width / 2 : x + 1.5;
      pdf.text(col.title, tx, y + 5, { align: col.align });
      x += col.width;
    });
    y += 8;
  };

  drawTableHeader();
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.2);

  payload.rows.forEach((row, index) => {
    const cells = isGst ? [
      String(index + 1),
      [row.name || '', row.brand || '', row.desc || ''].filter(Boolean).join('\n'),
      row.hsn || '—',
      row.qty || '—',
      row.price ? pdfMoney(row.price) : '—',
      row.total ? pdfMoney(row.total) : '—'
    ] : [
      String(index + 1),
      row.brand || '—',
      [row.name || '', row.desc || ''].filter(Boolean).join('\n'),
      row.qty || '—',
      row.price ? pdfMoney(row.price) : '—',
      row.total ? pdfMoney(row.total) : '—'
    ];

    const wrappedCells = cells.map((cell, idx) => pdfWrapLines(pdf, cell, columns[idx].width - 3));
    const rowHeight = Math.max(8, ...wrappedCells.map(lines => lines.length * 3.7 + 2));
    ensureSpace(rowHeight + 2);
    if (y === margin) drawTableHeader();

    let x = margin;
    pdf.setDrawColor(226, 232, 240);
    wrappedCells.forEach((lines, idx) => {
      const col = columns[idx];
      pdf.rect(x, y, col.width, rowHeight);
      const tx = col.align === 'right' ? x + col.width - 1.5 : col.align === 'center' ? x + col.width / 2 : x + 1.5;
      pdf.text(lines, tx, y + 4.5, { align: col.align });
      x += col.width;
    });
    y += rowHeight;
  });

  y += 6;
  ensureSpace(32);
  const totalsX = rightEdge - 70;
  pdf.roundedRect(totalsX, y, 70, dueAmount > 0 ? 26 : 18, 2, 2);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.text('Subtotal', totalsX + 4, y + 6);
  pdf.text(pdfMoney(totals.subtotal || payload.Subtotal || 0), rightEdge - 4, y + 6, { align: 'right' });
  let totalsY = y + 12;
  if (dueAmount > 0) {
    pdf.text('Previous Due', totalsX + 4, totalsY);
    pdf.text(pdfMoney(dueAmount), rightEdge - 4, totalsY, { align: 'right' });
    totalsY += 6;
  }
  pdf.setFillColor(5, 90, 72);
  pdf.rect(totalsX, totalsY, 70, 8, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.text('GRAND TOTAL', totalsX + 4, totalsY + 5.3);
  pdf.text(pdfMoney(totals.grandTotal || payload.GrandTotal || 0), rightEdge - 4, totalsY + 5.3, { align: 'right' });
  pdf.setTextColor(30, 41, 59);
  y = totalsY + 14;

  const termsValue = $('s-terms')?.value || '';
  if (termsValue.trim()) {
    const termLines = pdfWrapLines(pdf, termsValue, contentWidth);
    ensureSpace(termLines.length * 4 + 10);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.text('Terms & Conditions', margin, y);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.4);
    pdf.text(termLines, margin, y + 5);
    y += termLines.length * 4 + 8;
  }

  ensureSpace(36);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.text('Payment Details', margin, y);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.4);
  const paymentLines = [
    payload.bank?.name ? `Bank: ${payload.bank.name}` : '',
    payload.bank?.account ? `A/C No.: ${payload.bank.account}` : '',
    payload.bank?.ifsc ? `IFSC: ${payload.bank.ifsc}` : '',
    payload.bank?.upi ? `UPI: ${payload.bank.upi}` : ''
  ].filter(Boolean);
  paymentLines.forEach((line, index) => pdf.text(line, margin, y + 5 + index * 4));

  if (payload.settings?.showQR) {
    try {
      const qrDataUrl = buildQrDataUrl(
        payload.bank?.upi || '',
        payload.business?.company || payload.CompanyName || ''
      );
      if (qrDataUrl) {
        pdf.addImage(qrDataUrl, 'PNG', 92, y + 2, 24, 24);
        pdf.setFontSize(7.5);
        pdf.text('Scan to Pay', 104, y + 29, { align: 'center' });
      }
    } catch (err) {
      console.warn('Skipping QR image:', err.message);
    }
  }

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.text('Authorized Signature', rightEdge - 32, y, { align: 'center' });
  pdfDrawImageIfReady(pdf, $('sig-img'), 'JPEG', rightEdge - 48, y + 3, 32, 12);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.4);
  pdf.text(payload.business?.signatory || '', rightEdge - 32, y + 20, { align: 'center' });
}

function drawA4InvoicePdf(pdf, payload) {
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 12;
  const topGap = 8;
  const bottomGap = 10;
  const footerReserve = 16;
  const contentWidth = pageWidth - margin * 2;
  const rightEdge = pageWidth - margin;
  const isGst = payload.InvoiceType === 'GST';
  const dueAmount = parseFloat(payload.DueAmount || payload.customer?.dueAmount || 0) || 0;
  const totals = {
    ...calculateInvoiceTotals(
      parseFloat(payload.Subtotal || payload.calculations?.subtotal || 0),
      payload.settings?.taxType || payload.calculations?.taxType || payload.taxType || 'NONE',
      dueAmount
    ),
    ...(payload.calculations || {})
  };
  let pageIndex = 0;
  let y = 0;

  const drawFooterGuide = () => {
    const footerY = pageHeight - margin - bottomGap;
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.2);
    pdf.line(margin, footerY, rightEdge, footerY);
  };

  const startPage = (repeatHeader = false) => {
    if (pageIndex > 0) pdf.addPage();
    pageIndex += 1;
    pdf.setDrawColor(226, 232, 240);
    pdf.setTextColor(30, 41, 59);
    pdf.setFont('helvetica', 'normal');

    if (!repeatHeader) {
      const headerY = margin + topGap;
      pdfDrawImageIfReady(pdf, $('paper-logo'), 'JPEG', margin, headerY, 28, 18);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.text(payload.business?.company || 'Invoice', 105, headerY + 6, { align: 'center' });
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      const companyLines = [
        payload.business?.address || '',
        [payload.business?.phone || '', payload.business?.email || ''].filter(Boolean).join(' | '),
        payload.business?.gstin ? `GSTIN: ${payload.business.gstin}` : ''
      ].filter(Boolean);
      companyLines.forEach((line, index) => pdf.text(line, 105, headerY + 12 + index * 4, { align: 'center' }));

      pdf.setDrawColor(5, 90, 72);
      pdf.setFillColor(5, 90, 72);
      pdf.roundedRect(rightEdge - 48, headerY, 48, 22, 2, 2, 'S');
      pdf.rect(rightEdge - 48, headerY, 48, 6, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.text('INVOICE', rightEdge - 24, headerY + 4.2, { align: 'center' });
      pdf.setTextColor(30, 41, 59);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.5);
      pdf.text(`Invoice #: ${payload.InvoiceNumber || payload.meta?.invoiceNumber || ''}`, rightEdge - 45, headerY + 10);
      pdf.text(`Date: ${formatDate(payload.Date || payload.meta?.date || '')}`, rightEdge - 45, headerY + 14);
      if (payload.DueDate || payload.meta?.dueDate) {
        pdf.text(`Due: ${formatDate(payload.DueDate || payload.meta?.dueDate || '')}`, rightEdge - 45, headerY + 18);
      }
      y = headerY + 28;
      return;
    }

    const headerY = margin + 4;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text(payload.business?.company || 'Invoice', margin, headerY + 4);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.2);
    pdf.text(`Invoice #: ${payload.InvoiceNumber || payload.meta?.invoiceNumber || ''}`, rightEdge, headerY + 3.5, { align: 'right' });
    pdf.text(`Date: ${formatDate(payload.Date || payload.meta?.date || '')}`, rightEdge, headerY + 8, { align: 'right' });
    pdf.line(margin, headerY + 12, rightEdge, headerY + 12);
    y = headerY + 16;
  };

  const ensureSpace = (needed, { repeatHeader = true } = {}) => {
    if (y + needed <= pageHeight - margin - bottomGap - footerReserve) return;
    drawFooterGuide();
    startPage(repeatHeader);
  };

  startPage(false);

  ensureSpace(26, { repeatHeader: true });
  pdf.roundedRect(margin, y, 90, 24, 2, 2);
  pdf.roundedRect(rightEdge - 90, y, 90, 24, 2, 2);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.text('Bill From', margin + 3, y + 5);
  pdf.text('Bill To', rightEdge - 87, y + 5);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  const fromLines = [
    payload.business?.company || '',
    payload.business?.address || '',
    [payload.business?.phone || '', payload.business?.email || ''].filter(Boolean).join(' | '),
    payload.business?.gstin ? `GSTIN: ${payload.business.gstin}` : ''
  ].filter(Boolean);
  const toLines = [
    payload.customer?.name || '',
    payload.customer?.address || '',
    payload.customer?.phone || '',
    payload.customer?.gstin ? `GSTIN: ${payload.customer.gstin}` : '',
    isGst ? [payload.customer?.state || '', payload.customer?.placeOfSupply ? `POS: ${payload.customer.placeOfSupply}` : ''].filter(Boolean).join(' | ') : ''
  ].filter(Boolean);
  fromLines.slice(0, 4).forEach((line, index) => pdf.text(line, margin + 3, y + 10 + index * 3.8));
  toLines.slice(0, 5).forEach((line, index) => pdf.text(line, rightEdge - 87, y + 10 + index * 3.8));

  y += 30;
  const introLines = pdfWrapLines(pdf, $('s-intro')?.value || '', contentWidth);
  if (introLines.length) {
    ensureSpace(introLines.length * 4 + 4, { repeatHeader: true });
    pdf.setFontSize(8.8);
    pdf.text(introLines, margin, y);
    y += introLines.length * 4 + 4;
  }

  const columns = isGst ? [
    { title: 'No.', width: 10, align: 'center' },
    { title: 'Product Name', width: 78, align: 'left' },
    { title: 'HSN/SAC', width: 22, align: 'center' },
    { title: 'Qty', width: 16, align: 'center' },
    { title: 'Rate', width: 26, align: 'right' },
    { title: 'Total', width: 32, align: 'right' }
  ] : [
    { title: '#', width: 10, align: 'center' },
    { title: 'Brand Name', width: 40, align: 'left' },
    { title: 'Product Name', width: 56, align: 'left' },
    { title: 'Qty', width: 16, align: 'center' },
    { title: 'Price', width: 26, align: 'right' },
    { title: 'Total', width: 36, align: 'right' }
  ];

  const drawTableHeader = () => {
    pdf.setFillColor(241, 245, 249);
    pdf.setDrawColor(203, 213, 225);
    pdf.rect(margin, y, contentWidth, 8, 'FD');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    let x = margin;
    columns.forEach(col => {
      const tx = col.align === 'right' ? x + col.width - 1.5 : col.align === 'center' ? x + col.width / 2 : x + 1.5;
      pdf.text(col.title, tx, y + 5, { align: col.align });
      x += col.width;
    });
    y += 8;
  };

  drawTableHeader();
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.2);

  payload.rows.forEach((row, index) => {
    const cells = isGst ? [
      String(index + 1),
      [row.name || '', row.brand || '', row.desc || ''].filter(Boolean).join('\n'),
      row.hsn || '—',
      row.qty || '—',
      row.price ? pdfMoney(row.price) : '—',
      row.total ? pdfMoney(row.total) : '—'
    ] : [
      String(index + 1),
      row.brand || '—',
      [row.name || '', row.desc || ''].filter(Boolean).join('\n'),
      row.qty || '—',
      row.price ? pdfMoney(row.price) : '—',
      row.total ? pdfMoney(row.total) : '—'
    ];

    const wrappedCells = cells.map((cell, idx) => pdfWrapLines(pdf, cell, columns[idx].width - 3));
    const rowHeight = Math.max(8, ...wrappedCells.map(lines => lines.length * 3.7 + 2));
    ensureSpace(rowHeight + 10, { repeatHeader: true });
    if (y <= margin + 25) drawTableHeader();

    let x = margin;
    pdf.setDrawColor(226, 232, 240);
    wrappedCells.forEach((lines, idx) => {
      const col = columns[idx];
      pdf.rect(x, y, col.width, rowHeight);
      const tx = col.align === 'right' ? x + col.width - 1.5 : col.align === 'center' ? x + col.width / 2 : x + 1.5;
      pdf.text(lines, tx, y + 4.5, { align: col.align });
      x += col.width;
    });
    y += rowHeight;
  });

  y += 6;
  const taxLinesCount = [totals.cgstAmount, totals.sgstAmount, totals.igstAmount].filter(v => v > 0).length;
  const totalsBoxHeight = 18 + (taxLinesCount * 6) + (dueAmount > 0 ? 6 : 0);
  ensureSpace(totalsBoxHeight + 8, { repeatHeader: true });
  const totalsX = rightEdge - 70;
  pdf.roundedRect(totalsX, y, 70, totalsBoxHeight, 2, 2);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.text('Subtotal', totalsX + 4, y + 6);
  pdf.text(pdfMoney(totals.subtotal || payload.Subtotal || 0), rightEdge - 4, y + 6, { align: 'right' });
  let totalsY = y + 12;
  if (totals.cgstAmount > 0) {
    pdf.text(`CGST (${totals.cgstRate}%)`, totalsX + 4, totalsY);
    pdf.text(pdfMoney(totals.cgstAmount), rightEdge - 4, totalsY, { align: 'right' });
    totalsY += 6;
  }
  if (totals.sgstAmount > 0) {
    pdf.text(`SGST (${totals.sgstRate}%)`, totalsX + 4, totalsY);
    pdf.text(pdfMoney(totals.sgstAmount), rightEdge - 4, totalsY, { align: 'right' });
    totalsY += 6;
  }
  if (totals.igstAmount > 0) {
    pdf.text(`IGST (${totals.igstRate}%)`, totalsX + 4, totalsY);
    pdf.text(pdfMoney(totals.igstAmount), rightEdge - 4, totalsY, { align: 'right' });
    totalsY += 6;
  }
  if (dueAmount > 0) {
    pdf.text('Previous Due', totalsX + 4, totalsY);
    pdf.text(pdfMoney(dueAmount), rightEdge - 4, totalsY, { align: 'right' });
    totalsY += 6;
  }
  pdf.setFillColor(5, 90, 72);
  pdf.rect(totalsX, totalsY, 70, 8, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.text('GRAND TOTAL', totalsX + 4, totalsY + 5.3);
  pdf.text(pdfMoney(totals.grandTotal || payload.GrandTotal || 0), rightEdge - 4, totalsY + 5.3, { align: 'right' });
  pdf.setTextColor(30, 41, 59);
  y = totalsY + 14;

  const termsValue = $('s-terms')?.value || '';
  if (termsValue.trim()) {
    const termLines = pdfWrapLines(pdf, termsValue, contentWidth);
    ensureSpace(termLines.length * 4 + 10, { repeatHeader: true });
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.text('Terms & Conditions', margin, y);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.4);
    pdf.text(termLines, margin, y + 5);
    y += termLines.length * 4 + 8;
  }

  ensureSpace(42, { repeatHeader: true });
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.text('Payment Details', margin, y);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.4);
  const paymentLines = [
    payload.bank?.name ? `Bank: ${payload.bank.name}` : '',
    payload.bank?.account ? `A/C No.: ${payload.bank.account}` : '',
    payload.bank?.ifsc ? `IFSC: ${payload.bank.ifsc}` : '',
    payload.bank?.upi ? `UPI: ${payload.bank.upi}` : ''
  ].filter(Boolean);
  paymentLines.forEach((line, index) => pdf.text(line, margin, y + 5 + index * 4));

  const qrCanvas = document.querySelector('#qr-canvas canvas');
  if (payload.settings?.showQR && qrCanvas) {
    try {
      pdf.addImage(qrCanvas.toDataURL('image/png'), 'PNG', 92, y + 2, 24, 24);
      pdf.setFontSize(7.5);
      pdf.text('Scan to Pay', 104, y + 29, { align: 'center' });
    } catch (err) {
      console.warn('Skipping QR image:', err.message);
    }
  }

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.text('Authorized Signature', rightEdge - 32, y, { align: 'center' });
  pdfDrawImageIfReady(pdf, $('sig-img'), 'JPEG', rightEdge - 48, y + 3, 32, 12);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.4);
  pdf.text(payload.business?.signatory || '', rightEdge - 32, y + 20, { align: 'center' });
  drawFooterGuide();
}

async function incrementInvoiceNumber() {
  const currentNum = parseInt($('s-inv-num')?.value || '0') || 0;
  const nextNum = currentNum + 1;
  const invInput = $('s-inv-num');
  const invDisplay = $('s-inv-num-display');
  if (invInput) invInput.value = nextNum.toString();
  if (invDisplay) invDisplay.textContent = nextNum.toString();
  const invPreview = $('p-inv-num');
  if (invPreview) invPreview.textContent = nextNum.toString();
}

async function advanceToNextInvoiceDraftAfterDownload() {
  window.currentInvoiceFinalized = true;
  await prepareNextInvoiceDraft();
}

async function downloadVectorPDF() {
  // Validate: first item must have quantity and price filled
  if (!rows.length || !rows[0]) {
    toast('At least one item is required', 'error');
    return;
  }
  const firstItem = rows[0];
  if (!firstItem.qty || parseFloat(firstItem.qty) <= 0) {
    toast('First item: Quantity is required', 'error');
    return;
  }
  if (!firstItem.price || parseFloat(firstItem.price) <= 0) {
    toast('First item: Unit Price is required', 'error');
    return;
  }

  const btn = $('pdf-btn');
  const mobBtn = $('mob-pdf-btn');
  if (btn) {
    btn.innerHTML = '<span class="material-symbols-outlined" style="animation:spin 1s linear infinite">autorenew</span> Generating...';
    btn.disabled = true;
  }
  if (mobBtn) mobBtn.disabled = true;

  try {
    const saveResult = await saveToCloud(true);
    const payload = saveResult?.payload || extractInvoiceJSON(window.currentInvoiceId);
    const invNum = payload.InvoiceNumber || $('s-inv-num')?.value || '100';
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    drawA4InvoicePdf(pdf, payload);
    savePdfBlob(pdf, `Invoice_${invNum}.pdf`);
    await advanceToNextInvoiceDraftAfterDownload();
    toast('PDF downloaded and next invoice number is ready.');
  } catch (err) {
    console.error('PDF error:', err);
    toast('PDF generation failed: ' + (err.message || 'Unknown error'), 'error');
  } finally {
    if (btn) {
      btn.innerHTML = '<span class="material-symbols-outlined">download</span> Download PDF';
      btn.disabled = false;
    }
    if (mobBtn) mobBtn.disabled = false;
  }
}

async function downloadPDF() {
  // Export from the live preview DOM so the downloaded PDF matches the
  // on-screen invoice layout instead of the separate vector renderer.
  // Always auto-save silently first to ensure cloud has the latest data matching the PDF
  let saveResult;
  try {
    saveResult = await saveToCloud(true);
  } catch (e) {
    console.warn("Auto-save before PDF failed", e);
  }

  const btn = $('pdf-btn'), mobBtn = $('mob-pdf-btn');
  if (btn) { btn.innerHTML = '<span class="material-symbols-outlined" style="animation:spin 1s linear infinite">autorenew</span> Generating…'; btn.disabled = true; }
  if (mobBtn) { mobBtn.disabled = true; }

  const element = $('invoice-paper');
  const invNum = $('s-inv-num')?.value || '001';

  try {
    const isGst = document.body.classList.contains('gst-mode');
    const stateCode = (document.getElementById('s-client-state-code')?.value || '24').trim();
    const isSameState = stateCode === '24';

    let columnWidthsCss = '';
    if (!isGst) {
      columnWidthsCss = `
        #pdf-invoice-clone .items-table thead th:nth-child(1) { width:36px !important; }
        #pdf-invoice-clone .items-table thead th:nth-child(2) { width:auto !important; }
        #pdf-invoice-clone .items-table thead th:nth-child(3) { width:auto !important; }
        #pdf-invoice-clone .items-table thead th:nth-child(4) { width:68px !important; }
        #pdf-invoice-clone .items-table thead th:nth-child(5) { width:80px !important; }
        #pdf-invoice-clone .items-table thead th:nth-child(6) { width:90px !important; }
      `;
    } else if (isSameState) {
      columnWidthsCss = `
        #pdf-invoice-clone .items-table thead th:nth-child(1) { width:30px !important; }
        #pdf-invoice-clone .items-table thead th:nth-child(2) { width:205px !important; }
        #pdf-invoice-clone .items-table thead th:nth-child(3) { width:70px !important; }
        #pdf-invoice-clone .items-table thead th:nth-child(4) { width:40px !important; }
        #pdf-invoice-clone .items-table thead th:nth-child(5) { width:65px !important; }
        #pdf-invoice-clone .items-table thead th:nth-child(6) { width:75px !important; }
        #pdf-invoice-clone .items-table thead th:nth-child(7) { width:65px !important; }
        #pdf-invoice-clone .items-table thead th:nth-child(8) { width:65px !important; }
        #pdf-invoice-clone .items-table thead th:nth-child(9) { width:75px !important; }
      `;
    } else {
      columnWidthsCss = `
        #pdf-invoice-clone .items-table thead th:nth-child(1) { width:30px !important; }
        #pdf-invoice-clone .items-table thead th:nth-child(2) { width:230px !important; }
        #pdf-invoice-clone .items-table thead th:nth-child(3) { width:75px !important; }
        #pdf-invoice-clone .items-table thead th:nth-child(4) { width:45px !important; }
        #pdf-invoice-clone .items-table thead th:nth-child(5) { width:70px !important; }
        #pdf-invoice-clone .items-table thead th:nth-child(6) { width:85px !important; }
        #pdf-invoice-clone .items-table thead th:nth-child(7) { width:80px !important; }
        #pdf-invoice-clone .items-table thead th:nth-child(8) { width:75px !important; }
      `;
    }

    // ── Step 1: Inject scoped helper CSS for the clone ────────────────────
    const pdfStyle = document.createElement('style');
    pdfStyle.id = 'pdf-mode-style';
    pdfStyle.textContent = `
      #pdf-clone-wrap { position:fixed; top:0; left:0; width:794px; overflow:visible; z-index:-9999; pointer-events:none; background:#fff; }
      #pdf-invoice-clone { width:794px !important; background:#fff !important; color:#1e293b !important; font-family:'Inter',sans-serif !important; padding:44px 52px !important; box-shadow:none !important; transform:none !important; box-sizing:border-box !important; overflow:visible !important; }
      #pdf-invoice-clone .no-print, #pdf-invoice-clone .remove-row, #pdf-invoice-clone .add-row-btn { display:none !important; }
      #pdf-invoice-clone #paper-logo { max-width:160px !important; max-height:100px !important; object-fit:contain !important; display:block !important; }
      #pdf-invoice-clone .items-table { table-layout:fixed !important; width:100% !important; border-collapse:collapse !important; }
      ${columnWidthsCss}
      #pdf-invoice-clone .items-table tbody td { overflow:visible !important; white-space:normal !important; word-break:break-word !important; padding:8px 10px !important; vertical-align:top !important; }
      #pdf-invoice-clone .items-table tbody td:nth-child(1) { white-space:nowrap !important; }
      #pdf-invoice-clone select { -webkit-appearance:none; appearance:none; border:none !important; background:transparent !important; }
      .pdf-cell-text { font-family:'Inter',sans-serif; font-size:12px; color:#1e293b; white-space:normal; word-break:break-word; line-height:16px; }
      .pdf-cell-text.brand-text { font-weight:700; }
      .pdf-cell-text.desc-text { font-size:10px; color:#94a3b8; margin-top:4px; line-height:14px; }
      .pdf-cell-text.num-text { text-align:center; }
      .pdf-cell-text.price-text { text-align:right; }
    `;
    document.head.appendChild(pdfStyle);

    // ── Step 2: Deep-clone invoice paper ─────────────────────────────────
    const clone = element.cloneNode(true);
    clone.id = 'pdf-invoice-clone';
    clone.removeAttribute('style'); // wipe any inline transform/scale

    if ($('qr-toggle')?.checked) {
      const qrCanvasWrap = clone.querySelector('#qr-canvas');
      if (qrCanvasWrap) {
        const qrDataUrl = buildQrDataUrl(
          $('s-upi')?.value || '',
          $('s-company')?.value || ''
        );
        if (qrDataUrl) {
          qrCanvasWrap.innerHTML = '';
          const qrImg = document.createElement('img');
          qrImg.src = qrDataUrl;
          qrImg.alt = 'QR Code';
          qrImg.style.width = '90px';
          qrImg.style.height = '90px';
          qrImg.style.display = 'block';
          qrCanvasWrap.appendChild(qrImg);
        }
      }
    }

    // ── Step 3: Replace *all* form fields in clone with static text divs ──
    clone.querySelectorAll('input, textarea, select').forEach(inp => {
      if (inp.type === 'hidden') { inp.remove(); return; }
      // Get the value from the live original element
      let liveEl = null;
      if (inp.id) liveEl = element.querySelector('#' + inp.id);
      if (!liveEl && inp.dataset.rid && inp.dataset.field)
        liveEl = element.querySelector(`[data-rid="${inp.dataset.rid}"][data-field="${inp.dataset.field}"]`);
      const val = (liveEl || inp).value || '';
      const div = document.createElement('div');
      div.className = 'pdf-cell-text';
      if (inp.classList.contains('num-input')) div.classList.add('num-text');
      if (inp.classList.contains('price-input')) div.classList.add('price-text');
      if (inp.dataset.field === 'brand') div.classList.add('brand-text');
      if (inp.tagName === 'TEXTAREA') div.style.whiteSpace = 'pre-wrap';
      div.textContent = val;
      inp.parentNode.replaceChild(div, inp);
    });

    // ── Step 4: Mount clone in a zero-offset container ────────────────────
    const wrap = document.createElement('div');
    wrap.id = 'pdf-clone-wrap';
    wrap.appendChild(clone);
    document.body.appendChild(wrap);

    // Let browser lay out the clone
    await new Promise(r => requestAnimationFrame(r));
    await new Promise(r => setTimeout(r, 180));

    // ── Step 5: Capture with html2canvas (keeps normal text rendering for visual layout) ─────────
    const cloneRect = clone.getBoundingClientRect();
    function domPx(el) {
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      if (rect.height === 0) return null;
      return {
        top: rect.top - cloneRect.top - 2,
        bottom: rect.bottom - cloneRect.top + 20,
      };
    }

    const atomicBlocks = [];
    clone.querySelectorAll('.items-table thead tr').forEach((tr) => {
      const px = domPx(tr);
      if (px) atomicBlocks.push(px);
    });
    clone.querySelectorAll('#items-tbody tr').forEach((tr) => {
      const px = domPx(tr);
      if (px) atomicBlocks.push(px);
    });

    let footerTop = null;
    let footerBottom = null;
    ['.totals-wrap', '.paper-notes', '.paper-footer'].forEach((sel) => {
      const px = domPx(clone.querySelector(sel));
      if (!px) return;
      if (footerTop === null || px.top < footerTop) footerTop = px.top;
      if (footerBottom === null || px.bottom > footerBottom) footerBottom = px.bottom;
    });
    if (footerTop !== null && footerBottom !== null) {
      atomicBlocks.push({ top: footerTop, bottom: footerBottom });
    }

    const canvas = await html2canvas(clone, {
      scale: 3, // High resolution capture for maximum sharpness
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: 794,
      height: clone.scrollHeight,
      windowWidth: 794,
      windowHeight: clone.scrollHeight,
    });

    // Extract all text elements before removing wrap for the selectable text overlay
    const textNodes = [];
    const walk = document.createTreeWalker(clone, NodeFilter.SHOW_TEXT, null, false);
    let n;
    while (n = walk.nextNode()) {
      const textVal = n.textContent.trim();
      const parent = n.parentElement;
      if (textVal && parent && !parent.closest('.no-print')) {
        const parentRect = parent.getBoundingClientRect();
        textNodes.push({
          text: textVal,
          top: parentRect.top - cloneRect.top,
          left: parentRect.left - cloneRect.left,
          width: parentRect.width,
          height: parentRect.height,
          style: window.getComputedStyle(parent)
        });
      }
    }

    // Clean up clone immediately after capture
    wrap.remove();
    pdfStyle.remove();

    // ── Step 6: Write A4 PDF with smart page cuts ─────────────────────────
    const { jsPDF } = window.jspdf;
    const PW = 210, PH = 297; // A4 mm
    const pxToMm = PW / canvas.width;
    const domToCanvas = canvas.width / 794;
    const safePageH = (PH - 8) / pxToMm;
    const totalPx = canvas.height;
    const cBlocks = atomicBlocks.map((b) => ({
      top: b.top * domToCanvas,
      bottom: b.bottom * domToCanvas,
    }));

    const cuts = [0];
    let pageStart = 0;
    for (let guard = 0; guard < 50; guard++) {
      const idealEnd = pageStart + safePageH;
      if (idealEnd >= totalPx) break;

      let safeCut = idealEnd;
      for (const blk of cBlocks) {
        if (blk.top < idealEnd && blk.bottom > idealEnd) {
          safeCut = Math.min(safeCut, blk.top - 1);
        }
      }

      if (safeCut <= pageStart + 10) safeCut = idealEnd;
      cuts.push(safeCut);
      pageStart = safeCut;
    }
    cuts.push(totalPx);

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    for (let i = 0; i < cuts.length - 1; i++) {
      const sliceTop = cuts[i];
      const sliceBottom = cuts[i + 1];
      const sliceH = Math.ceil(sliceBottom - sliceTop);
      if (sliceH <= 0) continue;

      const sc = document.createElement('canvas');
      sc.width = canvas.width;
      sc.height = sliceH;
      sc.getContext('2d').drawImage(canvas, 0, -sliceTop);
      const img = sc.toDataURL('image/jpeg', 0.95);
      const sliceMm = (sliceH / canvas.width) * PW;
      if (i > 0) pdf.addPage();
      
      // 1. Draw page background slice (keeps layout 100% exact, text is crisp at scale 3)
      pdf.addImage(img, 'JPEG', 0, 0, PW, sliceMm);

      // 2. Draw invisible selectable text layer on top (mode 3)
      textNodes.forEach((node) => {
        const nodeTopCanvas = node.top * domToCanvas;
        if (nodeTopCanvas >= sliceTop - 5 && nodeTopCanvas < sliceBottom) {
          const yCanvasOnPage = nodeTopCanvas - sliceTop;
          let xMm = node.left * (PW / 794);
          const yMm = yCanvasOnPage * (PW / canvas.width);
          const hMm = node.height * (PW / 794);

          const fontSizePx = parseFloat(node.style.fontSize) || 12;
          const fontSizePt = fontSizePx * 72 / 96;

          const isBold = node.style.fontWeight === 'bold' || parseInt(node.style.fontWeight, 10) >= 600;
          pdf.setFont('Helvetica', isBold ? 'Bold' : 'Normal');
          pdf.setFontSize(fontSizePt);

          // Resolve horizontal alignment
          let align = 'left';
          if (node.style.textAlign === 'right' || node.style.justifyContent === 'flex-end') {
            align = 'right';
            xMm = (node.left + node.width) * (PW / 794);
          } else if (node.style.textAlign === 'center' || node.style.justifyContent === 'center') {
            align = 'center';
            xMm = (node.left + (node.width / 2)) * (PW / 794);
          }

          // Render text using renderingMode: 'invisible' so it acts as select/copy layer without messing up rendering
          pdf.text(node.text, xMm, yMm + (hMm * 0.85), {
            align: align,
            renderingMode: 'invisible'
          });
        }
      });
    }

    savePdfBlob(pdf, `Invoice_${invNum}.pdf`);

    if (saveResult) {
      await advanceToNextInvoiceDraftAfterDownload();
      toast('PDF downloaded and next invoice number is ready ✓');
    } else {
      toast('PDF downloaded ✓');
    }

    if (btn) { btn.innerHTML = '<span class="material-symbols-outlined">download</span> Download PDF'; btn.disabled = false; }
    if (mobBtn) { mobBtn.disabled = false; }

  } catch (err) {
    console.error('PDF error:', err);
    toast('PDF generation failed: ' + err.message, 'error');
    if (btn) { btn.innerHTML = '<span class="material-symbols-outlined">download</span> Download PDF'; btn.disabled = false; }
    if (mobBtn) { mobBtn.disabled = false; }
  }
}

// ─── MOBILE UI ────────────────────────────────────────────────────────────────
function initMobile() {
  const isMob = window.innerWidth <= 768;
  const tabs = $('mobile-tabs');
  if (tabs) {
    tabs.style.display = isMob ? 'flex' : 'none';
    tabs.style.visibility = isMob ? 'visible' : 'hidden';
    tabs.style.opacity = isMob ? '1' : '0';
  }
  if (isMob) showMobilePanel('edit');

  // Wire up mobile PDF button
  const mobPdf = $('mob-pdf-btn');
  if (mobPdf) mobPdf.onclick = downloadPDF;
}

function showMobilePanel(panel) {
  const sidebar = $('sidebar'), main = $('main');
  if (!sidebar || !main) return;
  if (panel === 'edit') {
    sidebar.classList.remove('panel-hidden');
    main.classList.add('panel-hidden');
    main.classList.remove('mob-preview');
  } else {
    sidebar.classList.add('panel-hidden');
    main.classList.remove('panel-hidden');
    main.classList.add('mob-preview');
    if (window.innerWidth <= 768) scalePaperForMobile();
  }
  // Highlight active tab
  document.querySelectorAll('.mob-nav-tab').forEach(t => t.classList.remove('active'));
  const activeTab = panel === 'edit' ? $('mob-edit-tab') : $('mob-preview-tab');
  if (activeTab) activeTab.classList.add('active');
}

function scalePaperForMobile() {
  const paper = $('invoice-paper'), main = $('main');
  if (!paper || !main || window.innerWidth > 768) return;
  requestAnimationFrame(() => {
    const scale = (window.innerWidth - 8) / 794;
    paper.style.transform = `scale(${scale})`;
    paper.style.transformOrigin = 'top left';
    main.style.minHeight = (paper.scrollHeight * scale + 80) + 'px';
  });
}

// ─── BOOT ─────────────────────────────────────────────────────────────────────
async function bootApp(loggedInMobile) {
  const today = getTodayInIndiaISO();
  const dateEl = $('s-inv-date');
  if (dateEl) dateEl.value = today;
  if (loggedInMobile) setUserPhone(loggedInMobile);
  initMobile();

  // Show the first blank item immediately instead of waiting for later boot work.
  if (!window.currentInvoiceId && !rows.length) {
    ensureOneBlankItem();
    renderRows();
    renderMobItems();
    refreshPaper();
  }

  // Fetch inventory and clients in background
  await Promise.all([fetchInventory(), fetchClients()]);

  // Load logo
  if (!logoDataUrl && typeof loadDefaultLogo === 'function') loadDefaultLogo();

  // Bind sidebar → paper sync
  bindSidebarInputs();

  const clientNameInput = $('s-client-name');
  if (clientNameInput) {
    clientNameInput.onfocus = () => showClientAutocomplete(clientNameInput);
    clientNameInput.oninput = (e) => {
      syncClientSub(e);
      showClientAutocomplete(clientNameInput);
    };
    clientNameInput.onkeydown = (e) => acKeyDown(e, clientNameInput);
  }

  // Wire buttons
  const pdfBtn = $('pdf-btn'); if (pdfBtn) pdfBtn.onclick = downloadPDF;
  const saveBtn = $('save-cloud-btn'); if (saveBtn) saveBtn.onclick = () => saveToCloud();
  const modeNonGstBtn = $('mode-nongst'); if (modeNonGstBtn) modeNonGstBtn.onclick = () => setBillingMode('nongst');
  const modeGstBtn = $('mode-gst'); if (modeGstBtn) modeGstBtn.onclick = () => setBillingMode('gst');

  // Init mobile
  initMobile();
  window.addEventListener('resize', initMobile);

  // ─── CHECK FOR URL HASH (Edit Mode) ───
  const hash = window.location.hash;
  if (hash.startsWith('#edit=')) {
      const editId = hash.replace('#edit=', '');
      // ✅ IMMEDIATELY clear the hash from the URL so reloads start fresh
      history.replaceState(null, '', window.location.pathname);
      toast('Loading invoice ' + editId + '...');
      try {
          const invoiceData = await apiGetInvoice(editId);
          if (invoiceData && typeof restoreInvoiceUI === 'function') {
              restoreInvoiceUI(invoiceData);
              window.currentInvoiceId = editId;
              window._invoiceSavedOnce = true;
              window.currentInvoiceFinalized = true;
          }
      } catch (err) {
          console.error('Failed to load invoice:', err);
          toast('Failed to load invoice details: ' + err.message, 'error');
      }
  } else if (hash === '#new=gst') {
      history.replaceState(null, '', window.location.pathname);
      setBillingMode('gst');
  } else if (hash === '#new=nongst') {
      history.replaceState(null, '', window.location.pathname);
      setBillingMode('nongst');
  }

  // Restore saved invoice draft data on reload
  let draftLoaded = false;
  if (!window.currentInvoiceId) {
    try {
      const raw = safeStorage.getItem(LS_KEY);
      if (raw) {
        loadSaved();
        draftLoaded = true;
      }
    } catch (e) {
      console.warn('Failed to restore draft:', e);
    }
  }

  if (!window.currentInvoiceId && !draftLoaded) {
    ['s-client-name', 's-client-addr', 's-client-phone', 's-client-gstin', 's-client-due', 's-due-date'].forEach(id => {
      const el = $(id);
      if (el) el.value = '';
    });
    const clientStateEl = $('s-client-state');
    if (clientStateEl) clientStateEl.value = 'Gujarat';
    const clientStateCodeEl = $('s-client-state-code');
    if (clientStateCodeEl) clientStateCodeEl.value = '24';
    const placeSupplyEl = $('s-place-supply');
    if (placeSupplyEl) placeSupplyEl.value = 'Gujarat';
    rows = [];
    rowCounter = 0;
    ensureOneBlankItem();
  }

  // Proactively generate invoice number for new records ONLY
  if (!window.currentInvoiceId) {
    await setAutoInvoiceNumber();
  }

  // Wait for DOM to settle then refresh paper and ensure items are visible
  setTimeout(() => {
    renderRows();
    renderMobItems();
    refreshPaper();
    recalcAll();
  }, 50);
  
  // Extra safety render for mobile items in case of rendering race
  setTimeout(() => {
    if (rows.length > 0) renderMobItems();
  }, 150);
}

// ─── BOOT ON LOAD ────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  // Font loading detection
  if (document.fonts && typeof document.fonts.load === 'function') {
    document.fonts.load('24px "Material Symbols Outlined"').then(function() {
      document.body.classList.add('material-symbols-loaded');
    }).catch(function(e) {
      console.warn('Font loading failed:', e);
      document.body.classList.add('material-symbols-loaded');
    });
  } else {
    document.body.classList.add('material-symbols-loaded');
  }

  // Login key bindings
  const lPass = $('l-pass');
  if (lPass) lPass.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
  const lUser = $('l-user');
  if (lUser) lUser.addEventListener('keydown', e => { if (e.key === 'Enter') { const lp = $('l-pass'); if (lp) lp.focus(); } });
  const loginBtn = document.querySelector('.login-btn');
  if (loginBtn) loginBtn.addEventListener('click', doLogin);
  const passToggleBtn = $('pass-toggle-btn');
  if (passToggleBtn) passToggleBtn.addEventListener('click', togglePasswordVisibility);

  forceUppercaseValue($('s-gstin'));
  forceUppercaseValue($('s-client-gstin'));
  forceUppercaseValue($('modal-client-gstin'));

  // Check if already logged in
  try {
    const auth = safeStorage.getItem('inv_auth');
    const mobile = safeStorage.getItem('inv_user_mobile');
    if (auth) {
      $('login-screen').style.display = 'none';
      $('toolbar').classList.remove('hidden');
      $('app').classList.remove('hidden');
      initMobile();
      bootApp(mobile);
    }
  } catch (err) {
    console.error('Error during boot auth check:', err);
  }
});

// ─── GLOBAL CLIENT SUB SYNC ──────────────────────────────────────────────────
function syncClientSub(e) {
  const addr = $('s-client-addr')?.value || '';
  const phone = formatClientPhoneForPreview($('s-client-phone')?.value || '');
  const gstin = formatClientGSTINForPreview($('s-client-gstin')?.value || '');
  const parts = [addr, phone, gstin].filter(Boolean);
  const pcs = $('p-client-sub'); if (pcs) pcs.textContent = parts.join(' | ');
  
  if (e && e.target) {
      tryAutoFillClient(e.target.value);
      showClientAutocomplete(e.target);
  }
  autoSave();
}

// ─── GST BILLING MODE FUNCTIONS ──────────────────────────────────────────────
function setBillingMode(mode) {
  const isGst = mode === 'gst';
  if (isGst) {
    document.body.classList.add('gst-mode');
    const modeGstBtn = $('mode-gst'); if (modeGstBtn) modeGstBtn.classList.add('active');
    const modeNongstBtn = $('mode-nongst'); if (modeNongstBtn) modeNongstBtn.classList.remove('active');
  } else {
    document.body.classList.remove('gst-mode');
    const modeNongstBtn = $('mode-nongst'); if (modeNongstBtn) modeNongstBtn.classList.add('active');
    const modeGstBtn = $('mode-gst'); if (modeGstBtn) modeGstBtn.classList.remove('active');
  }

  if (!isGst) {
    setTaxType('NONE');
  }

  // Update row fields: default gstRate / hsn for all rows
  rows.forEach(r => {
    if (isGst) {
      if (!r.gstRate && r.gstRate !== 0) r.gstRate = getTaxConfig(resolveTaxTypeFromInputs()).rate || 18;
      if (!r.hsn) r.hsn = '';
    } else {
      r.gstRate = 0;
      r.hsn = '';
    }
  });

  if (isGst && resolveTaxTypeFromInputs() === 'NONE') {
    setTaxType('GST18');
  }

  // Re-run client sub display since GST state details may need to appear/disappear
  syncClientSub();

  // GST-only: swap intro/terms shown in preview & saved PDF
  // Backup non-GST values on first switch, then override inputs for GST invoices
  try {
    const introEl = $('s-intro');
    const termsEl = $('s-terms');
    if (introEl && termsEl) {
      if (isGst) {
        if (!document.body.dataset._backupIntro) document.body.dataset._backupIntro = introEl.value || '';
        if (!document.body.dataset._backupTerms) document.body.dataset._backupTerms = termsEl.value || '';
        introEl.value = '';
        termsEl.value = `1. Good once sold will not be taken back\n2. Interest @18% p.a. will be charged if payment is not made within due date.\n3. Our risk and responsibility ceases as soon as the goods leave our premises\n4. "Subject to 'RAJKOT' Jurisdiction only. E.&.O.E"`;
      } else {
        // Restore previous values when leaving GST mode
        if (document.body.dataset._backupIntro !== undefined) {
          introEl.value = document.body.dataset._backupIntro || '';
          delete document.body.dataset._backupIntro;
        }
        if (document.body.dataset._backupTerms !== undefined) {
          termsEl.value = document.body.dataset._backupTerms || '';
          delete document.body.dataset._backupTerms;
        }
      }
    }
  } catch (e) { console.warn('GST intro/terms swap failed:', e); }
  ensureOneBlankItem();
  renderRows();
  renderMobItems();
  refreshPaper();
  // If mobile preview is active, rescale the paper so updated notes/terms are visible
  try { if (document.getElementById('main')?.classList.contains('mob-preview')) scalePaperForMobile(); } catch (e) {}
  recalcAll();
  autoSave();
}

async function startNewInvoice(mode) {
  if (!confirm('Start a new invoice? Unsaved data will be lost.')) return;
  rows = []; rowCounter = 0;
  window.currentInvoiceId = null;
  window._invoiceSavedOnce = false;
  window.currentInvoiceFinalized = false;
  ['s-client-name', 's-client-addr', 's-client-phone', 's-client-gstin', 's-client-due', 's-due-date', 's-intro'].forEach(id => {
    const el = $(id); if (el) el.value = '';
  });
  
  // Reset state fields
  const clientStateEl = $('s-client-state');
  if (clientStateEl) clientStateEl.value = 'Gujarat';
  const clientStateCodeEl = $('s-client-state-code');
  if (clientStateCodeEl) clientStateCodeEl.value = '24';
  const placeSupplyEl = $('s-place-supply');
  if (placeSupplyEl) placeSupplyEl.value = 'Gujarat';

  const today = getTodayInIndiaISO();
  const dateEl = $('s-inv-date'); if (dateEl) dateEl.value = today;

  setBillingMode(mode);

  // Fetch new number for the new invoice session after resetting state
  await setAutoInvoiceNumber(true);
  renderRows();
  ensureOneBlankItem();
  renderMobItems();
  refreshPaper();
  recalcAll();
  toast('New ' + (mode === 'gst' ? 'GST' : 'Non-GST') + ' invoice started');
  
  // Focus client name input for convenience
  $('s-client-name')?.focus();
}

function onClientStateChange() {
  const select = $('s-client-state');
  if (!select) return;
  const selectedOpt = select.options[select.selectedIndex];
  const code = selectedOpt.dataset.code;
  const codeInput = $('s-client-state-code');
  if (codeInput && code) {
    codeInput.value = code;
  }
  
  // Auto sync place of supply
  const placeSelect = $('s-place-supply');
  if (placeSelect) {
    if (select.value === 'Other') {
      placeSelect.value = 'Other';
    } else {
      placeSelect.value = select.value;
    }
  }
  
  // Sync place of supply text in preview
  const pps = $('p-place-supply'); if (pps) pps.textContent = (placeSelect ? placeSelect.value : select.value) || 'Gujarat';

  syncClientSub();
  recalcAll();
  autoSave();
}

function onStateCodeInput() {
  const codeInput = $('s-client-state-code');
  if (!codeInput) return;
  const val = codeInput.value.trim();
  const select = $('s-client-state');
  if (!select) return;
  let found = false;
  for (let opt of select.options) {
    if (opt.dataset.code === val) {
      select.value = opt.value;
      found = true;
      break;
    }
  }
  if (!found && val.length === 2) {
    select.value = 'Other';
  }
  
  // Auto sync place of supply
  const placeSelect = $('s-place-supply');
  if (placeSelect) {
    placeSelect.value = select.value;
  }
  
  // Sync place of supply text in preview
  const pps = $('p-place-supply'); if (pps) pps.textContent = (placeSelect ? placeSelect.value : select.value) || 'Gujarat';

  syncClientSub();
  recalcAll();
  autoSave();
}

function onRowGstRateChange(el) {
  const rid = el.dataset.rid;
  const row = rows.find(r => r.id === rid); if (!row) return;
  row.gstRate = parseFloat(el.value) || 0;
  recalcAll();
  renderRows();
  autoSave();
}



// ─── CLEAR / NEW INVOICE ──────────────────────────────────────────────────────
async function clearAll() {
  if (!confirm('Start a new invoice? Unsaved data will be lost.')) return;
  rows = []; rowCounter = 0;
  window.currentInvoiceId = null;
  window._invoiceSavedOnce = false;
  window.currentInvoiceFinalized = false;
  ['s-client-name', 's-client-addr', 's-client-phone', 's-client-gstin', 's-client-due', 's-due-date', 's-intro'].forEach(id => {
    const el = $(id); if (el) el.value = '';
  });
  const today = getTodayInIndiaISO();
  const dateEl = $('s-inv-date'); if (dateEl) dateEl.value = today;

  // Fetch new number for the new invoice session after resetting state
  await setAutoInvoiceNumber(true);
  renderRows();
  ensureOneBlankItem();
  renderMobItems();
  refreshPaper();
  recalcAll();
  toast('New invoice started');
}

// Validation
function validatePhone(p) { return /^\d{10}$/.test(String(p).trim()); }
function validateGST(g) { return /^[A-Z0-9]{15}$/i.test(String(g).trim()); }

// Modals
function openClientModal(c = {}) {
  const m = $('client-modal'); if (!m) return;
  m.dataset.masterType = ''; // Clear master type for standard add
  m.style.display = 'flex';
  $('modal-client-name').value = c.ClientName || '';
  $('modal-client-addr').value = c.Address || '';
  $('modal-client-phone').value = c.Phone || '';
  $('modal-client-gstin').value = normalizeGSTIN(c.GSTIN || '');
}
function openMasterModal(type = 'clients') {
  if (type === 'clients') {
    openClientModal({});
    const modal = $('client-modal');
    if (modal) modal.dataset.masterType = 'clients';
    const dueEl = $('modal-client-due');
    if (dueEl) dueEl.value = '';
    return;
  }
  openClientModal({});
}
function closeClientModal() { const m = $('client-modal'); if (m) m.style.display = 'none'; }

async function saveClientModal() {
  const m = $('client-modal');
  const type = m.dataset.masterType;
  const idValue = m.dataset.entryId;

  // Helper for sequential IDs
  function getNextMasterId(t) {
    const prefix = t === 'products' ? 'P-' : 'C-';
    const data = t === 'products' ? inventoryData : clientsData;
    const idField = t === 'products' ? 'ProductID' : 'ClientID';

    let max = 0;
    data.forEach(item => {
      const idStr = String(item[idField] || '').toUpperCase();
      if (idStr.startsWith(prefix)) {
        const numPart = idStr.replace(prefix, '');
        const num = parseInt(numPart, 10);
        if (!isNaN(num) && num < 1000000000) {
          if (num > max) max = num;
        }
      }
    });
    return prefix + String(max + 1).padStart(3, '0');
  }

  if (type === 'products') {
    const brand = formatText($('modal-client-name').value.trim());
    const name = formatText($('modal-client-addr').value.trim());
    const size = formatText($('modal-client-phone').value.trim());
    const price = $('modal-client-gstin').value.trim();

    if (!brand || !name) { toast('Brand and Product Name required', 'error'); return; }

    const p = {
      ProductID: idValue || getNextMasterId('products'),
      id: idValue || getNextMasterId('products'),
      BrandName: brand,
      'Brand Name': brand,
      brand: brand,
      ProductName: name,
      'Product Name': name,
      product: name,
      name: name,
      PackagingSize: size,
      'Packaging Size': size,
      packaging: size,
      size: size,
      UnitPrice: price,
      'Unit Price': price,
      price: price
    };

    try {
      const success = idValue ? await updateProduct(p) : await addProduct(p);
      if (success) { toast('Product saved to database'); fetchInventory(); closeClientModal(); }
    } catch (e) { toast(e.message, 'error'); }

  } else if (type === 'clients') {
    const cname = formatText($('modal-client-name').value.trim());
    const addr = formatText($('modal-client-addr').value.trim());
    const ph = $('modal-client-phone').value.trim();
    const gst = normalizeGSTIN($('modal-client-gstin').value);
    const due = $('modal-client-due')?.value?.trim() || '0';

    if (!cname) { toast('Client Name required', 'error'); return; }

    const c = {
      ClientID: idValue || getNextMasterId('clients'),
      id: idValue || getNextMasterId('clients'),
      ClientName: cname,
      'Client Name': cname,
      client: cname,
      name: cname,
      Address: addr,
      address: addr,
      Phone: ph,
      phone: ph,
      GSTIN: gst,
      gstin: gst,
      DueAmount: parseFloat(due) || 0,
      'Due Amount': parseFloat(due) || 0,
      due: parseFloat(due) || 0
    };

    try {
      const success = idValue ? await updateClient(c) : await addClient(c);
      if (success) { toast('Client saved to database'); fetchClients(); closeClientModal(); }
    } catch (e) { toast(e.message, 'error'); }
  } else {
    // Normal client quick-add (from invoice selection if not found)
    const client = {
      ClientName: formatText($('modal-client-name').value.trim()),
      Address: formatText($('modal-client-addr').value.trim()),
      Phone: $('modal-client-phone').value.trim(),
      GSTIN: $('modal-client-gstin').value.trim(),
    };
    if (client.Phone && !validatePhone(client.Phone)) { toast('Phone must be 10 digits', 'error'); return; }
    if (client.GSTIN && !validateGST(client.GSTIN)) { toast('GSTIN must be 15 chars', 'error'); return; }
    try { await addClient(client); closeClientModal(); toast('Client saved ✓'); } catch (e) { toast('Error: ' + e.message, 'error'); }
  }
}

async function deleteClientModal() {
  const m = $('client-modal');
  const type = m.dataset.masterType;
  const idValue = m.dataset.entryId;

  if (!idValue) { toast('Cannot delete unsaved record', 'error'); return; }
  if (!confirm('Are you sure you want to delete this master record?')) return;

  try {
    let success = false;
    if (type === 'products') success = await deleteProduct({ ProductID: idValue });
    else if (type === 'clients') success = await deleteClient({ ClientID: idValue });

    if (success) { toast('Record deleted'); bootApp(); closeClientModal(); }
  } catch (e) { toast(e.message, 'error'); }
}

// ─── CSS INJECTIONS ──────────────────────────────────────────────────────────
(function () {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .sb-master-row {
      padding: 10px 14px;
      border-bottom: 1px solid var(--border-light);
      cursor: pointer;
      transition: background 0.2s;
    }
    .sb-master-row:hover {
      background: var(--bg-hover);
    }
    .sb-master-row:last-child {
      border-bottom: none;
    }
  `;
  document.head.appendChild(style);
})();

// ─── CSS SPIN ANIMATION ───────────────────────────────────────────────────────
(function () {
  const style = document.createElement('style');
  style.textContent = '@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }';
  document.head.appendChild(style);
})();
