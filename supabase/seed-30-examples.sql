-- ═══════════════════════════════════════════════════════
-- FamInventar - 30 Beispieldatensaetze
-- ═══════════════════════════════════════════════════════
-- WICHTIG: Fuehre dieses Script als eingeloggter User aus
-- oder ersetze auth.uid() mit deiner User-UUID.
--
-- Um deine User-UUID zu finden:
-- SELECT id FROM auth.users LIMIT 1;
-- ═══════════════════════════════════════════════════════

-- Cleanup existing sample data (optional - entkommentieren falls noetig)
-- DELETE FROM fm_play_logs;
-- DELETE FROM fm_items;
-- DELETE FROM fm_collections;
-- DELETE FROM fm_sales;
-- DELETE FROM fm_purchases;
-- DELETE FROM fm_products;
-- DELETE FROM fm_tracker_entries;
-- DELETE FROM fm_smoking_materials;
-- DELETE FROM fm_trackers;

-- ═══════════════════════════════════════════
-- Schritt 1: Hole deine User-ID
-- ═══════════════════════════════════════════

DO $$
DECLARE
  my_uid UUID;
  -- Collection IDs
  col_schuhe UUID;
  col_elektronik UUID;
  col_spielzeug UUID;
  col_buecher UUID;
  col_werkzeug UUID;
  -- Item IDs (fuer Play Logs)
  item_lego UUID;
  item_teddy UUID;
  item_puzzle UUID;
  -- Product IDs
  prod_tee UUID;
  prod_kaffee UUID;
  prod_gewuerz UUID;
  -- Purchase IDs
  purch_tee1 UUID;
  purch_kaffee1 UUID;
  purch_gewuerz1 UUID;
  -- Tracker IDs
  tracker_zig UUID;
  tracker_wasser UUID;
  tracker_sport UUID;
