import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'

const API_URL = __DEV__
  ? 'http://10.0.2.2:8000/api'  // Android emulator → localhost
  : 'https://api.strange-delivery.com/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let _onUnauthorized = null
export const setUnauthorizedHandler = (fn) => { _onUnauthorized = fn }

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('token')
      _onUnauthorized?.()
    }
    return Promise.reject(error)
  }
)

export default api
