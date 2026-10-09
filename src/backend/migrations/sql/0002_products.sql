-- Danh mục nguyên liệu dùng chung (products + product_nutritions). Dữ liệu tham chiếu, chạy ở mọi môi trường.
-- Dữ liệu mẫu của người dùng (tài khoản, công thức, cân nặng, bữa ăn) nằm ở scripts/seed_dev.py, chỉ dùng cho dev.
--
-- Calo theo USDA / Bảng thành phần thực phẩm Việt Nam, giá theo chợ, siêu thị 2026; dòng nào khác DB cũ có
-- ghi chú "cũ: …". id được ghi cứng để seed dev tham chiếu ổn định; cuối file đẩy sequence theo.

INSERT INTO products (id, name) VALUES
  (1, 'Cơm trắng (đã nấu)'),
  (2, 'Ức gà (sống)'),
  (3, 'Thịt heo nạc'),
  (4, 'Thịt bò thăn'),
  (5, 'Cá hồi phi lê'),
  (6, 'Cá basa phi lê'),
  (7, 'Trứng gà'),
  (8, 'Đậu hũ trắng'),
  (9, 'Bún tươi'),
  (10, 'Bánh phở tươi'),
  (11, 'Rau muống'),
  (12, 'Bông cải xanh'),
  (13, 'Cà chua'),
  (14, 'Dưa leo'),
  (15, 'Cà rốt'),
  (16, 'Chuối'),
  (17, 'Táo'),
  (18, 'Sữa tươi không đường'),
  (19, 'Yến mạch'),
  (20, 'Bánh mì không'),
  (21, 'Dầu ăn'),
  (22, 'Khoai lang'),
  (23, 'Tôm sú'),
  (24, 'Sữa chua không đường'),
  (25, 'Hạt hạnh nhân'),
  (26, 'Đường cát'),
  (27, 'Nước mắm'),
  (28, 'Xà lách'),
  (29, 'Tỏi');

-- (id, product_id, measure_unit, measurement, calories, price)
INSERT INTO product_nutritions (id, product_id, measure_unit, measurement, calories, price) VALUES
  (1, 1, 'gram', 100, 130, 1000),     -- cũ: giá 2000; gạo ~22.000đ/kg, 100 g cơm ≈ 40 g gạo
  (2, 2, 'gram', 100, 120, 9000),
  (3, 3, 'gram', 100, 143, 12000),
  (4, 4, 'gram', 100, 150, 28000),
  (5, 5, 'gram', 100, 208, 45000),
  (6, 6, 'gram', 100, 90, 6500),
  (7, 7, 'piece', 1, 70, 3000),
  (8, 8, 'gram', 100, 76, 3000),
  (9, 9, 'gram', 100, 110, 1500),
  (10, 10, 'gram', 100, 141, 1800),
  (11, 11, 'gram', 100, 19, 1500),
  (12, 12, 'gram', 100, 34, 3500),
  (13, 13, 'gram', 100, 18, 2500),
  (14, 14, 'gram', 100, 15, 2000),
  (15, 15, 'gram', 100, 41, 2000),
  (16, 16, 'gram', 100, 89, 3000),
  (17, 17, 'gram', 100, 52, 6000),
  (18, 18, 'liter', 1, 610, 32000),
  (19, 19, 'gram', 100, 389, 9000),   -- cũ: giá 5000; yến mạch ~90.000đ/kg
  (20, 20, 'piece', 1, 220, 5000),    -- cũ: 190 kcal; ổ ~80 g × 270 kcal/100 g
  (21, 21, 'liter', 1, 8100, 55000),
  (22, 22, 'gram', 100, 86, 2500),
  (23, 23, 'gram', 100, 85, 35000),   -- cũ: 99 kcal, 25000; USDA tôm sống 85 kcal, tôm sú ~350.000đ/kg
  (24, 24, 'gram', 100, 61, 6500),    -- cũ: giá 3000; hộp 100 g ~6.500đ
  (25, 25, 'gram', 100, 579, 30000),
  (26, 26, 'gram', 100, 387, 2200),
  (27, 27, 'liter', 1, 420, 45000),   -- cũ: 350 kcal; 35 kcal/100 g × 1,2 kg/l
  (28, 28, 'gram', 100, 15, 3000),
  (29, 7, 'gram', 100, 143, 6000),    -- Trứng gà theo gram
  (30, 16, 'piece', 1, 105, 3500),    -- Chuối theo quả
  (31, 17, 'piece', 1, 95, 11000),    -- Táo theo quả
  (32, 29, 'gram', 100, 149, 6000);   -- Tỏi

SELECT setval(pg_get_serial_sequence('products', 'id'), (SELECT max(id) FROM products));
SELECT setval(pg_get_serial_sequence('product_nutritions', 'id'), (SELECT max(id) FROM product_nutritions));
