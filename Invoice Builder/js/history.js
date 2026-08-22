/**
 * ==============================================================================
 * js/history.js — History Page Logic
 * Invoice System
 * 
 * Fetches the invoice list from Apps Script and renders the interactive table.
 * ==============================================================================
 */

'use strict';

// Ensure user is logged in before viewing history
document.addEventListener('DOMContentLoaded', () => {
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

    try {
        const auth = safeStorage.getItem('inv_auth');
        if (!auth) {
            window.location.href = 'index.html';
            return;
        }
        
        // Load invoices on boot
        loadHistoryTable();
        
        // Setup Search Filter
        const searchInput = document.getElementById('history-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                filterHistoryTable(e.target.value);
            });
        }
    } catch (err) {
        console.error('History initialization error:', err);
    }
});

let allInvoices = []; // Cache for filtering

async function loadHistoryTable() {
    const tbody = document.getElementById('history-tbody');
    const loadingRow = document.getElementById('loading-row');
    const errorRow = document.getElementById('error-row');
    const emptyRow = document.getElementById('empty-row');
    
    // 1. Instant Cache Load (Optimistic UI)
    const cached = safeStorage.getItem('invoice_history_cache');
    if (cached) {
        try {
            let parsed = JSON.parse(cached);
            // Remove duplicates by uniqueId
            const seen = new Set();
            allInvoices = parsed.filter(inv => {
                if (!inv.uniqueId || seen.has(inv.uniqueId)) return false;
                seen.add(inv.uniqueId);
                return true;
            }).reverse();
            if (allInvoices.length > 0) {
                if (loadingRow) loadingRow.style.display = 'none';
                renderHistoryRows(allInvoices);
            }
        } catch(e) {}
    } else {
        if (tbody) tbody.innerHTML = '';
        if (loadingRow) loadingRow.style.display = '';
    }
    
    if (errorRow) errorRow.style.display = 'none';
    if (emptyRow) emptyRow.style.display = 'none';
    
    // 2. Silent Background Synchronization
    try {
        const freshInvoices = await apiGetInvoices();
        // Remove duplicates by uniqueId
        const seen = new Set();
        allInvoices = (freshInvoices || []).filter(inv => {
            if (!inv.uniqueId || seen.has(inv.uniqueId)) return false;
            seen.add(inv.uniqueId);
            return true;
        }).reverse();
        safeStorage.setItem('invoice_history_cache', JSON.stringify(allInvoices)); // Update Cache

        if (loadingRow) loadingRow.style.display = 'none';

        if (allInvoices.length === 0) {
            const tableBody = document.getElementById('history-tbody');
            if (tableBody) tableBody.innerHTML = ''; // Clear stale cache
            if (emptyRow) emptyRow.style.display = '';
            return;
        }

        // Only re-render if user hasn't typed in search yet
        const searchInput = document.getElementById('history-search');
        if (!searchInput || !searchInput.value) {
            renderHistoryRows(allInvoices);
        }

    } catch (err) {
        console.error('History fetch error:', err);
        const errorText = document.querySelector('#error-row div') || errorRow;
        if (errorText) {
            errorText.textContent = `Failed to load history: ${err.message}`;
        }
        if (loadingRow) loadingRow.style.display = 'none';
        if (errorRow) errorRow.style.display = '';
    }
}

