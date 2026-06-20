export const SENDER = { email: 'driver@example.com', password: '123456' }

export async function login(page, user = SENDER) {
  await page.goto('/login')
  await page.fill('input[type="email"]', user.email)
  await page.fill('input[type="password"]', user.password)
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/(orders|driver)/, { timeout: 8000 })
  // Đợi sidebar email — chỉ render sau khi user data load xong từ /auth/me
  await page.waitForSelector(`text=${user.email}`, { timeout: 8000 })
}

export async function logout(page) {
  const btn = page.locator('button[title="Đăng xuất"]')
  if (await btn.isVisible()) await btn.click()
}

export async function switchRole(page, role) {
  const label = role === 'driver' ? 'Tài xế' : 'Người gửi'
  const btn = page.getByRole('button', { name: label, exact: true })
  await btn.waitFor({ state: 'visible', timeout: 5000 })
  // Nếu đã ở đúng role thì không cần click
  const isActive = await btn.evaluate(el => el.className.includes('bg-white text-blue'))
  if (!isActive) {
    await btn.click()
    // Đợi URL thay đổi theo role
    const target = role === 'driver' ? '/orders/open' : '/orders/mine'
    await page.waitForURL(new RegExp(target.replace('/', '\\/')), { timeout: 5000 })
  }
}
