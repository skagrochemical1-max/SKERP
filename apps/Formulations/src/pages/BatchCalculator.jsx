import { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useFormulations } from '../context/FormulationContext';
import Layout from '../components/Layout';
import { calculateBatchQuantities, calculateTotalCost, formatNumber, formatCurrency, formatTitleCaseWithPercentRules } from '../utils/formulationUtils';

const BatchCalculator = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { updateFormulation } = useFormulations();
  const formulation = location.state?.formulation;

  const [batchSize, setBatchSize] = useState(formulation?.baseVolume || 1000);
  const [batchUnit, setBatchUnit] = useState(formulation?.baseUnit || 'L');
  const [batchNo, setBatchNo] = useState(`BATCH-${Date.now().toString().slice(-6)}`);
  const [editedIngredients, setEditedIngredients] = useState(
    formulation?.ingredients?.reduce((acc, ing, idx) => {
      acc[idx] = { percentage: parseFloat(ing.percentage) || 0, quantity: parseFloat(ing.quantity) || 0 };
      return acc;
    }, {}) || {}
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const resetScroll = () => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      ['main-content', 'app-layout'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.scrollTop = 0;
      });
    };
    resetScroll();
    const timer = setTimeout(resetScroll, 100);
    return () => clearTimeout(timer);
  }, []);

  if (!formulation) {
    return (
      <Layout>
      <div style={{ paddingBottom: '24px' }}>
          <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
            <p style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>No formulation selected</p>
            <button
              onClick={() => navigate('/')}
              className="btn btn-primary"
              style={{ marginTop: '16px' }}
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // Create modified formulation with edited values
  const modifiedFormulation = useMemo(() => ({
    ...formulation,
    ingredients: formulation.ingredients.map((ing, idx) => ({
      ...ing,
      percentage: editedIngredients[idx]?.percentage || 0,
      quantity: editedIngredients[idx]?.quantity || 0
    }))
  }), [formulation, editedIngredients]);

  const batchIngredients = useMemo(
    () => calculateBatchQuantities(modifiedFormulation, batchSize),
    [modifiedFormulation, batchSize]
  );

  const totalBatchCost = useMemo(
    () => batchIngredients.reduce((sum, ing) => sum + (ing.quantity * ing.costPerUnit), 0),
    [batchIngredients]
  );

  const handleIngredientChange = (index, field, value) => {
    const numValue = parseFloat(value) || 0;
    setEditedIngredients(prev => ({
      ...prev,
      [index]: {
        ...prev[index],
        [field]: numValue
      }
    }));
  };

  const handleConfirmProduction = async () => {
    if (!batchNo.trim()) {
      alert('Please enter a valid batch number');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const payload = {
        ...formulation,
        batchNo: batchNo,
        baseVolume: batchSize,
        baseUnit: batchUnit,
        status: 'Completed', 
        ingredients: batchIngredients.map(ing => ({
          name: ing.name,
          percentage: ing.percentage,
          quantity: ing.quantity,
          unit: ing.unit || batchUnit,
          costPerUnit: ing.costPerUnit,
          entryMode: ing.entryMode || 'percentage'
        }))
      };

      await updateFormulation(formulation.id, payload);
      alert('Batch production sheet saved successfully.');
      navigate('/');
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to save production run');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Layout>
      <div style={{ paddingBottom: '24px' }}>
        {errorMsg && (
          <div className="card" style={{ padding: '16px', background: 'var(--danger-light)', borderLeft: '4px solid var(--danger)', color: 'var(--text-primary)', marginBottom: '24px' }}>
            {errorMsg}
          </div>
        )}

        {/* Title */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Batch Calculator
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Scale recipes, audit values, and print production batch sheets
          </p>
        </div>

        {/* Print Only Header */}
        <div className="print-only-header" style={{ display: 'none' }}>
          <h2>{formulation.name} — Production Batch Sheet</h2>
          <p><strong>Batch Size:</strong> {batchSize} {batchUnit}</p>
          <p><strong>Batch Code / Lot No:</strong> {batchNo}</p>
        </div>

        {/* Main Columns */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px', alignItems: 'start' }} className="lg-two-cols">
          <style dangerouslySetInnerHTML={{__html: `
            @media (min-width: 1024px) {
              .lg-two-cols {
                grid-template-columns: 2.2fr 1fr !important;
              }
            }
            @media print {
              @page {
                size: auto;
                margin: 0 !important;
              }
              body {
                margin: 15mm !important;
                padding: 0 !important;
                height: auto !important;
                min-height: 0 !important;
                overflow: visible !important;
              }
              #sidebar, #topbar, .sidebar, .topbar, .mobile-bottom-nav, 
              .action-buttons-wrap, h1, p, .lg-two-cols > div:last-child {
                display: none !important;
              }
              .card:not(.print-table-card) {
                display: none !important;
              }
              html, .app-layout, .main-content, .page-body, 
              #root, #root > div, .lg-two-cols, .lg-two-cols > div:first-child {
                display: block !important;
                background: white !important;
                color: black !important;
                width: 100% !important;
                max-width: 100% !important;
                height: auto !important;
                min-height: 0 !important;
                overflow: visible !important;
                padding: 0 !important;
                margin: 0 !important;
              }
              .card.print-table-card {
                border: none !important;
                box-shadow: none !important;
                padding: 0 !important;
                margin: 0 !important;
                background: transparent !important;
                height: auto !important;
                overflow: visible !important;
                width: 100% !important;
              }
              .print-only-header {
                display: block !important;
                margin-bottom: 20px;
                border-bottom: 2px solid #000;
                padding-bottom: 10px;
                font-family: system-ui, -apple-system, sans-serif;
              }
              .print-only-header h2 {
                font-size: 20px;
                font-weight: 800;
                margin: 0 0 6px 0;
                color: #000;
              }
              .print-only-header p {
                font-size: 12px;
                margin: 3px 0;
                color: #333;
              }
              .line-items-table {
                width: 100% !important;
                border-collapse: collapse !important;
                margin: 0 !important;
                padding: 0 !important;
              }
              .line-items-table th, .line-items-table td {
                border-bottom: 1px solid #ddd !important;
                padding: 8px 6px !important;
                color: #000 !important;
                box-sizing: border-box !important;
              }
              .line-items-table th:nth-child(1), .line-items-table td:nth-child(1) { width: 40% !important; text-align: left !important; }
              .line-items-table th:nth-child(2), .line-items-table td:nth-child(2) { width: 15% !important; text-align: center !important; }
              .line-items-table th:nth-child(3), .line-items-table td:nth-child(3) { width: 25% !important; text-align: right !important; }
              .line-items-table th:nth-child(4), .line-items-table td:nth-child(4) { width: 20% !important; text-align: right !important; }
              .line-items-table th {
                background-color: #f5f5f5 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
          `}} />

          {/* Left Column */}
          <div style={{ display: 'grid', gap: '24px' }}>
            
            {/* Header info */}
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '14px' }}>
                {formulation.name}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', fontSize: '13px' }}>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '600' }}>BASE YIELD</div>
                  <div style={{ color: 'var(--text-primary)', fontWeight: '700', fontSize: '16px', fontFamily: 'monospace', marginTop: '4px' }}>
                    {formulation.baseVolume} {formulation.baseUnit}
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '600' }}>INGREDIENTS</div>
                  <div style={{ color: 'var(--text-primary)', fontWeight: '700', fontSize: '16px', fontFamily: 'monospace', marginTop: '4px' }}>
                    {formulation.ingredients.length} Items
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '600' }}>BASE COST</div>
                  <div style={{ color: 'var(--success)', fontWeight: '700', fontSize: '16px', fontFamily: 'monospace', marginTop: '4px' }}>
                    {formatCurrency(calculateTotalCost(formulation.ingredients, formulation.baseVolume))}
                  </div>
                </div>
              </div>
            </div>

            {/* Input Config */}
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent)', letterSpacing: '0.08em', marginBottom: '16px', textTransform: 'uppercase' }}>
                Batch Configuration
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }} className="responsive-inputs">
                <style dangerouslySetInnerHTML={{__html: `
                  .action-buttons-wrap {
                    display: flex;
                    justify-content: space-between;
                    gap: 16px;
                  }
                  .action-buttons-right {
                    display: flex;
                    gap: 12px;
                  }
                  @media (max-width: 768px) {
                    .card {
                      padding: 12px !important;
                    }
                    .responsive-inputs {
                      grid-template-columns: 1fr !important;
                      gap: 16px !important;
                    }
                    .line-items-table {
                      display: table !important;
                      width: 100% !important;
                      min-width: 0 !important;
                    }
                    .line-items-table thead {
                      display: table-header-group !important;
                    }
                    .line-items-table tbody {
                      display: table-row-group !important;
                    }
                    .line-items-table tfoot {
                      display: table-footer-group !important;
                    }
                    .line-items-table tr {
                      display: table-row !important;
                      border: none !important;
                      padding: 0 !important;
                      margin: 0 !important;
                      background: transparent !important;
                    }
                    .line-items-table th, 
                    .line-items-table td {
                      display: table-cell !important;
                      padding: 8px 4px !important;
                      font-size: 11px !important;
                      border-bottom: 1px solid var(--border) !important;
                      width: auto !important;
                    }
                    .line-items-table td .mobile-label {
                      display: none !important;
                    }
                    .action-buttons-wrap {
                      flex-direction: column !important;
                      gap: 12px !important;
                    }
                    .action-buttons-right {
                      flex-direction: column !important;
                      gap: 12px !important;
                      width: 100% !important;
                    }
                    .action-btn-full {
                      width: 100% !important;
                      justify-content: center !important;
                    }
                  }
                `}} />
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Target Batch Size</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="number"
                      value={batchSize}
                      onChange={(e) => setBatchSize(parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                      className="form-input font-mono"
                      style={{ flex: 1 }}
                    />
                    <select
                      value={batchUnit}
                      onChange={(e) => setBatchUnit(e.target.value)}
                      className="form-input font-mono"
                      style={{ width: '100px' }}
                    >
                      <option value="L">L</option>
                      <option value="ML">ML</option>
                      <option value="KG">KG</option>
                      <option value="GM">GM</option>
                    </select>
                  </div>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Batch Code / Lot No</label>
                  <input
                    type="text"
                    value={batchNo}
                    onChange={(e) => {
                      const input = e.target;
                      const rawValue = input.value;
                      const start = input.selectionStart;
                      const end = input.selectionEnd;
                      const formatted = formatTitleCaseWithPercentRules(rawValue);
                      setBatchNo(formatted);
                      requestAnimationFrame(() => {
                        input.setSelectionRange(start, end);
                      });
                    }}
                    placeholder="BATCH-XXXXXX"
                    className="form-input font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Quantities Table */}
            <div className="card print-table-card" style={{ padding: '24px' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent)', letterSpacing: '0.08em', marginBottom: '16px', textTransform: 'uppercase' }}>
                Calculated Ingredient Quantities
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="line-items-table">
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left' }}>INGREDIENT NAME</th>
                      <th style={{ width: '120px', textAlign: 'center' }}>%</th>
                      <th style={{ width: '150px', textAlign: 'right' }}>REQUIRED QTY</th>
                      <th style={{ width: '150px', textAlign: 'right' }}>EST. COST</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batchIngredients.map((ingredient, index) => (
                      <tr key={index}>
                        <td style={{ color: 'var(--text-primary)', fontWeight: '600' }}>
                          <span className="mobile-label">Ingredient Name</span>
                          {ingredient.name}
                        </td>
                        <td style={{ textAlign: 'center', fontFamily: 'monospace', color: 'var(--accent)', fontWeight: '700' }}>
                          <span className="mobile-label">Percentage (%)</span>
                          {ingredient.percentage.toFixed(2)}%
                        </td>
                        <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: '700' }}>
                          <span className="mobile-label">Required Qty</span>
                          {formatNumber(ingredient.quantity, 4)} {ingredient.unit || batchUnit}
                        </td>
                        <td style={{ textAlign: 'right', fontFamily: 'monospace', color: 'var(--success)', fontWeight: '700' }}>
                          <span className="mobile-label">Est. Cost</span>
                          {formatCurrency(ingredient.quantity * ingredient.costPerUnit)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="2" style={{ fontWeight: '800' }}>
                        <span className="mobile-label">Total Summary</span>
                        TOTAL BATCH
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: '800', fontSize: '16px', color: 'var(--accent)' }}>
                        <span className="mobile-label">Total Batch Yield</span>
                        {formatNumber(batchSize, 3)} {batchUnit}
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: '800', fontSize: '16px', color: 'var(--success)' }}>
                        <span className="mobile-label">Total Est. Cost</span>
                        {formatCurrency(totalBatchCost)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="action-buttons-wrap">
              <button
                onClick={() => navigate('/')}
                className="btn btn-secondary action-btn-full"
                style={{ padding: '12px 24px' }}
              >
                ← Return to Dashboard
              </button>
              
              <div className="action-buttons-right">
                <button
                  onClick={handlePrint}
                  className="btn btn-secondary action-btn-full"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px' }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '16px', height: '16px' }}>
                    <path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print Batch sheet
                </button>

                <button
                  onClick={handleConfirmProduction}
                  disabled={isSubmitting}
                  className="btn btn-primary action-btn-full"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 32px' }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '16px', height: '16px' }}>
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                  {isSubmitting ? 'Saving...' : 'Save Production Batch'}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div style={{ display: 'grid', gap: '24px' }}>
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent)', letterSpacing: '0.08em', marginBottom: '20px', textTransform: 'uppercase' }}>
                Batch Summary
              </div>
              <div style={{ display: 'grid', gap: '16px' }}>
                <div style={{ padding: '16px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Scaling Coefficient</div>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', fontFamily: 'monospace', marginTop: '6px' }}>
                    {formatNumber(batchSize / formulation.baseVolume, 2)}x
                  </div>
                </div>

                <div style={{ padding: '16px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Estimated Batch Cost</div>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--success)', fontFamily: 'monospace', marginTop: '6px' }}>
                    {formatCurrency(totalBatchCost)}
                  </div>
                </div>

                <div style={{ padding: '16px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Estimated cost per Yield Unit</div>
                  <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', fontFamily: 'monospace', marginTop: '6px' }}>
                    {formatCurrency(batchSize > 0 ? totalBatchCost / batchSize : 0)}/{batchUnit}
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
};

export default BatchCalculator;
