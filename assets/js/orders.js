/* orders.js */
let allOrders = [], orderItems = [], editingOrderId = null;
let activeOrderTab = 'Orders';
let activeStatusFilter = '';
let activeItemsStatusFilter = '';
let allPackagingData = [];
let allDetailedItems = [];

function updatePageDebug(text, color) {
  const el = document.getElementById('debug-page-status');
  if (el) {
    el.textContent = 'Page: ' + text;
    if (color) el.style.color = color;
  }
}

let cachedBottlesList = [];

async function fetchPackagingData() {
  try {
    const { data: pkgData, error: pkgErr } = await window.dbClient.from('product_packaging').select('*');
    if (!pkgErr && pkgData) {
      allPackagingData = pkgData;
    }
    const { data: invData, error: invErr } = await window.dbClient.from('inventory').select('*');
    if (!invErr && invData) {
      cachedBottlesList = invData.filter(it => it.category === 'Bottles');
    }
  } catch (e) {
    console.error('Failed to fetch packaging/inventory data:', e);
  }
}

async function loadOrders() {
  console.log('Loading orders...');
  updatePageDebug('Loading Orders...', '#10B981');
  try {
    UTILS.renderTableSkeleton('orders-table');
    await DB.initDB();
    await fetchPackagingData();
    
    const { data: ordersData, error: ordersErr } = await window.dbClient.from('orders').select('*').order('created_at', { ascending: false });
    if (ordersErr) throw ordersErr;
    allOrders = ordersData || [];
    
    // Retrieve client list to map display names
    const { data: clientsData, error: clientsErr } = await window.dbClient.from('clients').select('*');
    const clientsList = clientsErr ? [] : (clientsData || []);
    
    allOrders.forEach(o => {
      const match = clientsList.find(c => c.id === o.client_id);
      o.client_display = match ? match.name : (o.client_name || '—');
    });

    // Build comprehensive order items detailed array
    await buildDetailedOrderItems();

    applyFiltersAndRender();
    updatePageDebug('Ready (' + allOrders.length + ')', '#10B981');
    setTimeout(() => UTILS.initAllAutocompleteSelects(), 50);
  } catch (err) {
    console.error('loadOrders failed:', err);
    updatePageDebug('FAILED', '#EF4444');
    APP.showToast('Failed to load orders: ' + err.message, 'error');
  }
}

async function buildDetailedOrderItems() {
  allDetailedItems = [];
  try {
    for (const o of allOrders) {
      let items = o.items;
      if (!items) {
        const { data: detailData, error: detailErr } = await window.dbClient.from('order_items').select('*').eq('order_id', o.id);
        if (!detailErr && detailData) {
          items = detailData;
          o.items = items;
        } else {
          items = [];
        }
      }
      (items || []).forEach(it => {
        allDetailedItems.push({
          order_id: o.id,
          order_no: o.order_no,
          client_display: o.client_display,
          date: o.date,
          status: o.status,
          product_name: it.product_name,
          product_id: it.product_id,
          packaging_size: it.packaging_size,
          quantity: it.quantity,
          unit_price: it.unit_price,
          total: it.total
        });
      });
    }
  } catch (err) {
    console.error('Error building detailed order items:', err);
  }
}

function applyFiltersAndRender() {
  if (activeOrderTab === 'Orders') {
    const q = (document.getElementById('search-input')?.value || '').toLowerCase();
    let data = allOrders;
    if (activeStatusFilter) {
      data = data.filter(o => {
        let st = (o.status || 'Pending').toLowerCase();
        if (st === 'delivered') st = 'completed';
        return st === activeStatusFilter.toLowerCase();
      });
    }
    if (q) {
      data = data.filter(o => `${o.order_no} ${o.client_display} ${o.date}`.toLowerCase().includes(q));
    }
    renderTable(data);
  } else {
    const q = (document.getElementById('items-search-input')?.value || '').toLowerCase();
    let data = allDetailedItems;
    if (activeItemsStatusFilter) {
      data = data.filter(it => {
        let st = (it.status || 'Pending').toLowerCase();
        if (st === 'delivered') st = 'completed';
        return st === activeItemsStatusFilter.toLowerCase();
      });
    }
    if (q) {
      data = data.filter(it => `${it.order_no} ${it.client_display} ${it.product_name} ${it.date}`.toLowerCase().includes(q));
    }
    renderOrderItemsDetailTable(data);
  }
}

