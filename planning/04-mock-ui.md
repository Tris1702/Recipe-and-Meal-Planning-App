---
doc-id: 2026-09-22-recipe-meal-planning-mvp
status: draft
parent: ./02-tech-design.md
design-link: (chưa có — wireframe dưới đây suy ra từ spec, chưa qua designer)
---

# Mock UI — 12 màn hình, ba dải bề rộng

> Đây là **wireframe mức bố cục và trạng thái**, không phải bản thiết kế thị giác. Màu, kiểu chữ, khoảng cách
> để designer quyết sau. Mỗi màn hình ghi rõ các BR mà nó phải làm hiện ra được.

## Quy ước chung

**Ba dải bề rộng** (`NFR-platform-002`), khai một chỗ ở `core/layout/breakpoints.dart`:

| Dải | Bề rộng | Điều hướng | Lưới nội dung |
|-----|---------|-----------|---------------|
| Compact | < 600 dp | Thanh dưới 4 mục | 1 cột |
| Medium | 600–1024 dp | Navigation rail bên trái | 2 cột |
| Expanded | > 1024 dp | Sidebar cố định 240 dp | 3 cột hoặc master–detail |

**Bốn mục điều hướng gốc:** Kế hoạch · Công thức · Tủ đồ · Hồ sơ.

**Ba trạng thái mọi màn hình đọc dữ liệu đều phải có** — sản phẩm là online-only nên không màn hình nào được
phép chỉ vẽ trạng thái thành công:

```
┌──────────────────────────┐   ┌──────────────────────────┐   ┌──────────────────────────┐
│  ░░░░░░░░░░░░░░░░░░░░░   │   │         (biểu tượng)     │   │      Không tải được      │
│  ░░░░░░░░░░░░░░░         │   │   Chưa có gì ở đây       │   │   Kiểm tra kết nối mạng  │
│  ░░░░░░░░░░░░░░░░░░░     │   │   [ Hành động chính ]    │   │        [ Thử lại ]       │
│      skeleton            │   │        rỗng              │   │          lỗi             │
└──────────────────────────┘   └──────────────────────────┘   └──────────────────────────┘
```

**Quy ước ký hiệu:** `▸` mở rộng được · `☰` kéo thả · `⚠` cờ ước tính chưa đầy đủ · `●` còn hạn · `○` quá hạn.

---

## S-01 · Đăng nhập / Đăng ký

```
COMPACT (điện thoại)                      EXPANDED (web)
┌────────────────────────┐                ┌──────────────────────────────────────────────┐
│                        │                │                     │                        │
│        🍲 Bếp          │                │                     │        🍲 Bếp          │
│   Nấu gì hôm nay?      │                │   (ảnh nền món ăn)  │   Nấu gì hôm nay?      │
│                        │                │                     │                        │
│  ┌──────────────────┐  │                │                     │  ┌──────────────────┐  │
│  │ Email            │  │                │                     │  │ Email            │  │
│  └──────────────────┘  │                │                     │  └──────────────────┘  │
│  ┌──────────────────┐  │                │                     │  ┌──────────────────┐  │
│  │ Mật khẩu      👁 │  │                │                     │  │ Mật khẩu      👁 │  │
│  └──────────────────┘  │                │                     │  └──────────────────┘  │
│                        │                │                     │                        │
│  [    Đăng nhập     ]  │                │                     │  [    Đăng nhập     ]  │
│   Quên mật khẩu?       │                │                     │   Quên mật khẩu?       │
│  ──────  hoặc  ──────  │                │                     │  ──────  hoặc  ──────  │
│  [   Tạo tài khoản  ]  │                │                     │  [   Tạo tài khoản  ]  │
└────────────────────────┘                └──────────────────────────────────────────────┘
```

**Phải hiện được:**
- `BR-auth-002` — đăng ký bằng email đã có tài khoản: báo ngay dưới ô email, không mất nội dung đã nhập.
- `BR-auth-005` — sau 5 lần sai: thông báo bị tạm khoá kèm thời gian còn lại, không phải "sai mật khẩu".

---

## S-03 · Kế hoạch tuần (màn hình chính)

