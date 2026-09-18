// invoiceBuilder.js - Invoice UI logic

// Populate invoice form from JSON
function populateInvoiceForm(invoice) {
  // Example: Set customer fields
  document.getElementById('customerName').value = invoice.customerInfo.name || '';
  document.getElementById('customerMobile').value = invoice.customerInfo.mobile || '';
  // Rebuild product rows
  rebuildProductRows(invoice.productRows);
  // Set totals, notes, etc.
  document.getElementById('invoiceNotes').value = invoice.notes || '';
  // ...populate other fields as needed
}

// Extract invoice data from UI
function extractInvoiceData() {
  const invoice = {
    invoiceMeta: {
      invoiceNumber: document.getElementById('invoiceNumber').value,
      uniqueId: document.getElementById('uniqueId').value,
      date: document.getElementById('invoiceDate').value,
      status: document.getElementById('invoiceStatus').value,
      createdBy: '', // Set if needed
      createdTimestamp: '', // Set if needed
      lastEditedTimestamp: '' // Set if needed
    },
    customerInfo: {
      name: document.getElementById('customerName').value,
      mobile: document.getElementById('customerMobile').value,
      customFields: {} // Add custom fields if needed
    },
    productRows: collectProductRows(),
    calculations: calculateTotals(),
    taxData: collectTaxData(),
    totals: {
      amount: document.getElementById('grandTotal').value,
      inWords: document.getElementById('totalInWords').value
    },
    notes: document.getElementById('invoiceNotes').value,
    settings: {
      currency: 'INR',
      showGST: true
    }
  };
  return invoice;
}

// Example helper: rebuild product rows
function rebuildProductRows(rows) {
  // Clear existing rows
  const table = document.getElementById('productTable');
  table.innerHTML = '';
  rows.forEach(row => {
    // Create row elements and set values
    // ...
  });
}

// Example helper: collect product rows from UI
function collectProductRows() {
  // Read product rows from UI and return array
  return [];
}

// Example helper: calculate totals
function calculateTotals() {
  // Calculate subtotal, GST, discounts, etc.
  return {
    subtotal: 0,
    totalDiscount: 0,
    totalGST: 0,
    grandTotal: 0
  };
}

// Example helper: collect tax data
function collectTaxData() {
  return {
    gstBreakup: []
  };
}