function renderTable(data) {
  const tbody = document.querySelector('#orders-table tbody');
  if (!tbody) return;
  document.getElementById('total-info').textContent = `${data.length} order${data.length !== 1 ? 's' : ''}`;
  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="9"><div class="empty-state"><h3>No orders found</h3><p>Create your first order.</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = data.map(o => {
    const balance = parseFloat(o.total_amount) - parseFloat(o.paid_amount || 0);
    const rowBg = balance <= 0 ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)';
    
    // Status Badge
    let statusVal = o.status || 'Pending';
    if (statusVal === 'Delivered') {
      statusVal = 'Completed';
    }
    const isCompleted = statusVal.toLowerCase() === 'completed';
    const statusBadge = `<span class="badge ${isCompleted ? 'badge-success' : 'badge-warning'}">${statusVal}</span>`;

    return `<tr style="background: ${rowBg}">
      <td><input type="checkbox" class="row-check" value="${o.id}"></td>
      <td class="cell-bold">${o.order_no}</td>
      <td>${o.client_display || '—'}</td>
      <td>${UTILS.fmtDate(o.date)}</td>
      <td class="cell-amount">${UTILS.fmtCurrency(o.total_amount)}</td>
      <td class="cell-amount text-success">${UTILS.fmtCurrency(o.paid_amount)}</td>
      <td class="cell-amount text-danger">${UTILS.fmtCurrency(balance)}</td>
      <td>${statusBadge}</td>
      <td><div class="row-actions">
        <button class="action-btn view" onclick="viewOrder(${o.id})" title="View Details"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>
        <button class="action-btn edit" onclick="openEdit(${o.id})" title="Edit Order"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
        <button class="action-btn delete" onclick="deleteOrder(${o.id})" title="Delete"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg></button>
      </div></td>
    </tr>`;
  }).join('');
  UTILS.applyMobileTableLabels('orders-table');
}

