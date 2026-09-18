/* dashboard.js */
let revenueChart = null;
let categoryChart = null;

function updatePageDebug(text, color) {
  const el = document.getElementById('debug-page-status');
  if (el) {
    el.textContent = 'Page: ' + text;
    if (color) el.style.color = color;
  }
}

async function loadDashboard() {
  console.log('Loading dashboard...');
  updatePageDebug('Initializing...', '#10B981');
  
  try {
    renderDashboardSkeleton();
    await DB.initDB();
    
    // const res = await fetch('/api/dashboard/stats');
    // if (!res.ok) throw new Error('Failed to fetch dashboard stats');
    // const stats = await res.json();
    
    const { data: revData, error: revErr } = await window.dbClient.from('orders').select('total_amount').eq('status', 'Delivered');
    if (revErr) throw revErr;
    const revenue = revData.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);

    const { count: activeOrders, error: actErr } = await window.dbClient.from('orders').select('id', { count: 'exact', head: true }).neq('status', 'Delivered');
    if (actErr) throw actErr;

    const { data: recentActivities, error: recErr } = await window.dbClient.from('orders')
      .select('order_no, client_name, date, total_amount, status')
      .order('date', { ascending: false })
      .limit(5);
    if (recErr) throw recErr;

    const { data: invData, error: invErr } = await window.dbClient.from('inventory_items').select('id, name, unit, reorder_level, stock, category, item_subtype');
    if (invErr) throw invErr;

    const { data: batches } = await window.dbClient.from('stock_batches').select('item_id, current_qty, purchase_price').eq('item_type', 'Inventory');
    const costMap = {};
    if (batches) {
      batches.forEach(b => {
        if (!costMap[b.item_id]) costMap[b.item_id] = { totalCost: 0, totalQty: 0 };
        const qty = parseFloat(b.current_qty) || 0;
        const price = parseFloat(b.purchase_price) || 0;
        if (qty > 0) {
          costMap[b.item_id].totalCost += (qty * price);
          costMap[b.item_id].totalQty += qty;
        }
      });
    }
    
    window.dashboardInventoryData = (invData || []).map(p => {
       const stock = parseFloat(p.stock || 0);
       let cost = 0;
       if (costMap[p.id] && costMap[p.id].totalQty > 0) {
         cost = costMap[p.id].totalCost / costMap[p.id].totalQty;
       }
       return { ...p, stock, val: stock * cost };
    });
    
    const stockAlerts = window.dashboardInventoryData
      .filter(p => {
         const itemType = String(p.item_subtype || p.category || 'Raw Material').trim();
         const isTech = itemType.toLowerCase() === 'technical';
         const reorder = parseFloat(p.reorder_level || 0);
         const threshold = reorder > 0 ? reorder : (isTech ? 7 : 50);
         return p.stock <= threshold;
      })
      .map(p => {
         const itemType = String(p.item_subtype || p.category || 'Raw Material').trim();
         const isTech = itemType.toLowerCase() === 'technical';
         const reorder = parseFloat(p.reorder_level || 0);
         return { 
           ...p, 
           type: itemType,
           reorder_level: reorder > 0 ? reorder : (isTech ? 7 : 50)
         };
      })
      .sort((a, b) => a.stock - b.stock);

    setTimeout(() => renderInventoryValueSection(), 0);

    const stats = {
      kpis: { revenue, activeOrders: activeOrders || 0 },
      recentActivities,
      stockAlerts
    };
    
    // 1. Render KPIs
    const kpis = stats.kpis || {};
    
    const kpiRevenue = document.getElementById('kpi-revenue');
    if (kpiRevenue) kpiRevenue.textContent = UTILS.fmtCurrency(kpis.revenue || 0);
    
    const kpiOrders = document.getElementById('kpi-orders');
    if (kpiOrders) kpiOrders.textContent = kpis.activeOrders || 0;
    
    const badge = document.getElementById('pending-badge');
    if (badge) { 
      badge.textContent = kpis.activeOrders || 0; 
      badge.style.display = kpis.activeOrders ? '' : 'none'; 
    }

    // 2. Render Charts
    

    // 3. Render Activities & Alerts
    renderRecentActivities(stats.recentActivities || []);
    renderStockAlerts(stats.stockAlerts || []);
    
    console.log('Dashboard: All data loaded successfully');
    updatePageDebug('Ready', '#10B981');
    
  } catch (err) {
    console.error('Dashboard loadDashboard failed:', err);
    updatePageDebug('FAILED: ' + (err.message || 'Unknown error'), '#EF4444');
    APP.showToast('Failed to load dashboard: ' + err.message, 'error');
  }
}

function renderDashboardSkeleton() {
  ['kpi-revenue', 'kpi-orders', ].forEach(id => UTILS.setSkeletonText(id, 'w-50', true));
  UTILS.renderListSkeleton('recent-orders-list', 5);
  UTILS.renderListSkeleton('stock-alerts-list', 4);
}

function renderRevenueChart(data) {
  const ctx = document.getElementById('revenue-chart');
  if (!ctx) return;
  
  UTILS.destroyChart(revenueChart);
  const labels = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  
  revenueChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{ label: 'Revenue (₹)', data, backgroundColor: 'rgba(124,58,237,0.15)', borderColor: '#7C3AED', borderWidth: 2, borderRadius: 8 }]
    },
    options: { responsive: true, plugins: { legend: { display: false } } }
  });
}

