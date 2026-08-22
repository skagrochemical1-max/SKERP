/* Injects sidebar + topbar into every page dynamically   */
(function() {
  localStorage.setItem('sidebar_pinned', 'true');

  const storedTheme = localStorage.getItem('theme');
  const initialTheme = storedTheme === 'dark' || storedTheme === 'light' ? storedTheme : 'dark';
  document.documentElement.setAttribute('data-theme', initialTheme);
})();

const SIDEBAR_HTML = `
<aside class="sidebar" id="sidebar">
  <div class="sidebar-header">
    <div class="sidebar-logo">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:20px;height:20px"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
    </div>
    <div class="sidebar-brand"><h1>AgroChem ERP</h1><span>Pesticide Management</span></div>
    <button class="sidebar-toggle-btn" id="sidebar-toggle-btn" type="button" aria-label="Toggle sidebar" title="Toggle sidebar">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></svg>
    </button>
  </div>
  <nav class="sidebar-nav">
    <div class="nav-section-label">Main</div>
    <a href="dashboard.html" class="nav-item" data-page="dashboard.html" data-tooltip="Dashboard"><span class="nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg></span><span class="nav-label">Dashboard</span></a>
    
    <div class="nav-section-label">Masters</div>
    <a href="products.html" class="nav-item" data-page="products.html" data-tooltip="Products"><span class="nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg></span><span class="nav-label">Product Master</span></a>
    <a href="inventory.html" class="nav-item" data-page="inventory.html" data-tooltip="Inventory"><span class="nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg></span><span class="nav-label">Inventory Items</span></a>
    <a href="clients.html" class="nav-item" data-page="clients.html" data-tooltip="Clients"><span class="nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></span><span class="nav-label">Clients / Farmers</span></a>
    <a href="suppliers.html" class="nav-item" data-page="suppliers.html" data-tooltip="Suppliers"><span class="nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg></span><span class="nav-label">Suppliers</span></a>

    <div class="nav-section-label">Transactions</div>
    <a href="purchases.html" class="nav-item" data-page="purchases.html" data-tooltip="Purchases"><span class="nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/></svg></span><span class="nav-label">Purchase Entry</span></a>
    <a href="orders.html" class="nav-item" data-page="orders.html" data-tooltip="Sales Orders"><span class="nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg></span><span class="nav-label">Sales Orders</span></a>
    <a href="formulations.html" class="nav-item" data-page="formulations.html" data-tooltip="Formulations"><span class="nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/></svg></span><span class="nav-label">Production / Batch</span></a>
    <a href="daily-transactions.html" class="nav-item" data-page="daily-transactions.html" data-tooltip="Daily Stock Usage"><span class="nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/></svg></span><span class="nav-label">Daily Stock Usage</span></a>

    <div class="nav-section-label">Accounts & Reports</div>
    <a href="exports.html" class="nav-item" data-page="exports.html" data-tooltip="Exports"><span class="nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></span><span class="nav-label">Data Backup & Exports</span></a>

  </nav>
  <div class="sidebar-footer"></div>
</aside>
<div class="sidebar-overlay" id="sidebar-overlay"></div>`;

const TOPBAR_HTML = (title, breadcrumb) => `
<header class="topbar" id="topbar">
  <div class="topbar-left">
    <button class="sidebar-toggle-btn sidebar-toggle-mobile" id="sidebar-toggle-mobile-btn" type="button" aria-label="Toggle sidebar" title="Toggle sidebar">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></svg>
    </button>
    <div class="topbar-mobile-brand">
      <div class="topbar-logo">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width: 15px; height: 15px;"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
      </div>
      <span>AgroChem ERP</span>
    </div>
    <div class="topbar-brand">
      <span class="topbar-brand-name">AgroChem ERP</span>
    </div>

    <div class="topbar-divider"></div>
    <div class="topbar-breadcrumb">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px;opacity:0.5;flex-shrink:0"><polyline points="9 18 15 12 9 6"/></svg>
      <span>${title}</span>
    </div>
  </div>
  <div class="topbar-right">
    <a class="btn btn-ghost topbar-invoice-btn" href="/Invoice Builder/index.html">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;color:var(--accent);"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
      <span class="btn-text">Invoice Builder</span>
    </a>
    <button class="theme-toggle-btn" id="theme-toggle-btn" type="button" aria-label="Switch to dark mode" title="Switch to dark mode">
      <svg class="theme-icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
      <svg class="theme-icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9z"/></svg>
    </button>
    <div class="dropdown">
      <button class="user-avatar-btn" id="user-avatar-btn" type="button" aria-haspopup="menu" aria-expanded="false">
        <div class="user-avatar">AP</div>
        <span class="user-name">Admin</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;color:var(--text-muted)"><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      <div class="dropdown-menu" id="user-dropdown" role="menu" aria-label="User menu">
        <button class="dropdown-item" id="user-profile-btn" type="button" role="menuitem" onclick="window.location.href='profile.html'">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> Profile
        </button>
        <div class="dropdown-divider"></div>
        <button class="dropdown-item dropdown-item-danger" id="user-logout-btn" type="button" role="menuitem">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg> Logout
        </button>
      </div>
    </div>
  </div>
</header>`;