```
EXPANDED (web ≥ 1024 dp)
┌────────────┬──────────────────────────────────────────────────────────────────────────┐
│ 🍲 Bếp     │  ‹  Tuần 21/09 – 27/09  ›        [Hôm nay]  [⧉ Sao chép tuần]  [+ Thêm]  │
│            ├──────────┬──────────┬──────────┬──────────┬──────────┬────────┬─────────┤
│ ▸ Kế hoạch │   T2 21  │   T3 22  │   T4 23  │   T5 24  │   T6 25  │  T7 26 │  CN 27  │
│   Công thức│          │  ← hôm nay          │          │          │        │         │
│   Tủ đồ    ├──────────┼──────────┼──────────┼──────────┼──────────┼────────┼─────────┤
│   Hồ sơ    │ SÁNG     │          │          │          │          │        │         │
│            │ Phở bò   │ Bánh mì  │    +     │ Xôi gà   │    +     │   +    │  Bún bò │
│            │ 2 phần   │ 1 phần   │          │ 2 phần   │          │        │  2 phần │
│ ────────── ├──────────┼──────────┼──────────┼──────────┼──────────┼────────┼─────────┤
│ Mục tiêu   │ TRƯA     │          │          │          │          │        │         │
│ 2.000 kcal │ Cơm gà   │ Cơm tấm  │ Bún chả  │    +     │ Cơm rang │   +    │    +    │
│            │ 2 phần   │ 2 phần   │ 2 phần   │          │ 2 phần   │        │         │
│            ├──────────┼──────────┼──────────┼──────────┼──────────┼────────┼─────────┤
│            │ TỐI      │          │          │          │          │        │         │
│            │ Canh chua│ Cá kho   │ Canh chua│ Gà kho   │    +     │   +    │    +    │
│            │ Cá kho   │ Rau luộc │ 4 phần   │ 4 phần   │          │        │         │
│            │ Rau luộc │ 4 phần   │          │          │          │        │         │
│            ├──────────┼──────────┼──────────┼──────────┼──────────┼────────┼─────────┤
│            │ PHỤ      │    +     │ Sữa chua │    +     │    +     │   +    │    +    │
│            ├──────────┼──────────┼──────────┼──────────┼──────────┼────────┼─────────┤
│            │ 1.840    │ 2.310 ▲  │ 1.520 ⚠  │ 1.980    │   620    │   0    │   840   │
│            │ ▁▁▁▁▇▁▁  │ ▁▁▁▁▁▇█  │ ▁▁▁▇▁▁▁  │ ▁▁▁▁▇▁▁  │ ▁▇▁▁▁▁▁  │        │ ▁▁▇▁▁▁▁ │
└────────────┴──────────┴──────────┴──────────┴──────────┴──────────┴────────┴─────────┘
```

```
COMPACT (điện thoại) — bảy ngày không vừa bề ngang, nên đổi thành danh sách cuộn dọc
┌──────────────────────────────┐
│  ‹  Tuần 21/09 – 27/09   ›  ⋮│
│ ┌──┬──┬──┬──┬──┬──┬──┐       │   dải ngày cuộn ngang,
│ │T2│T3│T4│T5│T6│T7│CN│       │   ngày đang chọn được tô
│ │21│22│23│24│25│26│27│       │
│ └──┴──┴──┴▲─┴──┴──┴──┘       │
├──────────────────────────────┤
│ Thứ Năm 24/09                │
│ 1.980 / 2.000 kcal           │
│ ▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇░         │
│ Đ 92g · T 210g · B 64g       │
├──────────────────────────────┤
│ SÁNG                         │
│  ┌──────────────────────────┐│
│  │ 🖼  Xôi gà        2 phần ││
│  │    620 kcal            ⋮ ││
│  └──────────────────────────┘│
│  + Thêm món                  │
│ TRƯA                         │
│  + Thêm món                  │
│ TỐI                          │
│  ┌──────────────────────────┐│
│  │ 🖼  Gà kho        4 phần ││
│  │    1.360 kcal          ⋮ ││
│  └──────────────────────────┘│
│  + Thêm món                  │
│ PHỤ                          │
│  + Thêm món                  │
├──────────────────────────────┤
│  📅      📖      🧺      👤  │
└──────────────────────────────┘
```