function renderCategoryChart(data) {
  const ctx = document.getElementById('category-chart');
  if (!ctx) return;
  
  UTILS.destroyChart(categoryChart);
  
  const labels = data.map(d => d.category || 'Unknown').filter(Boolean);
  const values = data.map(d => parseFloat(d.val || 0));
  
  categoryChart = new Chart(ctx, {
    type: 'doughnut',
    data: { 
      labels: labels.length > 0 ? labels : ['No Data'], 
      datasets: [{ 
        data: values.length > 0 ? values : [1], 
        backgroundColor: ['#7C3AED','#10B981','#10B981','#EF4444','#3B82F6','#EC4899'] 
      }] 
    },
    options: { responsive: true, cutout: '70%', plugins: { legend: { display: labels.length > 0 } } }
  });
}

function renderRecentActivities(activities) {
  const el = document.getElementById('recent-orders-list');
  if (!el) return;
  
  if (!activities || activities.length === 0) { 
    el.innerHTML = '<p class="text-muted text-sm">No recent orders.</p>'; 
    return; 
  }
  
  el.innerHTML = activities.map(o => {
    return `<div class="recent-order-item" style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--border);">
      <div class="recent-order-info" style="font-size: 13.5px; color: var(--text-primary);">
        <strong>${o.order_no || 'N/A'}</strong> - ${o.client_name || 'Guest'}
        <p>${UTILS.fmtDate(o.date)} • ${UTILS.fmtCurrency(o.total_amount)}</p>
      </div>
      <div>${UTILS.statusBadge(o.status)}</div>
    </div>`;
  }).join('');
}

function renderStockAlerts(alerts) {
  const el = document.getElementById('stock-alerts-list');
  if (!el) return;
  
  if (!alerts || alerts.length === 0) { 
    el.innerHTML = '<p class="text-success text-sm">All stock levels healthy!</p>'; 
    return; 
  }
  
  el.innerHTML = alerts.map(p => {
    const isOutOfStock = parseFloat(p.stock || 0) === 0;
    const statusBadge = isOutOfStock
      ? '<span class="badge badge-gray" style="font-size: 11px;">Out of Stock</span>'
      : '<span class="badge badge-danger" style="font-size: 11px;">Low</span>';

    return `<div class="stock-alert-item" style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--border);">
      <div class="stock-alert-content" style="display: flex; flex-direction: column; gap: 3px;">
        <div class="stock-alert-name" style="font-weight: 600; font-size: 13.5px; color: var(--text-primary);">
          ${p.name || 'Unknown'} 
          <span class="badge badge-purple" style="font-size: 9.5px; padding: 2px 7px; margin-left: 6px; text-transform: uppercase;">${p.type || 'Raw Material'}</span>
        </div>
        <div class="stock-alert-meta" style="font-size: 12px; color: var(--text-muted); font-weight: 500;">
          ${parseFloat(p.stock || 0).toFixed(2)} ${p.unit || ''}
        </div>
      </div>
      <div>${statusBadge}</div>
    </div>`;
  }).join('');
}

loadDashboard();
function renderInventoryValueSection() {
  const data = window.dashboardInventoryData || [];
  
  // Aggregate totals by category
  const categoryTotals = {};
  let totalValue = 0;
  
  data.forEach(item => {
    const cat = item.category || 'Other';
    const val = item.val || 0;
    if (!categoryTotals[cat]) categoryTotals[cat] = 0;
    categoryTotals[cat] += val;
    totalValue += val;
  });
  
  window.dashboardInventoryCategoryTotals = categoryTotals;
  window.dashboardInventoryTotal = totalValue;
  
  const select = document.getElementById('dashboard-inventory-filter');
  if (select && !select.dataset.listenerAdded) {
    select.addEventListener('change', updateInventoryValueDisplay);
    select.dataset.listenerAdded = 'true';
  }
  
  updateInventoryValueDisplay();
}

function updateInventoryValueDisplay() {
  const select = document.getElementById('dashboard-inventory-filter');
  const typeLabel = document.getElementById('dashboard-inventory-selected-type');
  const valDisplay = document.getElementById('dashboard-inventory-total-value');
  const breakdownContainer = document.getElementById('dashboard-inventory-breakdown');
  
  if (!select || !typeLabel || !valDisplay) return;
  
  const selected = select.value;
  
  if (selected === 'All') {
    typeLabel.textContent = 'Selected Type: All Inventory';
    valDisplay.textContent = UTILS.fmtCurrency(window.dashboardInventoryTotal || 0);
    
    // Build breakdown table
    if (breakdownContainer) {
      const cats = Object.entries(window.dashboardInventoryCategoryTotals || {});
      if (cats.length > 0) {
        let html = '<table class="data-table" style="margin-top: 16px;"><thead><tr><th>Inventory Type</th><th style="text-align: right;">Total Value</th></tr></thead><tbody>';
        cats.sort((a,b) => b[1] - a[1]).forEach(([c, v]) => {
          html += '<tr><td>' + c + '</td><td style="text-align: right;">' + UTILS.fmtCurrency(v) + '</td></tr>';
        });
        html += '<tr style="font-weight: 700;"><td>Total Inventory</td><td style="text-align: right;">' + UTILS.fmtCurrency(window.dashboardInventoryTotal || 0) + '</td></tr>';
        html += '</tbody></table>';
        breakdownContainer.innerHTML = html;
        breakdownContainer.style.display = 'block';
      } else {
        breakdownContainer.style.display = 'none';
      }
    }
  } else {
    typeLabel.textContent = 'Selected Type: ' + selected;
    const val = (window.dashboardInventoryCategoryTotals || {})[selected] || 0;
    valDisplay.textContent = UTILS.fmtCurrency(val);
    if (breakdownContainer) {
      breakdownContainer.style.display = 'none';
    }
  }
}
