---
doc-id: 2026-09-22-recipe-meal-planning-mvp
status: draft
confluence: (none)
---

# Spec: Recipe & Meal Planning App — MVP

## 1. Problem & Why

Người nấu ăn tại nhà giữ công thức rải rác ở ảnh chụp màn hình, ghi chú và trí nhớ. Khi lên thực đơn cả
tuần, họ phải tự nhớ món nào cần gì, đã ăn gì, và trong tủ còn gì — không có chỗ nào trả lời ba câu đó
cùng lúc. Hệ quả: lên thực đơn mất thời gian, mua thừa nguyên liệu, và không biết mình ăn bao nhiêu calo.

Sản phẩm giải đúng ba việc đó trong một kho dữ liệu duy nhất: lưu công thức có cấu trúc, xếp món vào lịch
theo bữa, và đối chiếu với tủ đồ để biết còn thiếu gì. Dinh dưỡng đi kèm miễn phí vì công thức đã có
nguyên liệu định lượng.

Phạm vi MVP gồm 5 lát cắt dọc, mỗi lát ship được độc lập: **Auth**, **Danh mục nguyên liệu**,
**Công thức + tìm kiếm**, **Kế hoạch bữa ăn + dinh dưỡng**, **Pantry**.

**BR-ID dùng slug theo lát cắt** (`BR-auth-*`, `BR-ingredient-*`, `BR-recipe-*`, `BR-search-*`,
`BR-mealplan-*`, `BR-nutrition-*`, `BR-pantry-*`) thay vì một slug duy nhất cho cả spec, để id vừa duy
nhất repo-wide vừa đọc được, và để lát cắt nào ship trước thì grep trace của lát đó đứng độc lập.

## 2. User Stories

| ID | User Story | Related BRs |
|----|-----------|-------------|
| US-01 | Là người nấu ăn, tôi muốn lưu công thức của mình kèm nguyên liệu định lượng và các bước, để không phải nhớ và không phải tìm lại trong ảnh chụp màn hình. | BR-recipe-001, BR-recipe-002, BR-recipe-003, BR-recipe-004, BR-recipe-006, BR-recipe-007, BR-recipe-008, BR-recipe-009, BR-recipe-010, BR-recipe-011, BR-recipe-012, BR-recipe-013, BR-recipe-014, BR-recipe-015, BR-recipe-018, BR-ingredient-001, BR-ingredient-002, BR-ingredient-004, BR-ingredient-005 |
| US-02 | Là người nấu ăn, tôi muốn soạn dở một công thức dài rồi quay lại viết tiếp, để không mất công khi bị ngắt giữa chừng. | BR-recipe-005, BR-recipe-017, BR-recipe-018, BR-auth-006, BR-auth-007 |
| US-03 | Là người nấu ăn, tôi muốn tìm lại công thức theo tên, theo nguyên liệu hoặc theo tag, để chọn món nhanh. | BR-search-001, BR-search-002, BR-search-003, BR-search-004, BR-search-005, BR-search-006, BR-search-007 |
| US-04 | Là người lên thực đơn, tôi muốn xếp nhiều món vào từng bữa của từng ngày trong tuần, để cả nhà biết ăn gì. | BR-mealplan-001, BR-mealplan-002, BR-mealplan-003, BR-mealplan-004, BR-mealplan-005, BR-mealplan-006, BR-mealplan-007, BR-mealplan-009 |
| US-05 | Là người lên thực đơn, tôi muốn sao chép kế hoạch của một tuần sang tuần khác, để không phải xếp lại từ đầu mỗi tuần. | BR-mealplan-008, BR-mealplan-010 |
| US-06 | Là người quan tâm ăn uống, tôi muốn biết mỗi ngày ăn bao nhiêu calo và macro so với mục tiêu của mình, để cân đối bữa ăn. | BR-auth-010, BR-ingredient-001, BR-ingredient-003, BR-nutrition-001, BR-nutrition-002, BR-nutrition-003, BR-nutrition-004, BR-nutrition-005, BR-nutrition-006, BR-nutrition-007, BR-nutrition-008, BR-nutrition-009, BR-nutrition-010, BR-nutrition-011 |
| US-07 | Là người theo dõi ăn uống, tôi muốn số liệu của những ngày đã qua không đổi khi tôi sửa công thức, để nhật ký còn đáng tin. | BR-recipe-019, BR-recipe-020, BR-recipe-021, BR-recipe-022 |
| US-08 | Là người đi chợ, tôi muốn biết món này còn thiếu nguyên liệu gì và thiếu bao nhiêu so với đồ đang có, để mua đúng thứ cần. | BR-pantry-001, BR-pantry-002, BR-pantry-003, BR-pantry-004, BR-pantry-005, BR-pantry-006, BR-pantry-007, BR-pantry-008, BR-pantry-009, BR-pantry-010 |
| US-09 | Là người nấu ăn, tôi muốn lọc ra những món nấu được ngay với đồ đang có trong nhà, để quyết định bữa tối. | BR-search-008, BR-pantry-007, BR-pantry-008 |
| US-10 | Là người dùng mới, tôi muốn có sẵn vài công thức mẫu để dùng được ngay mà chưa phải nhập gì. | BR-auth-009, BR-recipe-016 |
| US-11 | Là người dùng, tôi muốn lấy lại tài khoản khi quên mật khẩu và xoá hẳn dữ liệu khi muốn rời đi. | BR-auth-001, BR-auth-002, BR-auth-003, BR-auth-004, BR-auth-005, BR-auth-008 |

## 3. Business Rules

> Dự án greenfield, chưa có living docs — mọi rule đều là **Thêm mới**, không cần annotate riêng.

### 3.1 Tài khoản & phạm vi dữ liệu

- `BR-auth-001` — Mọi công thức, mục lịch bữa ăn và mục pantry thuộc về đúng một tài khoản; tài khoản chỉ đọc và thay đổi được dữ liệu thuộc về chính mình.
  - ✅ Tài khoản A yêu cầu công thức do chính A tạo → A đọc và sửa được công thức đó.
  - ❌ Tài khoản B yêu cầu công thức thuộc tài khoản A → từ chối, không tiết lộ nội dung lẫn sự tồn tại của công thức đó.

- `BR-auth-002` — Một địa chỉ email sau khi chuẩn hoá về chữ thường chỉ gắn với tối đa một tài khoản đang tồn tại.
  - ✅ Đăng ký bằng "an@example.com" khi chưa tài khoản nào dùng email đó → tài khoản được tạo.
  - ❌ Đăng ký bằng "AN@Example.com" khi "an@example.com" đã gắn với một tài khoản đang tồn tại → không tạo tài khoản thứ hai.

