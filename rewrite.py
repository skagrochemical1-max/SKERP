import re

with open(r"E:\S K Agro\Website\ERP Supabase)\assets\js\orders.js", "r", encoding="utf-8") as f:
    content = f.read()

# 1. fetchPackagingData
content = re.sub(
    r"const res = await fetch\('/api/products/packaging'\);\s*if \(res\.ok\) \{\s*allPackagingData = await res\.json\(\);\s*\}\s*const invRes = await fetch\('/api/inventory'\);\s*if \(invRes\.ok\) \{\s*const allInv = await invRes\.json\(\);\s*cachedBottlesList = allInv\.filter\(it => it\.category === 'Bottles'\);\s*\}",
    """const { data: pkgData, error: pkgErr } = await window.dbClient.from('product_packaging').select('*');
    if (!pkgErr && pkgData) {
      allPackagingData = pkgData;
    }
    const { data: invData, error: invErr } = await window.dbClient.from('inventory').select('*');
    if (!invErr && invData) {
      cachedBottlesList = invData.filter(it => it.category === 'Bottles');
    }""",
    content
)

# 2. loadOrders
content = re.sub(
    r"const res = await fetch\(`/api/orders\?_t=\$\{Date\.now\(\)\}`\);\s*if \(!res\.ok\) throw new Error\('Failed to fetch orders from API'\);\s*allOrders = await res\.json\(\);\s*// Retrieve client list to map display names\s*const resCli = await fetch\('/api/clients'\);\s*const clientsList = resCli\.ok \? await resCli\.json\(\) : \[\];",
    """const { data: ordersData, error: ordersErr } = await window.dbClient.from('orders').select('*').order('created_at', { ascending: false });
    if (ordersErr) throw ordersErr;
    allOrders = ordersData || [];
    
    // Retrieve client list to map display names
    const { data: clientsRes, error: clientsErr } = await window.dbClient.from('clients').select('*');
    const clientsList = clientsErr ? [] : clientsRes;""",
    content
)

# 3. buildDetailedOrderItems
content = re.sub(
    r"const res = await fetch\(`/api/orders/\$\{o\.id\}`\);\s*if \(res\.ok\) \{\s*const detail = await res\.json\(\);\s*items = detail\.items \|\| \[\];\s*o\.items = items;\s*\} else \{\s*items = \[\];\s*\}",
    """const { data: detailData, error: detailErr } = await window.dbClient.from('order_items').select('*').eq('order_id', o.id);
        if (!detailErr && detailData) {
          items = detailData;
          o.items = items;
        } else {
          items = [];
        }""",
    content
)

# 4. viewOrder
content = re.sub(
    r"const res = await fetch\(`/api/orders/\$\{id\}`\);\s*if \(!res\.ok\) throw new Error\('Failed to fetch order details'\);\s*const o = await res\.json\(\);",
    """const { data: o, error: oErr } = await window.dbClient.from('orders').select('*, items:order_items(*)').eq('id', id).single();
    if (oErr) throw oErr;""",
    content
)

# 5. populateClientSelect
content = re.sub(
    r"const res = await fetch\('/api/clients'\);\s*const clients = res\.ok \? await res\.json\(\) : \[\];",
    """const { data: clientsData, error } = await window.dbClient.from('clients').select('*');
    if (error) throw error;
    const clients = clientsData || [];""",
    content
)

# 6. openEdit
content = re.sub(
    r"const res = await fetch\(`/api/orders/\$\{id\}\?_t=\$\{Date\.now\(\)\}`\);\s*if \(!res\.ok\) throw new Error\('Failed to fetch order details'\);\s*const o = await res\.json\(\);",
    """const { data: o, error: oErr } = await window.dbClient.from('orders').select('*, items:order_items(*)').eq('id', id).single();
    if (oErr) throw oErr;""",
    content
)
content = re.sub(
    r"const prodRes = await fetch\('/api/products'\);\s*cachedProductsList = prodRes\.ok \? await prodRes\.json\(\) : \[\];",
    """const { data: prodData, error: prodErr } = await window.dbClient.from('products').select('*');
    cachedProductsList = prodErr ? [] : (prodData || []);""",
    content
)
content = re.sub(
    r"const pkgRes = await fetch\(`/api/products/packaging\?product_id=\$\{item\.product_id\}`\);\s*if \(pkgRes\.ok\) \{\s*const pkgs = await pkgRes\.json\(\);\s*pMatch\.packaging_options = pkgs\.filter\(pk => pk\.product_id == item\.product_id\);\s*\}",
    """const { data: pkgs, error: pkgErr } = await window.dbClient.from('product_packaging').select('*').eq('product_id', item.product_id);
            if (!pkgErr && pkgs) {
              pMatch.packaging_options = pkgs;
            }""",
    content
)

