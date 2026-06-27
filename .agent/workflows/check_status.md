# Workflow: Check Status

Sử dụng quy trình này để kiểm tra nhanh trạng thái hoạt động của hệ thống cục bộ và trên VPS nhằm phát hiện lỗi sớm.

## 1. Kiểm tra môi trường cục bộ (Local Development)
- Kiểm tra trạng thái Docker container cục bộ:
  ```powershell
  docker ps
  ```
- Kiểm tra xem cổng cục bộ (mặc định: `8080`) có phản hồi chính xác không:
  - Sử dụng lệnh Powershell: `Invoke-WebRequest -Uri http://localhost:8080`
  - Hoặc mở trên trình duyệt.

## 2. Kiểm tra môi trường máy chủ (Remote VPS)
- Kết nối SSH vào VPS và kiểm tra danh sách container đang chạy:
  ```powershell
  ssh -p <PORT> -i <KEY> <USER>@<IP> "docker ps -a"
  ```
- Tìm kiếm container có tên liên quan tới dự án (ví dụ: `photoeditorthucme-photopea-1` hoặc `photopea-photopea-1`).
- Kiểm tra xem cổng dịch vụ của dự án có đang hoạt động và lắng nghe kết nối hay không:
  ```powershell
  ssh -p <PORT> -i <KEY> <USER>@<IP> "ss -tulnp | grep <APP_PORT>"
  ```

## 3. Kiểm tra tính năng PWA (Manifest & Service Worker)
- Mở DevTools (F12) trên trình duyệt (Chrome/Edge/Safari).
- Vào tab **Application** -> **Manifest**:
  - Đảm bảo file `manifest.json` được nhận dạng thành công.
  - Các icon kích thước `192x192` và `512x512` hiển thị đúng và không có cảnh báo bị thiếu.
- Vào tab **Application** -> **Service Workers**:
  - Đảm bảo service worker `sw.js` đang hiển thị trạng thái `Activated and running`.
