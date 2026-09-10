// Supabase fetch interceptor for React formulation app
(function() {
  const originalFetch = window.fetch;
  
  function getDbClient() {
    if (window.dbClient) return window.dbClient;
    if (window.supabase) {
      const url = 'https://uepuzyvdfyylztyecpug.supabase.co';
      const key = 'sb_publishable__UaVFmqPrT2UVq_brpCeUQ_p4r63kcz';
      window.dbClient = window.supabase.createClient(url, key, {
        auth: { storage: window.localStorage }
      });
      return window.dbClient;
    }
    return null;
  }

  window.fetch = async function(resource, config) {
    const resourceStr = typeof resource === 'string' ? resource : (resource?.url || '');
    
    if (resourceStr.includes('/api/') || resourceStr.startsWith('api/')) {
      const client = getDbClient();
      if (!client) {
        console.error('Supabase DB Client not initialized for React interceptor');
        return new Response(JSON.stringify({ message: 'Database connection not ready' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Parse path safely
      const url = new URL(resourceStr, window.location.origin);
      const path = url.pathname.replace(/^.*\/api\//, '').replace(/\/+$/, ''); // e.g. 'products', 'formulations', 'formulations/12'
      const method = (config?.method || 'GET').toUpperCase();
      
      const jsonResponse = (data) => new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
      const errorResponse = (msg, status = 400) => new Response(JSON.stringify({ message: msg }), {
        status,
        headers: { 'Content-Type': 'application/json' }
      });

      try {
        if (path === 'products' && method === 'GET') {
          const { data, error } = await client.from('products').select('*').order('name');
          if (error) throw error;
          return jsonResponse(data || []);
        }
        
        if (path === 'inventory' && method === 'GET') {
          const { data, error } = await client.from('inventory_items').select('*').order('name');
          if (error) throw error;
          return jsonResponse(data || []);
        }

        if (path === 'formulations' && method === 'GET') {
          const { data: forms, error: formsErr } = await client.from('formulations').select('*').order('id', { ascending: false });
          if (formsErr) throw formsErr;
          
          const { data: ings, error: ingsErr } = await client.from('formulation_ingredients').select('*');
          if (ingsErr) throw ingsErr;
          
          const result = (forms || []).map(f => {
            const fIngs = (ings || []).filter(i => String(i.formulation_id) === String(f.id)).map(i => ({
              id: i.id,
              product_name: i.product_name,
              product_id: i.product_id || '',
              percentage: parseFloat(i.percentage) || 0,
              quantity: parseFloat(i.quantity) || 0,
              unit: i.unit || 'L',
              cost_per_unit: parseFloat(i.cost_per_unit) || 0,
              entry_mode: i.entry_mode || (parseFloat(i.percentage) > 0 ? 'percentage' : 'quantity')
            }));
            return {
              id: f.id,
              product_name: f.product_name || `Formulation ${f.id}`,
              product_id: f.product_id,
              notes: f.notes || '',
              batch_size: parseFloat(f.batch_size) || 1000,
              batch_unit: f.batch_unit || 'L',
              status: f.status || 'Draft',
              batch_no: f.batch_no || '',
              ingredients: fIngs
            };
          });
          return jsonResponse(result);
        }

        if (path.startsWith('formulations/') && method === 'GET') {
          const id = path.split('/')[1];
          const { data: forms, error: formErr } = await client.from('formulations').select('*').eq('id', id);
          if (formErr) throw formErr;
          if (!forms || !forms.length) return errorResponse('Formulation not found', 404);
          
          const f = forms[0];
          const { data: ings, error: ingsErr } = await client.from('formulation_ingredients').select('*').eq('formulation_id', id);
          if (ingsErr) throw ingsErr;

          const fIngs = (ings || []).map(i => ({
            id: i.id,
            product_name: i.product_name,
            product_id: i.product_id || '',
            percentage: parseFloat(i.percentage) || 0,
            quantity: parseFloat(i.quantity) || 0,
            unit: i.unit || 'L',
            cost_per_unit: parseFloat(i.cost_per_unit) || 0,
            entry_mode: i.entry_mode || (parseFloat(i.percentage) > 0 ? 'percentage' : 'quantity')
          }));

          return jsonResponse({
            id: f.id,
            product_name: f.product_name || `Formulation ${f.id}`,
            product_id: f.product_id,
            notes: f.notes || '',
            batch_size: parseFloat(f.batch_size) || 1000,
            batch_unit: f.batch_unit || 'L',
            status: f.status || 'Draft',
            batch_no: f.batch_no || '',
            ingredients: fIngs
          });
        }

        if (path === 'formulations' && method === 'POST') {
          const body = JSON.parse(config.body || '{}');
          
          let prodId = body.product_id;
          if (prodId === '' || prodId === undefined || prodId === null || Number.isNaN(Number(prodId))) {
            prodId = null;
          } else {
            prodId = Number(prodId);
          }

          const payload = {
            product_id: prodId,
            product_name: body.product_name || '',
            batch_no: body.batch_no || ('BATCH-' + Date.now().toString().slice(-6)),
            batch_size: parseFloat(body.batch_size) || 1000,
            batch_unit: body.batch_unit || 'L',
            notes: body.notes || '',
            status: body.status || 'Draft'
          };
          
          const { data, error } = await client.from('formulations').insert([payload]).select();
          if (error) throw error;
          if (!data || !data.length) throw new Error('Failed to insert formulation');
          const newId = data[0].id;
          
          if (body.ingredients && body.ingredients.length > 0) {
            const ingPayload = body.ingredients.map(ing => {
              let pName = ing.product_name || ing.name || '';
              let pId = ing.product_id || ing.productId;
              if (pId === '' || pId === undefined || pId === null || Number.isNaN(Number(pId))) {
                pId = null;
              } else {
                pId = Number(pId);
              }
              
              return {
                formulation_id: Number(newId),
                product_name: pName,
                product_id: pId,
                percentage: parseFloat(ing.percentage) || 0,
                quantity: parseFloat(ing.quantity) || 0,
                unit: ing.unit || body.batch_unit || 'L',
                cost_per_unit: parseFloat(ing.cost_per_unit || ing.costPerUnit) || 0,
                entry_mode: ing.entry_mode || ing.entryMode || 'percentage'
              };
            });
            const { error: insertErr } = await client.from('formulation_ingredients').insert(ingPayload);
            if (insertErr) throw new Error(insertErr.message);
          }
          
          return jsonResponse({ id: newId, success: true });
        }

        if (path.startsWith('formulations/') && method === 'PUT') {
          const id = path.split('/')[1];
          const body = JSON.parse(config.body || '{}');
          
          let prodId = body.product_id;
          if (prodId === '' || prodId === undefined || prodId === null || Number.isNaN(Number(prodId))) {
            prodId = null;
          } else {
            prodId = Number(prodId);
          }

          const payload = {
            product_id: prodId,
            product_name: body.product_name || '',
            batch_no: body.batch_no || ('BATCH-' + Date.now().toString().slice(-6)),
            batch_size: parseFloat(body.batch_size) || 1000,
            batch_unit: body.batch_unit || 'L',
            notes: body.notes || '',
            status: body.status || 'Draft'
          };
          
          const { error: updateErr } = await client.from('formulations').update(payload).eq('id', id);
          if (updateErr) throw updateErr;

          await client.from('formulation_ingredients').delete().eq('formulation_id', id);
          
          if (body.ingredients && body.ingredients.length > 0) {
            const ingPayload = body.ingredients.map(ing => {
              let pName = ing.product_name || ing.name || '';
              let pId = ing.product_id || ing.productId;
              if (pId === '' || pId === undefined || pId === null || Number.isNaN(Number(pId))) {
                pId = null;
              } else {
                pId = Number(pId);
              }
              
              return {
                formulation_id: Number(id),
                product_name: pName,
                product_id: pId,
                percentage: parseFloat(ing.percentage) || 0,
                quantity: parseFloat(ing.quantity) || 0,
                unit: ing.unit || body.batch_unit || 'L',
                cost_per_unit: parseFloat(ing.cost_per_unit || ing.costPerUnit) || 0,
                entry_mode: ing.entry_mode || ing.entryMode || 'percentage'
              };
            });
            const { error: insertErr } = await client.from('formulation_ingredients').insert(ingPayload);
            if (insertErr) throw new Error(insertErr.message);
          }
          
          return jsonResponse({ success: true, id });
        }

        if (path.startsWith('formulations/') && method === 'DELETE') {
          const id = path.split('/')[1];
          const { error } = await client.from('formulations').delete().eq('id', id);
          if (error) throw error;
          return jsonResponse({ success: true });
        }

      } catch (err) {
        console.error('react-interceptor error:', err);
        return errorResponse(err.message || 'Operation failed');
      }
    }
    
    return originalFetch(resource, config);
  };
})();
