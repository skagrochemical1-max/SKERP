/**
 * Shared GST / IGST utilities for invoice calculations.
 * Centralized tax logic keeps preview, storage, and exports consistent.
 */
'use strict';

const TAX_TYPE_CONFIG = {
  NONE: { key: 'NONE', label: 'None GST 0%', rate: 0, cgstRate: 0, sgstRate: 0, igstRate: 0 },
  GST5: { key: 'GST5', label: 'GST 5%', rate: 5, cgstRate: 2.5, sgstRate: 2.5, igstRate: 0 },
  GST18: { key: 'GST18', label: 'GST 18%', rate: 18, cgstRate: 9, sgstRate: 9, igstRate: 0 },
  IGST5: { key: 'IGST5', label: 'IGST 5%', rate: 5, cgstRate: 0, sgstRate: 0, igstRate: 5 },
  IGST18: { key: 'IGST18', label: 'IGST 18%', rate: 18, cgstRate: 0, sgstRate: 0, igstRate: 18 }
};

const TAX_TYPES = Object.values(TAX_TYPE_CONFIG);

function normalizeTaxType(value) {
  if (!value && value !== 0) return 'NONE';
  if (typeof value === 'string') {
    const normalized = value.trim().toUpperCase();
    if (TAX_TYPE_CONFIG[normalized]) return normalized;
    if (normalized === 'NONE GST 0%') return 'NONE';
    if (normalized === 'GST 5%' || normalized === 'GST@5%' || normalized === '5' || normalized === 'GST5') return 'GST5';
    if (normalized === 'GST 18%' || normalized === 'GST@18%' || normalized === '18' || normalized === 'GST18') return 'GST18';
    if (normalized === 'IGST 5%' || normalized === 'IGST5') return 'IGST5';
    if (normalized === 'IGST 18%' || normalized === 'IGST18') return 'IGST18';
    return 'NONE';
  }
  if (typeof value === 'number') {
    if (value === 5) return 'GST5';
    if (value === 18) return 'GST18';
    return 'NONE';
  }
  return 'NONE';
}

function getTaxConfig(taxType) {
  const key = normalizeTaxType(taxType);
  return TAX_TYPE_CONFIG[key] || TAX_TYPE_CONFIG.NONE;
}

function calculateInvoiceTotals(subtotal, taxType, dueAmount = 0) {
  const config = getTaxConfig(taxType);
  const safeSubtotal = Number(subtotal) || 0;
  const safeDue = Number(dueAmount) || 0;

  const cgstAmount = Math.round((safeSubtotal * config.cgstRate / 100) * 100) / 100;
  const sgstAmount = Math.round((safeSubtotal * config.sgstRate / 100) * 100) / 100;
  const igstAmount = Math.round((safeSubtotal * config.igstRate / 100) * 100) / 100;
  const totalTax = Math.round((cgstAmount + sgstAmount + igstAmount) * 100) / 100;
  const grandTotal = Math.round((safeSubtotal + totalTax + safeDue) * 100) / 100;

  return {
    subtotal: safeSubtotal,
    taxType: config.key,
    cgstRate: config.cgstRate,
    sgstRate: config.sgstRate,
    igstRate: config.igstRate,
    cgstAmount,
    sgstAmount,
    igstAmount,
    totalTax,
    grandTotal
  };
}

function calculateRowGstTotals(rows, isSameState, dueAmount = 0) {
  let subtotal = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;

  rows.forEach(r => {
    const qty = parseFloat(r.qty) || 0;
    const price = parseFloat(r.price) || 0;
    const taxable = qty * price;
    subtotal += taxable;

    const rate = parseFloat(r.gstRate) || 0;
    if (isSameState) {
      const cgstRate = rate / 2;
      const sgstRate = rate / 2;
      totalCgst += Math.round((taxable * cgstRate / 100) * 100) / 100;
      totalSgst += Math.round((taxable * sgstRate / 100) * 100) / 100;
    } else {
      totalIgst += Math.round((taxable * rate / 100) * 100) / 100;
    }
  });

  subtotal = Math.round(subtotal * 100) / 100;
  totalCgst = Math.round(totalCgst * 100) / 100;
  totalSgst = Math.round(totalSgst * 100) / 100;
  totalIgst = Math.round(totalIgst * 100) / 100;
  const totalTax = Math.round((totalCgst + totalSgst + totalIgst) * 100) / 100;
  const grandTotal = Math.round((subtotal + totalTax + (parseFloat(dueAmount) || 0)) * 100) / 100;

  return {
    subtotal,
    cgstAmount: totalCgst,
    sgstAmount: totalSgst,
    igstAmount: totalIgst,
    totalTax,
    grandTotal
  };
}

function getTaxOptionList() {
  return [
    { label: 'None GST 0%', key: 'NONE' },
    { label: 'GST 5%', key: 'GST5' },
    { label: 'GST 18%', key: 'GST18' },
    { label: 'IGST 5%', key: 'IGST5' },
    { label: 'IGST 18%', key: 'IGST18' }
  ];
}

function formatTaxLabel(taxType) {
  return getTaxConfig(taxType).label;
}