# 7. renderOrderItems
content = re.sub(
    r"const res = await fetch\('/api/products'\);\s*cachedProductsList = res\.ok \? await res\.json\(\) : \[\];",
    """const { data: prodData, error: prodErr } = await window.dbClient.from('products').select('*');
    cachedProductsList = prodErr ? [] : (prodData || []);""",
    content
)
content = re.sub(
    r"const pkgRes = await fetch\(`/api/products/packaging\?product_id=\$\{pMatch\.id\}`\);\s*if \(pkgRes\.ok\) \{\s*const pkgs = await pkgRes\.json\(\);\s*pMatch\.packaging_options = pkgs\.filter\(pk => pk\.product_id == pMatch\.id\);\s*\}",
    """const { data: pkgs, error: pkgErr } = await window.dbClient.from('product_packaging').select('*').eq('product_id', pMatch.id);
          if (!pkgErr && pkgs) {
            pMatch.packaging_options = pkgs;
          }""",
    content
)

# 8. onProductSelectChange
content = re.sub(
    r"const pkgRes = await fetch\(`/api/products/packaging\?product_id=\$\{val\}`\);\s*if \(pkgRes\.ok\) \{\s*const pkgs = await pkgRes\.json\(\);\s*pkgOptions = pkgs\.filter\(pk => pk\.product_id == val\);\s*\}",
    """const { data: pkgs, error: pkgErr } = await window.dbClient.from('product_packaging').select('*').eq('product_id', val);
      if (!pkgErr && pkgs) {
        pkgOptions = pkgs;
      }""",
    content
)

# 9. onPackSizeChange
content = re.sub(
    r"const pkgRes = await fetch\(`/api/products/packaging\?product_id=\$\{it\.product_id\}`\);\s*if \(pkgRes\.ok\) \{\s*const pkgs = await pkgRes\.json\(\);\s*pkgOptions = pkgs\.filter\(pk => pk\.product_id == it\.product_id\);\s*\}",
    """const { data: pkgs, error: pkgErr } = await window.dbClient.from('product_packaging').select('*').eq('product_id', it.product_id);
      if (!pkgErr && pkgs) {
        pkgOptions = pkgs;
      }""",
    content
)

# 10. saveOrder
save_order_replacement = '''
      if (editingOrderId) {
        const { error: updateErr } = await window.dbClient.from('orders').update({
          client_id: d.client_id,
          client_name: clientName,
          date: d.date || UTILS.todayStr(),
          due_date: d.due_date || null,
          status: d.status || 'Pending',
          total_amount: finalTotal,
          paid_amount: paidAmount,
          discount: discountPct,
          tax: taxPct,
          notes: d.notes || ''
        }).eq('id', editingOrderId);
        
        if (updateErr) throw updateErr;

        await window.dbClient.from('order_items').delete().eq('order_id', editingOrderId);
        
        if (orderItems.length > 0) {
          const { error: itemsErr } = await window.dbClient.from('order_items').insert(
            orderItems.map(it => ({
              order_id: editingOrderId,
              product_id: it.product_id,
              product_name: it.product_name,
              packaging_size: it.packaging_size || null,
              quantity: parseFloat(it.quantity) || 0,
              unit_price: parseFloat(it.unit_price) || 0,
              total: parseFloat(it.total) || 0,
              bottle_inventory_id: it.bottle_inventory_id || null
            }))
          );
          if (itemsErr) throw itemsErr;
        }
      } else {
        const payload = {
          p_order_no: d.order_no || null,
          p_client_id: d.client_id,
          p_client_name: clientName,
          p_date: d.date || UTILS.todayStr(),
          p_due_date: d.due_date || null,
          p_status: d.status || 'Pending',
          p_total_amount: finalTotal,
          p_paid_amount: paidAmount,
          p_discount: discountPct,
          p_tax: taxPct,
          p_notes: d.notes || '',
          p_items: orderItems.map(it => ({
            product_id: it.product_id,
            product_name: it.product_name,
            packaging_size: it.packaging_size || null,
            quantity: parseFloat(it.quantity) || 0,
            unit_price: parseFloat(it.unit_price) || 0,
            total: parseFloat(it.total) || 0,
            bottle_inventory_id: it.bottle_inventory_id || null
          }))
        };
        const { data, error } = await window.dbClient.rpc('place_sales_order', payload);
        if (error) {
           throw error;
        }
      }
      APP.closeModal('order-modal');
      APP.showToast('Order saved successfully!', 'success');
      await loadOrders();
'''
# Using start and end markers to replace the fetch logic in saveOrder
content = re.sub(
    r"const payload = \{.*?\};\s*const url = editingOrderId \? `/api/orders/\$\{editingOrderId\}` : '/api/orders';.*?await loadOrders\(\);\s*};",
    save_order_replacement.strip() + "\n    };",
    content,
    flags=re.DOTALL
)

# 11. deleteOrder
content = re.sub(
    r"const res = await fetch\(`/api/orders/\$\{id\}`,\s*\{\s*method:\s*'DELETE'\s*\}\);.*?if \(!res\.ok \|\| !result\.success\) throw new Error\(result\.message \|\| 'Failed to delete order'\);",
    """const { error } = await window.dbClient.from('orders').delete().eq('id', id);
      if (error) throw error;""",
    content,
    flags=re.DOTALL
)

with open(r"E:\S K Agro\Website\ERP Supabase)\assets\js\orders.js", "w", encoding="utf-8") as f:
    f.write(content)

print("Done")
