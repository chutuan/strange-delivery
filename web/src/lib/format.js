export const formatPrice = (n) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)

export const formatDate = (d) =>
  new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(d))

export const formatDateTime = (d) =>
  new Date(d).toLocaleString('vi-VN')
