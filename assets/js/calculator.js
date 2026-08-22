/* calculator.js */

let allFormulations = [];
let allInventoryItems = [];

function calcScaledRequirement(ingredient, targetBatchSize, sourceBatchSize) {
  const percentage = parseFloat(ingredient.percentage) || 0;
  if (percentage > 0) {
    return (percentage / 100) * targetBatchSize;
  }

  const baseQuantity = parseFloat(ingredient.quantity) || 0;
  if (!sourceBatchSize) return baseQuantity;
  return baseQuantity * (targetBatchSize / sourceBatchSize);
}

function updatePageDebug(text, color) {
  const el = document.getElementById('debug-page-status');
  if (el) {
    el.textContent = 'Page: ' + text;
    if (color) el.style.color = color;
  }
}

async function loadCalculator() {
  console.log('Loading batch calculator...');
  updatePageDebug('Initializing...', '#10B981');
  
  try {
    await DB.initDB();
    
    // Fetch all formulations
    const resForm = await fetch('/api/formulations');
    if (!resForm.ok) throw new Error('Failed to fetch formulations');
    allFormulations = await resForm.json();
    
    // Fetch all inventory items for checking raw materials stock
    const resInv = await fetch('/api/inventory');
    if (resInv.ok) {
      allInventoryItems = await resInv.json();
    }
    
    populateFormulationSelect();
    updatePageDebug('Ready', '#10B981');
  } catch (err) {
    console.error('loadCalculator failed:', err);
    updatePageDebug('FAILED', '#EF4444');
    APP.showToast('Failed to load batch calculator: ' + err.message, 'error');
  }
}

function populateFormulationSelect() {
  const sel = document.getElementById('formulation-select');
  if (!sel) return;
  
  sel.innerHTML = '<option value="">Select Formulation…</option>' + allFormulations.map(f =>
    `<option value="${f.id}" data-batch="${f.batch_size}" data-unit="${f.batch_unit}">${f.product_name} (${f.batch_size} ${f.batch_unit || 'L'})</option>`
  ).join('');
}

async function calculateBatch() {
  const sel = document.getElementById('formulation-select');
  const batchInput = parseFloat(document.getElementById('batch-size-input').value);
  const resultContainer = document.getElementById('calc-result');

  if (!sel.value) { APP.showToast('Please select a formulation', 'error'); return; }
  if (!batchInput || batchInput <= 0) { APP.showToast('Enter a valid batch size', 'error'); return; }

  const opt = sel.selectedOptions[0];
  const originalBatch = parseFloat(opt.dataset.batch) || 1;
  const batchUnit = opt.dataset.unit || '';
  const scaleFactor = batchInput / originalBatch;
  const formId = parseInt(sel.value);

  try {
    APP.showSpinner();
    
    // Refresh inventory items to get live stock levels
    const resInv = await fetch('/api/inventory');
    if (resInv.ok) {
      allInventoryItems = await resInv.json();
    }
    
    // Fetch detailed formulation with ingredients list
    const resFormDetail = await fetch(`/api/formulations/${formId}`);
    if (!resFormDetail.ok) throw new Error('Failed to fetch formulation details');
    const form = await resFormDetail.ok ? await resFormDetail.json() : null;
    
    if (!form) {
      APP.showToast('Formulation not found', 'error');
      return;
    }

    const ingredients = form.ingredients || [];
    
    // Fetch finished good product details if product_id is associated
    let currentStock = null;
    if (form.product_id && form.product_id !== 1) {
      const resProd = await fetch(`/api/products/${form.product_id}`);
      if (resProd.ok) {
        const prod = await resProd.json();
        currentStock = prod.stock;
      }
    }

    resultContainer.innerHTML = `
      <div class="card" style="padding:24px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
          <div>
            <div style="font-size:16px;font-weight:800">${form.product_name}</div>
            <div style="font-size:12px;color:var(--text-muted)">Scaled batch: ${batchInput} ${batchUnit} (${scaleFactor.toFixed(3)}× original)</div>
          </div>
          <span class="badge badge-purple">${form.status || 'Formulation'}</span>
        </div>
        
        <div class="form-section-title">Scaled Ingredient Requirements</div>
        ${ingredients.length === 0 ? 
          `<p class="text-muted text-sm" style="padding:12px">No ingredient breakdown is stored for this batch yet. The calculator can still show the selected batch metadata and current target-product stock.</p>` :
          `<table class="data-table" style="margin-bottom:16px">
            <thead><tr><th>Ingredient</th><th>Required Qty</th><th>Unit</th><th>In Stock</th><th>Status</th></tr></thead>
            <tbody>${ingredients.map(ing => {
              const reqQty = calcScaledRequirement(ing, batchInput, originalBatch);
              const invItem = allInventoryItems.find(i => i.id === ing.product_id);
              const availStock = invItem ? parseFloat(invItem.stock) || 0 : 0;
              const sufficient = availStock >= reqQty;
              return `<tr>
                <td style="font-weight:600">${ing.product_name || '—'}</td>
                <td style="font-weight:700;color:var(--accent)">${reqQty.toFixed(3)}</td>
                <td>${ing.unit || '—'}</td>
                <td>${availStock.toFixed(2)}</td>
                <td>${sufficient ? '<span class="badge badge-success">Sufficient</span>' : 
                     '<span class="badge badge-danger">Insufficient</span>'}</td>
              </tr>`;
            }).join('')}</tbody>
          </table>`
        }

        <div style="padding:12px;border-radius:var(--radius-sm);background:var(--bg);margin-top:12px;font-size:12px;color:var(--text-muted)">
          Current stock for this target product: <strong>${currentStock === null ? '—' : currentStock.toFixed(2)}</strong>
        </div>
        
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:16px">
          <div style="background:var(--accent-light);border-radius:var(--radius-sm);padding:12px;text-align:center">
            <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--accent);letter-spacing:0.06em">Batch Size</div>
            <div style="font-size:20px;font-weight:800;color:var(--accent);margin-top:4px">${batchInput} ${batchUnit}</div>
          </div>
          <div style="background:var(--success-light);border-radius:var(--radius-sm);padding:12px;text-align:center">
            <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--success);letter-spacing:0.06em">Concentration</div>
            <div style="font-size:20px;font-weight:800;color:var(--success);margin-top:4px">${form.batch_unit || batchUnit || '—'}</div>
          </div>
          <div style="background:var(--warning-light);border-radius:var(--radius-sm);padding:12px;text-align:center">
            <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--accent-dark);letter-spacing:0.06em">Scale Factor</div>
            <div style="font-size:20px;font-weight:800;color:var(--accent-dark);margin-top:4px">${scaleFactor.toFixed(2)}×</div>
          </div>
        </div>
      </div>`;
  } catch (err) {
    APP.showToast('Failed to calculate batch scaled requirements: ' + err.message, 'error');
  } finally {
    APP.hideSpinner();
  }
}

document.getElementById('formulation-select')?.addEventListener('change', function() {
  const opt = this.selectedOptions[0];
  if (opt?.dataset.batch) {
    document.getElementById('batch-size-input').value = opt.dataset.batch;
    document.getElementById('batch-unit-display').textContent = opt.dataset.unit || '';
  }
});

loadCalculator();
