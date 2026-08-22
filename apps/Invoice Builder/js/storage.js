/**
 * ==============================================================================
 * js/storage.js — Data Extraction & Restoration Layer
 * Invoice System
 * 
 * Handles mapping the UI state to a robust JSON object and vice versa.
 * This ensures no data loss when saving/loading to Google Sheets.
 * ==============================================================================
 */

'use strict';

function inferStoredTaxType(data) {
    const explicit = data?.settings?.taxType || data?.calculations?.taxType || data?.taxType || data?.NonGstTaxType;
    const normalizedExplicit = normalizeTaxType(explicit);
    if (normalizedExplicit !== 'NONE') return normalizedExplicit;

    const subtotal = parseFloat(data?.calculations?.subtotal ?? data?.Subtotal ?? data?.TaxableAmount ?? 0) || 0;
    const cgst = parseFloat(data?.calculations?.cgstAmount ?? data?.CGST ?? 0) || 0;
    const sgst = parseFloat(data?.calculations?.sgstAmount ?? data?.SGST ?? 0) || 0;
    const igst = parseFloat(data?.calculations?.igstAmount ?? data?.IGST ?? 0) || 0;
    if (subtotal <= 0) return 'NONE';

    const roundRate = (value) => Math.round((value / subtotal) * 10000) / 100;
    if (igst > 0) {
        const igstRate = roundRate(igst);
        if (Math.abs(igstRate - 5) < 0.2) return 'IGST5';
        if (Math.abs(igstRate - 18) < 0.2) return 'IGST18';
    }
    if (cgst > 0 || sgst > 0) {
        const gstRate = roundRate(cgst + sgst);
        if (Math.abs(gstRate - 5) < 0.2) return 'GST5';
        if (Math.abs(gstRate - 18) < 0.2) return 'GST18';
    }

    return 'NONE';
}

/**
 * Extracts all invoice data from the current UI state into a structured JSON string.
 * This JSON is what gets saved to Google Sheets.
 * @param {string} uniqueId (Optional) Pass uniqueId if updating an existing invoice.
 * @returns {object} Highly structured invoice payload.
 */