- `BR-auth-003` — Người dùng quên mật khẩu lấy lại được quyền truy cập qua địa chỉ email đã đăng ký, và mỗi yêu cầu đặt lại chỉ dùng được một lần trong vòng 60 phút kể từ khi phát hành.
  - ✅ Yêu cầu đặt lại cho email đã đăng ký, dùng trong vòng 60 phút → người dùng đặt được mật khẩu mới và truy cập lại toàn bộ dữ liệu cũ.
  - ❌ Dùng lại một yêu cầu đặt lại đã được sử dụng → không đổi được mật khẩu.
  - ❌ Dùng một yêu cầu đặt lại đã phát hành quá 60 phút → không đổi được mật khẩu.

- `BR-auth-004` — Đổi mật khẩu làm mọi phiên đăng nhập của tài khoản đó trên các thiết bị khác mất hiệu lực ngay lập tức.
  - ✅ Người dùng đổi mật khẩu trong một phiên → phiên đó tiếp tục hoạt động bình thường.
  - ❌ Phiên trên một thiết bị khác thao tác sau khi mật khẩu vừa được đổi → bị từ chối cho tới khi đăng nhập lại.

- `BR-auth-005` — Một địa chỉ email có 5 lần đăng nhập thất bại liên tiếp trong vòng 15 phút thì các lần thử tiếp theo cho email đó bị từ chối trong 15 phút, kể cả khi mật khẩu đúng.
  - ✅ Nhập sai mật khẩu 2 lần rồi nhập đúng → đăng nhập thành công bình thường.
  - ❌ Thử liên tiếp lần thứ 6 sau 5 lần sai trong 15 phút, dù mật khẩu đúng → bị từ chối.

- `BR-auth-006` — Thao tác gửi với access token đã hết hạn nhưng refresh token còn hiệu lực và tài khoản đang hoạt động vẫn được thực hiện thành công sau khi phiên tự gia hạn.
  - ✅ Người dùng soạn công thức 25 phút trong khi access token sống 15 phút rồi lưu → công thức được lưu đầy đủ, không mất nguyên liệu hay bước nấu nào.

- `BR-auth-007` — Thao tác gửi khi cả access token lẫn refresh token đều đã hết hạn bị từ chối và không dữ liệu nào được ghi nhận.
  - ✅ Người dùng xác thực lại bằng mật khẩu sau khi cả hai token đã hết hạn rồi lưu công thức → công thức được lưu bình thường.
  - ❌ Người dùng bỏ dở lâu hơn thời hạn refresh token rồi quay lại lưu công thức → thao tác bị từ chối, không công thức nào được tạo.

- `BR-auth-008` — Tài khoản bị xoá theo yêu cầu của chính chủ thì toàn bộ công thức, mục lịch bữa ăn và mục pantry của tài khoản đó ngừng truy cập được ngay và bị xoá hẳn sau 30 ngày; trong 30 ngày đó chính chủ khôi phục lại được.
  - ✅ Chính chủ xoá tài khoản rồi đăng nhập lại sau 10 ngày → khôi phục được toàn bộ công thức và kế hoạch bữa ăn.
  - ❌ Đăng nhập lại sau 40 ngày kể từ khi xoá → tài khoản không còn, dữ liệu không khôi phục được.

- `BR-auth-009` — Tài khoản vừa được tạo có sẵn một bộ công thức mẫu thuộc quyền sở hữu của chính tài khoản đó, sửa và xoá được như công thức do người dùng tự tạo.
  - ✅ Đăng ký xong, người dùng lên lịch ngay một món mẫu mà chưa nhập công thức nào → mục lịch được tạo.
  - ✅ Người dùng xoá một công thức mẫu của mình → công thức đó biến mất khỏi kho của người dùng, kho của tài khoản khác không đổi.

- `BR-auth-010` — Mục tiêu calo mỗi ngày là một số nguyên dương do người dùng tự đặt, áp dụng cho mọi ngày cho tới khi chính người dùng thay đổi.
  - ✅ Người dùng đặt mục tiêu 2.000 kcal mỗi ngày → mọi ngày trong kế hoạch được so với mốc 2.000 kcal.
  - ❌ Người dùng đặt mục tiêu 0 hoặc số âm → không được chấp nhận, mục tiêu cũ giữ nguyên.

### 3.2 Danh mục nguyên liệu & nguồn dữ liệu dinh dưỡng

- `BR-ingredient-001` — Mỗi mục trong danh mục nguyên liệu có đơn vị cơ sở là gam hoặc mililit, kèm calo, đạm, tinh bột và chất béo khai theo 100 đơn vị cơ sở đó.
  - ✅ Mục "Thịt bò nạc" có đơn vị cơ sở gam và 250 kcal trên 100 gam → mọi công thức dùng nguyên liệu này tính được dinh dưỡng.
  - ❌ Mục nguyên liệu khai đơn vị cơ sở là "quả" → không được chấp nhận vào danh mục.

- `BR-ingredient-002` — Người dùng tạo được mục nguyên liệu riêng kèm dữ liệu dinh dưỡng tự nhập, và mục nguyên liệu riêng đó chỉ chính người dùng tạo ra nó mới dùng được.
  - ✅ Người dùng thêm "Mắm ruốc Huế" kèm số liệu tự nhập → dùng được trong công thức của mình và được tính vào dinh dưỡng.
  - ❌ Tài khoản khác dùng mục nguyên liệu riêng đó trong công thức của họ → bị từ chối.

- `BR-ingredient-003` — Giá trị dinh dưỡng của một mục nguyên liệu phải không âm, và calo không vượt quá 900 kcal trên 100 đơn vị cơ sở.
  - ✅ Mục "Dầu ăn" khai 884 kcal trên 100 gam → được chấp nhận.
  - ❌ Mục nguyên liệu khai 5.000 kcal trên 100 gam → bị từ chối.
  - ❌ Mục nguyên liệu khai âm 50 kcal trên 100 gam → bị từ chối.

- `BR-ingredient-004` — Mỗi mục trong danh mục nguyên liệu khai được hệ số quy đổi riêng của chính nó từ một đơn vị đếm hoặc đơn vị thìa sang đơn vị cơ sở của mục đó.
  - ✅ Mục "Trứng gà" khai 1 quả bằng 55 gam → một dòng nguyên liệu 2 quả trứng gà được tính là 110 gam khi cộng dinh dưỡng.
  - ❌ Mục "Hành lá" chưa khai hệ số cho đơn vị "nhánh" → một dòng nguyên liệu 3 nhánh hành lá không tính được đóng góp dinh dưỡng.
  - ❌ Hệ số quy đổi khai cho một nguyên liệu được đem áp dụng cho một nguyên liệu khác → sai, hệ số là riêng của từng mục.

