---
name: conventions
description: "Quy tắc phát triển dự án — đặc biệt: thêm/sửa tính năng thì cập nhật test"
metadata:
  node_type: memory
  type: project
  originSessionId: 50078acd-c02b-48a4-8750-ae729c832413
---

## Quy tắc bắt buộc

- **Mỗi khi thêm tính năng hoặc thay đổi logic thì phải cập nhật test tương ứng.**
  - API (`api/`): cập nhật/thêm feature test trong `api/tests/Feature/`, chạy `composer test` (hoặc `php artisan test`) để xác nhận pass trước khi commit.
  - Khi thay đổi response của endpoint (thêm field, đổi cấu trúc) → cập nhật assertion trong test tương ứng.
  - Khi thêm endpoint mới → viết feature test mới phủ các case: thành công, validation lỗi, phân quyền (403/422).

**How to apply:** Trước khi commit bất kỳ thay đổi feature/logic nào, kiểm tra xem có test nào cần cập nhật hoặc thêm mới không. Không commit code feature mà bỏ test.
