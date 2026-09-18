DO \
DECLARE
  v_tech_id INT;
  v_bottle_id INT;
  v_qty DOUBLE PRECISION := 65;
  v_pack_size VARCHAR := '';
  v_product_name VARCHAR := 'Abamectin 1.9% EC';
  v_product_id INT := 1; 
  v_formulation RECORD;
  v_item_tech_name VARCHAR;
BEGIN
  RAISE NOTICE 'ORDER PRODUCT Name: %, Quantity: %, Pack Size: %', v_product_name, v_qty, v_pack_size;

  -- 1. Try Formulation
  SELECT * INTO v_formulation FROM formulations WHERE LOWER(product_name) = LOWER(v_product_name) LIMIT 1;
  IF FOUND AND v_formulation.batch_size > 0 THEN
    RAISE NOTICE 'FOUND FORMULATION: %', v_formulation.id;
  ELSE
    RAISE NOTICE 'NO FORMULATION FOUND. CHECKING REPACKAGED TECHNICAL.';
    SELECT id, name INTO v_tech_id, v_item_tech_name FROM inventory_items WHERE LOWER(name) = LOWER(v_product_name) AND category IN ('Technical', 'Others') LIMIT 1;
    IF FOUND THEN
      RAISE NOTICE 'FOUND REPACKAGED TECHNICAL ID: % Name: %', v_tech_id, v_item_tech_name;
    ELSE
      RAISE NOTICE 'NO MATCHING TECHNICAL ITEM FOUND EITHER!';
      -- Let's see what IS in inventory items
      RAISE NOTICE 'Available Technical items:';
      FOR v_formulation IN SELECT id, name, category FROM inventory_items WHERE category = 'Technical' LOOP
        RAISE NOTICE '  - ID: %, Name: %', v_formulation.id, v_formulation.name;
      END LOOP;
    END IF;
  END IF;
END \;