- `BR-ingredient-005` — Quy đổi giữa hai đơn vị cùng hệ đại lượng dùng hệ số cố định chung cho toàn hệ thống, không phụ thuộc nguyên liệu.
  - ✅ Dòng nguyên liệu khai 0,5 kilogam với đơn vị cơ sở là gam → được tính là 500 gam.
  - ✅ Dòng nguyên liệu khai 1 lít với đơn vị cơ sở là mililit → được tính là 1.000 mililit.

### 3.3 Công thức

- `BR-recipe-001` — Công thức ở trạng thái đã công bố phải có tên khác rỗng sau khi cắt khoảng trắng đầu cuối, dài tối đa 120 ký tự.
  - ✅ Công thức tên "Phở bò" → công bố được.
  - ❌ Công thức có tên chỉ gồm khoảng trắng → không công bố được.
  - ❌ Công thức có tên dài 121 ký tự → không công bố được.

- `BR-recipe-002` — Công thức ở trạng thái đã công bố phải có ít nhất một dòng nguyên liệu.
  - ✅ Công thức có một dòng nguyên liệu "gạo 200 gam" và một bước nấu → công bố được.
  - ❌ Công thức chỉ có tên và các bước nấu → không công bố được.

- `BR-recipe-003` — Công thức ở trạng thái đã công bố phải có ít nhất một bước nấu với nội dung khác rỗng sau khi cắt khoảng trắng.
  - ✅ Công thức có đúng một bước "Luộc 10 phút" → công bố được.
  - ❌ Công thức có ba bước nhưng cả ba đều rỗng → không công bố được.

- `BR-recipe-004` — Công thức ở trạng thái đã công bố phải khai số khẩu phần cơ sở là số nguyên từ 1 đến 100, và toàn bộ định lượng nguyên liệu của công thức được hiểu là dành cho đúng số khẩu phần đó.
  - ✅ Công thức khai 4 khẩu phần với 800 gam thịt → mỗi khẩu phần ứng với 200 gam thịt.
  - ❌ Công thức khai 0 khẩu phần → không công bố được.
  - ❌ Công thức khai 150 khẩu phần → không công bố được.

- `BR-recipe-005` — Công thức ở trạng thái nháp chỉ bắt buộc có tên, không xuất hiện trong kết quả tìm kiếm, không gắn được vào kế hoạch bữa ăn và không tham gia dinh dưỡng của bất kỳ ngày nào.
  - ✅ Lưu nháp "Bún chả đang viết" chỉ có tên và hai dòng nguyên liệu → nội dung dở dang được giữ lại và mở ra viết tiếp được.
  - ❌ Gắn một công thức đang ở trạng thái nháp vào bữa tối → không được ghi nhận.

- `BR-recipe-006` — Mỗi dòng nguyên liệu định lượng của công thức phải trỏ tới một mục trong danh mục nguyên liệu, có số lượng lớn hơn 0 và không quá 100.000, và dùng một đơn vị thuộc tập đơn vị hệ thống hỗ trợ.
  - ✅ Dòng "Thịt bò nạc 200 gam" trỏ tới một mục trong danh mục → hợp lệ.
  - ❌ Dòng chỉ là chuỗi tự do "thịt bò gì đó" không khớp mục danh mục nào → công thức không công bố được.
  - ❌ Dòng "muối 0 gam" → công thức không công bố được.
  - ❌ Dòng "thịt bò 2 chén" với "chén" không thuộc tập đơn vị hệ thống hỗ trợ → công thức không công bố được.

- `BR-recipe-007` — Dòng nguyên liệu được khai là loại gia giảm tuỳ khẩu vị lưu được mà không cần số lượng, không đóng góp vào dinh dưỡng của công thức và không tham gia đối chiếu với pantry.
  - ✅ Công thức có dòng "muối, gia giảm tuỳ khẩu vị" → công bố được và calo của công thức không đổi vì dòng này.
  - ❌ Dòng khai là gia giảm tuỳ khẩu vị nhưng kèm số lượng 200 gam → bị từ chối vì hai khai báo mâu thuẫn.

- `BR-recipe-008` — Công thức mà mọi dòng nguyên liệu đều là loại gia giảm tuỳ khẩu vị không công bố được.
  - ✅ Công thức có một dòng định lượng và hai dòng gia giảm tuỳ khẩu vị → công bố được.
  - ❌ Công thức chỉ gồm "muối, tuỳ khẩu vị" và "tiêu, tuỳ khẩu vị" → không công bố được.

- `BR-recipe-009` — Công thức có hai dòng nguyên liệu cùng trỏ tới một mục danh mục và cùng một đơn vị thì không công bố được.
  - ✅ Công thức khai "hành tím 50 gam" và "hành tím 2 củ" → công bố được vì hai dòng khác đơn vị.
  - ❌ Công thức khai "thịt bò 200 gam" và "thịt bò 100 gam" → không công bố được.

- `BR-recipe-010` — Các bước nấu của một công thức có thứ tự xác định, đánh số liên tiếp bắt đầu từ 1, không trùng và không đứt quãng.
  - ✅ Công thức có ba bước được đánh số 1, 2, 3 → hợp lệ.
  - ✅ Xoá bước số 2 của một công thức ba bước → còn lại hai bước được đánh số 1, 2.
  - ❌ Công thức có các bước đánh số 1, 3, 4 → không công bố được.

- `BR-recipe-011` — Mỗi công thức có tối đa một ảnh đại diện, dung lượng không quá 10 MB, thuộc định dạng JPEG, PNG, WebP hoặc HEIC; gắn ảnh mới làm ảnh cũ bị thay thế.
  - ✅ Ảnh chụp từ điện thoại 8 MB định dạng HEIC → được nhận làm ảnh đại diện.
  - ✅ Công thức đã có ảnh, gắn thêm một ảnh hợp lệ → công thức vẫn chỉ có một ảnh, là ảnh mới.
  - ❌ Tệp ảnh 25 MB → bị từ chối, ảnh cũ giữ nguyên.

- `BR-recipe-012` — Ảnh của một công thức chỉ được xem bởi tài khoản sở hữu công thức đó.
  - ✅ Chủ công thức xem được ảnh món của mình.
  - ❌ Tài khoản khác truy cập ảnh của công thức không thuộc về mình → bị từ chối.