**Phải hiện được:**
- `BR-mealplan-002` — đúng bốn bữa Sáng/Trưa/Tối/Phụ, không có chỗ nào tạo bữa mới.
- `BR-mealplan-005` — một bữa xếp được nhiều món (ô "Tối" thứ Hai có ba món).
- `BR-mealplan-010` — tuần luôn bắt đầu Thứ Hai.
- `BR-nutrition-006` — dòng tổng calo cuối mỗi cột.
- `BR-nutrition-007` — ngày trống hiện `0`, không hiện lỗi.
- `BR-nutrition-008` — ngày có món thiếu dữ liệu mang dấu `⚠` (thứ Tư).
- `BR-nutrition-010` — ngày vượt mục tiêu mang dấu `▲` (thứ Ba).
- `BR-mealplan-001` — ngày là ngày lịch thuần; đổi múi giờ thiết bị không làm lưới nhảy cột.

**Ghi chú tương tác:** trên Medium và Expanded, kéo thả một món sang ô khác đổi ngày/bữa của mục lịch. Trên
Compact không có kéo thả — dùng menu `⋮ → Chuyển sang…`, vì kéo thả trong danh sách cuộn dọc trên màn hình
nhỏ là thao tác dễ trượt.

---

## S-04 · Chi tiết một ngày

```
┌──────────────────────────────────────────┐
│ ‹  Thứ Tư 23/09                          │
├──────────────────────────────────────────┤
│  1.520 kcal  ⚠ ước tính chưa đầy đủ      │
│  ▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇░░░░░   76% mục tiêu     │
│                                          │
│  Đạm 68,5 g   Tinh bột 180,2 g  Béo 52,0 g│
│                                          │
│  ⚠ Canh chua có nguyên liệu chưa đủ dữ   │
│    liệu dinh dưỡng: lá giang              │
├──────────────────────────────────────────┤
│ TRƯA                                     │
│  🖼 Bún chả              2 phần   960 kcal│
│ TỐI                                      │
│  🖼 Canh chua ⚠          4 phần   560 kcal│
└──────────────────────────────────────────┘
```

**Phải hiện được:** `BR-nutrition-006`, `BR-nutrition-008` (cờ ⚠ kèm **tên nguyên liệu** gây ra nó — không chỉ
một biểu tượng trơ), `BR-nutrition-010`, `BR-nutrition-009` (macro một chữ số thập phân, calo số nguyên).

---

## S-05 · Danh sách công thức

```
EXPANDED                                    COMPACT
┌────────────────────────────────────────┐  ┌──────────────────────────────┐
│ 🔎 tìm theo tên, nguyên liệu, tag       │  │ 🔎 tìm…                   ⚙ │
│                                        │  ├──────────────────────────────┤
│ [Tất cả] [🧺 Nấu được ngay] [⏱ <30']   │  │ [Tất cả][🧺 Nấu được][⏱<30']│
│ Tag: [ăn chay ×] [món Việt ×] [+]      │  │ Tag: [ăn chay ×] [+]         │
├────────────────────────────────────────┤  ├──────────────────────────────┤
│ ┌────────┐ ┌────────┐ ┌────────┐       │  │ ┌──────────────────────────┐ │
│ │  🖼    │ │  🖼    │ │  🖼    │       │  │ │ 🖼 │ Phở bò              │ │
│ │ Phở bò │ │ Cơm gà │ │Canh chua│      │  │ │    │ 620 kcal · 4 phần   │ │
│ │620 kcal│ │480 kcal│ │140 kcal⚠│      │  │ │    │ 🧺 Đủ nguyên liệu   │ │
│ │4 phần  │ │4 phần  │ │4 phần   │      │  │ └──────────────────────────┘ │
│ │🧺 Đủ   │ │🧺 Thiếu│ │🧺 —     │      │  │ ┌──────────────────────────┐ │
│ └────────┘ └────────┘ └────────┘       │  │ │ 🖼 │ Cơm gà              │ │
│ ┌────────┐ ┌────────┐ ┌────────┐       │  │ │    │ 480 kcal · 4 phần   │ │
│ │   …    │ │   …    │ │   …    │       │  │ │    │ 🧺 Thiếu 2 nguyên   │ │
│ └────────┘ └────────┘ └────────┘       │  │ └──────────────────────────┘ │
│        ↓ cuộn để tải tiếp              │  │        ↓ tải tiếp            │
│                              [ + Mới ] │  │                        (+)   │
└────────────────────────────────────────┘  └──────────────────────────────┘
```

