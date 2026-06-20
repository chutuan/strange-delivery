import { test, expect } from '@playwright/test'
import { login, switchRole } from './helpers.js'

test.describe('Người gửi', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await switchRole(page, 'sender')
  })

  test('xem trang danh sách đơn của tôi', async ({ page }) => {
    await page.goto('/orders/mine')
    await expect(page.locator('h2').first()).toContainText(/đơn|hàng/i)
  })

  test('filter theo trạng thái in_progress mặc định', async ({ page }) => {
    await page.goto('/orders/mine')
    await expect(page.locator('[class*="ring-2"]').first()).toBeVisible({ timeout: 5000 })
  })

  test('tạo đơn hàng mới thành công', async ({ page }) => {
    await page.goto('/orders/create')
    await page.waitForSelector('input[name="title"]', { timeout: 8000 })

    await page.fill('input[name="title"]', 'Test đơn Playwright')
    await page.fill('input[name="pickup_address"]', '1 Nguyễn Huệ, Q1')
    await page.fill('input[name="delivery_address"]', '2 Lê Lợi, Q1')
    await page.fill('input[name="recipient_name"]', 'Nguyễn Test')
    await page.fill('input[name="recipient_phone"]', '0901234567')
    await page.fill('input[name="budget_price"]', '50000')

    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/orders\/\d+|\/orders\/mine/, { timeout: 8000 })
  })

  test('click vào đơn xem chi tiết', async ({ page }) => {
    await page.goto('/orders/mine')
    // Dùng selector chặt: link trong main mà href là /orders/<số>
    const card = page.locator('main a[href^="/orders/"]:not([href="/orders/create"]):not([href="/orders/mine"]):not([href="/orders/open"])').first()
    await card.waitFor({ state: 'visible', timeout: 6000 })
    await card.click()
    await expect(page).toHaveURL(/\/orders\/\d+/)
  })
})