- `BR-recipe-013` — Tag của một công thức được chuẩn hoá bằng cách cắt khoảng trắng đầu cuối và gộp các khoảng trắng liên tiếp, và các tag trùng nhau sau chuẩn hoá khi bỏ qua hoa thường chỉ được ghi nhận một lần.
  - ✅ Công thức gắn "ăn chay", "Ăn Chay" và " ăn  chay " → công thức có đúng một tag "ăn chay".
  - ❌ Công thức gắn một tag chỉ gồm khoảng trắng → tag đó không được ghi nhận.

- `BR-recipe-014` — Một công thức mang tối đa 20 tag.
  - ✅ Công thức gắn 20 tag khác nhau → tất cả được ghi nhận.
  - ❌ Công thức gắn tag thứ 21 → tag đó bị từ chối, 20 tag cũ giữ nguyên.

- `BR-recipe-015` — Hai công thức trùng tên sau chuẩn hoá trong cùng một tài khoản đều được lưu và tồn tại độc lập với nhau.
  - ✅ Người dùng đã có "Phở bò" và tạo tiếp một "phở bò" phiên bản nấu nhanh → cả hai cùng tồn tại, sửa công thức này không ảnh hưởng công thức kia.

- `BR-recipe-016` — Nhân bản một công thức tạo ra một công thức mới độc lập thuộc cùng tài khoản, mang toàn bộ nguyên liệu, bước nấu, tag và số khẩu phần cơ sở của bản gốc.
  - ✅ Nhân bản "Phở bò" rồi đổi nguyên liệu của bản sao → bản gốc giữ nguyên nội dung cũ.

- `BR-recipe-017` — Cập nhật một công thức phải kèm số phiên bản mà người gửi đang dựa trên; số phiên bản đó khác số phiên bản hiện tại của công thức thì thao tác bị từ chối toàn bộ và không trường nào của công thức bị thay đổi.
  - ✅ Chỉ một thiết bị sửa công thức → thay đổi được ghi nhận và số phiên bản của công thức tăng lên.
  - ❌ Hai thiết bị cùng mở bản phiên bản 3, thiết bị thứ nhất lưu trước thành phiên bản 4, thiết bị thứ hai lưu dựa trên phiên bản 3 → lần lưu của thiết bị thứ hai bị từ chối và nội dung của thiết bị thứ nhất giữ nguyên.

- `BR-recipe-018` — Cùng một yêu cầu tạo công thức được gửi lại nhiều lần với cùng một khoá chống trùng chỉ tạo ra đúng một công thức.
  - ✅ Yêu cầu tạo "Bún chả" bị gián đoạn mạng rồi được gửi lại với cùng khoá chống trùng → người dùng có đúng một công thức "Bún chả".
  - ✅ Người dùng chủ động tạo lần thứ hai một công thức tên "Bún chả" với khoá chống trùng khác → người dùng có hai công thức.

- `BR-recipe-019` — Công thức bị xoá không còn xuất hiện trong kết quả tìm kiếm và không gắn mới được vào bất kỳ mục lịch bữa ăn nào.
  - ✅ Xoá "Phở bò" → tìm với từ khoá "phở" không còn trả về công thức đó.
  - ❌ Gắn một công thức đã bị xoá vào bữa tối tuần sau → bị từ chối như thể công thức đó không tồn tại.

- `BR-recipe-020` — Công thức bị xoá bị gỡ khỏi mọi mục lịch bữa ăn có ngày từ hôm nay trở đi, và dinh dưỡng của những ngày đó được tính lại không bao gồm chúng.
  - ✅ "Phở bò" đang nằm ở bữa trưa ngày mai và người dùng xoá công thức → bữa trưa ngày mai không còn món đó và tổng calo ngày mai giảm đúng phần của món đó.

- `BR-recipe-021` — Mục lịch bữa ăn thuộc ngày đã qua giữ nguyên tên công thức, số khẩu phần và các giá trị dinh dưỡng đã ghi nhận, kể cả khi công thức được tham chiếu bị xoá sau đó.
  - ✅ Tuần trước ăn "Phở bò" 620 kcal, hôm nay xoá công thức → tổng calo tuần trước không đổi và mục lịch vẫn nêu tên "Phở bò".
  - ❌ Xoá công thức làm tổng calo của tuần trước tụt xuống 0 → sai.

- `BR-recipe-022` — Mục lịch bữa ăn thuộc ngày đã qua giữ nguyên các giá trị dinh dưỡng đã ghi nhận khi công thức được tham chiếu bị sửa, còn mục lịch thuộc hôm nay và các ngày trong tương lai phản ánh nội dung mới nhất của công thức.
  - ✅ Công thức đang là 620 kcal mỗi khẩu phần và đã được ăn hôm qua, hôm nay được sửa thành 900 kcal → tổng của hôm qua vẫn tính theo 620 và các bữa từ hôm nay trở đi tính theo 900.

### 3.4 Tìm kiếm & lọc

- `BR-search-001` — Kết quả tìm kiếm và lọc chỉ gồm công thức đã công bố, chưa bị xoá, thuộc tài khoản đang thực hiện yêu cầu.
  - ✅ Tài khoản A có 10 công thức đã công bố và tài khoản B có 5, A tìm với từ khoá khớp tất cả → kết quả tối đa 10 công thức của A.
  - ❌ Một công thức đang ở trạng thái nháp xuất hiện trong kết quả → sai.

- `BR-search-002` — Tìm kiếm công thức đối chiếu từ khoá theo kiểu khớp chuỗi con với tên công thức, tên nguyên liệu và tag, không phân biệt chữ hoa chữ thường và không phân biệt dấu tiếng Việt.
  - ✅ Từ khoá "pho bo" → công thức "Phở bò" nằm trong kết quả.
  - ✅ Từ khoá "THỊT" → công thức "Bún chả" có nguyên liệu "thịt ba chỉ" nằm trong kết quả.

- `BR-search-003` — Nội dung các bước nấu không tham gia đối chiếu từ khoá khi tìm kiếm công thức.
  - ✅ Từ khoá "phở" xuất hiện trong tên công thức "Phở bò" và cũng xuất hiện trong một bước nấu của công thức đó → công thức nằm trong kết quả nhờ khớp tên.
  - ❌ Từ khoá "đảo đều tay" chỉ xuất hiện trong mô tả một bước nấu → công thức đó không nằm trong kết quả.

- `BR-search-004` — Tìm kiếm với từ khoá rỗng hoặc chỉ gồm khoảng trắng trả về toàn bộ công thức đã công bố của tài khoản theo thứ tự mặc định.
  - ✅ Người dùng có 12 công thức đã công bố và tìm với từ khoá rỗng → nhận được cả 12.