function renderOrderItemsDetailTable(data) {
  const tbody = document.querySelector('#order-items-detail-table tbody');
  if (!tbody) return;
  const totalInfo = document.getElementById('items-total-info');
  if (totalInfo) totalInfo.textContent = `${data.length} item${data.length !== 1 ? 's' : ''}`;
  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="10"><div class="empty-state"><h3>No items found</h3><p>No order items match the selected criteria.</p></div></td></tr>`;
    return;
  }

  // Group detailed items by order_id
  const groupedMap = new Map();
  data.forEach(it => {
    const key = it.order_id || it.order_no;
    if (!groupedMap.has(key)) {
      groupedMap.set(key, []);
    }
    groupedMap.get(key).push(it);
  });

  let rowsHtml = '';
  let groupIdx = 0;
  groupedMap.forEach((items, orderId) => {
    const first = items[0];
    let statusVal = first.status || 'Pending';
    if (statusVal === 'Delivered') statusVal = 'Completed';
    const isCompleted = statusVal.toLowerCase() === 'completed';
    const statusBadge = `<span class="badge ${isCompleted ? 'badge-success' : 'badge-warning'}">${statusVal}</span>`;

    // High contrast alternating background colors for distinct order blocks
    const blockBg = (groupIdx % 2 === 0) 
      ? 'background-color: rgba(255, 255, 255, 0.035);' 
      : 'background-color: rgba(16, 185, 129, 0.07);';

    const getPackSizeStr = (it) => {
      let packSizeStr = it.packaging_size;
      if (!packSizeStr) {
        const packMatch = allPackagingData.find(p => p.product_id == it.product_id);
        packSizeStr = packMatch ? cleanSizeLabel(packMatch.packaging_size, packMatch.product_unit) : '—';
      } else {
        packSizeStr = cleanSizeLabel(packSizeStr, '');
      }
      return packSizeStr;
    };

    items.forEach((it, idx) => {
      const isFirstRow = idx === 0;
      const isLastRow = idx === items.length - 1;
      const rowSpanAttr = isFirstRow ? ` rowspan="${items.length}"` : '';
      
      // Distinct bottom border separating different order blocks vs inner item rows
      const borderStyle = isLastRow 
        ? 'border-bottom: 3px solid rgba(16, 185, 129, 0.4);' 
        : 'border-bottom: 1px dashed rgba(255, 255, 255, 0.12);';

      const packSizeStr = getPackSizeStr(it);

      rowsHtml += `<tr style="${blockBg} ${borderStyle}">`;
      if (isFirstRow) {
        rowsHtml += `
          <td class="cell-bold"${rowSpanAttr} style="vertical-align:middle; padding: 14px 16px; font-weight:700; font-size:14px;">${first.order_no}</td>
          <td${rowSpanAttr} style="vertical-align:middle; padding: 14px 16px;">${first.client_display || '—'}</td>
          <td${rowSpanAttr} style="vertical-align:middle; padding: 14px 16px;">${UTILS.fmtDate(first.date)}</td>
        `;
      }
      rowsHtml += `
        <td style="font-weight:600; color:var(--primary); padding: 12px 16px;">${it.product_name || '—'}</td>
        <td style="padding: 12px 16px;"><span class="badge badge-neutral">${packSizeStr}</span></td>
        <td style="padding: 12px 16px;">${it.quantity}</td>
        <td class="cell-amount" style="padding: 12px 16px;">${UTILS.fmtCurrency(it.unit_price)}</td>
        <td class="cell-amount" style="font-weight:700; padding: 12px 16px;">${UTILS.fmtCurrency(it.total)}</td>
      `;
      if (isFirstRow) {
        rowsHtml += `
          <td${rowSpanAttr} style="vertical-align:middle; padding: 14px 16px;">${statusBadge}</td>
          <td${rowSpanAttr} style="vertical-align:middle; padding: 14px 16px;"><div class="row-actions">
            <button class="action-btn view" onclick="viewOrder(${first.order_id})" title="View Order"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>
            <button class="action-btn edit" onclick="openEdit(${first.order_id})" title="Edit Order"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
          </div></td>
        `;
      }
      rowsHtml += `</tr>`;
    });
    groupIdx++;
  });

  tbody.innerHTML = rowsHtml;
  UTILS.applyMobileTableLabels('order-items-detail-table');
}

async function viewOrder(id) {
  try {
    const { data: o, error: oErr } = await window.dbClient.from('orders').select('*, items:order_items(*)').eq('id', id).single();
    if (oErr) throw oErr;

    const balance = parseFloat(o.total_amount) - parseFloat(o.paid_amount || 0);
    let statusVal = o.status || 'Pending';
    if (statusVal === 'Delivered') statusVal = 'Completed';
    const isCompleted = statusVal.toLowerCase() === 'completed';
    const statusBadge = `<span class="badge ${isCompleted ? 'badge-success' : 'badge-warning'}">${statusVal}</span>`;

    let itemsHtml = (o.items || []).map(it => {
      const pSize = cleanSizeLabel(it.packaging_size || '', '');
      return `
      <tr>
        <td style="font-weight:600">${it.product_name}</td>
        <td><span class="badge badge-neutral">${pSize || '—'}</span></td>
        <td style="text-align:center">${it.quantity}</td>
        <td style="text-align:right">${UTILS.fmtCurrency(it.unit_price)}</td>
        <td style="text-align:right; font-weight:600">${UTILS.fmtCurrency(it.total)}</td>
      </tr>
    `}).join('');

    const html = `
      <div style="display:grid; gap:16px;">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border); padding-bottom:12px;">
          <div>
            <h3 style="margin:0; font-size:18px; color:var(--text);">${o.order_no}</h3>
            <p style="margin:4px 0 0; font-size:13px; color:var(--text-muted);">Booked Date: ${UTILS.fmtDate(o.date)} ${o.due_date ? `| Due Date: ${UTILS.fmtDate(o.due_date)}` : ''}</p>
          </div>
          <div>${statusBadge}</div>
        </div>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px; background:var(--bg); padding:14px; border-radius:8px;">
          <div>
            <span style="font-size:11px; text-transform:uppercase; letter-spacing:0.5px; color:var(--text-muted); font-weight:600;">Client Details</span>
            <div style="font-weight:600; font-size:15px; margin-top:4px; color:var(--text);">${o.client_name || '—'}</div>
          </div>
          <div>
            <span style="font-size:11px; text-transform:uppercase; letter-spacing:0.5px; color:var(--text-muted); font-weight:600;">Payment Status</span>
            <div style="font-size:14px; margin-top:4px; color:var(--text);">
              Total: <strong>${UTILS.fmtCurrency(o.total_amount)}</strong> | Paid: <span class="text-success" style="font-weight:600">${UTILS.fmtCurrency(o.paid_amount)}</span>
              <br>Balance: <span class="${balance > 0 ? 'text-danger' : 'text-success'}" style="font-weight:700">${UTILS.fmtCurrency(balance)}</span>
            </div>
          </div>
        </div>

        <div>
          <h4 style="margin:0 0 8px; font-size:14px; color:var(--text);">Ordered Items</h4>
          <table class="data-table" style="width:100%">
            <thead>
              <tr>
                <th style="text-align:left">Product Name</th>
                <th style="text-align:left">Pack Size</th>
                <th style="text-align:center">Quantity</th>
                <th style="text-align:right">Unit Price</th>
                <th style="text-align:right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml || '<tr><td colspan="4" style="text-align:center">No items</td></tr>'}
            </tbody>
          </table>
        </div>

        ${o.notes ? `
          <div style="background:var(--bg); padding:10px 14px; border-radius:6px; font-size:13px; color:var(--text-muted);">
            <strong>Notes:</strong> ${o.notes}
          </div>
        ` : ''}

        <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:8px;">
          <button class="btn btn-secondary" onclick="APP.closeModal('view-modal')">Close</button>
          <button class="btn btn-primary" onclick="APP.closeModal('view-modal'); openEdit(${o.id});">Edit Order</button>
        </div>
      </div>
    `;

    document.getElementById('view-content').innerHTML = html;
    APP.openModal('view-modal');
  } catch (err) {
    console.error(err);
    APP.showToast('Failed to view order: ' + err.message, 'error');
  }
}

async function populateClientSelect() {
  const sel = document.getElementById('client-select');
  if (!sel) return;
  try {
    const { data: clientsData, error } = await window.dbClient.from('clients').select('*');
    if (error) throw error;
    const clients = clientsData || [];
    sel.innerHTML = '<option value="">Select Client</option>' + clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  } catch (err) {
    console.error('populateClientSelect failed:', err);
  }
}

async function openAdd() {
  editingOrderId = null;
  document.getElementById('modal-title').textContent = 'New Sales Order';
  const orderForm = document.getElementById('order-form');
  orderForm.reset();
  const toggle = document.getElementById('auto-discount-toggle');
  if (toggle) toggle.checked = false;
  const gstSel = document.getElementById('gst-type-select');
  if (gstSel) { gstSel.value = ''; onGstTypeChange(''); }
  handleAutoDiscount();
  orderItems = [{ id: Date.now(), product_id: '', product_name: '', quantity: 1, unit_price: 0, total: 0, bottle_inventory_id: '' }];
  await populateClientSelect();
  await renderOrderItems();
  UTILS.applyDefaultDateInputs(orderForm, { skipFieldNames: ['due_date'] });
  APP.openModal('order-modal');
  setTimeout(() => UTILS.initAllAutocompleteSelects(), 10);
}

async function openEdit(id) {
  editingOrderId = id;
  try {
    await populateClientSelect();
    
    const { data: o, error: oErr } = await window.dbClient.from('orders').select('*, items:order_items(*)').eq('id', id).single();
    if (oErr) throw oErr;

    document.getElementById('modal-title').textContent = 'Edit Order';
    if (o.status === 'Delivered') {
      o.status = 'Completed';
    }
    UTILS.populateForm('order-form', o);
    UTILS.applyDefaultDateInputs(document.getElementById('order-form'), { skipFieldNames: ['due_date'] });
    const toggle = document.getElementById('auto-discount-toggle');
    if (toggle) toggle.checked = false;
    handleAutoDiscount();
    orderItems = o.items || [];
    
    orderItems.forEach(item => {
      item.total = (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0);
    });

    // Restore GST type selector from stored tax %
    const taxVal = parseFloat(o.tax) || 0;
    const gstSel = document.getElementById('gst-type-select');
    if (gstSel) {
      const reverseMap = { 5: 'GST5', 12: 'GST12', 18: 'GST18' };
      gstSel.value = reverseMap[taxVal] || '';
      onGstTypeChange(gstSel.value);
    }

    // Ensure products list is loaded
    const { data: prodData, error: prodErr } = await window.dbClient.from('products').select('*');
    cachedProductsList = prodErr ? [] : (prodData || []);

    // Ensure item packaging options are populated when editing
    for (const item of orderItems) {
      if (item.product_id) {
        const pMatch = cachedProductsList.find(p => p.id == item.product_id);
        if (pMatch && (!pMatch.packaging_options || pMatch.packaging_options.length === 0)) {
          try {
            const { data: pkgs, error: pkgErr } = await window.dbClient.from('product_packaging').select('*').eq('product_id', item.product_id);
            if (!pkgErr && pkgs) {
              pMatch.packaging_options = pkgs;
            }
          } catch (e) {
            console.warn('Failed to pre-fetch packaging for editing item:', item.product_id, e);
          }
        }
      }
    }

    await renderOrderItems();
    APP.openModal('order-modal');
    setTimeout(() => UTILS.initAllAutocompleteSelects(), 10);
  } catch (err) {
    console.error(err);
    APP.showToast('Failed to load order: ' + err.message, 'error');
  }
}

async function addOrderItem() {
  orderItems.push({ id: Date.now(), product_id: '', product_name: '', quantity: 1, unit_price: 0, total: 0, bottle_inventory_id: '' });
  await renderOrderItems();
}

function cleanSizeLabel(size, unit) {
  if (!size) return unit || '';
  const s = String(size).trim();
  const u = String(unit || '').trim();
  if (!u) return s;
  // If size already ends with unit (case-insensitive), or already contains a unit abbreviation, return size as is
  if (s.toLowerCase().includes(u.toLowerCase()) || /\b(ltr|ml|kg|gm|nos|pcs|box|bag|drum)\b/i.test(s)) {
    return s;
  }
  return `${s} ${u}`;
}

let cachedProductsList = [];

async function renderOrderItems() {
  const tbody = document.getElementById('order-items-tbody');
  if (!tbody) return;
  
  try {
    const { data: prodData, error: prodErr } = await window.dbClient.from('products').select('*');
    cachedProductsList = prodErr ? [] : (prodData || []);

    // Ensure item packaging options are populated for all items
    for (const item of orderItems) {
      let pMatch = cachedProductsList.find(p => p.id == item.product_id);
      if (!pMatch && item.product_name) {
        pMatch = cachedProductsList.find(p => String(p.name).toLowerCase().trim() === String(item.product_name).toLowerCase().trim());
        if (pMatch) item.product_id = pMatch.id;
      }
      if (pMatch && (!pMatch.packaging_options || pMatch.packaging_options.length === 0)) {
        try {
          const { data: pkgs, error: pkgErr } = await window.dbClient.from('product_packaging').select('*').eq('product_id', pMatch.id);
          if (!pkgErr && pkgs) {
            pMatch.packaging_options = pkgs;
          }
        } catch (e) {
          console.warn('Failed to pre-fetch packaging in renderOrderItems for product:', pMatch.id, e);
        }
      }
    }
    
    tbody.innerHTML = orderItems.map((item, idx) => {
      let pMatch = cachedProductsList.find(p => p.id == item.product_id);
      if (!pMatch && item.product_name) {
        pMatch = cachedProductsList.find(p => String(p.name).toLowerCase().trim() === String(item.product_name).toLowerCase().trim());
      }
      let pkgOptions = pMatch?.packaging_options || [];
      if (pkgOptions.length > 0) {
        pkgOptions = UTILS.sortPackSizesDescending(pkgOptions, opt => opt.packaging_size || opt.size);
      }
      const unitStr = pMatch?.unit || '';
      
      let pkgSelectHtml = '';
      if (pkgOptions.length > 0) {
        const itemNormPack = item.packaging_size ? String(item.packaging_size).toLowerCase().replace(/\s+/g, '') : '';
        let hasMatchedSel = false;
        const optionsStr = pkgOptions.map(opt => {
          const rawSize = opt.packaging_size || opt.size || '';
          const sizeLabel = cleanSizeLabel(rawSize, unitStr);
          const priceVal = parseFloat(opt.sell_price || opt.selling_price) || 0;
          const optNorm = String(sizeLabel).toLowerCase().replace(/\s+/g, '');
          const rawNorm = String(rawSize).toLowerCase().replace(/\s+/g, '');
          const isSel = itemNormPack 
            ? (optNorm === itemNormPack || rawNorm === itemNormPack)
            : (opt.is_base || opt === pkgOptions[0]);
          if (isSel) hasMatchedSel = true;
          return `<option value="${sizeLabel}" data-price="${priceVal}" ${isSel ? 'selected' : ''}>${sizeLabel}</option>`;
        }).join('');

        // Ensure item.packaging_size is set if not already set
        if (!item.packaging_size && pkgOptions.length > 0) {
          const selOpt = pkgOptions.find(opt => opt.is_base) || pkgOptions[0];
          item.packaging_size = cleanSizeLabel(selOpt.packaging_size || selOpt.size || '', unitStr);
          if (!item.unit_price) item.unit_price = parseFloat(selOpt.sell_price || selOpt.selling_price) || 0;
        }

        pkgSelectHtml = `<select data-native class="form-select order-pack-select" data-idx="${idx}" onchange="onPackSizeChange(${idx}, this.value)">
          ${optionsStr}
        </select>`;
      } else {
        const fallbackSize = item.packaging_size || unitStr || '';
        item.packaging_size = fallbackSize;
        pkgSelectHtml = `<input type="text" class="form-input order-pack-input" data-idx="${idx}" value="${fallbackSize}" placeholder="Pack size" onchange="onPackSizeChange(${idx}, this.value)">`;
      }

      // Filter bottles by matching packaging size or show all if empty
      let validBottles = cachedBottlesList;
      if (item.packaging_size) {
        const itemNormPack = String(item.packaging_size).toLowerCase().replace(/\s+/g, '');
        // We match bottle size if item_size exists, else fall back to matching name
        validBottles = cachedBottlesList.filter(b => {
          if (b.item_size) {
            const bNormSize = String(b.item_size).toLowerCase().replace(/\s+/g, '');
            return bNormSize === itemNormPack || itemNormPack.includes(bNormSize) || bNormSize.includes(itemNormPack);
          }
          return b.name.toLowerCase().replace(/\s+/g, '').includes(itemNormPack);
        });
        if (validBottles.length === 0) validBottles = cachedBottlesList; // fallback to all
      }

      const bottleSelectHtml = `
        <select data-native class="form-select order-bottle-select" data-idx="${idx}" onchange="onBottleChange(${idx}, this.value)">
          <option value="">Select Bottle</option>
          ${validBottles.map(b => `<option value="${b.id}" ${b.id == item.bottle_inventory_id ? 'selected' : ''}>${b.name} (${parseFloat(b.total_stock || b.stock || 0).toFixed(0)} avail)</option>`).join('')}
        </select>
      `;

      return `
        <tr data-row-idx="${idx}">
          <td style="min-width:180px">
            <select data-native class="form-select order-product-select" data-idx="${idx}" onchange="onProductSelectChange(${idx}, this.value)">
              <option value="">Select Product</option>
              ${cachedProductsList.map(p => `<option value="${p.id}" ${p.id == item.product_id ? 'selected' : ''}>${p.name}</option>`).join('')}
            </select>
          </td>
          <td style="min-width:140px" class="pack-size-cell">
            ${pkgSelectHtml}
          </td>
          <td style="min-width:160px" class="bottle-cell">
            ${bottleSelectHtml}
          </td>
          <td><input type="number" class="form-input item-qty-input" value="${item.quantity}" onchange="onQtyChange(${idx}, this.value)"></td>
          <td><input type="number" class="form-input item-price-input" value="${item.unit_price}" onchange="onUnitPriceChange(${idx}, this.value)"></td>
          <td class="cell-amount item-total-display">${UTILS.fmtCurrency(item.total)}</td>
          <td><button class="action-btn delete" onclick="removeItem(${idx})"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg></button></td>
        </tr>
      `;
    }).join('');
    calculateTotal();
  } catch (err) {
    console.error(err);
  }
}

async function onProductSelectChange(idx, valOrEvt) {
  let val = valOrEvt;
  if (valOrEvt && typeof valOrEvt === 'object' && valOrEvt.target) {
    val = valOrEvt.target.value;
  }
  console.log(`[OrderRow ${idx}] Product selected (ID):`, val);
  const it = orderItems[idx];
  if (!it) return;
  it.product_id = val;
  if (!val) {
    console.log(`[OrderRow ${idx}] Cleared product selection.`);
    it.product_name = '';
    it.packaging_size = '';
    it.unit_price = 0;
    it.total = 0;
    await renderOrderItems();
    return;
  }

  const p = cachedProductsList.find(x => x.id == val);
  console.log(`[OrderRow ${idx}] Fetched product object from Product Master:`, p);
  
  it.product_name = p?.name || '';
  let pkgOptions = p?.packaging_options || [];
  if (!pkgOptions.length && val) {
    try {
      const { data: pkgs, error: pkgErr } = await window.dbClient.from('product_packaging').select('*').eq('product_id', val);
      if (!pkgErr && pkgs) {
        pkgOptions = pkgs;
      }
    } catch (e) {
      console.warn('Failed to fetch packaging directly for product:', val, e);
    }
  }
  console.log(`[OrderRow ${idx}] Raw packaging_options array:`, pkgOptions);

  if (pkgOptions.length > 0) {
    pkgOptions = UTILS.sortPackSizesDescending(pkgOptions, opt => opt.packaging_size || opt.size);
    const selectedOpt = pkgOptions.find(opt => opt.is_base) || pkgOptions[0];
    const rawSize = selectedOpt.packaging_size || selectedOpt.size || '';
    it.packaging_size = cleanSizeLabel(rawSize, p?.unit);
    it.unit_price = parseFloat(selectedOpt.sell_price || selectedOpt.selling_price) || parseFloat(p?.sell_price) || 0;
  } else {
    it.packaging_size = p?.unit || '';
    it.unit_price = parseFloat(p?.sell_price) || 0;
  }
  it.total = (parseFloat(it.quantity) || 0) * (parseFloat(it.unit_price) || 0);
  it.bottle_inventory_id = ''; // Reset bottle selection
  await renderOrderItems();
}

async function onPackSizeChange(idx, val) {
  console.log(`[OrderRow ${idx}] Pack size changed to:`, val);
  const it = orderItems[idx];
  if (!it) return;
  it.packaging_size = val;
  const p = cachedProductsList.find(x => x.id == it.product_id);
  let pkgOptions = p?.packaging_options || [];
  if (!pkgOptions.length && it.product_id) {
    try {
      const { data: pkgs, error: pkgErr } = await window.dbClient.from('product_packaging').select('*').eq('product_id', it.product_id);
      if (!pkgErr && pkgs) {
        pkgOptions = pkgs;
      }
    } catch (e) {
      console.warn('Failed to fetch packaging on pack size change:', e);
    }
  }

  const normVal = String(val).toLowerCase().replace(/\s+/g, '');
  const matchOpt = pkgOptions.find(opt => {
    const rawSize = opt.packaging_size || opt.size || '';
    const cleaned = cleanSizeLabel(rawSize, p?.unit);
    const normCleaned = String(cleaned).toLowerCase().replace(/\s+/g, '');
    const normRaw = String(rawSize).toLowerCase().replace(/\s+/g, '');
    return normCleaned === normVal || normRaw === normVal;
  });

  console.log(`[OrderRow ${idx}] Matched packaging option from Product Master:`, matchOpt);

  if (matchOpt) {
    const pr = parseFloat(matchOpt.sell_price || matchOpt.selling_price);
    if (!isNaN(pr) && pr >= 0) {
      it.unit_price = pr;
    }
  }
  it.total = (parseFloat(it.quantity) || 0) * (parseFloat(it.unit_price) || 0);
  it.bottle_inventory_id = ''; // Reset bottle selection
  await renderOrderItems();
}

function onQtyChange(idx, val) {
  const it = orderItems[idx];
  it.quantity = parseFloat(val) || 0;
  it.total = it.quantity * (parseFloat(it.unit_price) || 0);
  const row = document.querySelector(`tr[data-row-idx="${idx}"]`);
  if (row) {
    const totalDisp = row.querySelector('.item-total-display');
    if (totalDisp) totalDisp.textContent = UTILS.fmtCurrency(it.total);
  }
  calculateTotal();
}

function onUnitPriceChange(idx, val) {
  const it = orderItems[idx];
  it.unit_price = parseFloat(val) || 0;
  it.total = (parseFloat(it.quantity) || 0) * it.unit_price;
  const row = document.querySelector(`tr[data-row-idx="${idx}"]`);
  if (row) {
    const totalDisp = row.querySelector('.item-total-display');
    if (totalDisp) totalDisp.textContent = UTILS.fmtCurrency(it.total);
  }
  calculateTotal();
}

function onBottleChange(idx, val) {
  const it = orderItems[idx];
  if (it) {
    it.bottle_inventory_id = val;
  }
}

function removeItem(idx) {
  orderItems.splice(idx, 1);
  renderOrderItems();
}

function handleAutoDiscount() {
  const toggle = document.getElementById('auto-discount-toggle');
  const discountField = document.getElementById('discount-field');
  const paidField = document.querySelector('#order-form input[name="paid_amount"]');
  
  if (!toggle || !discountField || !paidField) return;

  const isAuto = toggle.checked;
  
  if (isAuto) {
    discountField.readOnly = true;
    discountField.style.background = 'var(--bg)';
    
    const subtotal = orderItems.reduce((s, it) => s + it.total, 0);
    const paidAmount = parseFloat(paidField.value) || 0;
    
    if (subtotal > 0 && paidAmount < subtotal) {
      const diff = subtotal - paidAmount;
      const pct = (diff / subtotal) * 100;
      discountField.value = pct.toFixed(2);
    } else {
      discountField.value = "0";
    }
  } else {
    discountField.readOnly = false;
    discountField.style.background = '';
  }
}

function onGstTypeChange(gstCode) {
  const rateMap = { '': 0, 'GST5': 5, 'GST12': 12, 'GST18': 18, 'IGST5': 5, 'IGST12': 12, 'IGST18': 18 };
  const rate = rateMap[gstCode] || 0;
  const taxField = document.getElementById('tax-field');
  if (taxField) taxField.value = rate;
  updateGstBreakdown();
}

function updateGstBreakdown() {
  const subtotal = orderItems.reduce((s, it) => s + it.total, 0);
  const gstCode = document.getElementById('gst-type-select')?.value || '';
  const rateMap = { '': 0, 'GST5': 5, 'GST12': 12, 'GST18': 18, 'IGST5': 5, 'IGST12': 12, 'IGST18': 18 };
  const rate = rateMap[gstCode] || 0;

  const cgstRow = document.getElementById('cgst-row');
  const sgstRow = document.getElementById('sgst-row');
  const igstRow = document.getElementById('igst-row');
  const grandRow = document.getElementById('grand-total-row');

  if (!gstCode || rate === 0) {
    if (cgstRow) cgstRow.style.display = 'none';
    if (sgstRow) sgstRow.style.display = 'none';
    if (igstRow) igstRow.style.display = 'none';
    if (grandRow) grandRow.style.display = 'none';
    return;
  }

  if (gstCode.startsWith('IGST')) {
    const igstAmt = subtotal * rate / 100;
    if (cgstRow) cgstRow.style.display = 'none';
    if (sgstRow) sgstRow.style.display = 'none';
    if (igstRow) { igstRow.style.display = ''; document.getElementById('igst-label').textContent = `IGST (${rate}%):`; document.getElementById('igst-display').textContent = UTILS.fmtCurrency(igstAmt); }
    if (grandRow) { grandRow.style.display = ''; document.getElementById('grand-total-display').textContent = UTILS.fmtCurrency(subtotal + igstAmt); }
  } else {
    const half = rate / 2;
    const cgstAmt = subtotal * half / 100;
    const sgstAmt = subtotal * half / 100;
    if (igstRow) igstRow.style.display = 'none';
    if (cgstRow) { cgstRow.style.display = ''; document.getElementById('cgst-label').textContent = `CGST (${half}%):`; document.getElementById('cgst-display').textContent = UTILS.fmtCurrency(cgstAmt); }
    if (sgstRow) { sgstRow.style.display = ''; document.getElementById('sgst-label').textContent = `SGST (${half}%):`; document.getElementById('sgst-display').textContent = UTILS.fmtCurrency(sgstAmt); }
    if (grandRow) { grandRow.style.display = ''; document.getElementById('grand-total-display').textContent = UTILS.fmtCurrency(subtotal + cgstAmt + sgstAmt); }
  }
}

function calculateTotal() {
  const total = orderItems.reduce((s, it) => s + it.total, 0);
  const el = document.getElementById('order-total-display');
  if (el) el.textContent = UTILS.fmtCurrency(total);
  updateGstBreakdown();
  handleAutoDiscount();

  // Dynamically update Remaining Balance field
  const paidInput = document.getElementById('paid-amount-input');
  const remField = document.getElementById('remaining-balance-field');
  if (paidInput && remField) {
    const paid = parseFloat(paidInput.value) || 0;
    const rem = Math.max(0, total - paid);
    remField.value = UTILS.fmtCurrency(rem);
  }
}

async function saveOrder() {
  const d = UTILS.getFormData('order-form');
  if (!d.client_id) { APP.showToast('Please select a client', 'error'); return; }
  if (orderItems.length === 0) { APP.showToast('Please add at least one item', 'error'); return; }

  const saveBtn = document.querySelector('#order-modal button.btn-primary');
  if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Saving...'; }

  const clientSelect = document.getElementById('client-select');
  const clientName = clientSelect ? clientSelect.options[clientSelect.selectedIndex].text : '';
  const paidAmount = parseFloat(d.paid_amount) || 0.00;

  try {
    const autoToggle = document.getElementById('auto-discount-toggle');
    const isAuto = autoToggle && autoToggle.checked;

    const subtotal = orderItems.reduce((s, it) => s + it.total, 0);
    const taxPct = parseFloat(d.tax) || 0.00;
    const taxAmount = subtotal * taxPct / 100;
    const discountPct = parseFloat(d.discount) || 0.00;
    const discountAmount = subtotal * discountPct / 100;
    const finalTotal = isAuto ? paidAmount : (subtotal + taxAmount - discountAmount);
    
    const boToggle = document.getElementById('allow-backorder-toggle');
    const isBackorderMode = boToggle && boToggle.checked;

    const executeSave = async (allowBackorder = false) => {
      // Sync latest live DOM values from form table to orderItems array
      document.querySelectorAll('#order-items-tbody tr').forEach((row, idx) => {
        if (orderItems[idx]) {
          const prodSel = row.querySelector('.order-product-select');
          if (prodSel && prodSel.value) {
            orderItems[idx].product_id = prodSel.value;
            const pObj = cachedProductsList.find(p => p.id == prodSel.value);
            if (pObj) orderItems[idx].product_name = pObj.name;
          }
          const packSel = row.querySelector('.order-pack-select');
          const packInput = row.querySelector('.order-pack-input');
          if (packSel && packSel.value) {
            orderItems[idx].packaging_size = packSel.value;
          } else if (packInput && packInput.value) {
            orderItems[idx].packaging_size = packInput.value;
          }
          const qtyInp = row.querySelector('.item-qty-input');
          if (qtyInp) orderItems[idx].quantity = parseFloat(qtyInp.value) || 0;
          const priceInp = row.querySelector('.item-price-input');
          if (priceInp) orderItems[idx].unit_price = parseFloat(priceInp.value) || 0;
          orderItems[idx].total = (parseFloat(orderItems[idx].quantity) || 0) * (parseFloat(orderItems[idx].unit_price) || 0);

          const bottleSel = row.querySelector('.order-bottle-select');
          if (bottleSel) orderItems[idx].bottle_inventory_id = bottleSel.value;
        }
      });

      if (editingOrderId) {
        const { error: updateErr } = await window.dbClient.from('orders').update({
          client_id: d.client_id,
          client_name: clientName,
          date: d.date || UTILS.todayStr(),
          due_date: d.due_date || null,
          status: d.status || 'Pending',
          total_amount: finalTotal,
          paid_amount: paidAmount,
          discount: discountPct,
          tax: taxPct,
          notes: d.notes || ''
        }).eq('id', editingOrderId);
        
        if (updateErr) throw updateErr;

        await window.dbClient.from('order_items').delete().eq('order_id', editingOrderId);
        
        if (orderItems.length > 0) {
          const { error: itemsErr } = await window.dbClient.from('order_items').insert(
            orderItems.map(it => ({
              order_id: editingOrderId,
              product_id: it.product_id,
              product_name: it.product_name,
              packaging_size: it.packaging_size || null,
              quantity: parseFloat(it.quantity) || 0,
              unit_price: parseFloat(it.unit_price) || 0,
              total: parseFloat(it.total) || 0,
              bottle_inventory_id: it.bottle_inventory_id || null
            }))
          );
          if (itemsErr) throw itemsErr;
        }
      } else {
        const { data, error } = await window.dbClient.rpc('place_sales_order', {
          p_order_no: d.order_no || null,
          p_client_id: d.client_id,
          p_client_name: clientName,
          p_date: d.date || UTILS.todayStr(),
          p_due_date: d.due_date || null,
          p_status: d.status || 'Pending',
          p_total_amount: finalTotal,
          p_paid_amount: paidAmount,
          p_discount: discountPct,
          p_tax: taxPct,
          p_notes: d.notes || '',
          p_items: orderItems.map(it => ({
            product_id: it.product_id,
            product_name: it.product_name,
            packaging_size: it.packaging_size || null,
            quantity: parseFloat(it.quantity) || 0,
            unit_price: parseFloat(it.unit_price) || 0,
            total: parseFloat(it.total) || 0,
            bottle_inventory_id: it.bottle_inventory_id || null
          }))
        });
        if (error) {
           if (error.message && (error.message.includes('INSUFFICIENT_STOCK') || error.message.includes('Insufficient stock'))) {
             const cleanMsg = error.message.replace('INSUFFICIENT_STOCK:', '').trim();
             // Just throwing it for now as RPC may not support backorder logic.
             // But if we want, we could handle it. Let's match original error.
             throw new Error(cleanMsg);
           }
           throw error;
        }
      }

      APP.closeModal('order-modal');
      APP.showToast('Order saved successfully!', 'success');
      await loadOrders();
    };

    await executeSave(false);
  } catch (err) {
    console.error('saveOrder failed:', err);
    APP.showToast('Failed to save order: ' + err.message, 'error');
  } finally {
    if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Save Order'; }
  }
}

async function deleteOrder(id) {
  APP.showConfirm('Delete this order and its items?', async () => {
    try {
      const { error } = await window.dbClient.from('orders').delete().eq('id', id);
      if (error) throw error;
      
      APP.showToast('Order deleted!', 'success');
      setTimeout(() => loadOrders(), 100);
    } catch (err) {
      console.error(err);
      APP.showToast('Failed to delete order: ' + err.message, 'error');
    }
  });
}

// Tab Switching Listener
document.querySelectorAll('.table-tabs .tab-btn').forEach(btn => {
  btn.addEventListener('click', e => {
    document.querySelectorAll('.table-tabs .tab-btn').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    activeOrderTab = e.target.getAttribute('data-tab');

    const ordersWrap = document.getElementById('orders-table-wrap');
    const itemsWrap = document.getElementById('order-items-table-wrap');

    if (activeOrderTab === 'Orders') {
      if (ordersWrap) ordersWrap.style.display = '';
      if (itemsWrap) itemsWrap.style.display = 'none';
    } else {
      if (ordersWrap) ordersWrap.style.display = 'none';
      if (itemsWrap) itemsWrap.style.display = '';
    }
    applyFiltersAndRender();
  });
});

// Status Pill Filters for Orders
document.querySelectorAll('#status-pill-filters .cat-pill').forEach(btn => {
  btn.addEventListener('click', e => {
    document.querySelectorAll('#status-pill-filters .cat-pill').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    activeStatusFilter = e.target.getAttribute('data-status') || '';
    applyFiltersAndRender();
  });
});

// Status Pill Filters for Items
document.querySelectorAll('#items-status-pill-filters .cat-pill').forEach(btn => {
  btn.addEventListener('click', e => {
    document.querySelectorAll('#items-status-pill-filters .cat-pill').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    activeItemsStatusFilter = e.target.getAttribute('data-status') || '';
    applyFiltersAndRender();
  });
});

document.getElementById('search-input')?.addEventListener('input', () => applyFiltersAndRender());
document.getElementById('items-search-input')?.addEventListener('input', () => applyFiltersAndRender());

// Event listeners for auto discount calculations
document.getElementById('auto-discount-toggle')?.addEventListener('change', handleAutoDiscount);
document.querySelector('#order-form input[name="paid_amount"]')?.addEventListener('input', handleAutoDiscount);

loadOrders();
