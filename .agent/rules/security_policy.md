# Security Policy

Bảo mật là yếu tố quan trọng hàng đầu trong suốt quá trình phát triển, đóng gói và triển khai ứng dụng.

## 1. Quản lý Credentials & Key bảo mật
- **Không hard-code thông tin nhạy cảm**: Tuyệt đối không lưu trữ IP máy chủ, Port SSH, Username, Mật khẩu hoặc Private Key trực tiếp vào trong mã nguồn dự án hay các tệp tin lưu trên Git.
- **Tập tin môi trường cục bộ**: Mọi thông tin cấu hình triển khai phải được lưu trữ trong file `.env.deploy` ở thư mục gốc.
- **Bắt buộc GitIgnore**: Tệp tin `.env.deploy` (và bất cứ file nào có đuôi `.env*`) phải được đưa vào danh sách `.gitignore` và `.dockerignore` trước khi bắt đầu commit/đóng gói để tránh rò rỉ dữ liệu lên repo công khai.

## 2. Docker & Container Security
- Chạy ứng dụng dưới dạng Nginx không có quyền root (nếu cần bảo mật cao hơn), hoặc sử dụng container biệt lập không tiếp xúc trực tiếp với các tài nguyên hệ thống nhạy cảm của VPS.
- Không để lộ các cổng quản trị hoặc cổng test không cần thiết ra ngoài internet. Chỉ publish cổng ứng dụng cần thiết (ví dụ: cổng `8085` được chuyển hướng qua Nginx Reverse Proxy).

## 3. An toàn Triển khai (Deployment Safety)
- **Kiểm tra Port trước khi Bind**: Tránh làm sập các dịch vụ hiện có của VPS bằng cách kiểm tra cổng khả dụng trên máy chủ (ví dụ: qua lệnh `ss -tulnp` hoặc `netstat`) trước khi gán cổng trong `docker-compose.yml`.
- **An toàn Dữ liệu**: Không tự ý xóa các Docker Volume có chứa dữ liệu thật (Production Database/Files) mà không có xác nhận từ người dùng.
- **Xác thực SSH**: Ưu tiên sử dụng SSH Key (`~/.ssh/id_rsa`) được phân quyền đúng thay vì dùng xác thực mật khẩu thuần túy.