- `BR-search-005` — Khi nhiều loại bộ lọc khác nhau được áp dụng cùng lúc, công thức phải thoả tất cả các loại bộ lọc mới nằm trong kết quả.
  - ✅ Lọc tag "ăn chay" cùng thời gian nấu dưới 30 phút, công thức "Đậu hũ sốt cà" thoả cả hai → nằm trong kết quả.
  - ❌ Công thức "Đậu hũ kho" mang tag "ăn chay" nhưng nấu 50 phút → không nằm trong kết quả.

- `BR-search-006` — Khi một bộ lọc được chọn nhiều giá trị, công thức thoả bất kỳ giá trị nào trong số đó đều nằm trong kết quả.
  - ✅ Bộ lọc tag gồm "ăn chay" và "món Việt", công thức chỉ mang tag "món Việt" → nằm trong kết quả.
  - ❌ Công thức không mang tag nào trong hai tag đã chọn → không nằm trong kết quả.

- `BR-search-007` — Tìm kiếm trả về tối đa 50 công thức mỗi lần kèm thông tin để lấy tiếp phần còn lại, theo một thứ tự ổn định giữa các lần lấy; không khớp công thức nào là kết quả rỗng hợp lệ.
  - ✅ Người dùng có 320 công thức và tìm với từ khoá rỗng → nhận 50 công thức đầu và lấy tiếp được cho tới hết, không trùng và không sót.
  - ✅ Từ khoá không khớp công thức nào → người dùng nhận kết quả rỗng và vẫn tiếp tục thao tác được.

- `BR-search-008` — Lọc "nấu được với đồ đang có" chỉ trả về công thức mà mọi dòng nguyên liệu định lượng của nó đều được kết luận là đủ khi đối chiếu với pantry của chính tài khoản đó.
  - ✅ Công thức cần gạo 200 gam và trứng 2 quả, pantry còn hạn có gạo 1.000 gam và trứng 6 quả → công thức nằm trong kết quả.
  - ❌ Công thức cần trứng 2 quả và pantry chỉ có 1 quả → công thức không nằm trong kết quả.
  - ❌ Công thức cần 3 nhánh hành lá mà nguyên liệu này không quy đổi được về đơn vị cơ sở → công thức không nằm trong kết quả.

### 3.5 Kế hoạch bữa ăn

- `BR-mealplan-001` — Ngày của một mục lịch bữa ăn là một ngày lịch thuần không kèm giờ và không kèm múi giờ, và giữ nguyên bất kể thiết bị đang ở múi giờ nào hay ngày đó có đổi giờ mùa hay không.
  - ✅ Người dùng ở Việt Nam gắn món vào bữa trưa ngày 2026-10-05 rồi bay sang Mỹ và xem lại → món vẫn nằm ở bữa trưa ngày 2026-10-05.
  - ❌ Đổi múi giờ thiết bị làm bữa tối ngày 2026-10-05 chuyển sang ngày 2026-10-04 → sai.

- `BR-mealplan-002` — Bữa trong ngày thuộc một tập cố định do hệ thống định nghĩa gồm Sáng, Trưa, Tối và Phụ.
  - ✅ Gắn món vào bữa Phụ → được ghi nhận như một bữa bình thường của ngày.
  - ❌ Gắn món vào một loại bữa do người dùng tự đặt tên → không được ghi nhận.

- `BR-mealplan-003` — Mỗi mục lịch bữa ăn gắn đúng một công thức đã công bố thuộc chính tài khoản đó vào đúng một ngày, một bữa và một số khẩu phần lớn hơn 0 và không quá 50.
  - ✅ Gắn "Phở bò" vào bữa sáng ngày 2026-09-25 với 2 khẩu phần → ngày đó có món ở bữa sáng và dinh dưỡng được tính theo 2 khẩu phần.
  - ✅ Gắn "Phở bò" và khai chỉ ăn 0,5 khẩu phần → dinh dưỡng được tính theo 0,5 khẩu phần.
  - ❌ Gắn một công thức vào một ngày mà không xác định bữa → mục lịch không được tạo.
  - ❌ Gắn một công thức với 0 khẩu phần → mục lịch không được tạo.

- `BR-mealplan-004` — Mục lịch bữa ăn không khai số khẩu phần thì nhận số khẩu phần cơ sở của công thức được gắn.
  - ✅ Công thức khai 4 khẩu phần cơ sở và được lên lịch mà không chỉ định số khẩu phần → mục lịch mang 4 khẩu phần.

- `BR-mealplan-005` — Một bữa của một ngày chứa được nhiều mục lịch, kể cả nhiều mục cùng trỏ tới một công thức.
  - ✅ Bữa tối gồm "Canh chua", "Cá kho" và "Rau luộc" → cả ba cùng thuộc bữa tối ngày đó.
  - ✅ Bữa sáng gắn "Phở bò" 1 khẩu phần rồi gắn tiếp "Phở bò" 1 khẩu phần nữa → bữa sáng có hai mục, tương đương 2 khẩu phần món đó.

- `BR-mealplan-006` — Gắn công thức vào một ngày trong quá khứ được chấp nhận khi ngày đó cách hôm nay không quá 30 ngày.
  - ✅ Hôm nay là 2026-09-22, gắn món vào ngày 2026-09-20 để ghi bù bữa đã ăn → được ghi nhận và tổng dinh dưỡng ngày đó tăng tương ứng.
  - ❌ Hôm nay là 2026-09-22, gắn món vào ngày 2026-01-01 → bị từ chối.

- `BR-mealplan-007` — Gắn công thức vào một ngày trong tương lai được chấp nhận khi ngày đó cách hôm nay không quá 365 ngày.
  - ✅ Hôm nay là 2026-09-22, gắn món vào ngày 2027-03-01 → được ghi nhận.
  - ❌ Hôm nay là 2026-09-22, gắn món vào ngày 2030-01-01 → bị từ chối.

- `BR-mealplan-008` — Sao chép kế hoạch của một tuần sang một tuần khác tạo bản sao của mọi mục lịch tuần nguồn giữ nguyên thứ trong tuần, bữa, công thức và số khẩu phần, và các mục đã có ở tuần đích được giữ nguyên bên cạnh bản sao.
  - ✅ Tuần nguồn có "Phở bò" ở bữa sáng thứ Hai với 2 khẩu phần và được sao chép sang tuần sau → bữa sáng thứ Hai tuần sau có "Phở bò" 2 khẩu phần.
  - ✅ Tuần đích đã có "Bún bò" ở bữa sáng thứ Hai → sau khi sao chép, bữa đó có cả "Bún bò" và "Phở bò".

- `BR-mealplan-009` — Gỡ một mục lịch bữa ăn không làm thay đổi hay xoá công thức trong kho công thức.
  - ✅ Gỡ "Phở bò" khỏi bữa sáng thứ Hai → công thức "Phở bò" vẫn còn trong kho và vẫn tìm kiếm được.