function extractInvoiceJSON(existingUniqueId = null) {
    const isGst = document.body.classList.contains('gst-mode');
    const showQR = document.getElementById('qr-toggle').checked;
    const taxType = typeof resolveTaxTypeFromInputs === 'function'
        ? resolveTaxTypeFromInputs()
        : normalizeTaxType(document.getElementById('tax-type')?.value || document.getElementById('gst-rate')?.value);
    const taxConfig = getTaxConfig(taxType);

    // Collect product rows from global `rows` array (defined in main.js)
    // We deep copy to avoid mutating the live UI state
    const productRows = window.rows.map(r => ({
        id: r.id,
        brand: formatText(r.brand || ''),
        name: formatText(r.name || ''),
        desc: formatText(r.desc || ''),
        qty: parseFloat(r.qty) || 0,
        price: parseFloat(r.price) || 0,
        total: parseFloat(r.total) || 0,
        hsn: formatText(r.hsn || ''),
        gstRate: isGst ? taxConfig.rate : (parseFloat(r.gstRate) || 0)
    }));

    // Calculate totals carefully to match UI
    const subtotal = productRows.reduce((sum, r) => sum + r.total, 0);
    const dueAmount = parseFloat(document.getElementById('s-client-due')?.value) || 0;
    
    const calculations = calculateInvoiceTotals(subtotal, taxType, dueAmount);

    const invNum = (document.getElementById('s-inv-num')?.value || document.getElementById('p-inv-num')?.textContent || '').replace('—','').trim();
    // Google Sheets automatically drops leading zeros. Strip them so the backend's duplicate-check finds the row.
    const autoDroppedInvNum = /^[0-9]+$/.test(invNum) ? parseInt(invNum, 10).toString() : invNum;

    const uniqueId = existingUniqueId || generateUniqueId();

    // Build the full structure
    const payload = {
        InvoiceNumber: autoDroppedInvNum, // Top level for strict server requirement
        UniqueID: uniqueId,
        InvoiceType: isGst ? 'GST' : 'Non-GST',
        DocumentType: isGst ? 'Tax Invoice' : 'Invoice',
        GSTCopyLeft: isGst ? 'Debit Memo' : '',
        GSTCopyCenter: isGst ? 'Tax Invoice' : '',
        GSTCopyRight: isGst ? 'Original' : '',
        GSTIN: isGst ? (document.getElementById('s-client-gstin')?.value || '') : '',
        ClientState: isGst ? (document.getElementById('s-client-state')?.value || 'Gujarat') : '',
        ClientStateCode: isGst ? (document.getElementById('s-client-state-code')?.value || '24') : '',
        PlaceOfSupply: isGst ? (document.getElementById('s-place-supply')?.value || 'Gujarat') : '',
        TaxableAmount: isGst ? calculations.subtotal : '',
        DueDate: document.getElementById('s-due-date').value || '',
        Date: document.getElementById('s-inv-date').value || '',
        date: document.getElementById('s-inv-date').value || '',
        ClientName: formatText(document.getElementById('s-client-name').value || ''),
        ClientAddress: formatText(document.getElementById('s-client-addr').value || ''),
        ClientPhone: document.getElementById('s-client-phone').value || '',
        ClientGSTIN: isGst ? (document.getElementById('s-client-gstin')?.value || '') : '',
        'ClientName ': formatText(document.getElementById('s-client-name').value || ''),
        'Client Name': formatText(document.getElementById('s-client-name').value || ''),
        clientName: formatText(document.getElementById('s-client-name').value || ''),
        CustomerName: formatText(document.getElementById('s-client-name').value || ''),
        customerName: formatText(document.getElementById('s-client-name').value || ''),
        DueAmount: parseFloat(document.getElementById('s-client-due')?.value) || 0,
        dueAmount: parseFloat(document.getElementById('s-client-due')?.value) || 0,
        Subtotal: calculations.subtotal,
        Tax: isGst ? calculations.totalTax : '',
        CGST: isGst ? (calculations.cgstAmount || 0) : '',
        SGST: isGst ? (calculations.sgstAmount || 0) : '',
        IGST: isGst ? (calculations.igstAmount || 0) : '',
        TotalTax: isGst ? (calculations.totalTax || 0) : '',
        GrandTotal: calculations.grandTotal,
        taxType: isGst ? calculations.taxType : '',
        GSTTaxType: isGst ? calculations.taxType : '',
        NonGstTaxType: isGst ? '' : calculations.taxType,
        GSTSubtotal: isGst ? calculations.subtotal : '',
        GSTGrandTotal: isGst ? calculations.grandTotal : '',
        NonGSTSubtotal: isGst ? '' : calculations.subtotal,
        NonGSTGrandTotal: isGst ? '' : calculations.grandTotal,
        CompanyName: formatText(document.getElementById('s-company').value || ''),
        FromAddress: formatText(document.getElementById('s-address').value || ''),
        FromPhone: document.getElementById('s-phone').value || '',
        FromEmail: document.getElementById('s-email').value || '',
        FromGSTIN: isGst ? (document.getElementById('s-gstin').value || '') : '',
        Signatory: document.getElementById('s-signatory').value || '',
        BankName: document.getElementById('s-bank-name').value || '',
        BankAcc: document.getElementById('s-bank-acc').value || '',
        BankIFSC: document.getElementById('s-bank-ifsc').value || '',
        UPI: document.getElementById('s-upi').value || '',
        Intro: document.getElementById('s-intro').value || '',
        Terms: document.getElementById('s-terms').value || '',
        ItemsJSON: '', // Stringified payload saved to sheet by Code.gs
        meta: {
            uniqueId,
            invoiceNumber: invNum,
            InvoiceNumber: invNum,
            date: document.getElementById('s-inv-date').value || '',
            dueDate: document.getElementById('s-due-date').value || '',
            createdTimestamp: new Date().toISOString(),
            version: '1.1'
        },
        business: {
            company: formatText(document.getElementById('s-company').value || ''),
            address: formatText(document.getElementById('s-address').value || ''),
            phone: document.getElementById('s-phone').value || '',
            email: document.getElementById('s-email').value || '',
            gstin: document.getElementById('s-gstin').value || '',
            signatory: document.getElementById('s-signatory').value || ''
        },
        bank: {
            name: document.getElementById('s-bank-name').value || '',
            account: document.getElementById('s-bank-acc').value || '',
            ifsc: document.getElementById('s-bank-ifsc').value || '',
            upi: document.getElementById('s-upi').value || ''
        },
        customer: {
            name: formatText(document.getElementById('s-client-name').value || ''),
            address: formatText(document.getElementById('s-client-addr').value || ''),
            phone: document.getElementById('s-client-phone').value || '',
            gstin: document.getElementById('s-client-gstin').value || '',
            dueAmount: parseFloat(document.getElementById('s-client-due')?.value) || 0,
            state: isGst ? (document.getElementById('s-client-state')?.value || 'Gujarat') : '',
            stateCode: isGst ? (document.getElementById('s-client-state-code')?.value || '24') : '',
            placeOfSupply: isGst ? (document.getElementById('s-place-supply')?.value || 'Gujarat') : ''
        },
        customerInfo: {
            name: document.getElementById('s-client-name').value || ''
        },
        settings: {
            intro: document.getElementById('s-intro').value || '',
            terms: document.getElementById('s-terms').value || '',
            gstRate: taxConfig.rate,
            taxType: calculations.taxType,
            showQR: showQR
        },
        rows: productRows,
        calculations: {
            subtotal: calculations.subtotal,
            taxType: calculations.taxType,
            cgstRate: calculations.cgstRate || 0,
            sgstRate: calculations.sgstRate || 0,
            igstRate: calculations.igstRate || 0,
            cgstAmount: calculations.cgstAmount || 0,
            sgstAmount: calculations.sgstAmount || 0,
            igstAmount: calculations.igstAmount || 0,
            totalTax: calculations.totalTax || 0,
            grandTotal: calculations.grandTotal
        }
    };

    return payload;
}