**Phải hiện được:**
- `BR-search-002` — gõ "pho bo" ra "Phở bò"; ô tìm kiếm ghi rõ tìm cả theo nguyên liệu và tag.
- `BR-search-005` / `BR-search-006` — nhiều loại lọc giao nhau, nhiều tag trong cùng loại hợp nhau; các chip tag thể hiện rõ đang chọn gì.
- `BR-search-007` — cuộn tải tiếp theo con trỏ, không phân trang số.
- `BR-search-001` — công thức nháp **không** xuất hiện ở đây (nháp nằm ở S-07).
- `BR-search-008` — bộ lọc "Nấu được ngay"; huy hiệu 🧺 trên từng thẻ có ba giá trị Đủ / Thiếu n nguyên liệu / — (không xác định được).
- `BR-search-004` — ô tìm rỗng vẫn ra toàn bộ danh sách.

---

## S-06 · Chi tiết công thức

```
┌──────────────────────────────────────────────────────┐
│ ‹                                      ⧉ Nhân bản  ⋮ │
│ ┌──────────────────────────────────────────────────┐ │
│ │                    🖼  ảnh món                    │ │
│ └──────────────────────────────────────────────────┘ │
│ Phở bò                                    v4         │
│ [món Việt] [nước dùng]            ⏱ 180 phút         │
├──────────────────────────────────────────────────────┤
│ Khẩu phần    [ − ]   4   [ + ]        ← BR-nutrition-005
├──────────────────────────────────────────────────────┤
│ Mỗi khẩu phần:  620 kcal · Đ 38,0g · T 62,5g · B 22,0g│
├──────────────────────────────────────────────────────┤
│ 🧺 Đối chiếu tủ đồ                      [ Làm mới ]   │
│   ● Thịt bò nạc   cần 400 g   có 500 g      Đủ       │
│   ● Bánh phở      cần 400 g   có 150 g   Thiếu 250 g │
│   ○ Hành lá       cần 3 nhánh            Không rõ    │
│     ↳ chưa khai 1 nhánh bằng bao nhiêu gam           │
├──────────────────────────────────────────────────────┤
│ NGUYÊN LIỆU                                          │
│   Thịt bò nạc ................... 400 g              │
│   Bánh phở ...................... 400 g              │
│   Hành lá ....................... 3 nhánh            │
│   Muối .......................... tuỳ khẩu vị        │
├──────────────────────────────────────────────────────┤
│ CÁCH LÀM                                             │
│   1. Ninh xương bò 2 tiếng…                          │
│   2. Chần bánh phở…                                  │
├──────────────────────────────────────────────────────┤
│              [ 📅 Thêm vào kế hoạch ]                │
└──────────────────────────────────────────────────────┘
```

**Phải hiện được:**
- `BR-nutrition-005` — đổi số khẩu phần thì cả định lượng nguyên liệu lẫn dinh dưỡng đổi theo tỉ lệ.
- `BR-pantry-007` / `BR-pantry-009` — ba kết luận Đủ / Thiếu kèm lượng thiếu / Không rõ, tính theo số khẩu phần **đang xem**; dòng "Không rõ" phải nói **vì sao** không rõ.
- `BR-recipe-007` — dòng tuỳ khẩu vị hiện là "tuỳ khẩu vị", không có số, và không nằm trong phần đối chiếu tủ đồ.
- `BR-pantry-005` — nguyên liệu quá hạn hiện `○` và bị tính là không có.
- `BR-recipe-016` — nút Nhân bản.
- `BR-recipe-017` — số phiên bản `v4` hiện ở đây để khi có xung đột thì thông báo nói được chuyện gì đã xảy ra.

---

## S-07 · Soạn công thức