const CONFIRM_MODAL = `
<div class="modal-overlay" id="confirm-modal">
  <div class="modal" style="max-width:420px">
    <div class="modal-header"><span class="modal-title">Confirm Action</span></div>
    <div class="modal-body"><p id="confirm-message">Are you sure?</p></div>
    <div class="modal-footer">
      <button class="btn btn-secondary" id="confirm-cancel-btn">Cancel</button>
      <button class="btn btn-danger" id="confirm-ok-btn">Confirm</button>
    </div>
  </div>
</div>
<div id="toast-container"></div>
<div class="spinner-overlay" id="spinner-overlay"><div class="spinner"></div></div>
`;

const PROFILE_MODAL = `
<div class="modal-overlay" id="profile-modal">
  <div class="modal" style="max-width:460px">
    <div class="modal-header">
      <span class="modal-title">Profile</span>
      <button class="modal-close" type="button" onclick="APP.closeModal('profile-modal')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="modal-body">
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:18px">
        <div class="user-avatar" style="width:52px;height:52px;font-size:18px">AP</div>
        <div>
          <div style="font-size:18px;font-weight:800;color:var(--text-primary)">Admin</div>
          <div style="font-size:13px;color:var(--text-secondary)">System administrator</div>
        </div>
      </div>
      <div style="display:grid;gap:12px">
        <div style="padding:14px 16px;border:1px solid var(--border);border-radius:var(--radius);background:var(--bg)">
          <div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--text-muted);margin-bottom:4px">Workspace</div>
          <div style="font-size:14px;font-weight:600;color:var(--text-primary)">AgroChem ERP</div>
        </div>
        <div style="padding:14px 16px;border:1px solid var(--border);border-radius:var(--radius);background:var(--bg)">
          <div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--text-muted);margin-bottom:4px">Access</div>
          <div style="font-size:14px;font-weight:600;color:var(--text-primary)">All business modules enabled</div>
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" type="button" onclick="APP.closeModal('profile-modal')">Close</button>
      <button class="btn btn-primary" type="button" id="profile-go-dashboard-btn">Open Dashboard</button>
    </div>
  </div>
</div>`;

const BOTTOM_NAV_HTML = `
<nav class="mobile-bottom-nav">
  <a href="dashboard.html" class="bottom-nav-item" data-bottom-page="dashboard.html">
    <span class="bottom-nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg></span>
    <span class="bottom-nav-label">Home</span>
  </a>
  <a href="products.html" class="bottom-nav-item" data-bottom-page="products.html">
    <span class="bottom-nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg></span>
    <span class="bottom-nav-label">Products</span>
  </a>
  <a href="inventory.html" class="bottom-nav-item" data-bottom-page="inventory.html">
    <span class="bottom-nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg></span>
    <span class="bottom-nav-label">Stock</span>
  </a>
  <a href="orders.html" class="bottom-nav-item" data-bottom-page="orders.html">
    <span class="bottom-nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg></span>
    <span class="bottom-nav-label">Orders</span>
  </a>
  <button type="button" class="bottom-nav-item" onclick="toggleSidebar()">
    <span class="bottom-nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="6" height="6" rx="1.5"/><rect x="14" y="4" width="6" height="6" rx="1.5"/><rect x="4" y="14" width="6" height="6" rx="1.5"/><rect x="14" y="14" width="6" height="6" rx="1.5"/></svg></span>
    <span class="bottom-nav-label">Pages</span>
  </button>
</nav>
`;

function ensureSingletonMarkup(id, html) {
  const matches = document.querySelectorAll(`#${id}`);
  if (matches.length > 1) {
    matches.forEach((node, index) => {
      if (index > 0) node.remove();
    });
  }

  if (!document.getElementById(id)) {
    document.body.insertAdjacentHTML('beforeend', html);
  }
}

function setActiveBottomNav() {
  const path = window.location.pathname.split('/').pop() || 'dashboard.html';
  document.querySelectorAll('.bottom-nav-item').forEach(item => {
    const href = item.getAttribute('href') || '';
    item.classList.toggle('active', href === path);
  });
}

function injectLayout(title, breadcrumb) {
  const layout = document.getElementById('app-layout');
  if (!layout) return;
  layout.insertAdjacentHTML('afterbegin', SIDEBAR_HTML + TOPBAR_HTML(title, breadcrumb) + BOTTOM_NAV_HTML);
  ensureSingletonMarkup('confirm-modal', CONFIRM_MODAL);
  ensureSingletonMarkup('profile-modal', PROFILE_MODAL);
  ensureSingletonMarkup('toast-container', '<div id="toast-container"></div>');
  ensureSingletonMarkup('spinner-overlay', '<div class="spinner-overlay" id="spinner-overlay"><div class="spinner"></div></div>');
  
  // Update element references after layout is injected
  if (typeof updateSidebarReferences === 'function') updateSidebarReferences();
  
  // Initialize sidebar and navigation after layout is injected
  if (typeof applySidebarState === 'function') applySidebarState();
  if (typeof setActiveNav === 'function') setActiveNav();
  if (typeof setActiveBottomNav === 'function') setActiveBottomNav();
  if (typeof setupNavClickHandlers === 'function') setupNavClickHandlers();
  if (typeof restoreSidebarScroll === 'function') restoreSidebarScroll();
  
  // Re-attach event listeners
  if (typeof reattachLayoutEvents === 'function') reattachLayoutEvents();
}

window.LAYOUT = { injectLayout };
