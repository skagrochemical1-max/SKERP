import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormulations } from '../context/FormulationContext';
import Layout from '../components/Layout';
import { calculateTotalCost, formatCurrency, formatDate } from '../utils/formulationUtils';

const Dashboard = () => {
  const navigate = useNavigate();
  const { formulations = [], deleteFormulation, duplicateFormulation } = useFormulations();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFormulations = (formulations || []).filter(formulation => {
    if (!formulation) return false;
    const nameMatch = (formulation.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const ingMatch = (formulation.ingredients || []).some(ing => 
      ing && (ing.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
    return nameMatch || ingMatch;
  });

  const handleEdit = (id) => {
    navigate(`/editor/${id}`);
  };

  const handleDuplicate = (id) => {
    duplicateFormulation(id);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this formulation?')) {
      deleteFormulation(id);
    }
  };

  const handleCalculate = (formulation) => {
    navigate('/calculator', { state: { formulation } });
  };

  return (
    <Layout>
      <div style={{ paddingBottom: '24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Formulation Dashboard
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              Manage and scale active chemical production formulas
            </p>
          </div>
          <button
            onClick={() => navigate('/editor')}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '16px', height: '16px' }}>
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Formulation
          </button>
        </div>

        {/* Filters */}
        <div className="card" style={{ marginBottom: '24px', padding: '16px' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ marginBottom: '8px' }}>Search Formulations</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or chemical ingredient..."
              className="form-input"
              style={{ width: '100%' }}
            />
          </div>
        </div>

        {/* KPI Stats Grid */}
        <div className="kpi-grid" style={{ marginBottom: '24px' }}>
          <div className="stat-card">
            <div className="stat-icon purple">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
            </div>
            <div className="stat-label">Total Formulations</div>
            <div className="stat-value">{formulations.length}</div>
            <div className="stat-trend up">Registered Catalogs</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2l9 4.9V17L12 22l-9-5.1V6.9z"/></svg>
            </div>
            <div className="stat-label">Chemical Components</div>
            <div className="stat-value">
              {formulations.reduce((sum, f) => sum + (f.ingredients?.length || 0), 0)}
            </div>
            <div className="stat-trend up">Active Ingredients</div>
          </div>
        </div>

        {/* Grid List */}
        {filteredFormulations.length === 0 ? (
          <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
            <p style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>No formulations found</p>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>
              {searchQuery ? 'Try adjusting your search criteria' : 'Add your first formula to get started'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
            {filteredFormulations.map((formulation) => (
              <FormulationCard
                key={formulation.id}
                formulation={formulation}
                onEdit={handleEdit}
                onDuplicate={handleDuplicate}
                onDelete={handleDelete}
                onCalculate={handleCalculate}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

const FormulationCard = ({ formulation, onEdit, onDuplicate, onDelete, onCalculate }) => {
  const ingredients = formulation.ingredients || [];
  const totalCost = calculateTotalCost(ingredients, formulation.baseVolume);

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', transition: 'var(--transition)' }}>
      {/* Header */}
      <div style={{ padding: '20px', borderBottom: '1px solid var(--border)' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
          {formulation.name}
        </h3>
        {formulation.description && (
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px', minHeight: '32px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {formulation.description}
          </p>
        )}
        <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
          <span>Yield: {formulation.baseVolume} {formulation.baseUnit}</span>
          <span>•</span>
          <span>{ingredients.length} items</span>
        </div>
      </div>

      {/* Composition Body */}
      <div style={{ padding: '20px', flex: 1, background: 'rgba(0,0,0,0.1)' }}>
        <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: '10px' }}>
          CHEMICAL COMPOSITION
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {ingredients.map((ing, index) => (
            <div
              key={index}
              style={{
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '4px 8px',
                fontSize: '11px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{ing.name}</span>
              <span style={{ color: 'var(--accent)', fontWeight: '700', fontFamily: 'monospace' }}>
                {ing.percentage > 0 ? `${ing.percentage}%` : `${ing.quantity} ${ing.unit || formulation.baseUnit}`}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing / Footer */}
      <div style={{ padding: '20px', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600' }}>BASE COST</div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--success)', fontFamily: 'monospace' }}>
              {formatCurrency(totalCost)}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600' }}>BATCH RATE</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
              {formatCurrency(formulation.baseVolume > 0 ? totalCost / formulation.baseVolume : 0)}/{formulation.baseUnit}
            </div>
          </div>
        </div>

        {/* Buttons / Actions */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => onEdit(formulation.id)}
            className="btn btn-secondary"
            style={{ flex: 1, padding: '10px', display: 'flex', justifyContent: 'center' }}
            title="Edit Formula"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '16px', height: '16px' }}>
              <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          
          <button
            onClick={() => onDuplicate(formulation.id)}
            className="btn btn-secondary"
            style={{ flex: 1, padding: '10px', display: 'flex', justifyContent: 'center' }}
            title="Duplicate Formula"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '16px', height: '16px' }}>
              <path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>

          <button
            onClick={() => onDelete(formulation.id)}
            className="btn btn-secondary"
            style={{ flex: 1, padding: '10px', display: 'flex', justifyContent: 'center', color: 'var(--danger)' }}
            title="Delete Formula"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '16px', height: '16px' }}>
              <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
          </button>

          <button
            onClick={() => onCalculate(formulation)}
            className="btn btn-primary"
            style={{ flex: 1.5, padding: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
            title="Scale Production Batch"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '15px', height: '15px' }}>
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="9" y1="9" x2="15" y2="15" />
              <line x1="15" y1="9" x2="9" y2="15" />
            </svg>
            Scale
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