```
┌──────────────────────────────────────────────────────┐
│ ✕                          Nháp · đã lưu 10:42   ⋯   │
├──────────────────────────────────────────────────────┤
│ Tên món                                              │
│ ┌──────────────────────────────────────────────────┐ │
│ │ Phở bò                                           │ │
│ └──────────────────────────────────────────────────┘ │
│ Ảnh   [ 🖼 Chọn ảnh ]         Khẩu phần  [ − ] 4 [+] │
│ Thời gian nấu  [ 180 ] phút                          │
│ Tag   [món Việt ×] [+ thêm tag]            3/20      │
├──────────────────────────────────────────────────────┤
│ NGUYÊN LIỆU                                          │
│ ☰ ┌──────────────┬────────┬─────────┬──┐            │
│   │ Thịt bò nạc  │  400   │ g     ▾ │✕ │            │
│ ☰ ├──────────────┼────────┼─────────┼──┤            │
│   │ Bánh phở     │  400   │ g     ▾ │✕ │            │
│ ☰ ├──────────────┼────────┴─────────┼──┤            │
│   │ Muối         │ ☑ tuỳ khẩu vị    │✕ │            │
│   └──────────────┴──────────────────┴──┘            │
│   + Thêm nguyên liệu        → mở S-08                │
├──────────────────────────────────────────────────────┤
│ CÁCH LÀM                                             │
│ ☰ 1. ┌────────────────────────────────────────┐ ✕   │
│      │ Ninh xương bò 2 tiếng…                 │     │
│      └────────────────────────────────────────┘     │
│   + Thêm bước                                        │
├──────────────────────────────────────────────────────┤
│ ⚠ Chưa công bố được: thiếu ít nhất một bước nấu      │
│                         [ Lưu nháp ]  [ Công bố ]    │
└──────────────────────────────────────────────────────┘
```

**Phải hiện được:**
- `BR-recipe-005` — nhãn "Nháp · đã lưu 10:42" là hợp đồng với người dùng: nội dung đang nằm trên máy chủ. Tự lưu nháp sau 3 giây ngừng gõ và trước khi rời màn hình.
- `BR-recipe-002` / `BR-recipe-003` / `BR-recipe-004` — thông báo chặn công bố nói **thiếu cái gì**, không phải "dữ liệu không hợp lệ".
- `BR-recipe-010` — kéo thả sắp xếp bước; số thứ tự tự đánh lại, người dùng không gõ số.
- `BR-recipe-009` — thêm dòng trùng nguyên liệu và trùng đơn vị thì báo ngay tại dòng, gợi ý gộp.
- `BR-recipe-014` — bộ đếm `3/20` tag.
- `BR-recipe-017` — lưu khi có người khác vừa sửa: giữ nguyên nội dung đang soạn, nói rõ bản trên máy chủ đã đổi và cho đối chiếu trước khi ghi đè.
- `NFR-platform-003` — nút chọn ảnh hoạt động cả trên web (không có đường dẫn tệp) lẫn trên di động.

---

## S-08 · Chọn nguyên liệu

```
┌────────────────────────────────────────┐
│ ‹  Chọn nguyên liệu                    │
│ ┌────────────────────────────────────┐ │
│ │ 🔎 thit bo                         │ │
│ └────────────────────────────────────┘ │
├────────────────────────────────────────┤
│  Thịt bò nạc          250 kcal/100g    │
│  Thịt bò bắp          201 kcal/100g    │
│  Thịt bò xay          254 kcal/100g    │
│  Thịt ba chỉ heo      518 kcal/100g    │
│ ────────────────────────────────────── │
│  Của tôi                               │
│  Mắm ruốc Huế          88 kcal/100g    │
│ ────────────────────────────────────── │
│  + Tạo nguyên liệu "thit bo" của riêng │
│    tôi                                 │
└────────────────────────────────────────┘

Tạo nguyên liệu riêng:
┌────────────────────────────────────────┐
│ Tên           [ Mắm ruốc Huế        ]  │
│ Đơn vị cơ sở  ( ) gam   ( ) mililit    │
│ Trên 100 gam:                          │
│   Calo    [  88 ]   Đạm      [ 12,0 ]  │
│   Tinh bột[ 2,0 ]   Chất béo [  1,5 ]  │
│ ⓘ Bỏ trống cả bốn ô nếu chưa biết —    │
│   công thức vẫn lưu được, chỉ mang dấu │
│   "ước tính chưa đầy đủ".              │
│ Quy đổi (không bắt buộc)               │
│   1 [ thìa canh ▾ ] = [ 18 ] gam       │
└────────────────────────────────────────┘
```

