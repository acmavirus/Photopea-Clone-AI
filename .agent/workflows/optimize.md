# Workflow: Optimize

Quy trình tối ưu hiệu suất tải trang và tài nguyên của ứng dụng để đảm bảo trải nghiệm cài đặt PWA mượt mà nhất, đặc biệt trên thiết bị di động kết nối mạng yếu.

## 1. Tối ưu hóa Nginx Caching
- Mở file `nginx.conf` và kiểm tra cấu hình cache cho các tài nguyên tĩnh:
  ```nginx
  location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
      root /usr/share/nginx/html;
      expires 1y;
      add_header Cache-Control "public, no-transform";
  }
  ```
- Bổ sung định dạng `.webmanifest` hoặc `.json` vào danh sách này nếu muốn lưu cache cấu hình PWA (lưu ý: thời gian hết hạn của manifest nên ngắn hơn hoặc để `no-cache` nếu dự án cập nhật liên tục).

## 2. Nén và Tối ưu hóa Ảnh / Icons
- Các biểu tượng PWA (`icon-192.png` và `icon-512.png`) cần có kích thước chuẩn xác.
- Sử dụng thuật toán nội suy chất lượng cao (như Lanczos) khi resize từ file SVG gốc để tránh làm vỡ nét biểu tượng trên màn hình Retina/High-DPI của điện thoại.
- Có thể dùng các công cụ nén ảnh không hao tổn (như OptiPNG hoặc TinyPNG) để tối ưu hóa kích thước file icon trước khi đóng gói.

## 3. Tối ưu kích thước gói truyền tải Deploy
- Script triển khai tự động (`deploy.ps1`) bắt buộc phải loại bỏ các thư mục phát triển cục bộ và lịch sử git trước khi nén để giảm dung lượng file gửi qua mạng:
  - Loại trừ thư mục: `.git/`, `.gemini/`, `.agents/`, `.codex/`, `node_modules/`.
  - Giảm thời gian truyền tải từ vài chục MB xuống còn ~3.5MB.
