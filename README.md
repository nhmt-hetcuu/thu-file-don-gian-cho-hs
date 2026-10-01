# Web Thu Hình Ảnh Hoạt Động Đoàn

Ứng dụng web chạy trên **Google Apps Script** giúp học sinh nộp ảnh/video minh chứng hoạt động Đoàn theo từng tuần. File được lưu tự động vào **Google Drive**, dữ liệu (họ tên, lớp, thời gian, link ảnh) được ghi vào **Google Sheet** — không cần server riêng, không tốn phí hosting.
**Demo:** - https://claude.ai/artifact/3tjcnSJCST32pkgez8Jmzy
## Tính năng

- Form nộp ảnh/video đơn giản, tối ưu cho điện thoại.
- **Nén ảnh ngay trên trình duyệt** trước khi gửi (giảm dung lượng, gửi nhanh hơn) — video gửi nguyên bản.
- Tự động đặt tên file theo dạng `Lớp_HọTên_Tuần_ThờiGian.đuôifile`, không lo trùng tên.
- Tự động tạo thư mục trên Drive theo từng **Tuần hoạt động**, có thể bật thêm thư mục con theo **Lớp**.
- Mỗi tuần tự động có 1 tab riêng trong Google Sheet, định dạng sẵn: header màu, cố định dòng tiêu đề, kẻ sọc xen kẽ, cột **Link ảnh** bấm mở trực tiếp.
- Toàn bộ nội dung hiển thị (tên trường, tên phong trào, ghi chú, danh sách Tuần) **lấy động từ 1 tab "Config"** trong Sheet — sửa nội dung ngay trong Sheet, không cần sửa code hay deploy lại.
- Chống ghi đè khi nhiều người gửi cùng lúc (`LockService`).
- Báo lỗi chi tiết theo từng bước (mở Drive / tạo thư mục / tạo file / ghi Sheet) để dễ debug.

## Cấu trúc project

```
.
├── Code.gs      # Toàn bộ logic phía server (Apps Script)
└── Index.html   # Giao diện form phía học sinh
```

## Cài đặt

### 1. Chuẩn bị Google Drive & Google Sheet

- Tạo (hoặc dùng sẵn) **1 thư mục Drive** để chứa ảnh/video nộp lên → lấy **ID thư mục** (đoạn ký tự trong URL sau `/folders/`).
- Tạo (hoặc dùng sẵn) **1 Google Sheet** để ghi dữ liệu → lấy **ID Sheet** (đoạn ký tự trong URL sau `/d/` và trước `/edit`).

### 2. Tạo Apps Script project