**Phải hiện được:** `BR-recipe-006` (buộc trỏ vào danh mục, không gõ tự do), `BR-ingredient-002` (tạo nguyên
liệu riêng), `BR-ingredient-003` (calo > 900 bị từ chối ngay tại ô), `BR-ingredient-004` (khai hệ số quy đổi),
`BR-nutrition-004` (để trống dữ liệu vẫn dùng được — ghi chú `ⓘ` nói thẳng hệ quả).

---

## S-09 · Tủ đồ (pantry)

```
┌──────────────────────────────────────────────┐
│ Tủ đồ                          🔎      [ + ] │
│ [Tất cả] [● Còn hạn] [○ Quá hạn] [Sắp hết hạn]│
├──────────────────────────────────────────────┤
│ ● Gạo tẻ                    5 kg             │
│   không hạn dùng                             │
│ ● Thịt bò nạc             500 g              │
│   hạn 25/09 · còn 3 ngày                     │
│ ● Sữa tươi                  1 l              │
│   hạn 15/11                                  │
│ ○ Sữa tươi                  1 l      Quá hạn │
│   hạn 20/09 · không tính khi đối chiếu       │
│ ● Trứng gà                  0 quả            │
│   đã hết · không tính khi đối chiếu          │
└──────────────────────────────────────────────┘
```

**Phải hiện được:**
- `BR-pantry-003` — hai lô "Sữa tươi" khác hạn nằm thành hai dòng riêng, **không** gộp.
- `BR-pantry-002` — thêm đúng lô đã có thì số lượng cộng dồn, không sinh dòng thứ ba.
- `BR-pantry-005` / `BR-pantry-006` — lô quá hạn và lô số lượng 0 vẫn hiển thị nhưng ghi rõ "không tính khi đối chiếu"; đây là chỗ dễ khiến người dùng tưởng hệ thống tính sai nếu không nói ra.
- `BR-pantry-004` — lô không khai hạn ghi "không hạn dùng", không để trống.
- `BR-pantry-010` — không có gì tự trừ tồn; mọi thay đổi đều do người dùng.

---

## S-10 · Thêm món vào lịch

```
┌────────────────────────────────────────┐
│ ‹  Thêm vào kế hoạch                   │
├────────────────────────────────────────┤
│ Món     🖼 Phở bò            [ Đổi ]   │
│ Ngày    [ Thứ Năm, 24/09/2026      📅] │
│ Bữa     ( )Sáng (•)Trưa ( )Tối ( )Phụ  │
│ Khẩu phần   [ − ]  4,0  [ + ]          │
│             mặc định theo công thức    │
├────────────────────────────────────────┤
│ Thêm vào ngày này: +2.480 kcal         │
│ Tổng ngày sẽ là 4.460 / 2.000 ▲        │
├────────────────────────────────────────┤
│                    [    Thêm món    ]  │
└────────────────────────────────────────┘
```

**Phải hiện được:** `BR-mealplan-002` (đúng bốn bữa), `BR-mealplan-003` (khẩu phần bước 0,5, tối đa 50),
`BR-mealplan-004` (mặc định lấy theo công thức, nói rõ ra), `BR-mealplan-006` / `BR-mealplan-007` (lịch chặn
chọn ngày ngoài khoảng −30 / +365 ngày), `BR-nutrition-010` (xem trước tác động lên tổng ngày).

---

## S-11 · Sao chép tuần

```
┌────────────────────────────────────────────┐
│ Sao chép kế hoạch                          │
│  Từ tuần   [ 21/09 – 27/09  ▾ ]  12 món    │
│  Sang tuần [ 28/09 – 04/10  ▾ ]   3 món    │
│ ────────────────────────────────────────── │
│  ⓘ 12 món sẽ được thêm vào tuần đích.      │
│    3 món đang có ở tuần đích được giữ      │
│    nguyên, không bị ghi đè.                │
│                       [ Huỷ ] [ Sao chép ] │
└────────────────────────────────────────────┘
```

**Phải hiện được:** `BR-mealplan-008` — nói thẳng là **cộng thêm chứ không ghi đè**, kèm số món cụ thể của cả
hai tuần. Đây là thao tác dễ bị hiểu nhầm nhất trong sản phẩm nên hệ quả phải hiện trước khi bấm.

---

## S-12 · Hồ sơ & cài đặt