/**
 * Completely restores the UI state from a saved JSON invoice object.
 * Acts as if the user just manually typed all this data in.
 * @param {object} data The parsed JSON object retrieved from Sheets.
 */
function restoreInvoiceUI(data) {
    if (!data) return;

    // --- 🔹 BACKWARD COMPATIBILITY FOR OLD INVOICES ---
    if (data.fields) {
        Object.entries(data.fields).forEach(([id, val]) => {
            const el = document.getElementById(id);
            if (el) el.value = val || '';
        });
        
        const legacyTaxType = data.taxType || data.settings?.taxType || data.gstType || data.gst || data.gstRate;
        const configKey = normalizeTaxType(legacyTaxType);
        setVal('gst-rate', getTaxConfig(configKey).rate);
        setVal('tax-type', configKey);
        const gstLabelEl = document.getElementById('gst-rate-display');
        if (gstLabelEl) gstLabelEl.value = configKey;
        
        const qrToggle = document.getElementById('qr-toggle');
        if (qrToggle) qrToggle.checked = !!data.qr;
        
        window.currentInvoiceId = data._legacyUniqueId || data.fields['uniqueId'] || null;
        window.currentInvoiceFinalized = !!window.currentInvoiceId;

        if (typeof window.setBillingMode === 'function') {
            window.setBillingMode('nongst');
        }
    } 
    // --- 🔹 MODERN SECURE FORMAT ---
    else if (data.meta) {
        // Switch to appropriate GST/Non-GST mode
        const isGst = data.InvoiceType === 'GST';
        const configKey = inferStoredTaxType(data);
        if (typeof window.setBillingMode === 'function') {
            window.setBillingMode(isGst ? 'gst' : 'nongst');
        }

        // 1. Restore Meta Fields
        setVal('s-inv-num', data.meta.invoiceNumber || data.InvoiceNumber);
        setVal('s-inv-date', data.meta.date);
        setVal('s-due-date', data.meta.dueDate);

        window.currentInvoiceId = data.meta.uniqueId;
        window.currentInvoiceFinalized = true;

        // 2. Restore Business Fields
        if (data.business) {
            setVal('s-company', data.business.company);
            setVal('s-address', data.business.address);
            setVal('s-phone', data.business.phone);
            setVal('s-email', data.business.email);
            setVal('s-gstin', data.business.gstin);
            setVal('s-signatory', data.business.signatory);
        }

        // 3. Restore Bank Fields
        if (data.bank) {
            setVal('s-bank-name', data.bank.name);
            setVal('s-bank-acc', data.bank.account);
            setVal('s-bank-ifsc', data.bank.ifsc);
            setVal('s-upi', data.bank.upi);
        }

        // 4. Restore Customer Fields
        if (data.customer) {
            setVal('s-client-name', data.customer.name);
            setVal('s-client-addr', data.customer.address);
            setVal('s-client-phone', data.customer.phone);
            setVal('s-client-gstin', data.customer.gstin);
            
            if (isGst) {
                setVal('s-client-state', data.ClientState || data.customer.state || 'Gujarat');
                setVal('s-client-state-code', data.ClientStateCode || data.customer.stateCode || '24');
                setVal('s-place-supply', data.PlaceOfSupply || data.customer.placeOfSupply || 'Gujarat');
            }

            if (typeof window.tryAutoFillClient === 'function' && data.customer.name) {
                window.tryAutoFillClient(data.customer.name);
            } else if (typeof window.setClientDue === 'function') {
                window.setClientDue(data.customer.dueAmount || data.DueAmount || 0);
            }
            
            // Note: refreshPaper() below handles the full customer text formatting on the preview card
        }

        // 5. Restore Settings
        if (data.settings) {
            setVal('s-intro', data.settings.intro);
            setVal('s-terms', data.settings.terms);
            setVal('gst-rate', getTaxConfig(configKey).rate);
            setVal('tax-type', configKey);
            const gstLabelEl = document.getElementById('gst-rate-display');
            if (gstLabelEl) gstLabelEl.value = configKey;
            const qrToggle = document.getElementById('qr-toggle');
            if (qrToggle) qrToggle.checked = !!data.settings.showQR;
        }
    } 
    // --- 🔹 FLAT SHEET DATA (Fallthrough for raw rows) ---
    else if (data.InvoiceNumber || data.ItemsJSON) {
        // Try to parse ItemsJSON as a FULL payload first (new save format)
        let fullPayload = null;
        if (data.ItemsJSON) {
            try {
                const parsed = typeof data.ItemsJSON === 'string' ? JSON.parse(data.ItemsJSON) : data.ItemsJSON;
                if (parsed && !Array.isArray(parsed) && parsed.meta) {
                    fullPayload = parsed;
                }
            } catch(e) {}
        }

        if (fullPayload) {
            window.currentInvoiceId = data.UniqueID || data.InvoiceNumber;
            window.currentInvoiceFinalized = true;
            fullPayload.meta.uniqueId = window.currentInvoiceId;
            restoreInvoiceUI(fullPayload);
            return; // handled by recursion
        }

        // Legacy flat path
        const isGst = data.InvoiceType === 'GST';
        const configKey = inferStoredTaxType(data);
        if (typeof window.setBillingMode === 'function') {
            window.setBillingMode(isGst ? 'gst' : 'nongst');
        }

        setVal('s-inv-num', data.InvoiceNumber || data.invoiceNumber);
        if (data.Date) setVal('s-inv-date', String(data.Date).split('T')[0]);
        setVal('s-client-name', data.ClientName || data.customerName || data.clientName);
        setVal('s-client-addr', data.ClientAddress || data.Address || '');
        setVal('s-client-phone', data.ClientPhone || data.Phone || data.mobile || '');
        setVal('s-client-gstin', data.ClientGSTIN || data.GSTIN || '');
        
        if (isGst) {
            setVal('s-client-state', data.ClientState || 'Gujarat');
            setVal('s-client-state-code', data.ClientStateCode || '24');
            setVal('s-place-supply', data.PlaceOfSupply || 'Gujarat');
        }
        setVal('gst-rate', getTaxConfig(configKey).rate);
        setVal('tax-type', configKey);
        const gstLabelEl = document.getElementById('gst-rate-display');
        if (gstLabelEl) gstLabelEl.value = configKey;
        
        if (!data.rows && data.ItemsJSON) {
            try { 
                const parsed = typeof data.ItemsJSON === 'string' ? JSON.parse(data.ItemsJSON) : data.ItemsJSON;
                data.rows = Array.isArray(parsed) ? parsed : [];
            } catch(e) { console.error("ItemsJSON parse error", e); }
        }
        
        window.currentInvoiceId = data.UniqueID || data.InvoiceNumber;
        window.currentInvoiceFinalized = !!window.currentInvoiceId;
        const legacyName = data.ClientName || data.customerName || data.clientName;
        if (typeof window.tryAutoFillClient === 'function' && legacyName) {
            window.tryAutoFillClient(legacyName);
        } else if (typeof window.setClientDue === 'function') {
            window.setClientDue(data.DueAmount || data.dueAmount || 0);
        }
    }
    else {
        return;
    }

    // 6. Restore Product Rows
    window.rows = [];
    window.rowCounter = 0; // reset local row ID counter
    
    if (data.rows && Array.isArray(data.rows) && data.rows.length > 0) {
        data.rows.forEach(r => {
            if (typeof window.addRow === 'function') {
                window.addRow({
                    brand: r.brand,
                    name: r.name,
                    desc: r.desc,
                    qty: r.qty,
                    price: r.price,
                    total: r.total,
                    hsn: r.hsn || '',
                    gstRate: r.gstRate || 0
                });
            }
        });
    } else {
        if (typeof window.addRow === 'function') window.addRow();
    }

    // 7. Force all UI recalculations and rendering
    if (typeof window.refreshPaper === 'function') window.refreshPaper();
    if (typeof window.recalcAll === 'function') window.recalcAll();
    if (typeof window.updateIntro === 'function') window.updateIntro();
    if (typeof window.updateTerms === 'function') window.updateTerms();
    if (typeof window.updateQR === 'function') window.updateQR();
}


// ─── UTILITIES ────────────────────────────────────────────────────────────────

function setVal(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    el.value = value || '';
}

// Generate a unique ID for the invoice (fallback if not using DB auto-increment)
function generateUniqueId() {
    const ts = new Date().getTime().toString(36);
    const rand = Math.random().toString(36).substring(2, 6);
    return `INV-${ts}-${rand}`.toUpperCase();
}
