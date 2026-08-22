// ==========================================
// INVOICE BUILDER APP - APPS SCRIPT BACKEND
// Google Sheets Database Architecture
// ==========================================

const API_SECRET = 'sk_agro_secure_key_2026';
const SPREADSHEET_ID = '1axb8I12FZrcSzdEUKrdlO7kpgQ0-BJ6wYSKv32gPQZI';

function getSpreadsheet() {
  if (typeof SPREADSHEET_ID !== 'undefined' && SPREADSHEET_ID) {
    try {
      return SpreadsheetApp.openById(SPREADSHEET_ID);
    } catch (e) {
      console.warn("Could not open spreadsheet by ID: " + e.toString());
    }
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

function doGet(e) {
  const params = e.parameter;
  const apiKey = params.apiKey || params.token; // Handle both
  
  if (apiKey !== API_SECRET) {
    return respondJSON({ success: false, error: 'Unauthorized' }, 401);
  }

  const action = params.action;
  
  try {
    switch (action) {
      case 'getProducts':
        return respondJSON(fetchData('Products'));
      case 'getClients':
        return respondJSON(fetchData('Clients'));
      case 'getInvoiceHistory':
        return respondJSON(fetchData('History'));
      case 'getNextInvoiceNumber':
        return respondJSON({ success: true, data: getNextInvoiceNumber() });
      case 'getInvoice':
        return respondJSON(getInvoiceById(params.id));
      default:
        return respondJSON({ success: false, error: 'Invalid GET action' }, 400);
    }
  } catch (error) {
    return respondJSON({ success: false, error: error.toString() }, 500);
  }
}

function doPost(e) {
  try {
    const params = e.parameter;
    const postData = e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : {};
    
    // Auth Check: Try body then URL params
    const apiKey = postData.apiKey || params.apiKey || params.token;
    if (apiKey !== API_SECRET) {
      return respondJSON({ success: false, error: 'Unauthorized' }, 401);
    }

    // Determine Action: Try body then URL params
    const action = postData.action || params.action;
    
    // For addClient/addProduct, the data might be the WHOLE body or under .data
    // master.js sends { data: {...} }, api.js sends just the object
    const payload = postData.data || postData;

    switch (action) {
      case 'saveInvoice':
        return respondJSON(saveInvoice(payload));
        
      case 'addProduct':
        return respondJSON(addRowData('Products', payload));
      case 'updateProduct':
        return respondJSON(updateRowData('Products', 'ProductID', payload.ProductID, payload));
      case 'deleteProduct':
        return respondJSON(deleteRowData('Products', 'ProductID', payload.ProductID));
        
      case 'addClient':
        return respondJSON(addRowData('Clients', payload));
      case 'updateClient':
        return respondJSON(updateRowData('Clients', 'ClientID', payload.ClientID, payload));
      case 'deleteClient':
        return respondJSON(deleteRowData('Clients', 'ClientID', payload.ClientID));

      case 'deleteInvoice':
        return respondJSON(deleteRowData('History', 'InvoiceNumber', payload.InvoiceNumber));

      case 'updateClientDue':
        return respondJSON(updateClientDueByName(payload.clientName, payload.dueAmount));
        
      default:
        return respondJSON({ success: false, error: 'Invalid POST action' }, 400);
    }
  } catch (error) {
    return respondJSON({ success: false, error: error.toString() }, 500);
  }
}

// ==========================================
// CORE DATABASE OPERATIONS
// ==========================================

function fetchData(sheetName) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    throw new Error(`Sheet '${sheetName}' not found`);
  }
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { success: true, data: [] };
  
  const headers = data[0];
  const rows = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const rowObj = {};
    for (let j = 0; j < headers.length; j++) {
      rowObj[headers[j]] = row[j];
    }
    rows.push(rowObj);
  }
  
  return { success: true, data: rows };
}

function addRowData(sheetName, objData) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error(`Sheet '${sheetName}' not found`);
  
  const headers = sheet.getDataRange().getValues()[0];
  
  // Helper for flexible key matching
  const getVal = (obj, header) => {
    if (obj[header] !== undefined) return obj[header];
    const h = header.trim().toLowerCase().replace(/\s/g,'');
    const key = Object.keys(obj).find(k => k.trim().toLowerCase().replace(/\s/g,'') === h);
    return key ? obj[key] : undefined;
  };

  if (Array.isArray(objData)) {
    if (objData.length === 0) return { success: true, message: `No data to add` };
    const rows = objData.map(obj => {
      obj.LastUpdated = new Date().toISOString();
      const row = [];
      for (let i = 0; i < headers.length; i++) {
        const val = getVal(obj, headers[i]);
        row.push(val !== undefined ? val : '');
      }
      return row;
    });
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, headers.length).setValues(rows);
    return { success: true, message: `Added ${rows.length} rows to ${sheetName}` };
  } else {
    const newRow = [];
    objData.LastUpdated = new Date().toISOString();
    for (let i = 0; i < headers.length; i++) {
        const val = getVal(objData, headers[i]);
        newRow.push(val !== undefined ? val : '');
    }
    sheet.appendRow(newRow);
    return { success: true, message: `Added to ${sheetName}` };
  }
}