1. Vào [script.google.com](https://script.google.com) → **New project**.
2. Xoá nội dung mặc định của file `Code.gs`, dán toàn bộ nội dung file `Code.gs` trong repo này vào.
3. Tạo thêm 1 file HTML: **File → New → HTML**, đặt tên chính xác là `Index` → dán nội dung file `Index.html` vào.
4. Trong `Code.gs`, sửa 2 dòng sau theo ID thực tế của bạn:
   ```js
   var SPREADSHEET_ID = 'DÁN_ID_SHEET_CỦA_BẠN';
   var MAIN_FOLDER_ID = 'DÁN_ID_THƯ_MỤC_DRIVE_CỦA_BẠN';
   ```

### 3. Deploy thành Web App

1. **Deploy → New deployment → chọn loại "Web app"**.
2. Cấu hình **bắt buộc đúng** như sau (sai 2 mục này là nguyên nhân phổ biến nhất gây lỗi khi người khác dùng):
   | Mục | Giá trị |
   |---|---|
   | Execute as | **Me** (chủ sở hữu script) |
   | Who has access | **Anyone** *(không chọn "Anyone within [tổ chức]")* |
3. Bấm **Deploy**, copy link `.../exec` — đây là link gửi cho học sinh.

> Nếu dùng tài khoản Google Workspace (email trường/tổ chức), Apps Script hay tự gợi ý "Anyone within [tổ chức]" trông rất giống "Anyone" — để ý kỹ, chọn nhầm sẽ khiến tài khoản Gmail cá nhân không mở được form.

### 4. Khởi tạo tab Config (tuỳ chọn)

Tab `Config` sẽ tự được tạo với giá trị mặc định ngay lần đầu có người mở form. Muốn tạo sẵn ngay (không cần đợi ai mở form):

- Mở Apps Script editor → chọn hàm `taoConfigMacDinh` ở thanh **Run** → bấm **Run**.

## Tuỳ chỉnh qua Google Sheet (tab "Config")

Không cần sửa code — mở Sheet, vào tab **Config**:

| Ô | Ý nghĩa |
|---|---|
| `B2` | Tên trường |
| `B3` | Tên phong trào / tiêu đề (dùng Alt+Enter để xuống dòng) |
| `B4` | Ghi chú nhỏ (ví dụ: "Năm học 2026-2027") |
| `A7` trở xuống | Danh sách **Tuần hoạt động** — mỗi dòng 1 lựa chọn, thêm/xoá/sửa tuỳ ý |
| `D1` | `TRUE`/`FALSE` — có tạo thêm thư mục con theo **Lớp** bên trong mỗi Tuần hay không |

Sửa xong lưu lại, **không cần deploy lại** — form tự đọc giá trị mới ở lần mở tiếp theo.

## Cấu trúc dữ liệu sau khi chạy

**Google Drive:**
```
Thư mục gốc/
├── Tuần 1/
│   ├── 12A3_NguyenVanA_Tuan1_20260930_143015.jpg
│   └── 12A3/                      ← chỉ có nếu D1 = TRUE
│       └── ...
└── Tuần 2/
    └── ...
```

**Google Sheet:** mỗi Tuần có 1 tab riêng, 4 cột: `Thời gian | Họ và tên | Lớp | Link ảnh`.

## Bảo trì

- **Trang trí lại các tab Tuần đã tạo từ trước** (nếu bạn mới thêm tính năng định dạng sau khi đã có sẵn dữ liệu): chạy hàm `trangTriTatCaCacTuan` trong Apps Script editor.
- **Xem log lỗi chi tiết**: Apps Script editor → mục **Executions** (biểu tượng đồng hồ).
- **Xoá dữ liệu an toàn**: có thể xoá dòng/tab trong Sheet hoặc file/folder con trong Drive bất cứ lúc nào — hệ thống tự tạo lại khi cần. Tuyệt đối **không xoá chính file Sheet hoặc thư mục gốc** đang gắn với `SPREADSHEET_ID` / `MAIN_FOLDER_ID`.

## So sánh với Google Form

Google Form cũng hỗ trợ tải file lên Drive, nhưng với use case "thu ảnh minh chứng hoạt động theo tuần/lớp", có vài khác biệt đáng kể — rõ nhất là trên điện thoại:

| Tiêu chí | Web app này | Google Form |
|---|---|---|
| **Đăng nhập để nộp** | Không cần — ai có link cũng gửi được ngay | **Bắt buộc đăng nhập Google** mới dùng được mục tải file lên, khá phiền trên điện thoại (nhất là học sinh dùng tài khoản phụ huynh, tài khoản trường bị giới hạn chia sẻ ngoài miền) |
| **Tốc độ gửi ảnh** | Tự nén ảnh ngay trên máy trước khi gửi → nhanh hơn, tốn ít 4G/wifi hơn | Gửi nguyên file gốc (ảnh điện thoại thường 3-10MB), không có bước nén |
| **Tổ chức file trên Drive** | Tự động chia thư mục theo Tuần (và theo Lớp nếu bật) | Mặc định dồn hết vào 1 thư mục phẳng theo tên câu hỏi, phải tự sắp xếp lại thủ công |
| **Đặt tên file** | Tự đặt lại tên rõ ràng: `Lớp_HọTên_Tuần_ThờiGian.jpg` | Giữ nguyên tên gốc kiểu `IMG_2026.jpg`, khó tìm/kiểm tra sau này |
| **Giao diện** | Tự thiết kế theo đúng màu/logo/tên trường, không có branding của Google | Theo khung giao diện cố định của Google Form |
| **Trải nghiệm trên điện thoại** | Chọn ảnh bằng ô chọn file gốc của trình duyệt, 1 chạm là xong, không bước trung gian | Câu hỏi "Tải tệp lên" bắt phải **đăng nhập Google** → **xác nhận quyền truy cập Drive** → chọn nguồn file (máy/Drive/camera) → đợi tải lên ngay trong lúc làm Form — khá nhiều bước rườm rà, mất mạng giữa chừng dễ phải làm lại từ đầu |
| **Tuỳ biến logic** | Có thể thêm điều kiện riêng (ví dụ: bật/tắt thư mục theo Lớp, đổi tên file, nén ảnh...) | Giới hạn trong các tính năng có sẵn của Form, không chỉnh được logic xử lý sau khi nộp |
| **Độ khó cài đặt ban đầu** | Cần biết paste code vào Apps Script, cấu hình Deploy đúng cách | Tạo Form vài phút là dùng được ngay, không cần code |
| **Thống kê/biểu đồ phản hồi** | Không có sẵn (phải tự xem trong Sheet) | Có sẵn tab "Phản hồi" với biểu đồ, tóm tắt tự động |
| **Độ ổn định/giới hạn** | Phụ thuộc quota Apps Script (đủ dùng cho quy mô lớp/trường) | Hạ tầng của Google vận hành, ít lo quota hơn |

**Tóm lại:** Google Form phù hợp nếu muốn làm nhanh, không cần code, và không quan trọng việc file phải được sắp xếp gọn gàng theo Tuần/Lớp. Web app này phù hợp hơn nếu muốn trải nghiệm nộp bài mượt trên điện thoại (không bắt đăng nhập, không qua nhiều bước xác nhận quyền Drive), file tự sắp xếp gọn theo đúng cấu trúc cần quản lý, và có thương hiệu/giao diện riêng của trường.

## Giới hạn cần biết

- Google Apps Script (tài khoản miễn phí): tối đa ~90 phút chạy script/ngày, mỗi lần chạy tối đa 6 phút, tối đa ~30 lượt chạy đồng thời — dư sức cho vài trăm lượt nộp/ngày.
- Dung lượng Drive miễn phí: 15GB dùng chung Gmail/Drive/Photos. Ảnh đã được nén trước khi gửi; **video không nén được** nên sẽ tốn dung lượng nhanh hơn nếu có nhiều video dài/chất lượng cao.
- Không có xác thực đăng nhập trên form — ai có link đều gửi được. Phù hợp quy mô nội bộ lớp/trường, không nên dùng cho dữ liệu nhạy cảm.

## License

Tự do sử dụng, chỉnh sửa cho mục đích học tập / nội bộ trường học.
