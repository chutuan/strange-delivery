---
name: conventions
description: "Quy tắc phát triển dự án — đặc biệt: thêm/sửa tính năng thì cập nhật test"
metadata:
  node_type: memory
  type: project
  originSessionId: 50078acd-c02b-48a4-8750-ae729c832413
---

## Quy tắc bắt buộc

- **Mỗi khi thêm tính năng hoặc sửa đổi thì cập nhật TOÀN BỘ — API + web + mobile + test cùng lúc.**
  - Không chỉ sửa một layer rồi để các layer khác cũ.
  - Thêm endpoint mới → phải có màn hình/trang web tương ứng ở web và mobile ngay trong cùng commit.
  - Đổi response API (thêm field, đổi cấu trúc) → cập nhật cả web và mobile nơi dùng field đó.

- **Test phải được cập nhật đồng thời:**
  - API (`api/`): cập nhật/thêm feature test trong `api/tests/Feature/`, chạy `php artisan test` để xác nhận pass.
  - Khi thay đổi response → cập nhật assertion; khi thêm endpoint → viết test mới phủ thành công/validation/phân quyền.

- **Scope của "cập nhật toàn bộ":**
  - `api/` — controller, model, migration, routes, test
  - `web/` — page/component React tương ứng
  - `mobile/` — screen React Native tương ứng

**How to apply:** Trước khi commit, tự hỏi: "Layer nào khác bị ảnh hưởng bởi thay đổi này?" Rồi cập nhật hết trong cùng một commit.
