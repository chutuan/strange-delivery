import { test, expect } from '@playwright/test'
import { login, switchRole } from './helpers.js'

test.describe('Tài xế', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await switchRole(page, 'driver')
  })

  test('trang tổng quan hiện thống kê', async ({ page }) => {
    await page.goto('/driver/dashboard')
    await expect(page.locator('h2').first()).toContainText('Tổng quan')
    await expect(page.locator('text=Đã giao thành công')).toBeVisible()
    await expect(page.locator('text=Tổng doanh thu')).toBeVisible()
  })

  test('chart hoạt động 30 ngày hiển thị', async ({ page }) => {
    await page.goto('/driver/dashboard')
    await expect(page.locator('text=Hoạt động 30 ngày qua')).toBeVisible()
    await page.getByRole('button', { name: 'Doanh thu', exact: true }).click()
    await expect(page.locator('text=Doanh thu (nghìn đồng)')).toBeVisible()
  })

  test('trang tìm đơn hiện danh sách đơn mở', async ({ page }) => {
    await page.goto('/orders/open')
    await expect(page.locator('h2').first()).toBeVisible()
  })

  test('lịch sử bid hiện danh sách', async ({ page }) => {
    await page.goto('/driver/bids')
    await expect(page.locator('h2').first()).toContainText('Lịch sử bid')
    await expect(page.getByRole('button', { name: 'Tất cả', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Được chọn', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Đang chờ', exact: true })).toBeVisible()
  })

  test('filter bid theo trạng thái', async ({ page }) => {
    await page.goto('/driver/bids')
    const btn = page.getByRole('button', { name: 'Được chọn', exact: true })
    await btn.click()
    await expect(btn).toHaveClass(/bg-blue-600/)
  })

  test('click vào bid chuyển sang chi tiết đơn', async ({ page }) => {
    await page.goto('/driver/bids')
    // Link order trong main (loại trừ nav links)
    const card = page.locator('main a[href^="/orders/"]:not([href="/orders/mine"]):not([href="/orders/open"])').first()
    const hasCard = await card.isVisible({ timeout: 4000 }).catch(() => false)
    if (hasCard) {
      await card.click()
      await expect(page).toHaveURL(/\/orders\/\d+/)
    } else {
      await expect(page.locator('text=Chưa có bid nào')).toBeVisible()
    }
  })
})
