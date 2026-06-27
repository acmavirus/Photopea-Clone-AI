# Decision Log

Nhật ký ghi lại các quyết định kiến trúc quan trọng được đưa ra trong quá trình phát triển dự án.

## [2026-06-28] Quyết định 1: Cấu hình PWA Mobile và sinh Icon tự động
- **Bối cảnh**: Người dùng yêu cầu cấu hình dự án chạy được PWA trên thiết bị di động và có thể cài đặt lên màn hình chính.
- **Quyết định**:
  - Trích xuất biểu tượng từ file vector gốc `images/ps.svg` để đảm bảo độ phân giải.
  - Sử dụng thư viện Pillow trong Python để tự động resize và xuất bản thành 2 file PNG tiêu chuẩn: `icon-192.png` và `icon-512.png` đặt trong thư mục `images/`.
  - Viết tệp cấu hình `manifest.json` trong thư mục gốc.
  - Thêm thẻ liên kết manifest và các thẻ meta hỗ trợ iOS Safari (`apple-mobile-web-app-capable`, `apple-touch-icon`) vào `index.html`.

## [2026-06-28] Quyết định 2: Viết Script Triển khai VPS Tự động (deploy.ps1)
- **Bối cảnh**: Người dùng yêu cầu triển khai dự án lên VPS từ máy Windows cục bộ.
- **Quyết định**:
  - Viết một script PowerShell (`deploy.ps1`) thực hiện nén zip (tarball), chuyển mã nguồn lên VPS, giải nén và kích hoạt lại Docker container thông qua lệnh `ssh` / `scp`.
  - Tách biệt toàn bộ thông tin đăng nhập và địa chỉ IP nhạy cảm ra tệp `.env.deploy` nằm trong danh sách `.gitignore` nhằm tuân thủ quy tắc bảo mật.

## [2026-06-28] Quyết định 3: Tối ưu hóa Port và Thư mục Triển khai trên VPS
- **Bối cảnh**: Quá trình triển khai lên cổng mặc định `8080` bị lỗi do cổng đã bị chiếm dụng bởi container `sdvd-server` trên VPS của người dùng. Cổng `8085` cũng bị chiếm dụng bởi container cũ.
- **Quyết định**:
  - Dọn dẹp thư mục tạm `/var/www/photopea` và container chạy thử trên cổng `8083`.
  - Thay đổi đường dẫn triển khai chính thức thành `/var/www/photoeditor.thuc.me` trùng với tên miền thực tế.
  - Parameter hóa cổng kết nối trong `docker-compose.yml` thông qua biến môi trường `${PORT}`.
  - Cập nhật cấu hình sang cổng `8085`, đồng thời cấu hình script deploy thực hiện `docker compose down` trước khi khởi động để tự động dọn dẹp container cũ và giải phóng cổng `8085`, giúp tên miền `https://photoeditor.thuc.me/` tự động định tuyến tới mã nguồn mới nhất.
