import { StyleSheet } from 'react-native'

export const C = {
  primary: '#1d4ed8',
  primaryLight: '#eff6ff',
  success: '#16a34a',
  successLight: '#dcfce7',
  error: '#dc2626',
  errorLight: '#fee2e2',
  text: '#111827',
  textSec: '#6b7280',
  border: '#e5e7eb',
  bg: '#f9fafb',
  white: '#ffffff',
  placeholder: '#9ca3af',
}

export const field = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '600', color: C.text, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: C.text,
    backgroundColor: C.white,
  },
  inputError: { borderColor: C.error },
  err: { fontSize: 12, color: C.error, marginTop: 4 },
})

export const btn = StyleSheet.create({
  primary: {
    backgroundColor: C.primary,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  primaryText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  outline: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
  },
  outlineText: { fontSize: 14, color: C.text, fontWeight: '500' },
  danger: {
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
  },
  dangerText: { fontSize: 14, color: C.error, fontWeight: '500' },
})

export const card = StyleSheet.create({
  base: {
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
})
