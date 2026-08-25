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

      const { data: invData, error: invErr } = await window.dbClient.from('inventory_items').select('id, name, unit, reorder_level, stock, category');
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
           const threshold = parseFloat(p.reorder_level || 0);
           return p.stock <= threshold;
        })
        .map(p => ({ ...p, type: p.category || 'Item' }))
        .sort((a, b) => p.stock - b.stock);

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
    el.innerHTML = '<p class="text-muted text-sm">No orders yet.</p>'; 
    return; 
  }
  
  el.innerHTML = activities.map(o => {
    return `<div class="activity-item">
      <div class="activity-dot ${o.status === 'Delivered' ? 'green' : 'yellow'}"></div>
      <div class="activity-text">
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
    const threshold = parseFloat(p.reorder_level || 0);
    return `<div class="stock-alert-item">
      <div class="stock-alert-content">
        <div class="stock-alert-name">${p.name || 'Unknown'} <span class="badge ${p.type === 'Catalog' ? 'badge-purple' : 'badge-info'}" style="font-size: 9px; padding: 2px 6px; margin-left: 4px;">${p.type || 'Item'}</span></div>
        <div class="stock-alert-meta">${parseFloat(p.stock || 0).toFixed(1)} / ${threshold} ${p.unit || ''}</div>
      </div>
      <span class="badge badge-danger">Low</span>
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
  
  // Populate dropdown if not already populated
  const select = document.getElementById('dashboard-inventory-filter');
  if (select && select.options.length <= 1) {
    const categories = Object.keys(categoryTotals).sort();
    categories.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      select.appendChild(opt);
    });
    
    // Add event listener to re-render when dropdown changes
    select.addEventListener('change', updateInventoryValueDisplay);
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
