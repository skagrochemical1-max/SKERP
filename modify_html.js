const fs = require('fs');
let content = fs.readFileSync('pages/production.html', 'utf8');

// Replacements
content = content.replace(/<title>.*<\/title>/, '<title>AgroChem ERP — Production</title>');
content = content.replace(/assets\/js\/orders\.js/g, 'assets/js/production.js');
content = content.replace(/LAYOUT\.injectLayout\('Orders', 'Orders'\)/, "LAYOUT.injectLayout('Production', 'Transactions')");
content = content.replace(/Orders Dashboard/g, 'Production Dashboard');
content = content.replace(/Manage and track customer sales orders\./g, 'Record production batches and sync inventory.');

// Replace Tabs
const tabsRegex = /<div class="tabs"[^>]*>[\s\S]*?<\/div>/;
content = content.replace(tabsRegex, '');

// Simplify search and filters
content = content.replace(/<div class="table-filters cat-pill-filters" id="status-pill-filters">[\s\S]*?<\/div>/, '');

// Table Headers
content = content.replace(/<th><input type="checkbox"><\/th><th>Order No<\/th><th>Client<\/th><th>Date<\/th><th>Total<\/th><th>Paid<\/th><th>Balance<\/th><th>Status<\/th><th>Actions<\/th>/,
'<th><input type="checkbox"></th><th>Batch No</th><th>Product</th><th>Formula</th><th>Date</th><th>Qty Produced</th><th>Actions</th>');

// Replace order items table wrap entirely
content = content.replace(/<div class="table-wrap data-table-wrap-mobile" id="order-items-table-wrap"[\s\S]*?<\/div>\s*<\/div>\s*<\/main>/, '</main>');

// Update Modals
content = content.replace(/<span class="modal-title" id="modal-title">New Order<\/span>/, '<span class="modal-title" id="modal-title">New Production Batch</span>');
content = content.replace(/APP\.closeModal\('order-modal'\)/g, "APP.closeModal('production-modal')");
content = content.replace(/id="order-modal"/g, 'id="production-modal"');
content = content.replace(/id="order-form"/g, 'id="production-form"');
content = content.replace(/id="orders-table"/g, 'id="production-table"');
content = content.replace(/id="search-input"/g, 'id="production-search-input"');
content = content.replace(/id="orders-table-wrap"/g, 'id="production-table-wrap"');

// Update Form
content = content.replace(/<!-- Section 1: Client & General -->[\s\S]*?<!-- Section 2: Products -->/, 
`<!-- Section 1: General -->
        <section class="form-section">
          <h3 class="form-section-title">Production Info</h3>
          <p class="form-section-desc">Select product and quantity produced.</p>
          <div class="form-row">
            <div class="form-group form-col-half">
              <label class="form-label">Product *</label>
              <select class="form-input" name="product_id" id="product-select" required>
                <option value="">Select Product</option>
              </select>
            </div>
            <div class="form-group form-col-half">
              <label class="form-label">Batch No</label>
              <input class="form-input" name="batch_no" type="text" placeholder="Auto-generated or custom">
            </div>
            <div class="form-group form-col-half">
              <label class="form-label">Formula Name</label>
              <input class="form-input" name="formula_name" type="text" placeholder="e.g. Standard 50% EC">
            </div>
            <div class="form-group form-col-half">
              <label class="form-label">Quantity Produced *</label>
              <input class="form-input" name="quantity_produced" type="number" min="0.01" step="0.01" placeholder="0.0" required>
            </div>
            <div class="form-group form-col-half">
              <label class="form-label">Date</label>
              <input class="form-input" name="date" type="date" required>
            </div>
          </div>
        </section>
        <!-- Section 2: Ingredients -->`);

// Update Form Section 2
content = content.replace(/<section class="form-section">[\s\S]*?<h3 class="form-section-title">Order Items<\/h3>[\s\S]*?<\/section>/,
`<section class="form-section">
  <h3 class="form-section-title">Raw Materials Used</h3>
  <p class="form-section-desc">Add inventory ingredients consumed in this batch. Stock will be automatically deducted.</p>
  <div class="line-items-container">
    <table class="line-items-table" style="margin-bottom:8px">
      <thead><tr>
        <th style="width:50%">Raw Material (Inventory)</th>
        <th style="width:30%">Qty Used</th>
        <th style="width:10%"></th>
      </tr></thead>
      <tbody id="ingredients-tbody"></tbody>
    </table>
  </div>
  <button type="button" class="add-line-btn" style="margin-top: 10px;" onclick="addIngredientRow()">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Add Raw Material
  </button>
  <div class="form-group form-col-full" style="margin-top:20px;">
    <label class="form-label">Notes</label>
    <textarea class="form-input" name="notes" rows="2" placeholder="Any production notes"></textarea>
  </div>
</section>`);

content = content.replace(/<button class="btn btn-primary" onclick="openOrderModal\(\)">/, '<button class="btn btn-primary" onclick="openProductionModal()">');
content = content.replace(/New Order/, 'New Entry');

fs.writeFileSync('pages/production.html', content, 'utf8');
