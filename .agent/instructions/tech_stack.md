# Tech Stack & Environment Instructions

Tài liệu hướng dẫn về cấu trúc công nghệ và môi trường của dự án Photoeditor.

## 1. Thành phần Công nghệ (Tech Stack)
Dự án này là một ứng dụng Web tĩnh chạy Client-side 100%:
- **Frontend**: HTML5, Vanilla CSS, Javascript thuần (kèm thư viện ngoài được đóng gói trong `code/external/`).
- **Web Server**: Nginx (chạy phiên bản `nginx:1.27-alpine` để tối ưu dung lượng và bảo mật).
- **Containerization**: Docker & Docker Compose để quản lý môi trường chạy độc lập.

## 2. Progressive Web App (PWA)
- **Web App Manifest**: Tệp `manifest.json` trong thư mục gốc chịu trách nhiệm định nghĩa các siêu dữ liệu PWA để ứng dụng có thể cài đặt độc lập trên di động.
- **Service Worker**: Tệp `sw.js` chịu trách nhiệm đăng ký fetch handler để đáp ứng tiêu chuẩn cài đặt của Chrome/Safari di động.
- **Biểu tượng ứng dụng**:
  - `images/icon-192.png`: Dành cho danh sách ứng dụng, màn hình khởi động (splash screen) nhỏ.
  - `images/icon-512.png`: Dành cho màn hình chính, biểu tượng lớn trên độ phân giải cao.
  - `images/ps.svg`: Định dạng vector gốc để mở rộng linh hoạt.

## 3. Môi trường Triển khai (Deployment Environment)
- **Cục bộ (Local)**: Chạy trên cổng `8080` qua Docker Compose.
- **VPS Máy chủ**:
  - Máy chủ chạy nền tảng Linux (Ubuntu/Debian).
  - Định tuyến qua Nginx Proxy Manager (hoặc reverse proxy tương tự) kết nối HTTPS trên cổng `443` chuyển tiếp vào cổng ứng dụng nội bộ (mặc định: `8085`).
  - Triển khai bằng script tự động hóa từ Windows PowerShell local (`deploy.ps1`) truyền tải file tarball nén qua giao thức SSH/SCP.