```
┌────────────────────────────────────────┐
│ Hồ sơ                                  │
│  an@example.com                        │
├────────────────────────────────────────┤
│ DINH DƯỠNG                             │
│  Mục tiêu calo mỗi ngày   [ 2000 ] kcal│
│  ⓘ Số liệu dinh dưỡng là ước tính tham │
│    khảo để lập kế hoạch ăn uống, không │
│    phải tư vấn y tế.                   │
├────────────────────────────────────────┤
│ HIỂN THỊ                               │
│  Giao diện   ( )Sáng ( )Tối (•)Theo máy│
├────────────────────────────────────────┤
│ TÀI KHOẢN                              │
│  Đổi mật khẩu                        › │
│  Đăng xuất                           › │
│  Xoá tài khoản                       › │
└────────────────────────────────────────┘

Xoá tài khoản:
┌────────────────────────────────────────┐
│ Xoá tài khoản?                         │
│ 42 công thức, 128 mục kế hoạch và 15   │
│ mục tủ đồ sẽ ngừng truy cập ngay.      │
│ Đăng nhập lại trong 30 ngày để khôi    │
│ phục. Sau 30 ngày dữ liệu bị xoá hẳn.  │
│ Gõ "XOA" để xác nhận:  [        ]      │
│                  [ Huỷ ] [ Xoá ]       │
└────────────────────────────────────────┘
```

**Phải hiện được:** `BR-auth-010` (mục tiêu calo, chặn 0 và số âm), `BR-nutrition-011` (tuyên bố miễn trừ đặt
đúng chỗ người dùng đọc số liệu), `BR-auth-004` (đổi mật khẩu báo trước là sẽ đăng xuất thiết bị khác),
`BR-auth-008` (nói rõ 30 ngày và số lượng dữ liệu cụ thể, không nói chung chung).

---

## S-02 · Quên & đặt lại mật khẩu

```
┌────────────────────────────────┐   ┌────────────────────────────────┐
│ ‹ Quên mật khẩu                │   │ Đặt mật khẩu mới               │
│ Nhập email đã đăng ký, chúng   │   │ Mật khẩu mới   [          👁 ] │
│ tôi sẽ gửi liên kết đặt lại.   │   │ Nhập lại       [          👁 ] │
│ [ email                      ] │   │ ⓘ Liên kết có hiệu lực 60 phút │
│         [    Gửi liên kết   ]  │   │   và chỉ dùng được một lần.    │
└────────────────────────────────┘   └────────────────────────────────┘
        ↓ sau khi gửi
┌────────────────────────────────┐
│ Nếu email này có tài khoản,    │   ← BR-auth-002: câu chữ cố ý không
│ liên kết đặt lại đã được gửi.  │     xác nhận email có tồn tại hay không
└────────────────────────────────┘
```

**Phải hiện được:** `BR-auth-003` (một lần, 60 phút — nói ra chứ không để người dùng đoán khi liên kết hết hạn).

---

## Bảng phủ màn hình ↔ nhóm rule

| Nhóm rule | Màn hình phủ |
|-----------|--------------|
| `BR-auth-*` | S-01, S-02, S-12 |
| `BR-ingredient-*` | S-08 |
| `BR-recipe-*` | S-05, S-06, S-07, S-08 |
| `BR-search-*` | S-05 |
| `BR-mealplan-*` | S-03, S-04, S-10, S-11 |
| `BR-nutrition-*` | S-03, S-04, S-06, S-12 |
| `BR-pantry-*` | S-06, S-09 |

## Ba điều mọi màn hình phải tôn trọng

1. **Không màn hình nào chỉ vẽ trạng thái thành công.** Sản phẩm online-only, nên skeleton / rỗng / lỗi là ba trạng thái bắt buộc, không phải tuỳ chọn.
2. **Cờ "ước tính chưa đầy đủ" luôn nói được lý do.** `BR-nutrition-003` và `BR-nutrition-004` yêu cầu người dùng phân biệt được con số đầy đủ với con số thiếu; một biểu tượng `⚠` không kèm tên nguyên liệu gây ra nó là chưa đạt yêu cầu đó.
3. **Thông báo chặn phải nói thiếu cái gì.** "Dữ liệu không hợp lệ" không thoả bất kỳ BR nào; "Chưa công bố được: thiếu ít nhất một bước nấu" thì có.
