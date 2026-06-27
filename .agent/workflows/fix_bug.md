# Workflow: Fix Bug

Quy trình xử lý sự cố thường gặp trong quá trình phát triển cục bộ và triển khai lên máy chủ VPS.

## 1. Trình tự gỡ lỗi (Debugging Protocol)
1. **Xác định phạm vi lỗi**: Lỗi xảy ra ở môi trường cục bộ (Local) hay máy chủ (VPS)?
2. **Kiểm tra Logs hệ thống**:
   - Logs Nginx cục bộ: `docker logs <container-id>`
   - Logs trên VPS: `ssh ... "docker logs <remote-container-id>"`
3. **Kiểm tra Console trình duyệt**: Nhấp chuột phải -> **Inspect** -> **Console** để tìm lỗi nạp Service Worker hoặc nạp Manifest.

## 2. Các lỗi phổ biến & Cách khắc phục

### Lỗi 1: Cổng bị chiếm dụng trên VPS (Port Allocation Conflict)
- **Triệu chứng**: Chạy Docker Compose báo lỗi: `Bind for 0.0.0.0:<PORT> failed: port is already allocated`.
- **Giải pháp**:
  1. Chạy lệnh `ss -tulnp` để tìm các tiến trình hoặc container đang dùng cổng đó.
  2. Thay đổi cổng map trong cấu hình `.env.deploy` (ví dụ: đổi `VPS_APP_PORT="8085"` thay vì `8080`).
  3. Re-deploy.

### Lỗi 2: Trình duyệt không nhận dạng PWA hoặc nút Cài đặt bị ẩn
- **Triệu chứng**: Mở trang web không hiển thị nút "Install App", kiểm tra DevTools báo lỗi manifest hoặc thiếu HTTPS.
- **Giải pháp**:
  1. Kiểm tra lại đường dẫn file manifest trong `<head>` của `index.html`.
  2. Kiểm tra xem service worker có đăng ký fetch handler chưa.
  3. PWA bắt buộc phải chạy trên HTTPS trên môi trường production. Đảm bảo tên miền đã được định tuyến qua Nginx Reverse Proxy có cài đặt chứng chỉ SSL/TLS (ví dụ: Cloudflare SSL hoặc Let's Encrypt).

### Lỗi 3: PowerShell Script bị lỗi phân tách biến khi dùng dấu hai chấm `:`
- **Triệu chứng**: PowerShell báo lỗi cú pháp: `Variable reference is not valid. ':' was not followed by a valid variable name...`
- **Giải pháp**:
  - Không viết trực tiếp `$VAR1:$VAR2` trong chuỗi ký tự.
  - Sử dụng dấu ngoặc nhọn để phân định tên biến rõ ràng: `${VAR1}:${VAR2}`.
