# Issue Resolutions

Nhật ký ghi lại các lỗi kỹ thuật phát sinh và cách thức xử lý chi tiết để tránh lặp lại sự cố trong tương lai.

## Lỗi 1: Cú pháp PowerShell lỗi phân tách biến chứa dấu hai chấm (`:`)
- **Triệu chứng**: Khi chạy script deploy, PowerShell báo lỗi: `Variable reference is not valid. ':' was not followed by a valid variable name character. Consider using ${} to delimit the name.`
- **Nguyên nhân**: PowerShell hiểu dấu hai chấm ngay sau biến `$VPS_IP` trong chuỗi `"$VPS_USER@$VPS_IP:$VPS_PROJECT_DIR/"` là drive-letter specifier (giống như `C:` hoặc `D:`).
- **Cách giải quyết**: Bao bọc biến bằng dấu ngoặc nhọn để phân tách rõ ràng phạm vi của tên biến:
  ```powershell
  $DestPath = "${VPS_USER}@${VPS_IP}:${VPS_PROJECT_DIR}/"
  ```

## Lỗi 2: Trích xuất giá trị môi trường bị lỗi do ghi chú nội dòng (Inline Comments)
- **Triệu chứng**: Hàm tải cấu hình `Test-Path` báo lỗi: `Illegal characters in path.`
- **Nguyên nhân**: Trình đọc file `.env.deploy` thực hiện split chuỗi theo dấu `=` và lấy toàn bộ phần còn lại làm giá trị, bao gồm cả ghi chú nội dòng bắt đầu bằng dấu `#` (ví dụ: `VPS_KEY_PATH="~/.ssh/id_rsa" # ghi chú` sẽ lấy giá trị là `"~/.ssh/id_rsa" # ghi chú`).
- **Cách giải quyết**: Thực hiện cắt bỏ toàn bộ ký tự từ dấu `#` trở đi trước khi thực hiện phân tách cặp khóa-giá trị:
  ```powershell
  $line = ($_ -split '#', 2)[0].Trim()
  ```

## Lỗi 3: Cổng kết nối bị chiếm dụng (Docker Bind Port Conflict)
- **Triệu chứng**: Deploy lên VPS báo lỗi `Bind for 0.0.0.0:8080 failed: port is already allocated` và container không thể chạy.
- **Nguyên nhân**: Cổng `8080` của VPS đã được sử dụng bởi container `sdvd-server`. Các cổng khác cũng đang chạy các dự án WordPress hoặc Joomla.
- **Cách giải quyết**:
  1. Sử dụng lệnh `ss -tulnp` để liệt kê các cổng đang lắng nghe để tìm cổng trống (kết quả tìm được cổng `8083` và `8085` sau khi dọn container cũ là khả dụng).
  2. Cấu hình biến môi trường `${PORT}` động trong `docker-compose.yml` để linh hoạt thay đổi cổng mà không cần sửa file compose gốc.
  3. Chỉ định `VPS_APP_PORT="8085"` trong `.env.deploy` để khớp với cổng định tuyến của tên miền `photoeditor.thuc.me` trên Reverse Proxy.

## Lỗi 4: Rich PWA Install UI won’t be available on desktop/mobile (Thiếu screenshots)
- **Triệu chứng**: Chrome DevTools hiển thị cảnh báo Rich PWA Install UI không khả dụng cho cả thiết bị di động và máy tính do thiếu screenshots có định dạng form factor tương ứng.
- **Nguyên nhân**: Chrome yêu cầu có ít nhất 1 screenshot định dạng `wide` (cho PC) và 1 screenshot định dạng `narrow` (cho Mobile) để kích hoạt giao diện hộp thoại cài đặt đẹp mắt (Rich Install UI).
- **Cách giải quyết**:
  1. Trích xuất và định cấu hình lại ảnh chụp màn hình thực tế của ứng dụng sang kích thước `1280x720` (wide) và `450x800` (narrow) rồi lưu vào `images/`.
  2. Bổ sung mảng `screenshots` trong `manifest.json` chỉ định rõ `src`, `sizes`, `type` và `form_factor`.

## Lỗi 5: Biểu tượng SVG load thất bại hoặc không hợp lệ (MIME / Ratio)
- **Triệu chứng**: Cảnh báo `Icon https://photoeditor.thuc.me/images/ps.svg failed to load` hiển thị trong tab Manifest.
- **Nguyên nhân**: File `ps.svg` có kích thước tỉ lệ chữ nhật (`1024x820` - không phải là hình vuông tỉ lệ 1:1). Trình duyệt bắt buộc các biểu tượng ứng dụng PWA phải là hình vuông (tỉ lệ 1:1).
- **Cách giải quyết**: Loại bỏ khai báo icon `images/ps.svg` khỏi mảng `icons` trong `manifest.json`. Chỉ giữ lại các icon chuẩn vuông PNG (`icon-192.png` và `icon-512.png`).

## Lỗi 6: Favicon.ico trả về lỗi 404 trên production mặc dù file đã tồn tại trên VPS
- **Triệu chứng**: Gặp lỗi `GET https://photoeditor.thuc.me/favicon.ico 404 (Not Found)` trên môi trường live, nhưng curl nội bộ trong VPS trả về 200 OK.
- **Nguyên nhân**: Do trước đó file `favicon.ico` chưa tồn tại nên truy cập bị lỗi 404, lỗi này đã bị Cloudflare CDN ghi nhớ và lưu cache (HIT) ở các máy chủ biên (edge servers) với thời gian 4 tiếng. Do đó, dù VPS đã cập nhật file mới, Cloudflare vẫn trả về 404 cũ.
- **Cách giải quyết**: Bổ sung tham số phiên bản `?v=3` (cache buster) vào các đường dẫn `favicon.ico` trong `index.html`. Trình duyệt sẽ yêu cầu URL mới và Cloudflare sẽ buộc phải lấy trực tiếp file mới từ VPS.

