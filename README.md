# OM TRIP 2026 - Live Scoreboard & Prize Reveal 🏆

Hệ thống theo dõi Bảng điểm 3 Vòng chơi Realtime và Công bố Giải thưởng Chung cuộc dành cho Team Building **OM TRIP 2026**.

## 🌟 Tính Năng Chính
- **Bảng điểm Realtime 3 Vòng Chơi**:
  - Tự động đồng bộ điểm số (`Vòng 1`, `Vòng 2`, `Vòng 3`) và cộng dồn điểm tức thì qua MQTT Cloud WebSocket & Google Sheets.
  - Người chơi từng đội đăng nhập bằng mật khẩu riêng để theo dõi tiến độ điểm số đội mình.
- **Lễ Trao Giải & Công Bố Phong Bì**:
  - Giao diện mở phong bì hồi hộp với đếm ngược 3..2..1 và hiệu ứng pháo hoa rực rỡ.
  - Hỗ trợ giấu thứ hạng tạo bất ngờ, đồng bộ trực tiếp khi BTC bấm **Công Bố Kết Quả**.
- **Trang Quản Trị BTC (Admin)**:
  - Cập nhật điểm từng vòng cho 4 đội.
  - Tùy chọn gán giải tự động theo tổng điểm (`⚡ Tự Xếp Giải Theo Tổng Điểm`).
  - Đổi mật khẩu đăng nhập của từng đội.
  - Quản lý trạng thái mở khóa từng đội hoặc toàn bộ cùng lúc.

## 🚀 Cấu Trúc File
- `index.html`: Giao diện dành cho người chơi & các đội thi đấu.
- `admin.html`: Giao diện quản trị dành riêng cho Ban Tổ Chức (BTC).
- `sync.js`: Bộ engine đồng bộ Realtime đa thiết bị (Google Sheets + MQTT Broker + BroadcastChannel).

## 🔗 Liên Kết Sau Khi Kích Hoạt GitHub Pages
- **Trang Người Chơi (Các Đội)**: `https://<username>.github.io/<repo-name>/`
- **Trang Admin BTC**: `https://<username>.github.io/<repo-name>/admin.html`
