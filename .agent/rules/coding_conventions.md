# Coding Conventions

Dự án này là một bản sao ứng dụng xử lý ảnh tĩnh (Photopea clone) chạy độc lập qua Docker Nginx. Dưới đây là các quy ước viết code nhằm duy trì sự gọn nhẹ, tối ưu và nhất quán.

## 1. HTML & CSS
- Giữ các tệp HTML gốc sạch sẽ, tránh sử dụng placeholder.
- CSS sử dụng Vanilla CSS trong thư mục `style/` và nhúng trực tiếp trong thẻ `<style>` của `index.html` nếu là style cấu hình nhanh.
- Thiết lập viewport chuẩn di động hỗ trợ PWA tốt:
  ```html
  <meta name='viewport' content='width=device-width, minimum-scale=1.0, maximum-scale=1.0, initial-scale=1.0'>
  ```

## 2. Javascript (PWA & Service Worker)
- Các tệp JS trong thư mục `code/` cần được giữ nguyên bản trừ khi có yêu cầu tối ưu hoặc vá lỗi.
- Đăng ký service worker trong file JS chính (`pp.js` hoặc tương đương) phải sử dụng cấu hình tương thích:
  ```javascript
  if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("sw.js", { scope: "./" })
  }
  ```
- File `sw.js` trong thư mục gốc chịu trách nhiệm xử lý vòng đời Service Worker và sự kiện fetch. Cần có ít nhất một fetch event handler trống hoặc đầy đủ để được coi là ứng dụng PWA hợp lệ.

## 3. Cấu hình Docker & Nginx
- Dockerfile nên sử dụng base image nhẹ (như `nginx:alpine`).
- Tất cả tài nguyên tĩnh cần được COPY vào `/usr/share/nginx/html`.
- File cấu hình `nginx.conf` phải hỗ trợ:
  - Cache tài nguyên tĩnh (js, css, png, svg, webmanifest, v.v.) dài hạn để tăng tốc độ tải PWA.
  - Sử dụng header `Cache-Control "public, no-transform"`.
  - Phản hồi đúng MIME type cho các file manifest và assets.

## 4. Script Triển khai (PowerShell)
- Viết kịch bản tự động hóa bằng PowerShell (.ps1) chạy trên môi trường Windows local của người dùng.
- Tránh hardcode các khóa bảo mật, mật khẩu hay IP trong script. Thay vào đó, hãy đọc cấu hình từ tệp tin ngoại biên `.env.deploy`.
- Luôn sử dụng cú pháp đóng ngoặc nhọn `{}` cho các biến khi dùng chung với dấu hai chấm `:` trong chuỗi ký tự (ví dụ: `"${VPS_IP}:${VPS_APP_PORT}"`) để tránh lỗi phân tách ổ đĩa của PowerShell.
