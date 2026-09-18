import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFormulations } from '../context/FormulationContext';
import Layout from '../components/Layout';
import ProgressRing from '../components/ProgressRing';
import {
  calculateTotalPercentage,
  calculateTotalCost,
  validateFormulation,
  formatCurrency,
  formatTitleCaseWithPercentRules,
} from '../utils/formulationUtils';

const FormulationEditor = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { getFormulation, addFormulation, updateFormulation, products } = useFormulations();
  const errorRef = useRef(null);

  const [formulation, setFormulation] = useState({
    name: '',
    productId: '',
    description: '',
    baseVolume: 1000,
    baseUnit: 'L',
    ingredients: [
      { name: '', percentage: 0, quantity: 0, costPerUnit: 0, unit: 'L' },
      { name: '', percentage: 0, quantity: 0, costPerUnit: 0, unit: 'L' },
    ],
  });

  const [errors, setErrors] = useState([]);
  const [searchFocused, setSearchFocused] = useState(false);

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

    if (id) {
      const existing = getFormulation(id);
      if (existing) {
        setFormulation(existing);
      }
    }

    return () => clearTimeout(timer);
  }, [id, getFormulation]);

  const totalPercentage = useMemo(
    () => calculateTotalPercentage(formulation.ingredients, formulation.baseVolume, formulation.baseUnit),
    [formulation.ingredients, formulation.baseVolume, formulation.baseUnit]
  );

  const totalCost = useMemo(
    () => calculateTotalCost(formulation.ingredients, formulation.baseVolume, formulation.baseUnit),
    [formulation.ingredients, formulation.baseVolume, formulation.baseUnit]
  );

  const handleFieldChange = (field, value) => {
    setFormulation({ ...formulation, [field]: value });
  };

  const handleIngredientChange = (index, field, value) => {
    const newIngredients = [...formulation.ingredients];
    
    if (field === 'name') {
      newIngredients[index] = {
        ...newIngredients[index],
        name: value
      };
    } else {
      const numValue = parseFloat(value) || 0;
      newIngredients[index] = {
        ...newIngredients[index],
        [field]: numValue,
      };

      // Implement mutually exclusive PERCENTAGE/QUANTITY logic
      if (field === 'percentage' && numValue > 0) {
        newIngredients[index].quantity = 0;
        newIngredients[index].entryMode = 'percentage';
      } else if (field === 'quantity' && numValue > 0) {
        newIngredients[index].percentage = 0;
        newIngredients[index].entryMode = 'quantity';
      }
    }

    setFormulation({ ...formulation, ingredients: newIngredients });
  };

  const addIngredient = () => {
    setFormulation({
      ...formulation,
      ingredients: [
        ...formulation.ingredients,
        { name: '', percentage: 0, quantity: 0, costPerUnit: 0, unit: formulation.baseUnit },
      ],
    });
  };

  const removeIngredient = (index) => {
    if (formulation.ingredients.length <= 2) {
      alert('Minimum 2 ingredients required');
      return;
    }
    const newIngredients = formulation.ingredients.filter((_, i) => i !== index);
    setFormulation({ ...formulation, ingredients: newIngredients });
  };

  const handleSave = async () => {
    const validation = validateFormulation(formulation);
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      setTimeout(() => {
        if (errorRef.current) {
          errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      return;
    }

    setErrors([]);

    try {
      if (id) {
        await updateFormulation(id, formulation);
      } else {
        await addFormulation(formulation);
      }
      navigate('/');
    } catch (err) {
      setErrors([err.message || 'Failed to save formulation.']);
    }
  };

  const handleCancel = () => {
    navigate('/');
  };

  // Filter products based on formulation.name
  const filteredProducts = useMemo(() => {
    const query = (formulation.name || '').toLowerCase();
    if (!query) return products;
    return products.filter(p => p.name && p.name.toLowerCase().includes(query));
  }, [products, formulation.name]);

  // Handle typing normalization with cursor preservation
  const handleProductNameChange = (e) => {
    const input = e.target;
    const rawValue = input.value;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const formatted = formatTitleCaseWithPercentRules(rawValue);

    const matchedProd = products.find(p => p.name.toLowerCase() === formatted.toLowerCase());
    setFormulation(prev => ({
      ...prev,
      name: formatted,
      productId: matchedProd ? String(matchedProd.id) : prev.productId
    }));
    setSearchFocused(true);

    requestAnimationFrame(() => {
      input.setSelectionRange(start, end);
    });
  };

  const handleDescriptionChange = (e) => {
    const textarea = e.target;
    const rawValue = textarea.value;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const formatted = formatTitleCaseWithPercentRules(rawValue);

    handleFieldChange('description', formatted);

    requestAnimationFrame(() => {
      textarea.setSelectionRange(start, end);
    });
  };

  const handleIngredientNameChange = (index, e) => {
    const input = e.target;
    const rawValue = input.value;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const formatted = formatTitleCaseWithPercentRules(rawValue);

    handleIngredientChange(index, 'name', formatted);

    requestAnimationFrame(() => {
      input.setSelectionRange(start, end);
    });
  };

  return (
    <Layout>
      <div style={{ paddingBottom: '24px', marginTop: '12px' }}>
        {/* Navigation & Header */}
        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={handleCancel}
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '13px' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '14px', height: '14px' }}>
              <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
            </svg>
            Back to Dashboard
          </button>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            {id ? 'Edit Formulation' : 'New Formulation'}
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Define the chemical components, percentages, and costs of your formula.
          </p>
        </div>

        {/* Validation Errors */}
        {errors.length > 0 && (
          <div ref={errorRef} className="card" style={{ marginBottom: '24px', borderLeft: '4px solid var(--danger)', padding: '16px', background: 'var(--danger-light)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '20px', height: '20px', color: 'var(--danger)', marginTop: '2px' }}>
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <div>
                <div style={{ color: 'var(--danger)', fontWeight: '700', fontSize: '14px', marginBottom: '6px' }}>Validation Failures</div>
                <ul style={{ fontSize: '13px', color: 'var(--text-primary)', listStyleType: 'disc', paddingLeft: '20px', margin: 0 }}>
                  {errors.map((error, index) => (
                    <li key={index} style={{ marginBottom: '4px' }}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Main Grid Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px', alignItems: 'start' }} className="lg-two-cols">
          <style dangerouslySetInnerHTML={{__html: `
            @media (min-width: 1024px) {
              .lg-two-cols {
                grid-template-columns: 2.2fr 1fr !important;
              }
            }
            select option {
              background-color: var(--surface) !important;
              color: var(--text-primary) !important;
            }
            .form-input, textarea.form-input, select.form-input {
              font-size: 14px !important;
              font-weight: 500 !important;
            }
            .line-items-table .form-input {
              font-size: 13px !important;
            }
          `}} />

          {/* Left Column - Main Editor Forms */}
          <div style={{ display: 'grid', gap: '24px' }}>

            {/* Product Identity */}
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent)', letterSpacing: '0.08em', marginBottom: '16px', textTransform: 'uppercase' }}>
                Product Identity
              </div>
              <div style={{ display: 'grid', gap: '16px' }}>
                <div className="form-group" style={{ position: 'relative' }}>
                  <label className="form-label">Finished Good Product (Search existing or type custom)</label>
                  <input
                    type="text"
                    value={formulation.name}
                    onChange={handleProductNameChange}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => {
                      setTimeout(() => setSearchFocused(false), 200);
                    }}
                    placeholder="Search existing catalog products or type custom name..."
                    className="form-input"
                    style={{ width: '100%' }}
                  />

                  {/* Autocomplete list */}
                  {searchFocused && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        backgroundColor: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)',
                        maxHeight: '200px',
                        overflowY: 'auto',
                        zIndex: 100,
                        marginTop: '4px',
                        boxShadow: 'var(--shadow)'
                      }}
                    >
                      {filteredProducts.map(p => (
                        <div
                          key={p.id}
                          onMouseDown={() => {
                            setFormulation({
                              ...formulation,
                              productId: String(p.id),
                              name: p.name
                            });
                            setSearchFocused(false);
                          }}
                          style={{
                            padding: '10px 14px',
                            cursor: 'pointer',
                            borderBottom: '1px solid var(--border)',
                            fontSize: '13px',
                            color: 'var(--text-primary)'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(0,0,0,0.1)'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                        >
                          {p.name}
                        </div>
                      ))}
                      {filteredProducts.length === 0 && (
                        <div style={{ padding: '10px 14px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                          No matching catalog product. (Will save as custom formulation name)
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Description / Internal Remarks</label>
                  <textarea
                    value={formulation.description}
                    onChange={handleDescriptionChange}
                    placeholder="Describe usage instructions, application standards, etc."
                    rows="2"
                    className="form-input"
                    style={{ width: '100%', resize: 'none' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Base Volume / Output Capacity</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="number"
                      value={formulation.baseVolume}
                      onChange={(e) => handleFieldChange('baseVolume', parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                      className="form-input font-mono"
                      style={{ flex: 1 }}
                    />
                    <select
                      value={formulation.baseUnit}
                      onChange={(e) => {
                        const newUnit = e.target.value;
                        const updatedIngredients = formulation.ingredients.map(ing => ({
                          ...ing,
                          unit: newUnit
                        }));
                        setFormulation({
                          ...formulation,
                          baseUnit: newUnit,
                          ingredients: updatedIngredients
                        });
                      }}
                      className="form-input font-mono"
                      style={{ width: '130px' }}
                    >
                      <option value="L">L (Liters)</option>
                      <option value="ML">ML (Milliliters)</option>
                      <option value="KG">KG (Kilograms)</option>
                      <option value="GM">GM (Grams)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Table Composition */}
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyBetween: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Ingredients Composition
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="line-items-table">
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left' }}>INGREDIENT NAME</th>
                      <th style={{ width: '100px', textAlign: 'center' }}>%</th>
                      <th style={{ width: '40px', textAlign: 'center', color: 'var(--accent)', fontWeight: '700' }}>OR</th>
                      <th style={{ width: '150px', textAlign: 'center' }}>QTY</th>
                      <th style={{ width: '130px', textAlign: 'right' }}>COST/UNIT (₹)</th>
                      <th style={{ width: '48px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {formulation.ingredients.map((ingredient, index) => (
                      <tr key={index}>
                        <td>
                          <span className="mobile-label">Ingredient Name</span>
                          <input
                            type="text"
                            value={ingredient.name}
                            onChange={(e) => handleIngredientNameChange(index, e)}
                            placeholder="Type chemical ingredient..."
                            className="form-input"
                            style={{ width: '100%' }}
                          />
                        </td>
                        <td>
                          <span className="mobile-label">Percentage (%)</span>
                          <input
                            type="number"
                            value={ingredient.percentage || ''}
                            onChange={(e) => handleIngredientChange(index, 'percentage', e.target.value)}
                            min="0"
                            step="0.0001"
                            placeholder="0.00"
                            className="form-input font-mono text-center"
                            style={{ width: '100%' }}
                          />
                        </td>
                        <td style={{ textAlign: 'center', fontSize: '11px', fontWeight: '800', color: 'var(--accent)' }}>
                          OR
                        </td>
                        <td>
                          <span className="mobile-label">Quantity</span>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <input
                              type="number"
                              value={ingredient.quantity || ''}
                              onChange={(e) => handleIngredientChange(index, 'quantity', e.target.value)}
                              min="0"
                              step="0.0001"
                              placeholder="0.00"
                              className="form-input font-mono text-center"
                              style={{ flex: 1, minWidth: '60px' }}
                            />
                            <select
                              value={ingredient.unit || formulation.baseUnit}
                              onChange={(e) => {
                                const newIngredients = [...formulation.ingredients];
                                newIngredients[index] = {
                                  ...newIngredients[index],
                                  unit: e.target.value
                                };
                                setFormulation({ ...formulation, ingredients: newIngredients });
                              }}
                              className="form-input font-mono"
                              style={{ width: '65px', padding: '4px', fontSize: '11px' }}
                            >
                              <option value="L">L</option>
                              <option value="ML">ML</option>
                              <option value="KG">KG</option>
                              <option value="GM">GM</option>
                            </select>
                          </div>
                        </td>
                        <td>
                          <span className="mobile-label">Cost/Unit (₹)</span>
                          <input
                            type="number"
                            value={ingredient.costPerUnit || ''}
                            onChange={(e) => {
                              const newIngredients = [...formulation.ingredients];
                              newIngredients[index].costPerUnit = parseFloat(e.target.value) || 0;
                              setFormulation({ ...formulation, ingredients: newIngredients });
                            }}
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            className="form-input font-mono text-right"
                            style={{ width: '100%' }}
                          />
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="mobile-label">Remove</span>
                          <button
                            onClick={() => removeIngredient(index)}
                            disabled={formulation.ingredients.length <= 2}
                            style={{ border: 'none', background: 'transparent', padding: '6px', cursor: 'pointer', color: 'var(--danger)' }}
                            title="Remove row"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '16px', height: '16px' }}>
                              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                onClick={addIngredient}
                className="btn btn-secondary"
                style={{ width: '100%', marginTop: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '14px', height: '14px' }}>
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add Ingredient Component
              </button>
            </div>

            {/* Actions Bar */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={handleCancel} className="btn btn-secondary" style={{ padding: '12px 24px' }}>
                Cancel
              </button>
              <button onClick={handleSave} className="btn btn-primary" style={{ padding: '12px 32px' }}>
                {id ? 'Update Formulation' : 'Commit Recipe'}
              </button>
            </div>
          </div>

          {/* Right Column - Indicators Panel */}
          <div style={{ display: 'grid', gap: '24px' }}>
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent)', letterSpacing: '0.08em', marginBottom: '20px', textTransform: 'uppercase' }}>
                Formula Indicators
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                <ProgressRing percentage={totalPercentage} />
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '20px',
                  border: '1px solid',
                  background: totalPercentage > 100.01 ? 'rgba(220,38,38,0.1)' : totalPercentage < 99.99 ? 'rgba(217,119,6,0.1)' : 'rgba(16,185,129,0.1)',
                  borderColor: totalPercentage > 100.01 ? 'var(--danger)' : totalPercentage < 99.99 ? 'var(--accent)' : 'var(--success)'
                }}
              >
                <span style={{ fontSize: '15px', fontWeight: '700', color: totalPercentage > 100.01 ? 'var(--danger)' : totalPercentage < 99.99 ? 'var(--text-primary)' : 'var(--success)' }}>
                  {totalPercentage.toFixed(2)}%
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {totalPercentage > 100.01 ? '(Exceeds 100% boundary)' : totalPercentage < 99.99 ? '(Below 100% boundary)' : '(Balanced Recipe ✓)'}
                </span>
              </div>

              <div style={{ display: 'grid', gap: '12px', fontSize: '13px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Components count</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: '600', fontFamily: 'monospace' }}>{formulation.ingredients.length} items</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Recipe Cost</span>
                  <span style={{ color: 'var(--success)', fontWeight: '700', fontFamily: 'monospace' }}>{formatCurrency(totalCost)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Unit Cost Ratio</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: '600', fontFamily: 'monospace' }}>
                    {formatCurrency(formulation.baseVolume > 0 ? totalCost / formulation.baseVolume : 0)}/{formulation.baseUnit}
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
};

export default FormulationEditor;
