import { test, expect } from '@playwright/test'
import { login } from './helpers.js'

// Sidebar nav link (hidden sm:flex div), loại trừ bottom nav (flex sm:hidden)
const sidebarLink = (page, href) =>
  page.locator(`div[class*="sm:flex"] nav a[href="${href}"]`)

test.describe('Role switcher', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('button role switcher hiện trong header', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Người gửi', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Tài xế', exact: true })).toBeVisible()
  })

  test('chuyển sang chế độ tài xế — nav thay đổi', async ({ page }) => {
    await page.getByRole('button', { name: 'Tài xế', exact: true }).click()
    await page.waitForURL(/\/orders\/open/, { timeout: 5000 })
    await expect(sidebarLink(page, '/driver/dashboard')).toBeVisible()
    await expect(sidebarLink(page, '/orders/open')).toBeVisible()
  })

  test('chuyển về người gửi — nav thay đổi trở lại', async ({ page }) => {
    await page.getByRole('button', { name: 'Tài xế', exact: true }).click()
    await page.waitForURL(/\/orders\/open/, { timeout: 5000 })
    await page.getByRole('button', { name: 'Người gửi', exact: true }).click()
    await page.waitForURL(/\/orders\/mine/, { timeout: 5000 })
    await expect(sidebarLink(page, '/orders/mine')).toBeVisible()
  })

  test('role được lưu sau khi reload', async ({ page }) => {
    await page.getByRole('button', { name: 'Tài xế', exact: true }).click()
    await page.waitForURL(/\/orders\/open/, { timeout: 5000 })
    await page.reload()
    await page.waitForSelector('text=driver@example.com', { timeout: 8000 })
    await expect(sidebarLink(page, '/driver/dashboard')).toBeVisible()
  })
})
