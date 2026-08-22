import { createContext, useContext, useState, useEffect } from 'react';

const FormulationContext = createContext();
const API_BASE_URL = '/api';

export const useFormulations = () => {
  const context = useContext(FormulationContext);
  if (!context) {
    throw new Error('useFormulations must be used within a FormulationProvider');
  }
  return context;
};

// Mapper: DB -> React
export const mapDbToReactFormulation = (dbForm) => {
  return {
    id: String(dbForm.id),
    name: dbForm.product_name || '',
    productId: dbForm.product_id || '',
    description: dbForm.notes || '',
    baseVolume: parseFloat(dbForm.batch_size) || 1000,
    baseUnit: dbForm.batch_unit || 'L',
    status: dbForm.status || 'Draft',
    batchNo: dbForm.batch_no || '',
    ingredients: (dbForm.ingredients || []).map(ing => ({
      productId: ing.product_id || '',
      name: ing.product_name || '',
      percentage: parseFloat(ing.percentage) || 0,
      quantity: parseFloat(ing.quantity) || 0,
      costPerUnit: parseFloat(ing.cost_per_unit) || 0,
      unit: ing.unit || 'L',
      entryMode: ing.entry_mode || 'percentage'
    }))
  };
};

// Mapper: React -> DB
export const mapReactToDbFormulation = (reactForm) => {
  return {
    product_id: parseInt(reactForm.productId, 10),
    product_name: reactForm.name,
    batch_no: reactForm.batchNo || 'B-' + Date.now(),
    batch_size: parseFloat(reactForm.baseVolume) || 1000,
    batch_unit: reactForm.baseUnit || 'L',
    status: reactForm.status || 'Draft',
    notes: reactForm.description || '',
    ingredients: (reactForm.ingredients || []).map(ing => ({
      product_id: parseInt(ing.productId, 10),
      product_name: ing.name,
      percentage: parseFloat(ing.percentage) || 0,
      quantity: parseFloat(ing.quantity) || 0,
      unit: ing.unit || reactForm.baseUnit || 'L',
      cost_per_unit: parseFloat(ing.costPerUnit) || 0,
      entry_mode: ing.entryMode || 'percentage'
    }))
  };
};

export const FormulationProvider = ({ children }) => {
  const [formulations, setFormulations] = useState([]);
  const [products, setProducts] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all data from ERP backend
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch formulations, products, and inventory items in parallel
      const [formResponse, prodResponse, invResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/formulations`),
        fetch(`${API_BASE_URL}/products`),
        fetch(`${API_BASE_URL}/inventory`)
      ]);

      if (!formResponse.ok) throw new Error('Failed to fetch formulations');
      if (!prodResponse.ok) throw new Error('Failed to fetch products');
      if (!invResponse.ok) throw new Error('Failed to fetch inventory');

      const formsData = await formResponse.json();
      const prodsData = await prodResponse.json();
      const invsData = await invResponse.json();

      setProducts(prodsData);
      setInventoryItems(invsData);
      setFormulations(formsData.map(mapDbToReactFormulation));
    } catch (err) {
      console.error('Error fetching ERP data:', err);
      setError(err.message);
      setFormulations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addFormulation = async (formulation) => {
    try {
      const dbPayload = mapReactToDbFormulation(formulation);
      const response = await fetch(`${API_BASE_URL}/formulations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dbPayload),
      });
      if (!response.ok) {
        let errMsg = 'Failed to add formulation';
        try {
          const errData = await response.json();
          if (errData && errData.message) errMsg = errData.message;
        } catch (_) {}
        throw new Error(errMsg);
      }
      const resData = await response.json();
      
      // Reload everything to get the fresh mapped structure
      await fetchData();
      return resData.id;
    } catch (err) {
      console.error('Error adding formulation:', err);
      setError(err.message);
      throw err;
    }
  };

  const updateFormulation = async (id, updatedFormulation) => {
    try {
      const dbPayload = mapReactToDbFormulation(updatedFormulation);
      const response = await fetch(`${API_BASE_URL}/formulations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dbPayload),
      });
      if (!response.ok) {
        let errMsg = 'Failed to update formulation';
        try {
          const errData = await response.json();
          if (errData && errData.message) errMsg = errData.message;
        } catch (_) {}
        throw new Error(errMsg);
      }
      
      // Reload to get fresh state
      await fetchData();
    } catch (err) {
      console.error('Error updating formulation:', err);
      setError(err.message);
      throw err;
    }
  };

  const deleteFormulation = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/formulations/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete formulation');
      setFormulations(formulations.filter(f => f.id !== id));
    } catch (err) {
      console.error('Error deleting formulation:', err);
      setError(err.message);
      throw err;
    }
  };

  const duplicateFormulation = async (id) => {
    try {
      const existing = formulations.find(f => f.id === id);
      if (!existing) throw new Error('Formulation not found to duplicate');
      
      const duplicateForm = {
        ...existing,
        name: `${existing.name} (Copy)`,
        status: 'Draft',
        batchNo: ''
      };
      
      await addFormulation(duplicateForm);
    } catch (err) {
      console.error('Error duplicating formulation:', err);
      setError(err.message);
      throw err;
    }
  };

  const getFormulation = (id) => {
    return formulations.find(f => f.id === id);
  };

  const value = {
    formulations,
    products,
    inventoryItems,
    loading,
    error,
    addFormulation,
    updateFormulation,
    deleteFormulation,
    duplicateFormulation,
    getFormulation,
    refreshData: fetchData,
    checkUniqueProductName: (name, excludeId = null) => {
      return true; 
    },
  };

  return (
    <FormulationContext.Provider value={value}>
      {children}
    </FormulationContext.Provider>
  );
};
