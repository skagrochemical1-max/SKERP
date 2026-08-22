/* formulations.js */
let allFormulations = [];
let allProducts = [];
let inventoryItems = [];
let editingFormId = null;
let ingredientRows = [];
let activeProductionFormulation = null;
let formulationSummary = null;
let recalculationTimer = null;
let rowSequence = 0;

const FORMULATION_DECIMALS = 4;
const ROUND_TOLERANCE = 0.0001;

function updatePageDebug(text, color) {
  const el = document.getElementById('debug-page-status');
  if (el) {
    el.textContent = `Page: ${text}`;
    if (color) el.style.color = color;
  }
}

function roundTo(value, decimals = FORMULATION_DECIMALS) {
  const factor = 10 ** decimals;
  return Math.round(((parseFloat(value) || 0) + Number.EPSILON) * factor) / factor;
}

function parseNumber(value) {
  if (value === null || value === undefined || value === '') return 0;
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isNearlyEqual(left, right, tolerance = ROUND_TOLERANCE) {
  return Math.abs((parseFloat(left) || 0) - (parseFloat(right) || 0)) <= tolerance;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getFormulationName(row) {
  return row?.product_name || row?.name || row?.display_name || `Formulation ${row?.id || ''}`.trim();
}

function getBatchSize() {
  return parseNumber(document.getElementById('base-volume-input')?.value);
}

function getBatchUnit() {
  return document.getElementById('master-unit-sel')?.value || 'L';
}

function getIngredientRowById(rowId) {
  return ingredientRows.find(row => String(row.row_id) === String(rowId));
}

function getInventoryItemById(productId) {
  return inventoryItems.find(item => String(item.id) === String(productId));
}

function createIngredientRow(prefill = {}) {
  rowSequence += 1;
  const inferredMode = prefill.entry_mode
    || (parseNumber(prefill.percentage) > 0 ? 'percentage' : '')
    || (parseNumber(prefill.quantity) > 0 ? 'quantity' : '')
    || 'percentage';

  return {
    row_id: prefill.row_id || `row-${rowSequence}`,
    product_id: prefill.product_id ?? '',
    product_name: prefill.product_name ?? '',
    percentage: parseNumber(prefill.percentage),
    quantity: parseNumber(prefill.quantity),
    unit: prefill.unit ?? '',
    cost_per_unit: parseNumber(prefill.cost_per_unit),
    total_cost: parseNumber(prefill.total_cost ?? prefill.cost),
    entry_mode: inferredMode,
    duplicate_name: false
  };
}

function getIngredientOptions() {
  return inventoryItems
    .map(item => `<option value="${item.id}">${escapeHtml(item.name)} (${escapeHtml(item.unit || '')})</option>`)
    .join('');
}

function getActiveIngredientRows() {
  return ingredientRows.filter(row => String(row.product_id || '').trim());
}

function formatQty(value) {
  return `${roundTo(value).toFixed(FORMULATION_DECIMALS)}`;
}

function computeQuantityForBatch(row, batchSize) {
  const percentage = parseNumber(row.percentage);
  const quantity = parseNumber(row.quantity);
  if (row.entry_mode === 'quantity') return quantity;
  if (batchSize <= 0) return quantity;
  return roundTo((percentage / 100) * batchSize);
}

function computePercentageForBatch(row, batchSize) {
  const percentage = parseNumber(row.percentage);
  const quantity = parseNumber(row.quantity);
  if (row.entry_mode === 'percentage') return percentage;
  if (batchSize <= 0) return percentage;
  return roundTo((quantity / batchSize) * 100);
}

function scheduleRecalculation() {
  clearTimeout(recalculationTimer);
  recalculationTimer = setTimeout(() => {
    recalculateFormulationState();
  }, 60);
}

function handleBatchInputChange() {
  scheduleRecalculation();
}

function updateAllIngredients() {
  scheduleRecalculation();
}

function renderIngredientRows() {
  const tbody = document.getElementById('ingredients-container');
  if (!tbody) return;

  if (!ingredientRows.length) {
    ingredientRows = [createIngredientRow(), createIngredientRow()];
  }

  tbody.innerHTML = ingredientRows.map(row => `
    <tr class="ingredient-row" data-row-id="${row.row_id}">
      <td>
        <select
          class="form-select search-select ${row.duplicate_name ? 'is-warning' : ''}"
          data-autocomplete
          data-field="product_id"
          onchange="updateIngredientField('${row.row_id}', 'product_id', this.value)"
        >
          <option value="">Select ingredient</option>
          ${getIngredientOptions()}
        </select>
      </td>
      <td>
        <input
          class="form-input"
          data-field="percentage"
          type="number"
          min="0"
          step="0.0001"
          oninput="updateIngredientField('${row.row_id}', 'percentage', this.value)"
        >
      </td>
      <td>
        <input
          class="form-input"
          data-field="quantity"
          type="number"
          min="0"
          step="0.0001"
          oninput="updateIngredientField('${row.row_id}', 'quantity', this.value)"
        >
      </td>
      <td>
        <input
          class="form-input"
          data-field="unit"
          type="text"
          oninput="updateIngredientField('${row.row_id}', 'unit', this.value)"
        >
      </td>
      <td>
        <input
          class="form-input"
          data-field="cost_per_unit"
          type="number"
          min="0"
          step="0.0001"
          oninput="updateIngredientField('${row.row_id}', 'cost_per_unit', this.value)"
        >
      </td>
      <td class="ingredient-or-cell">
        <div data-field="total_cost_display" style="font-weight:700">${UTILS.fmtCurrency(0)}</div>
        <div data-field="entry_mode_hint" style="font-size:11px;color:var(--text-muted)">By %</div>
      </td>
      <td class="ingredient-or-cell">
        <button type="button" class="action-btn delete" onclick="removeIngredientRow('${row.row_id}')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
        </button>
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('.search-select').forEach(select => {
    const tr = select.closest('tr');
    const row = getIngredientRowById(tr?.dataset.rowId);
    if (row) select.value = String(row.product_id || '');
  });

  setTimeout(() => UTILS.initAllAutocompleteSelects(), 10);
  recalculateFormulationState();
}

function syncRenderedRows() {
  ingredientRows.forEach(row => {
    const tr = document.querySelector(`tr[data-row-id="${row.row_id}"]`);
    if (!tr) return;

    const select = tr.querySelector('[data-field="product_id"]');
    const percentageInput = tr.querySelector('[data-field="percentage"]');
    const quantityInput = tr.querySelector('[data-field="quantity"]');
    const unitInput = tr.querySelector('[data-field="unit"]');
    const cpuInput = tr.querySelector('[data-field="cost_per_unit"]');
    const totalCostDisplay = tr.querySelector('[data-field="total_cost_display"]');
    const modeHint = tr.querySelector('[data-field="entry_mode_hint"]');

    if (select && document.activeElement !== select) {
      select.value = String(row.product_id || '');
      select.classList.toggle('is-warning', !!row.duplicate_name);
    }

    if (percentageInput && document.activeElement !== percentageInput) {
      percentageInput.value = formatQty(row.percentage);
    }

    if (quantityInput && document.activeElement !== quantityInput) {
      quantityInput.value = formatQty(row.quantity);
    }

    if (unitInput && document.activeElement !== unitInput) {
      unitInput.value = row.unit || '';
    }

    if (cpuInput && document.activeElement !== cpuInput) {
      cpuInput.value = formatQty(row.cost_per_unit);
    }

    if (totalCostDisplay) {
      totalCostDisplay.textContent = UTILS.fmtCurrency(row.total_cost);
    }

    if (modeHint) {
      modeHint.textContent = row.entry_mode === 'quantity' ? 'By Qty' : 'By %';
    }
  });
}

function updateIngredientField(rowId, key, value) {
  const row = getIngredientRowById(rowId);
  if (!row) return;

  if (key === 'product_id') {
    row.product_id = value;
    const item = getInventoryItemById(value);
    row.product_name = item?.name || '';
    row.unit = item?.unit || row.unit || getBatchUnit();
    row.cost_per_unit = parseNumber(item?.purchase_price || row.cost_per_unit);
  } else if (key === 'percentage') {
    row.percentage = Math.max(0, parseNumber(value));
    row.entry_mode = 'percentage';
  } else if (key === 'quantity') {
    row.quantity = Math.max(0, parseNumber(value));
    row.entry_mode = 'quantity';
  } else if (key === 'cost_per_unit') {
    row.cost_per_unit = Math.max(0, parseNumber(value));
  } else if (key === 'unit') {
    row.unit = value;
  }

  scheduleRecalculation();
}

function addIngredientRow(prefill = {}) {
  ingredientRows.push(createIngredientRow(prefill));
  renderIngredientRows();
}

function removeIngredientRow(rowId) {
  ingredientRows = ingredientRows.filter(row => String(row.row_id) !== String(rowId));
  if (!ingredientRows.length) {
    ingredientRows = [createIngredientRow()];
  }
  renderIngredientRows();
}

function buildValidationState(batchSize, activeRows, summary) {
  const errors = [];
  const warnings = [];

  if (batchSize <= 0) {
    errors.push('Batch size must be greater than zero.');
  }

  if (activeRows.length < 2) {
    errors.push('At least 2 ingredients are required.');
  }

  ingredientRows.forEach((row, index) => {
    const hasAnyValue = row.product_id || parseNumber(row.percentage) > 0 || parseNumber(row.quantity) > 0 || parseNumber(row.cost_per_unit) > 0;
    if (hasAnyValue && !row.product_id) {
      errors.push(`Ingredient row ${index + 1} is missing an ingredient name.`);
    }

    if (parseNumber(row.percentage) < 0 || parseNumber(row.quantity) < 0 || parseNumber(row.cost_per_unit) < 0) {
      errors.push(`Ingredient row ${index + 1} cannot contain negative values.`);
    }
  });

  if (summary.totalPercentage > 100 + ROUND_TOLERANCE) {
    errors.push('Total percentage cannot exceed 100%.');
  }

  if (summary.totalQuantity > batchSize + ROUND_TOLERANCE) {
    errors.push('Total quantity cannot exceed the batch size.');
  }

  if (summary.duplicateNames.length) {
    warnings.push(`Duplicate ingredient selected: ${summary.duplicateNames.join(', ')}.`);
  }

  const hasExactTotal = isNearlyEqual(summary.totalPercentage, 100) || isNearlyEqual(summary.totalQuantity, batchSize);
  const canSave = errors.length === 0 && hasExactTotal;

  if (errors.length === 0 && !hasExactTotal) {
    errors.push('Total percentage must equal 100% or total quantity must equal the batch size before saving.');
  }

  return { errors, warnings, canSave: canSave && errors.length === 0 };
}

function renderValidationPanel(errors = [], warnings = []) {
  const panel = document.getElementById('formulation-validation-panel');
  if (!panel) return;

  if (!errors.length && !warnings.length) {
    panel.className = 'formulation-validation-panel';
    panel.innerHTML = '';
    return;
  }

  const items = [
    ...errors.map(message => `<li><strong>Error:</strong> ${escapeHtml(message)}</li>`),
    ...warnings.map(message => `<li><strong>Warning:</strong> ${escapeHtml(message)}</li>`)
  ];

  panel.className = 'formulation-validation-panel has-warning';
  panel.innerHTML = `
    <div style="font-weight:700">Formula validation</div>
    <ul>${items.join('')}</ul>
  `;
}

function refreshSummaryUI(summary, validation) {
  const batchUnit = getBatchUnit();
  const batchSize = getBatchSize();
  const compositionEl = document.getElementById('total-composition-display');
  const compositionUnitEl = document.getElementById('total-composition-unit');
  const countEl = document.getElementById('ingredient-count');
  const totalPctEl = document.getElementById('total-percentage');
  const remainingPctEl = document.getElementById('remaining-percentage');
  const totalQtyEl = document.getElementById('total-quantity');
  const remainingQtyEl = document.getElementById('remaining-quantity');
  const costEl = document.getElementById('total-cost');
  const unitCostEl = document.getElementById('unit-cost');
  const saveBtn = document.getElementById('save-formulation-btn');

  if (compositionEl) compositionEl.textContent = formatQty(summary.totalQuantity);
  if (compositionUnitEl) compositionUnitEl.textContent = batchUnit;
  if (countEl) countEl.textContent = String(summary.activeRows.length);
  if (totalPctEl) totalPctEl.textContent = `${formatQty(summary.totalPercentage)}%`;
  if (remainingPctEl) remainingPctEl.textContent = `${formatQty(summary.remainingPercentage)}%`;
  if (totalQtyEl) totalQtyEl.textContent = `${formatQty(summary.totalQuantity)} ${batchUnit}`;
  if (remainingQtyEl) remainingQtyEl.textContent = `${formatQty(summary.remainingQuantity)} ${batchUnit}`;
  if (costEl) costEl.textContent = UTILS.fmtCurrency(summary.totalCost);
  if (unitCostEl) unitCostEl.textContent = batchSize > 0 ? `${UTILS.fmtCurrency(summary.costPerUnitProduced)}/${batchUnit}` : `${UTILS.fmtCurrency(0)}/${batchUnit}`;
  if (saveBtn) saveBtn.disabled = !validation.canSave;

  renderValidationPanel(validation.errors, validation.warnings);
}

function refreshBalanceIngredientOptions(activeRows) {
  const select = document.getElementById('balance-ingredient-select');
  if (!select) return;

  const current = select.value;
  select.innerHTML = '<option value="">Select ingredient</option>' + activeRows
    .map(row => `<option value="${row.row_id}">${escapeHtml(row.product_name || 'Unnamed Ingredient')}</option>`)
    .join('');

  if (activeRows.some(row => String(row.row_id) === String(current))) {
    select.value = current;
  }
}

function renderBOM(activeRows) {
  const tbody = document.getElementById('bom-container');
  if (!tbody) return;

  if (!activeRows.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-muted text-sm">Add ingredients to generate the BOM.</td></tr>';
    return;
  }

  tbody.innerHTML = activeRows.map(row => `
    <tr>
      <td style="font-weight:600">${escapeHtml(row.product_name || 'Unnamed Ingredient')}</td>
      <td>${formatQty(row.quantity)}</td>
      <td>${escapeHtml(row.unit || getBatchUnit())}</td>
      <td>${formatQty(row.percentage)}%</td>
      <td>${UTILS.fmtCurrency(row.total_cost)}</td>
    </tr>
  `).join('');
}

function recalculateFormulationState() {
  const batchSize = getBatchSize();
  const normalizedNames = new Map();

  ingredientRows = ingredientRows.map(row => {
    const item = getInventoryItemById(row.product_id);
    if (item) {
      row.product_name = item.name;
      row.unit = row.unit || item.unit || getBatchUnit();
      if (!parseNumber(row.cost_per_unit)) {
        row.cost_per_unit = parseNumber(item.purchase_price);
      }
    }

    if (row.entry_mode === 'quantity') {
      row.quantity = roundTo(Math.max(0, parseNumber(row.quantity)));
      row.percentage = batchSize > 0 ? roundTo((row.quantity / batchSize) * 100) : 0;
    } else {
      row.percentage = roundTo(Math.max(0, parseNumber(row.percentage)));
      row.quantity = batchSize > 0 ? roundTo((row.percentage / 100) * batchSize) : 0;
    }

    row.cost_per_unit = roundTo(Math.max(0, parseNumber(row.cost_per_unit)));
    row.total_cost = roundTo(row.quantity * row.cost_per_unit);
    row.duplicate_name = false;

    const normalizedName = String(row.product_name || '').trim().toLowerCase();
    if (normalizedName) {
      if (!normalizedNames.has(normalizedName)) normalizedNames.set(normalizedName, []);
      normalizedNames.get(normalizedName).push(row);
    }

    return row;
  });

  const duplicateNames = [];
  normalizedNames.forEach((rows, key) => {
    if (rows.length > 1) {
      duplicateNames.push(rows[0].product_name || key);
      rows.forEach(row => {
        row.duplicate_name = true;
      });
    }
  });

  const activeRows = getActiveIngredientRows();
  const totalPercentage = roundTo(activeRows.reduce((sum, row) => sum + parseNumber(row.percentage), 0));
  const totalQuantity = roundTo(activeRows.reduce((sum, row) => sum + parseNumber(row.quantity), 0));
  const totalCost = roundTo(activeRows.reduce((sum, row) => sum + parseNumber(row.total_cost), 0));
  const remainingPercentage = roundTo(Math.max(0, 100 - totalPercentage));
  const remainingQuantity = roundTo(Math.max(0, batchSize - totalQuantity));
  const costPerUnitProduced = batchSize > 0 ? roundTo(totalCost / batchSize) : 0;

  formulationSummary = {
    batchSize,
    batchUnit: getBatchUnit(),
    activeRows,
    duplicateNames,
    totalPercentage,
    totalQuantity,
    remainingPercentage,
    remainingQuantity,
    totalCost,
    costPerUnitProduced
  };

  const validation = buildValidationState(batchSize, activeRows, formulationSummary);
  syncRenderedRows();
  refreshSummaryUI(formulationSummary, validation);
  refreshBalanceIngredientOptions(activeRows);
  renderBOM(activeRows);
  return { summary: formulationSummary, validation };
}

function autoBalanceFormula() {
  const { summary, validation } = recalculateFormulationState();
  if (validation.errors.some(message => message.includes('cannot exceed') || message.includes('Batch size'))) {
    APP.showToast('Resolve total overflow or batch size issues before auto-balancing.', 'error');
    return;
  }

  const balanceRowId = document.getElementById('balance-ingredient-select')?.value;
  const row = getIngredientRowById(balanceRowId);
  if (!row) {
    APP.showToast('Select a balancing ingredient first.', 'error');
    return;
  }

  row.entry_mode = 'quantity';
  row.quantity = roundTo(parseNumber(row.quantity) + summary.remainingQuantity);
  recalculateFormulationState();
}

function scaleFormula() {
  const scaleInput = document.getElementById('scale-batch-size');
  const newBatchSize = parseNumber(scaleInput?.value);
  const currentBatchSize = getBatchSize();

  if (newBatchSize <= 0) {
    APP.showToast('Enter a valid new batch size for scaling.', 'error');
    return;
  }

  if (currentBatchSize <= 0) {
    APP.showToast('Current batch size must be valid before scaling.', 'error');
    return;
  }

  ingredientRows = ingredientRows.map(row => {
    const percentage = row.entry_mode === 'quantity'
      ? roundTo((parseNumber(row.quantity) / currentBatchSize) * 100)
      : roundTo(parseNumber(row.percentage));

    return {
      ...row,
      percentage,
      entry_mode: 'percentage'
    };
  });

  document.getElementById('base-volume-input').value = newBatchSize;
  recalculateFormulationState();
  APP.showToast('Formula scaled successfully.', 'success');
}

function getIngredientPayload() {
  return getActiveIngredientRows().map(row => ({
    product_id: parseInt(row.product_id, 10),
    product_name: row.product_name,
    percentage: roundTo(row.percentage),
    quantity: roundTo(row.quantity),
    unit: row.unit || getBatchUnit(),
    cost_per_unit: roundTo(row.cost_per_unit),
    total_cost: roundTo(row.total_cost),
    entry_mode: row.entry_mode || 'percentage'
  }));
}

function resetFormulationBuilder() {
  ingredientRows = [createIngredientRow(), createIngredientRow()];
  formulationSummary = null;
  document.getElementById('form-form')?.reset();
  document.getElementById('base-volume-input').value = 1000;
  document.getElementById('master-unit-sel').value = 'L';
  document.getElementById('scale-batch-size').value = '';
  renderIngredientRows();
}

function renderFormulationsGrid(data) {
  const grid = document.getElementById('form-grid');
  if (!grid) return;

  const info = document.getElementById('total-info');
  if (info) info.textContent = `${data.length} formulation${data.length !== 1 ? 's' : ''}`;

  if (!data.length) {
    grid.innerHTML = '<div style="grid-column:1/-1"><div class="empty-state"><h3>No formulations yet</h3><p>Create your first recipe to start producing batches.</p></div></div>';
    return;
  }

  grid.innerHTML = data.map(row => {
    const ingredientCount = row.ingredients ? row.ingredients.length : 0;
    const totalCost = parseNumber(row.total_cost);
    return `<div class="card" style="min-height:100%">
      <div class="card-body" style="display:flex;flex-direction:column;gap:12px">
        <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start">
          <div>
            <div style="font-size:16px;font-weight:800">${escapeHtml(getFormulationName(row))}</div>
            <div style="font-size:12px;color:var(--text-muted)">${UTILS.fmtDate(row.date)} • ${formatQty(row.batch_size || 0)} ${escapeHtml(row.batch_unit || 'L')}</div>
          </div>
          ${UTILS.statusBadge(row.status || 'Draft')}
        </div>
        <div style="font-size:12px;color:var(--text-muted);line-height:1.6">${escapeHtml(row.notes || row.description || 'No notes provided.')}</div>
        <div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;gap:8px;flex-wrap:wrap">
          <span class="badge badge-gray">${ingredientCount} ingredient${ingredientCount === 1 ? '' : 's'}</span>
          <span class="badge badge-info">${UTILS.fmtCurrency(totalCost)}</span>
          <div class="row-actions">
            ${row.status !== 'Completed' ? `<button class="action-btn produce" onclick="openProduction(${row.id})" title="Produce Batch" style="color:var(--success)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg></button>` : ''}
            <button class="action-btn edit" onclick="openEdit(${row.id})" title="Edit formulation"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
            <button class="action-btn delete" onclick="deleteFormulation(${row.id})" title="Delete"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg></button>
          </div>
        </div>
      </div>
    </div>`;
  }).join('');
}

function filterFormulations() {
  const query = String(document.getElementById('search-input')?.value || '').trim().toLowerCase();
  if (!query) {
    renderFormulationsGrid(allFormulations);
    return;
  }

  const filtered = allFormulations.filter(row => {
    const haystack = [
      getFormulationName(row),
      row.notes,
      row.batch_no,
      row.status
    ].join(' ').toLowerCase();
    return haystack.includes(query);
  });

  renderFormulationsGrid(filtered);
}

async function loadFormulations() {
  updatePageDebug('Loading Formulations...', '#10B981');
  try {
    if (window.DB && window.DB.initDB) await window.DB.initDB();

    const [productsRes, inventoryRes, formulationsRes] = await Promise.all([
      window.dbClient.from('products').select('*'),
      window.dbClient.from('inventory_items').select('*'),
      window.dbClient.from('formulations').select('*, formulation_ingredients(*)')
    ]);

    if (productsRes.error) throw productsRes.error;
    if (inventoryRes.error) throw inventoryRes.error;
    if (formulationsRes.error) throw formulationsRes.error;

    allProducts = productsRes.data || [];
    inventoryItems = inventoryRes.data || [];
    allFormulations = formulationsRes.data || [];

    allFormulations.forEach(formulation => {
      const match = allProducts.find(product => product.id === formulation.product_id);
      formulation.display_name = match ? match.name : formulation.product_name;
      formulation.ingredients = formulation.formulation_ingredients || [];
    });

    renderFormulationsGrid(allFormulations);
    updatePageDebug(`Ready (${allFormulations.length})`, '#10B981');
  } catch (err) {
    console.error('Formulations load failed:', err);
    updatePageDebug('FAILED', '#EF4444');
    APP.showToast(`Failed to load formulations: ${err.message}`, 'error');
    renderFormulationsGrid([]);
  }
}

function openAdd() {
  editingFormId = null;
  document.getElementById('modal-title').textContent = 'Add Formulation';
  resetFormulationBuilder();
  APP.openModal('form-modal');
}

async function openEdit(id) {
  editingFormId = id;
  const row = allFormulations.find(item => item.id === id);
  if (!row) return;

  document.getElementById('modal-title').textContent = 'Edit Formulation';
  document.getElementById('form-form').reset();
  UTILS.populateForm('form-form', {
    name: getFormulationName(row),
    description: row.notes || '',
    batch_size: row.batch_size || 1000,
    batch_unit: row.batch_unit || 'L'
  });

  try {
    const { data: details, error } = await window.dbClient
      .from('formulations')
      .select('*, formulation_ingredients(*)')
      .eq('id', id)
      .single();
    if (error) throw error;
    if (!details) throw new Error('Failed to load formulation details');

    ingredientRows = (details.formulation_ingredients || []).map(item => createIngredientRow(item));
    if (ingredientRows.length < 2) {
      ingredientRows.push(createIngredientRow());
    }

    document.getElementById('base-volume-input').value = details.batch_size || row.batch_size || 1000;
    document.getElementById('master-unit-sel').value = details.batch_unit || row.batch_unit || 'L';
    document.getElementById('scale-batch-size').value = '';

    renderIngredientRows();
    APP.openModal('form-modal');
  } catch (err) {
    APP.showToast(`Failed to load formulation ingredients: ${err.message}`, 'error');
  }
}

async function saveFormulation() {
  const formData = UTILS.getFormData('form-form');
  const { summary, validation } = recalculateFormulationState();

  if (!formData.name) {
    APP.showToast('Product name is required.', 'error');
    return;
  }

  if (!validation.canSave) {
    APP.showToast(validation.errors[0] || 'Fix formulation validation errors before saving.', 'error');
    return;
  }

  const ingredients = getIngredientPayload();
  const existingRecord = editingFormId ? allFormulations.find(item => item.id === editingFormId) : null;
  const nextNo = existingRecord?.batch_no || `FML-${String(allFormulations.length + 1).padStart(4, '0')}`;

  const bodyData = {
    product_id: existingRecord?.product_id || 1,
    product_name: formData.name,
    batch_no: nextNo,
    batch_size: roundTo(summary.batchSize),
    batch_unit: summary.batchUnit,
    date: UTILS.todayStr(),
    status: existingRecord?.status || 'Draft',
    notes: formData.description || '',
    total_percentage: roundTo(summary.totalPercentage),
    total_quantity: roundTo(summary.totalQuantity),
    total_cost: roundTo(summary.totalCost),
    cost_per_unit: roundTo(summary.costPerUnitProduced),
    created_by: existingRecord?.created_by || 'ERP User'
  };

  try {
    let formulationId = editingFormId;
    if (editingFormId) {
      const { error } = await window.dbClient
        .from('formulations')
        .update(bodyData)
        .eq('id', editingFormId);
      if (error) throw error;
    } else {
      const { data, error } = await window.dbClient
        .from('formulations')
        .insert([bodyData])
        .select()
        .single();
      if (error) throw error;
      formulationId = data.id;
    }

    if (editingFormId) {
      await window.dbClient.from('formulation_ingredients').delete().eq('formulation_id', editingFormId);
    }
    
    if (ingredients.length > 0) {
      const ingredientsData = ingredients.map(ing => ({
        formulation_id: formulationId,
        ...ing
      }));
      const { error: ingError } = await window.dbClient
        .from('formulation_ingredients')
        .insert(ingredientsData);
      if (ingError) throw ingError;
    }

    APP.showToast(editingFormId ? 'Formulation updated.' : 'Formulation saved.', 'success');
    APP.closeModal('form-modal');
    await loadFormulations();
  } catch (err) {
    console.error('saveFormulation failed:', err);
    APP.showToast(`Error saving formulation: ${err.message}`, 'error');
  }
}

function getScaledRequirement(ingredient, scaledBatchSize, formulationBatchSize) {
  const percentage = parseNumber(ingredient.percentage);
  if (percentage > 0) {
    return roundTo((percentage / 100) * scaledBatchSize);
  }

  const baseQty = parseNumber(ingredient.quantity);
  if (formulationBatchSize <= 0) return roundTo(baseQty);
  return roundTo(baseQty * (scaledBatchSize / formulationBatchSize));
}

async function openProduction(id) {
  const row = allFormulations.find(item => item.id === id);
  if (!row) return;
  activeProductionFormulation = row;

  const productSelect = document.getElementById('prod-product-id');
  if (productSelect) {
    productSelect.innerHTML = '<option value="">Select Finished Good Product…</option>' + allProducts.map(product => `<option value="${product.id}">${escapeHtml(product.name)} (${escapeHtml(product.unit || '')})</option>`).join('');
    if (row.product_id && row.product_id !== 1) {
      productSelect.value = String(row.product_id);
    }
  }

  document.getElementById('prod-formulation-id').value = id;
  document.getElementById('prod-batch-no').value = `B-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(id).padStart(3, '0')}`;
  document.getElementById('prod-batch-size').value = row.batch_size || '';
  document.getElementById('prod-unit-label').textContent = row.batch_unit || 'L';

  calculateProductionNeeds();
  APP.openModal('production-modal');
}

function calculateProductionNeeds() {
  if (!activeProductionFormulation) return;

  const batchSize = parseNumber(document.getElementById('prod-batch-size')?.value);
  const container = document.getElementById('prod-ingredients-inner');
  if (!container) return;

  if (!batchSize) {
    container.innerHTML = '<div class="text-muted text-sm">Enter a batch size to calculate ingredient requirements.</div>';
    return;
  }

  const formulationBatchSize = parseNumber(activeProductionFormulation.batch_size);
  let missingStock = false;

  const rowsHtml = (activeProductionFormulation.ingredients || []).map(ingredient => {
    const requiredQty = getScaledRequirement(ingredient, batchSize, formulationBatchSize);
    const stockItem = inventoryItems.find(item => item.id === ingredient.product_id);
    const availableStock = stockItem ? parseNumber(stockItem.stock) : 0;
    const unit = ingredient.unit || stockItem?.unit || activeProductionFormulation.batch_unit || 'L';
    const isAvailable = availableStock >= requiredQty;
    if (!isAvailable) missingStock = true;

    return `
      <tr>
        <td><strong>${escapeHtml(ingredient.product_name || 'Unnamed Ingredient')}</strong></td>
        <td>${formatQty(requiredQty)} ${escapeHtml(unit)}</td>
        <td>${formatQty(availableStock)} ${escapeHtml(unit)}</td>
        <td><span class="badge ${isAvailable ? 'badge-success' : 'badge-danger'}">${isAvailable ? 'Available' : 'Insufficient'}</span></td>
      </tr>
    `;
  }).join('');

  container.innerHTML = `
    <table class="line-items-table" style="width:100%; margin-top:10px;">
      <thead>
        <tr>
          <th>Ingredient</th>
          <th>Req. Qty</th>
          <th>Available Stock</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
    </table>
    ${missingStock ? '<div style="color:var(--danger);font-weight:700;font-size:13px;margin-top:12px;">Warning: Insufficient raw materials stock. Production cannot proceed.</div>' : ''}
  `;

  const confirmBtn = document.querySelector('#production-modal .modal-footer .btn-primary');
  if (confirmBtn) {
    confirmBtn.disabled = missingStock;
  }
}

async function confirmProduction() {
  if (!activeProductionFormulation) return;

  const prodId = document.getElementById('prod-product-id').value;
  const batchSize = parseNumber(document.getElementById('prod-batch-size')?.value);
  const batchNo = document.getElementById('prod-batch-no')?.value;

  if (!prodId) {
    APP.showToast('Please select the finished good product to produce.', 'error');
    return;
  }
  if (batchSize <= 0) {
    APP.showToast('Please enter a valid batch size.', 'error');
    return;
  }
  if (!batchNo) {
    APP.showToast('Please enter a batch number.', 'error');
    return;
  }

  const finishedProduct = allProducts.find(product => String(product.id) === String(prodId));
  const formulationBatchSize = parseNumber(activeProductionFormulation.batch_size);

  const ingredientsPayload = (activeProductionFormulation.ingredients || []).map(ingredient => ({
    product_id: ingredient.product_id,
    product_name: ingredient.product_name,
    percentage: roundTo(parseNumber(ingredient.percentage)),
    quantity: getScaledRequirement(ingredient, batchSize, formulationBatchSize),
    unit: ingredient.unit || activeProductionFormulation.batch_unit || 'L',
    cost_per_unit: roundTo(parseNumber(ingredient.cost_per_unit)),
    total_cost: roundTo(getScaledRequirement(ingredient, batchSize, formulationBatchSize) * parseNumber(ingredient.cost_per_unit)),
    entry_mode: ingredient.entry_mode || 'percentage'
  }));

  const totalCost = roundTo(ingredientsPayload.reduce((sum, ingredient) => sum + parseNumber(ingredient.total_cost), 0));
  const payload = {
    product_id: parseInt(prodId, 10),
    product_name: finishedProduct?.name || activeProductionFormulation.product_name || 'Finished Good',
    batch_no: batchNo,
    batch_size: roundTo(batchSize),
    batch_unit: activeProductionFormulation.batch_unit || 'L',
    date: UTILS.todayStr(),
    status: 'Completed',
    notes: `Produced batch using formulation "${activeProductionFormulation.product_name}"`,
    total_percentage: roundTo(ingredientsPayload.reduce((sum, ingredient) => sum + parseNumber(ingredient.percentage), 0)),
    total_quantity: roundTo(ingredientsPayload.reduce((sum, ingredient) => sum + parseNumber(ingredient.quantity), 0)),
    total_cost: totalCost,
    cost_per_unit: batchSize > 0 ? roundTo(totalCost / batchSize) : 0,
    created_by: 'ERP User'
  };

  try {
    const { error } = await window.dbClient
      .from('formulations')
      .update(payload)
      .eq('id', activeProductionFormulation.id);
    if (error) throw error;

    await window.dbClient.from('formulation_ingredients').delete().eq('formulation_id', activeProductionFormulation.id);
    
    if (ingredientsPayload.length > 0) {
      const ingData = ingredientsPayload.map(ing => ({
        formulation_id: activeProductionFormulation.id,
        ...ing
      }));
      const { error: ingError } = await window.dbClient.from('formulation_ingredients').insert(ingData);
      if (ingError) throw ingError;
    }

    APP.showToast('Production run completed. Stocks updated.', 'success');
    APP.closeModal('production-modal');
    await loadFormulations();
  } catch (err) {
    console.error(err);
    APP.showToast(`Production failed: ${err.message}`, 'error');
  }
}

async function deleteFormulation(id) {
  APP.showConfirm('Delete this formulation and its ingredients?', async () => {
    try {
      const { error } = await window.dbClient.from('formulations').delete().eq('id', id);
      if (error) throw error;

      APP.showToast('Formulation deleted.', 'success');
      setTimeout(() => loadFormulations(), 100);
    } catch (err) {
      console.error(err);
      APP.showToast(`Failed to delete formulation: ${err.message}`, 'error');
    }
  });
}

document.getElementById('search-input')?.addEventListener('input', filterFormulations);
loadFormulations();