- `BR-mealplan-010` — Tuần trong kế hoạch bữa ăn bắt đầu từ Thứ Hai, áp dụng thống nhất cho mọi tài khoản.
  - ✅ Xem kế hoạch của tuần chứa ngày 2026-09-25 → luôn nhận đúng khoảng từ Thứ Hai 2026-09-21 tới Chủ Nhật 2026-09-27.

### 3.6 Dinh dưỡng

- `BR-nutrition-001` — Các chỉ số dinh dưỡng được theo dõi gồm calo, đạm, tinh bột và chất béo; các chỉ số khác không được tính toán hay công bố.
  - ✅ Một công thức có đủ bốn chỉ số calo, đạm, tinh bột và chất béo → được coi là đầy đủ dữ liệu dinh dưỡng.
  - ❌ Yêu cầu cho biết lượng natri hoặc chất xơ của một công thức → không có số liệu, nằm ngoài phạm vi.

- `BR-nutrition-002` — Tổng dinh dưỡng của một công thức bằng tổng đóng góp của các dòng nguyên liệu định lượng đã quy đổi được về đơn vị cơ sở, và dinh dưỡng mỗi khẩu phần bằng tổng đó chia cho số khẩu phần cơ sở.
  - ✅ Công thức 4 khẩu phần gồm 400 gam thịt bò 250 kcal trên 100 gam và 200 gam bún 110 kcal trên 100 gam → tổng 1.220 kcal và mỗi khẩu phần 305 kcal.
  - ✅ Công thức được sửa từ 4 khẩu phần xuống 2 khẩu phần với nguyên liệu giữ nguyên → dinh dưỡng mỗi khẩu phần tăng gấp đôi và tổng không đổi.

- `BR-nutrition-003` — Công thức có ít nhất một dòng nguyên liệu định lượng dùng đơn vị không quy đổi được về đơn vị cơ sở thì dòng đó không được tính vào tổng và kết quả dinh dưỡng của công thức được nhận biết là ước tính chưa đầy đủ kèm danh sách nguyên liệu không tính được.
  - ✅ Công thức có "trứng 2 quả" và mục danh mục khai 1 quả bằng 55 gam → trứng được tính và công thức vẫn đầy đủ dữ liệu.
  - ❌ Công thức có "hành 1 nhánh" mà nguyên liệu này không có hệ số quy đổi cho đơn vị nhánh → hành không được tính và công thức là ước tính chưa đầy đủ.

- `BR-nutrition-004` — Công thức có ít nhất một dòng nguyên liệu định lượng trỏ tới mục danh mục chưa có dữ liệu dinh dưỡng vẫn công bố được, dòng đó không được tính vào tổng, và kết quả dinh dưỡng được nhận biết là ước tính chưa đầy đủ.
  - ✅ Công thức có 5 nguyên liệu định lượng, 4 trong số đó có dữ liệu dinh dưỡng → công thức công bố được kèm con số ước tính và dấu hiệu chưa đầy đủ.
  - ❌ Công thức bị từ chối công bố chỉ vì một nguyên liệu chưa có dữ liệu dinh dưỡng → sai.
  - ❌ Công thức thiếu dữ liệu một nguyên liệu nhưng con số dinh dưỡng được công bố ngang hàng với công thức đủ dữ liệu → sai.

- `BR-nutrition-005` — Xem một công thức theo số khẩu phần khác số khẩu phần cơ sở thì định lượng từng nguyên liệu và dinh dưỡng được nhân theo đúng tỉ lệ giữa hai số khẩu phần đó.
  - ✅ Công thức cơ sở 4 khẩu phần với 800 gam thịt, xem ở 6 khẩu phần → cần 1.200 gam thịt.

- `BR-nutrition-006` — Tổng dinh dưỡng của một ngày bằng tổng của mọi mục lịch thuộc ngày đó, mỗi mục tính bằng dinh dưỡng một khẩu phần của công thức nhân với số khẩu phần của mục.
  - ✅ Ngày có một mục 500 kcal mỗi khẩu phần với 2 khẩu phần và một mục 300 kcal mỗi khẩu phần với 1 khẩu phần → tổng ngày là 1.300 kcal.

- `BR-nutrition-007` — Ngày không có mục lịch bữa ăn nào có tổng dinh dưỡng bằng 0 và được coi là đầy đủ dữ liệu.
  - ✅ Người dùng xem một ngày chưa lập kế hoạch → tổng là 0 kcal và 0 gam mỗi macro, và người dùng vẫn thao tác tiếp được.

- `BR-nutrition-008` — Ngày có ít nhất một mục lịch thuộc công thức có dinh dưỡng là ước tính chưa đầy đủ thì tổng dinh dưỡng của cả ngày đó cũng được nhận biết là ước tính chưa đầy đủ.
  - ✅ Ngày có ba món và một món thiếu dữ liệu nguyên liệu → tổng ngày vẫn được công bố nhưng mang dấu hiệu chưa đầy đủ.
  - ❌ Ngày chứa món thiếu dữ liệu nhưng tổng được công bố như con số đầy đủ → sai.

- `BR-nutrition-009` — Mọi phép cộng dồn dinh dưỡng được thực hiện trên giá trị chưa làm tròn, và việc làm tròn chỉ áp dụng cho con số cuối cùng được công bố, với calo làm tròn tới số nguyên và các macro tới một chữ số thập phân.
  - ✅ Một ngày gồm ba mục mỗi mục 333,4 kcal → tổng ngày được công bố là 1.000 kcal.
  - ❌ Tổng ngày được tính bằng cách cộng các con số đã làm tròn của từng mục → sai.

- `BR-nutrition-010` — Ngày có tổng calo lớn hơn mục tiêu calo mỗi ngày của người dùng được nhận biết là vượt mục tiêu.
  - ✅ Ngày có tổng 2.300 kcal trong khi mục tiêu là 2.000 kcal → ngày đó được nhận biết là vượt mục tiêu.

- `BR-nutrition-011` — Số liệu dinh dưỡng của sản phẩm là ước tính tham khảo phục vụ lập kế hoạch ăn uống, không phải tư vấn y tế hay dinh dưỡng lâm sàng.
  - ✅ Người dùng dùng số liệu để cân đối bữa ăn trong tuần → đúng mục đích sử dụng.
  - ❌ Sản phẩm đưa ra khuyến nghị điều trị, chẩn đoán hoặc chế độ ăn bệnh lý dựa trên số liệu này → nằm ngoài phạm vi, không được làm.

### 3.7 Pantry (tủ đồ)