function updateRowData(sheetName, idField, idValue, objData) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error(`Sheet '${sheetName}' not found`);

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idIndex = headers.indexOf(idField);
  
  if (idIndex === -1) throw new Error(`ID field '${idField}' not found`);
  if (!idValue) throw new Error('ID value is missing');
  
  // Helper for flexible key matching
  const getVal = (obj, header) => {
    if (obj[header] !== undefined) return obj[header];
    const h = header.trim().toLowerCase().replace(/\s/g,'');
    const key = Object.keys(obj).find(k => k.trim().toLowerCase().replace(/\s/g,'') === h);
    return key ? obj[key] : undefined;
  };

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idIndex]) === String(idValue)) {
      objData.LastUpdated = new Date().toISOString();
      
      const updatedRow = [];
      for (let j = 0; j < headers.length; j++) {
        const val = getVal(objData, headers[j]);
        if (val !== undefined) {
          updatedRow.push(val);
        } else {
          updatedRow.push(data[i][j]);
        }
      }
      
      sheet.getRange(i + 1, 1, 1, headers.length).setValues([updatedRow]);
      return { success: true, message: `Updated row in ${sheetName}` };
    }
  }
  
  return { success: false, error: 'Record not found for update' };
}

function deleteRowData(sheetName, idField, idValue) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error(`Sheet '${sheetName}' not found`);

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idIndex = headers.indexOf(idField);
  
  if (idIndex === -1) throw new Error(`ID field '${idField}' not found`);
  if (!idValue) throw new Error('ID value is missing for deletion');

  // Search from bottom up to avoid shifting index issues if deleting multiple,
  // but we are returning on first match
  for (let i = data.length - 1; i >= 1; i--) {
    if (String(data[i][idIndex]) === String(idValue)) {
      sheet.deleteRow(i + 1);
      return { success: true, message: `Deleted row from ${sheetName}` };
    }
  }
  
  return { success: false, error: 'Record not found for deletion' };
}

// ==========================================
// SPECIFIC BUSINESS LOGIC
// ==========================================

