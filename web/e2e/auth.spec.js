import { test, expect } from '@playwright/test'
import { login, logout } from './helpers.js'

test.describe('Xác thực', () => {
  test('redirect về /login khi chưa đăng nhập', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/login/)
  })

  test('đăng nhập thành công và vào được trang chính', async ({ page }) => {
    await login(page)
    await expect(page).toHaveURL(/\/(orders|driver)/)
    await expect(page.locator('header')).toBeVisible()
  })

  test('sai mật khẩu hiện thông báo lỗi', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'driver@example.com')
    await page.fill('input[type="password"]', 'saomatkhau')
    await page.click('button[type="submit"]')
    await expect(page.locator('text=/sai|không đúng|lỗi/i')).toBeVisible({ timeout: 5000 })
  })

  test('đăng xuất về trang login', async ({ page }) => {
    await login(page)
    await logout(page)
    await expect(page).toHaveURL(/\/login/)
  })
})