- `BR-pantry-001` — Mỗi mục pantry gồm một nguyên liệu thuộc danh mục, một số lượng không âm, một đơn vị thuộc tập đơn vị hệ thống hỗ trợ, và một hạn sử dụng tuỳ chọn.
  - ✅ Thêm "gạo 5 kilogam" vào pantry → mục được ghi nhận.
  - ❌ Thêm "gạo âm 2 kilogam" → không được ghi nhận.
  - ❌ Thêm "gạo 1 bao" với "bao" không thuộc tập đơn vị hệ thống hỗ trợ → không được ghi nhận.

- `BR-pantry-002` — Thêm vào pantry một mục trùng nguyên liệu, trùng đơn vị và trùng hạn sử dụng với một mục đã có thì số lượng được cộng dồn vào mục sẵn có.
  - ✅ Pantry có "sữa 1 lít hạn 2026-10-01" và thêm "sữa 1 lít hạn 2026-10-01" → pantry có một mục "sữa 2 lít hạn 2026-10-01".

- `BR-pantry-003` — Thêm vào pantry một mục trùng nguyên liệu và trùng đơn vị nhưng khác hạn sử dụng với một mục đã có thì hai mục được giữ riêng biệt thành hai lô.
  - ✅ Pantry có "sữa 1 lít hạn 2026-10-01" và thêm "sữa 1 lít hạn 2026-11-15" → pantry có hai lô riêng với tổng khả dụng 2 lít.

- `BR-pantry-004` — Mục pantry không khai hạn sử dụng luôn được tính vào lượng khả dụng khi đối chiếu với công thức.
  - ✅ Mục "muối 500 gam" không khai hạn sử dụng → luôn được tính là khả dụng.

- `BR-pantry-005` — Mục pantry có hạn sử dụng trước ngày hôm nay không được tính vào lượng khả dụng khi đối chiếu với công thức, nhưng vẫn tồn tại trong pantry cho tới khi người dùng bỏ đi.
  - ✅ Hôm nay là 2026-09-22 và pantry có "sữa 1 lít hạn 2026-09-22" → sữa vẫn được tính là khả dụng.
  - ❌ Hôm nay là 2026-09-22 và pantry có "sữa 1 lít hạn 2026-09-20" → công thức cần sữa bị kết luận là thiếu sữa.

- `BR-pantry-006` — Mục pantry có số lượng bằng 0 không được tính vào lượng khả dụng khi đối chiếu với công thức.
  - ✅ Người dùng cập nhật mục "trứng" về 0 → công thức cần trứng không còn được kết luận là đủ nguyên liệu.

- `BR-pantry-007` — Đối chiếu một công thức với pantry kết luận mỗi dòng nguyên liệu định lượng là đủ, là thiếu kèm lượng còn thiếu, hoặc là không xác định được khi đơn vị của dòng nguyên liệu và của mục pantry không quy đổi lẫn nhau.
  - ✅ Công thức cần 200 gam thịt bò và pantry có 500 gam còn hạn → dòng nguyên liệu này được kết luận là đủ.
  - ❌ Công thức cần 200 gam thịt bò và pantry có 150 gam → kết luận thiếu 50 gam.
  - ❌ Công thức cần 200 gam thịt bò và pantry có "thịt bò 1 miếng" không quy đổi được → kết luận là không xác định được.

- `BR-pantry-008` — Một công thức chỉ được kết luận là đủ nguyên liệu khi mọi dòng nguyên liệu định lượng của nó đều được kết luận là đủ.
  - ✅ Công thức có ba dòng nguyên liệu định lượng và cả ba đều đủ → công thức được kết luận là đủ nguyên liệu.
  - ❌ Công thức có ba dòng nguyên liệu định lượng, hai dòng đủ và một dòng không xác định được → công thức không được kết luận là đủ nguyên liệu.

- `BR-pantry-009` — Đối chiếu công thức với pantry tính lượng nguyên liệu cần theo số khẩu phần đang xét, không theo số khẩu phần cơ sở của công thức.
  - ✅ Công thức 4 khẩu phần cần 400 gam thịt nhưng chỉ nấu 2 khẩu phần và pantry có 150 gam → kết luận thiếu 50 gam.

- `BR-pantry-010` — Số lượng trong pantry chỉ thay đổi khi chính người dùng cập nhật; việc lên lịch một công thức hay việc một bữa trong kế hoạch trôi qua không làm thay đổi tồn pantry.
  - ✅ Người dùng lên kế hoạch nấu phở bò cả tuần → tồn thịt bò trong pantry giữ nguyên.
  - ❌ Hệ thống tự trừ 200 gam gạo khỏi pantry sau khi bữa tối trôi qua → sai trong phạm vi này.

## 4. Design Requirements / NFR + Compliance/Security

- `NFR-platform-001` (Đa nền tảng) — Ứng dụng chạy trên iOS, Android và trình duyệt web từ **một codebase Flutter duy nhất**; không có codebase riêng cho web.
- `NFR-platform-002` (Responsive) — Giao diện dùng được ở ba dải bề rộng: điện thoại (< 600 dp), máy tính bảng (600–1024 dp) và máy tính để bàn (> 1024 dp); không có chức năng nào chỉ dùng được ở một dải duy nhất.
- `NFR-platform-003` (Upload ảnh) — Chọn và tải ảnh hoạt động cả trên thiết bị di động (có đường dẫn tệp) lẫn trên web (chỉ có luồng bytes, không có đường dẫn tệp), và chấp nhận ảnh HEIC do iOS sinh ra.
- `NFR-perf-001` (Hiệu năng) — p95 thời gian phản hồi của các truy vấn đọc (tìm kiếm công thức, xem kế hoạch một tuần, đối chiếu pantry) dưới 300 ms với kho 1.000 công thức và 200 mục pantry mỗi tài khoản.
- `NFR-perf-002` (Phân trang) — Mọi danh sách trả về từ máy chủ đều phân trang với trần 50 bản ghi mỗi trang; không endpoint nào trả toàn bộ tập dữ liệu.
- `NFR-sec-001` (Bảo mật) — Mật khẩu được lưu dưới dạng băm với thuật toán băm mật khẩu có chi phí điều chỉnh được; không lưu mật khẩu dạng có thể khôi phục.
- `NFR-sec-002` (Bảo mật) — Endpoint đăng nhập và endpoint yêu cầu đặt lại mật khẩu có giới hạn tần suất theo địa chỉ email và theo địa chỉ IP.
- `NFR-sec-003` (Chống trùng) — Mọi thao tác tạo bản ghi nhận khoá chống trùng do client sinh và trả về bản ghi đã tạo khi khoá lặp lại.
- `NFR-data-001` (Toàn vẹn) — Công thức mang số phiên bản tăng đơn điệu, dùng cho kiểm soát ghi đè lạc quan.
- `NFR-data-002` (Trần lưu trữ) — Mỗi tài khoản có trần tổng dung lượng ảnh; vượt trần thì việc tải ảnh mới bị từ chối và ảnh đã có giữ nguyên.
- `NFR-compliance-001` (Dữ liệu cá nhân) — Dữ liệu ăn uống của người dùng chỉ phục vụ chính tài khoản đó; không dùng cho mục đích khác và không chia sẻ sang tài khoản khác.