function saveInvoice(invoiceData) {
  if (!invoiceData.InvoiceNumber) throw new Error('InvoiceNumber is required');
  
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('History');
  if (!sheet) throw new Error(`Sheet 'History' not found`);
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const invIndex = headers.indexOf('InvoiceNumber');
  const uidIndex = headers.indexOf('UniqueID');
  const incomingUniqueId = String(invoiceData?.meta?.uniqueId || invoiceData.UniqueID || '').trim();
  
  // Helper for flexible key matching
  const getVal = (obj, header) => {
    if (obj[header] !== undefined) return obj[header];
    const h = header.trim().toLowerCase().replace(/\s/g,'');
    const key = Object.keys(obj).find(k => k.trim().toLowerCase().replace(/\s/g,'') === h);
    return key ? obj[key] : undefined;
  };

  // ── Store FULL payload in ItemsJSON so we can restore ALL fields on load ──
  // This includes customer address/phone/GSTIN, business info, bank, settings, etc.
  invoiceData.ItemsJSON = JSON.stringify(invoiceData);

  invoiceData.LastUpdated = new Date().toISOString();
  let foundRow = -1;
  let numberCollisionRow = -1;
  for (let i = 1; i < data.length; i++) {
    const rowInv = String(data[i][invIndex] || '').trim();
    const rowUid = uidIndex >= 0 ? String(data[i][uidIndex] || '').trim() : '';

    if (incomingUniqueId && rowUid && rowUid === incomingUniqueId) {
      foundRow = i + 1;
      break;
    }

    if (rowInv === String(invoiceData.InvoiceNumber).trim()) {
      numberCollisionRow = i + 1;
      if (!incomingUniqueId || !rowUid || rowUid === incomingUniqueId) {
        foundRow = i + 1;
        break;
      }
    }
  }

  if (foundRow === -1 && numberCollisionRow !== -1) {
    invoiceData.InvoiceNumber = getNextInvoiceNumber();
    if (invoiceData.meta) invoiceData.meta.invoiceNumber = invoiceData.InvoiceNumber;
  }

  invoiceData.ItemsJSON = JSON.stringify(invoiceData);

  const rowData = [];
  for (let h = 0; h < headers.length; h++) {
    const val = getVal(invoiceData, headers[h]);
    rowData.push(val !== undefined ? val : '');
  }
  
  if (foundRow !== -1) {
    sheet.getRange(foundRow, 1, 1, headers.length).setValues([rowData]);
    return {
      success: true,
      message: 'Invoice updated',
      uniqueId: invoiceData?.meta?.uniqueId || invoiceData.UniqueID || invoiceData.InvoiceNumber,
      invoiceNumber: invoiceData.InvoiceNumber,
      rowNumber: foundRow,
      action: 'updated'
    };
  } else {
    sheet.appendRow(rowData);
    return {
      success: true,
      message: 'Invoice created',
      uniqueId: invoiceData?.meta?.uniqueId || invoiceData.UniqueID || invoiceData.InvoiceNumber,
      invoiceNumber: invoiceData.InvoiceNumber,
      rowNumber: sheet.getLastRow(),
      action: 'created'
    };
  }
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

function respondJSON(responseObject, statusCode = 200) {
  const output = ContentService.createTextOutput(JSON.stringify(responseObject));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

/**
 * Returns the next sequential invoice number by scanning the History sheet.
 * Format: padded 3-digit number, e.g. "100", "101", ...
 */
function getNextInvoiceNumber() {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('History');
  if (!sheet) return '100';
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return '100';
  
  const headers = data[0];
  const invIdx = headers.indexOf('InvoiceNumber');
  if (invIdx === -1) return '100';
  
  let maxNum = 99; // Start at 99 so next is 100
  for (let i = 1; i < data.length; i++) {
    const raw = String(data[i][invIdx] || '');
    const num = parseInt(raw.replace(/[^0-9]/g, ''), 10) || 0;
    if (num > maxNum) maxNum = num;
  }
  
  return String(maxNum + 1).padStart(3, '0');
}

/**
 * Fetch a single invoice record by uniqueId or InvoiceNumber from History sheet.
 * Returns a fully-structured nested object so the frontend can restore ALL fields.
 */
function getInvoiceById(id) {
  if (!id) return { success: false, error: 'id is required' };
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('History');
  if (!sheet) return { success: false, error: 'History sheet not found' };
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { success: false, error: 'No invoices found' };
  
  const headers = data[0];
  const invIdx = headers.indexOf('InvoiceNumber');
  const uidIdx = headers.indexOf('UniqueID');
  
  for (let i = 1; i < data.length; i++) {
    const rowInvNum = String(data[i][invIdx] || '').trim();
    const rowUid = uidIdx >= 0 ? String(data[i][uidIdx] || '').trim() : '';
    if (rowInvNum === String(id).trim() || rowUid === String(id).trim()) {
      // Build flat row object
      const rowObj = {};
      for (let j = 0; j < headers.length; j++) {
        rowObj[headers[j]] = data[i][j];
      }

      // ── Parse ItemsJSON ────────────────────────────────────────────────────
      // ItemsJSON may be: (a) a JSON string of the full invoice payload,
      //                   (b) a JSON string of just the product rows array.
      let parsedItems = null;
      if (rowObj.ItemsJSON) {
        try {
          parsedItems = typeof rowObj.ItemsJSON === 'string'
            ? JSON.parse(rowObj.ItemsJSON)
            : rowObj.ItemsJSON;
        } catch(e) { parsedItems = null; }
      }

      // ── If ItemsJSON contains a full structured payload, return it directly ──
      // (This is the common case for invoices saved by the current code)
      if (parsedItems && !Array.isArray(parsedItems) && parsedItems.meta) {
        // Ensure uniqueId and InvoiceNumber are up-to-date from the sheet row
        parsedItems.meta.uniqueId    = rowObj.UniqueID || parsedItems.meta.uniqueId;
        parsedItems.meta.invoiceNumber = rowInvNum    || parsedItems.meta.invoiceNumber;
        parsedItems.InvoiceNumber    = rowInvNum;
        parsedItems.UniqueID         = rowObj.UniqueID;
        return { success: true, data: parsedItems };
      }

      // ── Fallback: build the nested structure from flat columns + rows array ──
      const productRows = Array.isArray(parsedItems) ? parsedItems : [];
      const subtotal    = parseFloat(rowObj.Subtotal  || 0);
      const tax         = parseFloat(rowObj.Tax       || 0);
      const grandTotal  = parseFloat(rowObj.GrandTotal|| 0);

      const structured = {
        InvoiceNumber: rowInvNum,
        UniqueID: rowObj.UniqueID || '',
        meta: {
          uniqueId:      rowObj.UniqueID || rowInvNum,
          invoiceNumber: rowInvNum,
          date:          rowObj.Date ? String(rowObj.Date).split('T')[0] : '',
          dueDate:       rowObj.DueDate || ''
        },
        business: {
          company:   rowObj.CompanyName  || '',
          address:   rowObj.FromAddress  || '',
          phone:     rowObj.FromPhone    || '',
          email:     rowObj.FromEmail    || '',
          gstin:     rowObj.FromGSTIN    || '',
          signatory: rowObj.Signatory    || ''
        },
        bank: {
          name:    rowObj.BankName || '',
          account: rowObj.BankAcc  || '',
          ifsc:    rowObj.BankIFSC || '',
          upi:     rowObj.UPI      || ''
        },
        customer: {
          name:      rowObj.ClientName    || rowObj.CustomerName || '',
          address:   rowObj.ClientAddress || rowObj.Address      || '',
          phone:     rowObj.ClientPhone   || rowObj.Phone        || rowObj.Mobile || '',
          gstin:     rowObj.ClientGSTIN   || rowObj.GSTIN        || '',
          dueAmount: parseFloat(rowObj.DueAmount || 0)
        },
        settings: {
          intro:   rowObj.Intro   || '',
          terms:   rowObj.Terms   || '',
          gstRate: parseFloat(rowObj.GSTRate || 0),
          showQR:  false
        },
        rows: productRows,
        calculations: { subtotal, tax, grandTotal }
      };
      return { success: true, data: structured };
    }
  }
  return { success: false, error: `Invoice '${id}' not found` };
}

// Setup function to initialize Sheets
function setupDatabaseStructure() {
  const ss = getSpreadsheet();
  
  function createSheet(name, headers) {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      sheet.appendRow(headers);
    } else {
      // Check for missing headers and append them
      const lastCol = sheet.getLastColumn();
      const existingHeaders = lastCol > 0 ? sheet.getRange(1, 1, 1, lastCol).getValues()[0] : [];
      const missingHeaders = [];
      headers.forEach(h => {
        const normH = h.trim().toLowerCase().replace(/\s/g, '');
        const exists = existingHeaders.some(eh => eh.trim().toLowerCase().replace(/\s/g, '') === normH);
        if (!exists) {
          missingHeaders.push(h);
        }
      });
      if (missingHeaders.length > 0) {
        sheet.getRange(1, lastCol + 1, 1, missingHeaders.length).setValues([missingHeaders]);
      }
    }
  }

  createSheet('Products', ['ProductID', 'BrandName', 'ProductName', 'PackagingSize', 'UnitPrice', 'LastUpdated']);
  createSheet('Clients', ['ClientID', 'ClientName', 'Address', 'Phone', 'GSTIN', 'LastUpdated']);
  createSheet('History', [
    'InvoiceNumber', 'UniqueID', 'InvoiceType', 'Date', 'DueDate', 'ClientName', 'ClientAddress', 'ClientPhone',
    'ClientGSTIN', 'ClientState', 'ClientStateCode', 'PlaceOfSupply', 'Subtotal', 'TaxableAmount', 'Tax', 'CGST',
    'SGST', 'IGST', 'TotalTax', 'GrandTotal', 'DueAmount', 'NonGstTaxType', 'CompanyName', 'FromAddress',
    'FromPhone', 'FromEmail', 'FromGSTIN', 'Signatory', 'BankName', 'BankAcc', 'BankIFSC', 'UPI', 'Intro',
    'Terms', 'ItemsJSON', 'LastUpdated'
  ]);
  
  return "Setup Complete";
}

// ── Update DueAmount for a client identified by name ──────────────────────────
function updateClientDueByName(clientName, dueAmount) {
  if (!clientName) return { success: false, error: 'clientName is required' };
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('Clients');
  if (!sheet) return { success: false, error: 'Clients sheet not found' };

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const nameIdx = headers.indexOf('ClientName');
  const dueIdx  = headers.indexOf('DueAmount');
  const updIdx  = headers.indexOf('LastUpdated');

  if (nameIdx === -1) return { success: false, error: 'ClientName column not found' };
  if (dueIdx  === -1) return { success: false, error: 'DueAmount column not found. Please add a DueAmount column to the Clients sheet.' };

  const needle = String(clientName).trim().toLowerCase();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][nameIdx]).trim().toLowerCase() === needle) {
      sheet.getRange(i + 1, dueIdx + 1).setValue(parseFloat(dueAmount) || 0);
      if (updIdx !== -1) sheet.getRange(i + 1, updIdx + 1).setValue(new Date().toISOString());
      return { success: true, message: 'DueAmount updated for ' + clientName };
    }
  }
  return { success: false, error: 'Client "' + clientName + '" not found in Clients sheet' };
}