BEGIN
  -- Hole ersten User
  SELECT id INTO my_uid FROM auth.users LIMIT 1;
  IF my_uid IS NULL THEN
    RAISE EXCEPTION 'Kein User gefunden! Bitte zuerst registrieren.';
  END IF;

  RAISE NOTICE 'User-ID: %', my_uid;

  -- ═══════════════════════════════════════════
  -- MODUL 1: INVENTAR (5 Collections, 15 Items)
  -- ═══════════════════════════════════════════

  -- Collections
  INSERT INTO fm_collections (id, user_id, name, type, icon) VALUES
    (gen_random_uuid(), my_uid, 'Schuhe', 'normal', '👟')
    RETURNING id INTO col_schuhe;

  INSERT INTO fm_collections (id, user_id, name, type, icon) VALUES
    (gen_random_uuid(), my_uid, 'Elektronik', 'normal', '📱')
    RETURNING id INTO col_elektronik;

  INSERT INTO fm_collections (id, user_id, name, type, icon) VALUES
    (gen_random_uuid(), my_uid, 'Spielzeug', 'toy', '🧸')
    RETURNING id INTO col_spielzeug;

  INSERT INTO fm_collections (id, user_id, name, type, icon) VALUES
    (gen_random_uuid(), my_uid, 'Buecher', 'normal', '📚')
    RETURNING id INTO col_buecher;

  INSERT INTO fm_collections (id, user_id, name, type, icon) VALUES
    (gen_random_uuid(), my_uid, 'Werkzeug', 'normal', '🔧')
    RETURNING id INTO col_werkzeug;

  -- Items: Schuhe (3)
  INSERT INTO fm_items (collection_id, name, value, category, location, acquired_type, acquired_from) VALUES
    (col_schuhe, 'Nike Air Max 90', 149.99, 'schuhe', 'zuhause', 'gekauft', 'Foot Locker'),
    (col_schuhe, 'Adidas Stan Smith', 89.95, 'schuhe', 'zuhause', 'gekauft', 'Amazon'),
    (col_schuhe, 'Winterstiefel Kinder', 45.00, 'schuhe', 'keller', 'geschenkt', 'Oma');

  -- Items: Elektronik (3)
  INSERT INTO fm_items (collection_id, name, value, category, location, acquired_type, acquired_from, acquired_date) VALUES
    (col_elektronik, 'iPad Air 2024', 699.00, 'elektronik', 'zuhause', 'gekauft', 'Apple Store', '2024-09-15'),
    (col_elektronik, 'PlayStation 5', 499.00, 'konsolen', 'zuhause', 'gekauft', 'MediaMarkt', '2024-01-10'),
    (col_elektronik, 'AirPods Pro', 279.00, 'elektronik', 'ausgeborgt', 'gekauft', 'Amazon', '2024-06-01');

  UPDATE fm_items SET borrowed_to = 'Bruder Ali' WHERE name = 'AirPods Pro' AND collection_id = col_elektronik;

  -- Items: Spielzeug (4) - fuer Play Logs
  INSERT INTO fm_items (id, collection_id, name, value, category, location, acquired_type, acquired_from, acquired_occasion)
  VALUES (gen_random_uuid(), col_spielzeug, 'LEGO Technic Porsche', 179.99, 'lego', 'zuhause', 'geschenkt', 'Papa', 'geburtstag')
  RETURNING id INTO item_lego;

  INSERT INTO fm_items (id, collection_id, name, value, category, location, acquired_type, acquired_from, acquired_occasion)
  VALUES (gen_random_uuid(), col_spielzeug, 'Teddybaer Bruno', 29.99, 'puppen', 'zuhause', 'geschenkt', 'Tante Fatima', 'eid')
  RETURNING id INTO item_teddy;

  INSERT INTO fm_items (id, collection_id, name, value, category, location)
  VALUES (gen_random_uuid(), col_spielzeug, 'Ravensburger Puzzle 1000', 19.99, 'puzzle', 'zuhause')
  RETURNING id INTO item_puzzle;

  INSERT INTO fm_items (collection_id, name, value, category, location, acquired_type, acquired_from)
  VALUES (col_spielzeug, 'Hot Wheels Track Builder', 39.99, 'autos', 'zuhause', 'gekauft', 'Toys R Us');

  -- Items: Buecher (3)
  INSERT INTO fm_items (collection_id, name, value, category, location) VALUES
    (col_buecher, 'Harry Potter Box Set', 69.99, 'buecher', 'zuhause'),
    (col_buecher, 'Gregs Tagebuch 1-5', 49.95, 'buecher', 'zuhause'),
    (col_buecher, 'Der kleine Prinz', 12.00, 'buecher', 'ausgeborgt');

  UPDATE fm_items SET borrowed_to = 'Nachbar Yusuf' WHERE name = 'Der kleine Prinz' AND collection_id = col_buecher;

  -- Items: Werkzeug (2)
  INSERT INTO fm_items (collection_id, name, value, category, location, acquired_type, acquired_from) VALUES
    (col_werkzeug, 'Bosch Akkuschrauber', 89.00, 'werkzeug', 'garage', 'gekauft', 'Hornbach'),
    (col_werkzeug, 'Werkzeugkoffer 120-teilig', 59.99, 'werkzeug', 'keller', 'gekauft', 'OBI');

  -- Play Logs (fuer Spielzeug)
  INSERT INTO fm_play_logs (item_id, played_at, duration_minutes, notes) VALUES
    (item_lego, NOW() - INTERVAL '1 day', 45, 'Porsche zusammengebaut - Teil 1'),
    (item_lego, NOW() - INTERVAL '2 days', 60, 'Porsche fertig gebaut!'),
    (item_lego, NOW() - INTERVAL '5 days', 30, 'Motor eingebaut'),
    (item_lego, NOW() - INTERVAL '10 days', 90, 'Erste Tueten geoeffnet'),
    (item_teddy, NOW() - INTERVAL '1 day', 20, 'Gute-Nacht-Geschichte mit Bruno'),
    (item_teddy, NOW() - INTERVAL '3 days', 15, 'Teddy-Picknick'),
    (item_teddy, NOW() - INTERVAL '7 days', 25, 'Bruno war beim Arzt'),
    (item_puzzle, NOW() - INTERVAL '2 days', 45, 'Rand fertig'),
    (item_puzzle, NOW() - INTERVAL '4 days', 60, 'Puzzle angefangen');

  -- ═══════════════════════════════════════════
  -- MODUL 2: HANDEL (3 Produkte, 5 Einkaeufe, 4 Verkaeufe)
  -- ═══════════════════════════════════════════

  -- Produkte
  INSERT INTO fm_products (id, user_id, name, category, unit, low_stock_threshold)
  VALUES (gen_random_uuid(), my_uid, 'Gruener Tee Sencha', 'tee', 'kg', 2)
  RETURNING id INTO prod_tee;

  INSERT INTO fm_products (id, user_id, name, category, unit, low_stock_threshold)
  VALUES (gen_random_uuid(), my_uid, 'Arabica Kaffee Premium', 'kaffee', 'kg', 1)
  RETURNING id INTO prod_kaffee;

  INSERT INTO fm_products (id, user_id, name, category, unit, low_stock_threshold)
  VALUES (gen_random_uuid(), my_uid, 'Safran Premium Iran', 'gewuerze', 'g', 10)
  RETURNING id INTO prod_gewuerz;

  -- Einkaeufe
  INSERT INTO fm_purchases (id, user_id, product_id, batch_id, quantity, total_price, supplier, purchase_date, status)
  VALUES (gen_random_uuid(), my_uid, prod_tee, 'GRUN-2026-001', 5.0, 75.00, 'Tee-Import GmbH', '2026-01-15', 'teilweise_verkauft')
  RETURNING id INTO purch_tee1;

  INSERT INTO fm_purchases (user_id, product_id, batch_id, quantity, total_price, supplier, purchase_date, status)
  VALUES (my_uid, prod_tee, 'GRUN-2026-002', 3.0, 48.00, 'Tee-Import GmbH', '2026-02-20', 'im_lager');

  INSERT INTO fm_purchases (id, user_id, product_id, batch_id, quantity, total_price, supplier, purchase_date, status)
  VALUES (gen_random_uuid(), my_uid, prod_kaffee, 'ARAB-2026-001', 4.0, 96.00, 'Kaffee-Kontor Berlin', '2026-02-01', 'teilweise_verkauft')
  RETURNING id INTO purch_kaffee1;

  INSERT INTO fm_purchases (user_id, product_id, batch_id, quantity, total_price, supplier, purchase_date, status)
  VALUES (my_uid, prod_kaffee, 'ARAB-2026-002', 2.0, 52.00, 'Kaffee-Kontor Berlin', '2026-03-01', 'eingekauft');

  INSERT INTO fm_purchases (id, user_id, product_id, batch_id, quantity, total_price, supplier, purchase_date, status)
  VALUES (gen_random_uuid(), my_uid, prod_gewuerz, 'SAFR-2026-001', 50.0, 250.00, 'Gewuerzbasar Istanbul', '2026-01-20', 'teilweise_verkauft')
  RETURNING id INTO purch_gewuerz1;

  -- Verkaeufe
  INSERT INTO fm_sales (user_id, purchase_id, buyer, quantity, sale_price, sale_date, status) VALUES
    (my_uid, purch_tee1, 'Laden am Markt', 2.0, 40.00, '2026-02-01', 'abgeschlossen'),
    (my_uid, purch_tee1, 'Online-Shop Kunde', 1.0, 22.00, '2026-02-15', 'bezahlt'),
    (my_uid, purch_kaffee1, 'Cafe Zentral', 2.0, 60.00, '2026-02-20', 'abgeschlossen'),
    (my_uid, purch_gewuerz1, 'Restaurant Beirut', 20.0, 150.00, '2026-02-10', 'bezahlt');

  -- ═══════════════════════════════════════════
  -- MODUL 3: TRACKER (3 Tracker, ~20 Eintraege)
  -- ═══════════════════════════════════════════

  -- Zigaretten-Tracker
  INSERT INTO fm_trackers (id, user_id, name, icon, color, type, unit, daily_goal, goal_direction, cost_per_unit, has_subtypes, subtypes, is_smoking_tracker)
  VALUES (gen_random_uuid(), my_uid, 'Zigaretten', '🚬', '#EF4444', 'kombi', 'Stk.', 10, 'max', 0.35, true, ARRAY['gekauft', 'gedreht', 'e-zig'], true)
  RETURNING id INTO tracker_zig;

  -- Wasser-Tracker
  INSERT INTO fm_trackers (id, user_id, name, icon, color, type, unit, daily_goal, goal_direction)
  VALUES (gen_random_uuid(), my_uid, 'Wasser trinken', '💧', '#3B82F6', 'counter', 'Glaeser', 8, 'min')
  RETURNING id INTO tracker_wasser;

  -- Sport-Tracker
  INSERT INTO fm_trackers (id, user_id, name, icon, color, type, unit, daily_goal, goal_direction)
  VALUES (gen_random_uuid(), my_uid, 'Sport / Training', '💪', '#10B981', 'zeit', 'Min.', 30, 'min')
  RETURNING id INTO tracker_sport;

  -- Smoking Materials
  INSERT INTO fm_smoking_materials (user_id, tracker_id, name, package_amount, package_unit, package_price, usage_per_cig, sort_order) VALUES
    (my_uid, tracker_zig, 'Tabak (30g)', 30, 'g', 7.00, 0.7, 1),
    (my_uid, tracker_zig, 'Blaettchen (50 Stk.)', 50, 'Stk.', 1.50, 1, 2),
    (my_uid, tracker_zig, 'Filter (120 Stk.)', 120, 'Stk.', 1.20, 1, 3);

  -- Tracker Entries: Zigaretten (letzte 7 Tage)
  INSERT INTO fm_tracker_entries (user_id, tracker_id, date, count, cost, subtype, time_of_day) VALUES
    (my_uid, tracker_zig, CURRENT_DATE, 3, 1.05, 'gekauft', '08:30'),
    (my_uid, tracker_zig, CURRENT_DATE, 2, 0.54, 'gedreht', '12:00'),
    (my_uid, tracker_zig, CURRENT_DATE - 1, 8, 2.80, 'gekauft', '10:00'),
    (my_uid, tracker_zig, CURRENT_DATE - 1, 4, 1.08, 'gedreht', '15:00'),
    (my_uid, tracker_zig, CURRENT_DATE - 2, 6, 2.10, 'gekauft', '09:00'),
    (my_uid, tracker_zig, CURRENT_DATE - 2, 3, 0.81, 'gedreht', '18:00'),
    (my_uid, tracker_zig, CURRENT_DATE - 3, 11, 3.85, 'gekauft', '08:00'),
    (my_uid, tracker_zig, CURRENT_DATE - 4, 9, 3.15, 'gekauft', '09:30'),
    (my_uid, tracker_zig, CURRENT_DATE - 4, 2, 0.54, 'gedreht', '20:00'),
    (my_uid, tracker_zig, CURRENT_DATE - 5, 7, 2.45, 'gekauft', '11:00'),
    (my_uid, tracker_zig, CURRENT_DATE - 6, 10, 3.50, 'gekauft', '08:00');

  -- Tracker Entries: Wasser (letzte 7 Tage)
  INSERT INTO fm_tracker_entries (user_id, tracker_id, date, count, time_of_day) VALUES
    (my_uid, tracker_wasser, CURRENT_DATE, 5, '14:00'),
    (my_uid, tracker_wasser, CURRENT_DATE - 1, 8, '21:00'),
    (my_uid, tracker_wasser, CURRENT_DATE - 2, 6, '20:00'),
    (my_uid, tracker_wasser, CURRENT_DATE - 3, 9, '22:00'),
    (my_uid, tracker_wasser, CURRENT_DATE - 4, 7, '19:00'),
    (my_uid, tracker_wasser, CURRENT_DATE - 5, 4, '18:00'),
    (my_uid, tracker_wasser, CURRENT_DATE - 6, 8, '21:00');

  -- Tracker Entries: Sport (letzte 7 Tage)
  INSERT INTO fm_tracker_entries (user_id, tracker_id, date, count, duration_minutes, time_of_day, notes) VALUES
    (my_uid, tracker_sport, CURRENT_DATE, 45, 45, '07:00', 'Joggen im Park'),
    (my_uid, tracker_sport, CURRENT_DATE - 1, 30, 30, '18:00', 'Krafttraining'),
    (my_uid, tracker_sport, CURRENT_DATE - 3, 60, 60, '10:00', 'Schwimmen'),
    (my_uid, tracker_sport, CURRENT_DATE - 4, 20, 20, '07:30', 'Yoga'),
    (my_uid, tracker_sport, CURRENT_DATE - 6, 40, 40, '17:00', 'Radfahren');

  RAISE NOTICE 'Fertig! 30 Beispieldaten eingefuegt.';
  RAISE NOTICE '- 5 Collections mit 15 Items';
  RAISE NOTICE '- 9 Play Logs';
  RAISE NOTICE '- 3 Produkte, 5 Einkaeufe, 4 Verkaeufe';
  RAISE NOTICE '- 3 Tracker mit 23 Eintraegen + 3 Materialien';

END $$;
