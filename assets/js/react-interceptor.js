// Supabase fetch interceptor for React app
(function() {
  const originalFetch = window.fetch;
  
  window.fetch = async function(resource, config) {
    if (typeof resource === 'string' && resource.includes('/api/')) {
      // Mock the backend using Supabase
      const url = new URL(resource, window.location.origin);
      const path = url.pathname.replace('/api/', ''); // e.g. formulations
      const method = config?.method || 'GET';
      
      const jsonResponse = (data) => new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });
      const errorResponse = (msg) => new Response(JSON.stringify({ message: msg }), { status: 400, headers: { 'Content-Type': 'application/json' } });

      try {
        if (path === 'products' && method === 'GET') {
          const { data } = await window.dbClient.from('products').select('*');
          return jsonResponse(data || []);
        }
        
        if (path === 'inventory' && method === 'GET') {
          const { data } = await window.dbClient.from('inventory_items').select('*');
          return jsonResponse(data || []);
        }

        if (path === 'formulations' && method === 'GET') {
          const { data: forms } = await window.dbClient.from('formulations').select('*');
          const { data: ings } = await window.dbClient.from('formulation_ingredients').select('*');
          
          const result = (forms || []).map(f => {
            const fIngs = (ings || []).filter(i => i.formulation_id === f.id).map(i => ({
              id: i.id,
              product_name: i.ingredient_name,
              product_id: '',
              percentage: i.percentage,
              quantity: i.quantity,
              unit: i.unit,
              cost_per_unit: i.cost_per_unit,
              entry_mode: i.percentage > 0 ? 'percentage' : 'quantity'
            }));
            return {
              id: f.id,
              product_name: f.product_name || `Formulation ${f.id}`,
              product_id: f.product_id,
              notes: f.notes || '',
              batch_size: f.batch_size || 1000,
              batch_unit: f.batch_unit || 'L',
              status: f.status || 'Draft',
              batch_no: f.batch_no || '',
              ingredients: fIngs
            };
          });
          return jsonResponse(result);
        }

        if (path === 'formulations' && method === 'POST') {
          const body = JSON.parse(config.body);
          
          const payload = {
            product_id: body.product_id || null,
            product_name: body.product_name,
            batch_size: body.batch_size || 1000,
            batch_unit: body.batch_unit || 'L',
            notes: body.notes || '',
            status: body.status || 'Draft'
          };
          
          const { data, error } = await window.dbClient.from('formulations').insert([payload]).select();
          if (error) throw error;
          const newId = data[0].id;
          
          if (body.ingredients && body.ingredients.length > 0) {
            const ingPayload = body.ingredients.map(ing => ({
              formulation_id: newId,
              ingredient_name: ing.product_name || ing.name,
              percentage: ing.percentage || 0,
              quantity: ing.quantity || 0,
              unit: ing.unit || '',
              cost_per_unit: ing.cost_per_unit || ing.costPerUnit || 0
            }));
            await window.dbClient.from('formulation_ingredients').insert(ingPayload);
          }
          
          return jsonResponse({ id: newId });
        }

        if (path.startsWith('formulations/') && method === 'PUT') {
          const id = path.split('/')[1];
          const body = JSON.parse(config.body);
          
          const payload = {
            product_id: body.product_id || null,
            product_name: body.product_name,
            batch_size: body.batch_size || 1000,
            batch_unit: body.batch_unit || 'L',
            notes: body.notes || '',
            status: body.status || 'Draft'
          };
          
          await window.dbClient.from('formulations').update(payload).eq('id', id);
          await window.dbClient.from('formulation_ingredients').delete().eq('formulation_id', id);
          
          if (body.ingredients && body.ingredients.length > 0) {
            const ingPayload = body.ingredients.map(ing => ({
              formulation_id: id,
              ingredient_name: ing.product_name || ing.name,
              percentage: ing.percentage || 0,
              quantity: ing.quantity || 0,
              unit: ing.unit || '',
              cost_per_unit: ing.cost_per_unit || ing.costPerUnit || 0
            }));
            await window.dbClient.from('formulation_ingredients').insert(ingPayload);
          }
          
          return jsonResponse({ success: true });
        }

        if (path.startsWith('formulations/') && method === 'DELETE') {
          const id = path.split('/')[1];
          await window.dbClient.from('formulations').delete().eq('id', id);
          return jsonResponse({ success: true });
        }

      } catch (err) {
        return errorResponse(err.message);
      }
    }
    
    return originalFetch(resource, config);
  };
})();
