/* ─── utils.js ────────────────────────────────────────── */
function fmtCurrency(val, symbol = '₹') {
  const n = parseFloat(val) || 0;
  return symbol + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtDate(str) {
  if (!str) return '—';
  const d = new Date(str);
  if (isNaN(d)) return str;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtDateInput(str) {
  if (!str) return '';
  return str.split('T')[0];
}
function getTodayDateString(timeZone = 'Asia/Kolkata') {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
    const year = parts.find(p => p.type === 'year')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const day = parts.find(p => p.type === 'day')?.value;
    return year && month && day ? `${year}-${month}-${day}` : '';
  } catch (err) {
    return new Date().toISOString().split('T')[0];
  }
}
function todayStr() {
  return getTodayDateString();
}
function setDefaultDateValue(input, fallbackDate = getTodayDateString()) {
  if (!input) return fallbackDate;
  if (input.value) return input.value;
  input.value = fallbackDate;
  return input.value;
}
function applyDefaultDateInputs(root = document, options = {}) {
  const targetRoot = root && typeof root.querySelectorAll === 'function' ? root : document;
  const skipFieldNames = new Set((options.skipFieldNames || []).map(name => String(name).toLowerCase()));
  const skipFieldIds = new Set((options.skipFieldIds || []).map(id => String(id).toLowerCase()));
  const today = getTodayDateString();
  targetRoot.querySelectorAll('input[type="date"]').forEach(input => {
    const name = String(input.name || '').toLowerCase();
    const id = String(input.id || '').toLowerCase();
    if (
      input.disabled || 
      input.readOnly || 
      input.dataset.noDefaultDate === 'true' || 
      skipFieldNames.has(name) || 
      skipFieldIds.has(id) ||
      id.includes('filter') ||
      name.includes('filter') ||
      id.includes('from') ||
      name.includes('from') ||
      id.includes('to') ||
      name.includes('to')
    ) return;
    if (!input.value) input.value = today;
  });
}
function fmtNumber(val, decimals = 2) {
  return (parseFloat(val) || 0).toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}
function fmtPercent(val) {
  return (parseFloat(val) || 0).toFixed(1) + '%';
}
function formatPhone(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 10);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)} ${digits.slice(5)}`;
}
function isPhoneFieldName(name = '') { return /contact|phone|mobile/i.test(String(name || '')); }
function isGstinFieldName(name = '') { return /gst|gstin/i.test(String(name || '')); }
function capitalizeWord(word) {
  const lower = String(word || '').toLowerCase();
  const firstLetterIndex = lower.search(/[a-z]/i);
  if (firstLetterIndex === -1) return lower;
  return `${lower.slice(0, firstLetterIndex)}${lower.charAt(firstLetterIndex).toUpperCase()}${lower.slice(firstLetterIndex + 1)}`;
}
function formatTitleCaseWithPercentRules(value) {
  const parts = String(value || '').split(/(\s+)/);
  let uppercaseUntilPlus = false;
  return parts.map(part => {
    if (!part || /^\s+$/.test(part)) return part;
    if (part === '+') { uppercaseUntilPlus = false; return part; }
    const normalized = uppercaseUntilPlus ? part.toUpperCase() : capitalizeWord(part);
    if (/^\d+(?:\.\d+)?%$/.test(part)) uppercaseUntilPlus = true;
    return normalized;
  }).join('');
}
function normalizeTextValue(value, fieldName = '') {
  if (isPhoneFieldName(fieldName)) return formatPhone(value);
  if (isGstinFieldName(fieldName)) return String(value || '').toUpperCase();
  return formatTitleCaseWithPercentRules(value);
}
function shouldNormalizeFormField(field) {
  if (!field) return false;
  const tagName = (field.tagName || '').toUpperCase();
  if (tagName === 'TEXTAREA') return true;
  if (tagName !== 'INPUT') return false;
  const type = String(field.type || '').toLowerCase();
  return !['number', 'date', 'email', 'search', 'checkbox', 'radio', 'hidden', 'file', 'password'].includes(type);
}
const STATUS_CLASSES = { 'Delivered': 'badge-success', 'Completed': 'badge-success', 'Paid': 'badge-success', 'Active': 'badge-success', 'Pending': 'badge-warning', 'Processing':'badge-info', 'Partial': 'badge-warning', 'Cancelled': 'badge-danger', 'Rejected': 'badge-danger', 'Overdue': 'badge-danger', 'Draft': 'badge-gray', 'Inactive': 'badge-gray' };
function statusBadge(status) {
  const cls = STATUS_CLASSES[status] || 'badge-gray';
  return `<span class="badge ${cls}">${status}</span>`;
}
function applyMobileTableLabels(tableOrId) {
  const table = typeof tableOrId === 'string' ? document.getElementById(tableOrId) : tableOrId;
  if (!table) return;
  const wrap = table.closest('.table-wrap');
  if (wrap) wrap.classList.add('data-table-wrap-mobile');
  const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent.trim());
  table.querySelectorAll('tbody tr').forEach(tr => {
    Array.from(tr.querySelectorAll('td')).forEach((td, i) => {
      const label = headers[i] || '';
      td.setAttribute('data-label', label);
      if (isPhoneFieldName(label)) {
        const rawText = td.textContent.trim();
        if (rawText && rawText !== '—' && rawText !== 'â€”') td.textContent = formatPhone(rawText);
      }
      if (label && !td.querySelector('.mobile-label') && label !== 'Actions' && label !== 'Select') {
        const lbl = document.createElement('div');
        lbl.className = 'mobile-label'; lbl.textContent = label; td.prepend(lbl);
      }
    });
  });
}
function renderTableSkeleton(tableOrId, rows = 6) {
  const table = typeof tableOrId === 'string' ? document.getElementById(tableOrId) : tableOrId;
  if (!table) return;
  const tbody = table.querySelector('tbody');
  const headCount = table.querySelectorAll('thead th').length || 1;
  if (!tbody) return;
  tbody.innerHTML = Array.from({ length: rows }).map(() => `<tr class="skeleton-table-row">${Array.from({ length: headCount }).map(() => `<td><div class="skeleton-line ${Math.random() > 0.5 ? 'w-80' : 'w-60'}"></div></td>`).join('')}</tr>`).join('');
}
function setSkeletonText(elOrId, widthClass = 'w-60', large = false) {
  const el = typeof elOrId === 'string' ? document.getElementById(elOrId) : elOrId;
  if (!el) return;
  el.innerHTML = `<div class="skeleton-line ${large ? 'lg ' : ''}${widthClass}"></div>`;
}
function renderListSkeleton(containerOrId, count = 5) {
  const container = typeof containerOrId === 'string' ? document.getElementById(containerOrId) : containerOrId;
  if (!container) return;
  container.innerHTML = Array.from({ length: count }).map(() => `<div class="skeleton-list-item"><div class="skeleton-dot"></div><div class="skeleton-stack" style="flex:1"><div class="skeleton-line w-50"></div><div class="skeleton-line sm w-80"></div></div><div class="skeleton-badge"></div></div>`).join('');
}
function getFormData(formId) {
  const form = document.getElementById(formId);
  if (!form) return {};
  const data = {};
  new FormData(form).forEach((val, key) => {
    const field = form.elements[key];
    data[key] = shouldNormalizeFormField(field) ? normalizeTextValue(val, key) : val;
  });
  return data;
}
function populateForm(formId, data) {
  const form = document.getElementById(formId);
  if (!form) return;
  Object.entries(data).forEach(([k, v]) => {
    const el = form.elements[k];
    if (el) {
      el.value = shouldNormalizeFormField(el) ? normalizeTextValue(v ?? '', k) : (v ?? '');
      if (el.tagName && el.tagName.toUpperCase() === 'SELECT') {
        el.dispatchEvent(new Event('change'));
      }
    }
  });
}
function destroyChart(chartRef) { if (chartRef && typeof chartRef.destroy === 'function') chartRef.destroy(); }
function initAllAutocompleteSelects() { if (window.UniversalSearchSelect) UniversalSearchSelect.initAll(); }

function normalizeUnit(unitStr) {
  if (!unitStr) return 'Nos';
  const u = String(unitStr).trim().toLowerCase();
  if (['kg', 'kilogram', 'kilograms', 'kilo'].includes(u)) return 'Kg';
  if (['gram', 'grams', 'g', 'gm'].includes(u)) return 'Gram';
  if (['litre', 'litres', 'ltr', 'ltr.', 'l'].includes(u)) return 'Litre';
  if (['ml', 'milliliter', 'milliliters'].includes(u)) return 'Ml';
  if (['nos', 'pcs', 'box', 'bag', 'drum', 'piece', 'pieces', 'no'].includes(u)) return 'Nos';
  return 'Nos';
}

function convertUnit(qty, fromUnit, toUnit) {
  const q = parseFloat(qty) || 0;
  if (!fromUnit || !toUnit) return q;
  const f = normalizeUnit(fromUnit);
  const t = normalizeUnit(toUnit);
  if (f === t) return q;
  
  if (f === 'Litre' && t === 'Ml') return q * 1000;
  if (f === 'Ml' && t === 'Litre') return q / 1000;
  
  if (f === 'Kg' && t === 'Gram') return q * 1000;
  if (f === 'Gram' && t === 'Kg') return q / 1000;
  
  return q;
}

function exportToCSV(data, label) {
  if (!data || !data.length) return;
  const headers = Object.keys(data[0]);
  const csvRows = [];
  
  // Headers row
  csvRows.push(headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(','));
  
  // Data rows
  data.forEach(row => {
    const values = headers.map(header => {
      const val = row[header];
      const str = val === null || val === undefined ? '' : String(val);
      return `"${str.replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  });
  
  const csvContent = '\uFEFF' + csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${label.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function exportToExcel(data, label) {
  if (!data || !data.length) return;
  if (window.XLSX) {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, label.slice(0, 31)); // sheet names limited to 31 chars
    XLSX.writeFile(wb, `${label.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
  } else {
    // Fallback to CSV if SheetJS isn't available
    exportToCSV(data, label);
  }
}

function parsePackSizeInMl(str) {
  if (!str) return 0;
  const s = String(str).toLowerCase().trim();
  const match = s.match(/([\d.]+)\s*([a-zA-Z.]+)?/);
  if (!match) return 0;
  const val = parseFloat(match[1]) || 0;
  const unit = normalizeUnit(match[2] || '');
  if (unit === 'Litre' || unit === 'Kg') {
    return val * 1000;
  }
  return val;
}

function sortPackSizesDescending(items, sizeGetter = (x => x.packaging_size || x.size || x)) {
  return [...items].sort((a, b) => {
    const sizeA = parsePackSizeInMl(sizeGetter(a));
    const sizeB = parsePackSizeInMl(sizeGetter(b));
    return sizeB - sizeA;
  });
}

window.UTILS = { fmtCurrency, fmtDate, fmtDateInput, todayStr, getTodayDateString, setDefaultDateValue, applyDefaultDateInputs, fmtNumber, fmtPercent, formatPhone, isPhoneFieldName, isGstinFieldName, normalizeTextValue, formatTitleCaseWithPercentRules, statusBadge, applyMobileTableLabels, renderTableSkeleton, setSkeletonText, renderListSkeleton, getFormData, populateForm, destroyChart, initAllAutocompleteSelects, normalizeUnit, convertUnit, parsePackSizeInMl, sortPackSizesDescending, exportToCSV, exportToExcel };