function renderHistoryRows(invoices) {
    const tbody = document.getElementById('history-tbody');
    if(!tbody) return;
    tbody.innerHTML = '';

    const INR = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    invoices.forEach(inv => {
        const tr = document.createElement('tr');
        // Format Date in India time so date-only values do not shift by timezone.
        let dateStr = inv.date;
        try {
            if (dateStr) {
                const normalized = String(dateStr).slice(0, 10);
                const date = new Date(`${normalized}T12:00:00+05:30`);
                dateStr = date.toLocaleDateString('en-IN', {
                    timeZone: 'Asia/Kolkata',
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                });
            }
        } catch(e){}
        const amtStr = '₹' + INR.format(inv.totalAmount || 0);
        tr.innerHTML = `
            <td data-label="INV #"><strong>${escapeHTML(inv.invoiceNumber || '—')}</strong></td>
            <td data-label="DATE">${escapeHTML(dateStr || '—')}</td>
            <td data-label="CUSTOMER NAME">${escapeHTML(inv.customerName || 'Unknown')}</td>
            <td data-label="MOBILE">${escapeHTML(inv.mobile || '—')}</td>
            <td data-label="TOTAL AMOUNT" style="text-align:right; font-weight:600; color:var(--primary)">${amtStr}</td>
            <td data-label="ACTION" class="action-cell">
                <button class="btn btn-ghost btn-sm" onclick="openInvoice('${inv.uniqueId}')" title="Open in Editor">
                    <span class="material-symbols-outlined" style="font-size:16px">edit</span> Open
                </button>
                <button class="btn btn-ghost btn-sm" onclick="deleteInvoice('${inv.uniqueId}')" title="Delete Invoice" style="color: #ef4444; margin-left: 4px;">
                    <span class="material-symbols-outlined" style="font-size:16px">delete</span>
                </button>
            </td>
        `;
        // Download actual PDF directly from history
        window.downloadPDFfromHistory = async function(uniqueId) {
            const invoice = allInvoices.find(inv => inv.uniqueId === uniqueId);
            if (!invoice) {
                toast('Invoice not found', 'show');
                return;
            }
            // Load invoice into preview
            if (typeof openInvoice === 'function') {
                await openInvoice(uniqueId);
                // Wait for UI to update
                await new Promise(r => setTimeout(r, 400));
            }
            // Trigger PDF download
            if (typeof downloadPDF === 'function') {
                downloadPDF();
            } else {
                toast('PDF download function not found', 'show');
            }
        };
        tbody.appendChild(tr);
    });
// Download invoice directly from history
window.downloadInvoiceFromHistory = async function(uniqueId) {
    const invoice = allInvoices.find(inv => inv.uniqueId === uniqueId);
    if (!invoice) {
        toast('Invoice not found', 'show');
        return;
    }
    // Convert invoice to JSON and trigger download
    const filename = `Invoice_${invoice.invoiceNumber || uniqueId}.json`;
    const blob = new Blob([JSON.stringify(invoice, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast('Invoice downloaded', 'show');
};
}

function filterHistoryTable(searchTerm) {
    if (!searchTerm) {
        renderHistoryRows(allInvoices);
        return;
    }
    const lower = searchTerm.toLowerCase();
    // Remove duplicates before filtering
    const seen = new Set();
    const filtered = allInvoices.filter(inv => {
        if (!inv.uniqueId || seen.has(inv.uniqueId)) return false;
        seen.add(inv.uniqueId);
        const searchPool = `${inv.customerName || ''} ${inv.invoiceNumber || ''}`.toLowerCase();
        return searchPool.includes(lower);
    });
    renderHistoryRows(filtered);
}

// Redirects back to index.html with the invoice ID in the URL hash
function openInvoice(uniqueId) {
    window.location.href = `index.html#edit=${uniqueId}`;
}

async function deleteInvoice(uniqueId) {
    if (!confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) return;
    
    // 1. Instant UI Update (Optimistic Deletion)
    const previousInvoices = [...allInvoices]; // save backup in case of failure
    allInvoices = allInvoices.filter(i => i.uniqueId !== uniqueId);
    
    // Instantly remove from screen
    renderHistoryRows(allInvoices);
    
    // 2. Adjust Empty State immediately layout
    if (allInvoices.length === 0) {
        const emptyRow = document.getElementById('empty-row');
        if (emptyRow) emptyRow.style.display = '';
    }
    
    // 3. Update Cache silently
    safeStorage.setItem('invoice_history_cache', JSON.stringify(allInvoices));

    // 4. Send background request
    try {
        const result = await apiDeleteInvoice(uniqueId);
        if (!result || !result.success) {
            throw new Error(result && result.message ? result.message : 'Delete failed');
        }
    } catch(err) {
        console.error(err);
        // Revert UI if server request failed
        alert('Delete failed: ' + (err.message || 'Server connection failed. Deletion rolled back.'));
        allInvoices = previousInvoices;
        safeStorage.setItem('invoice_history_cache', JSON.stringify(allInvoices));
        const emptyRow = document.getElementById('empty-row');
        if (emptyRow) emptyRow.style.display = 'none';
        renderHistoryRows(allInvoices);
    }
}

function escapeHTML(str) {
    return String(str||'').replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag])
    );
}

function goBack() {
    window.location.href = 'index.html';
}