## 5. Out of Scope

- Shopping list có vòng đời (gộp nguyên liệu theo tuần, đánh dấu đã mua).
- Household: nhiều tài khoản chia sẻ chung một kho công thức, một lịch hoặc một pantry.
- Cộng đồng: công thức công khai, đánh giá, bình luận, bảng tin.
- Import công thức từ URL, từ ảnh hoặc bằng nhận dạng ký tự.
- Offline và cache đọc ở client (sản phẩm là online-only; ngoại lệ duy nhất có chủ ý là trạng thái nháp lưu trên máy chủ).
- Snapshot toàn bộ nội dung công thức (nguyên liệu và các bước) vào mục lịch; chỉ snapshot con số dinh dưỡng và tên.
- Pantry tự trừ tồn khi một bữa được đánh dấu đã nấu.
- Quy đổi thể tích sang khối lượng bằng mật độ chung cho mọi nguyên liệu.
- Vi chất: vitamin, natri, chất xơ, cholesterol.
- Tính TDEE theo cân nặng, chiều cao và mức vận động; mục tiêu riêng cho từng macro; biểu đồ xu hướng.
- Ảnh minh hoạ cho từng bước nấu.
- Tên bữa do người dùng tự định nghĩa.
- Lặp lịch tự động theo chu kỳ.
- Quét mã vạch để thêm vào pantry.
- Gợi ý thực đơn tự động.
- Chi phí và giá tiền của món ăn.
- Đa ngôn ngữ giao diện.
- Xuất dữ liệu của người dùng ra tệp.
- Công thức lồng công thức (dùng một công thức sốt hoặc nước dùng làm nguyên liệu của công thức khác).

## 6. Open Questions

| # | Question | Type | Blocking? | Owner | Resolution |
|---|----------|------|-----------|-------|------------|
| OQ-01 | Nguyên liệu là chuỗi tự do hay tham chiếu danh mục, và dữ liệu dinh dưỡng lấy từ đâu? | Business | ✅ | User | Danh mục nguyên liệu do hệ thống seed sẵn (~300–500 nguyên liệu Việt phổ biến), đơn vị cơ sở g hoặc ml, kèm calo và ba macro trên 100 đơn vị cơ sở; người dùng tự thêm được nguyên liệu riêng kèm số liệu tự nhập. |
| OQ-02 | "Hộ gia đình" nghĩa là một tài khoản dùng chung hay nhiều tài khoản chia sẻ dữ liệu? | Business | ✅ | User | Một tài khoản bằng một kho dữ liệu; không có household chia sẻ. Nhiều người trong nhà thể hiện qua số khẩu phần. |
| OQ-03 | Pantry phục vụ quyết định nghiệp vụ nào khi shopping list đã bị loại? | Business | ✅ | User | Hai kết quả: lọc "nấu được với đồ đang có", và đối chiếu ra danh sách nguyên liệu còn thiếu kèm lượng thiếu. Đây là đối chiếu tức thời, không phải danh sách có vòng đời. |
| OQ-04 | Kế hoạch bữa ăn là kế hoạch hay nhật ký đã ăn — số liệu quá khứ có đổi khi sửa công thức không? | Business | ✅ | User | Mục lịch ngày quá khứ giữ snapshot con số dinh dưỡng và tên; mục lịch hôm nay và tương lai tham chiếu sống tới công thức. |
| OQ-05 | Online-only làm mất công thức đang soạn khi mạng hoặc phiên gãy — chấp nhận hay cần bản nháp? | Business | ✅ | User | Có trạng thái nháp lưu trên máy chủ với validation tối thiểu; nháp không vào tìm kiếm, không vào lịch, không vào dinh dưỡng. |
| OQ-06 | Quy đổi từ đơn vị đếm và đơn vị thìa sang g/ml có nằm trong phạm vi không? | Business | ✅ | User | Có, bằng hệ số khai riêng cho từng mục danh mục nguyên liệu. Nguyên liệu chưa khai hệ số thì bị loại khỏi tổng và công thức mang dấu hiệu ước tính chưa đầy đủ, không bị chặn lưu. |
| OQ-07 | Tài khoản mới mở ra là kho rỗng — xử lý cold start thế nào? | Business | ✅ | User | Seed một bộ công thức mẫu cho tài khoản mới, cộng thao tác nhân bản công thức. |
| OQ-08 | Có mốc so sánh cho con số dinh dưỡng hằng ngày không? | Business | ✅ | User | Có, một con số mục tiêu calo mỗi ngày do người dùng tự đặt. |
| OQ-09 | Hai thiết bị cùng sửa một công thức thì xử lý ra sao? | Technical | ✅ | AI (mặc định kỹ thuật) | Kiểm soát ghi đè lạc quan bằng số phiên bản: ghi dựa trên bản cũ bị từ chối toàn bộ, không ghi đè âm thầm. |
| OQ-10 | Số lượng công thức mẫu seed cho tài khoản mới là bao nhiêu? | Product | ❌ | User | (open — đề xuất 15–20; không chặn vì không đổi schema) |
| OQ-11 | Danh mục nguyên liệu seed nên phủ bao nhiêu mục ở bản đầu tiên? | Product | ❌ | User | (open — đề xuất 300; không chặn vì mở rộng bằng dữ liệu, không đổi schema) |

## 7. Dependencies

| Dependency | Type | Status |
|------------|------|--------|
| Bộ dữ liệu dinh dưỡng nguyên liệu Việt (nguồn để seed danh mục) | dữ liệu | pending — cần chọn nguồn và đối soát trước khi seed |
| Dịch vụ gửi email (đặt lại mật khẩu) | service | pending — chưa chọn nhà cung cấp |
| Object storage cho ảnh công thức | infra | pending — chưa chọn nhà cung cấp |

## Appendix

- Nguồn: `discovery` three-amigos (3 agent context sạch: Product / Developer / Tester), 2026-09-22.
- JIRA Story: (không có — repo chưa cấu hình issue tracker, chạy local-only).
- Vị trí tài liệu theo chỉ định của user là `planning/`, không phải `docs/agentic-workflow/`.
