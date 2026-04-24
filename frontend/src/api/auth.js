import api from './axios'

export const login = (email, password) =>
  api.post('/auth/login/', { email, password })

export const register = (data) =>
  api.post('/auth/register/', data)  // data can include role: 'user'|'astrologer'

export const logout = (refresh) =>
  api.post('/auth/logout/', { refresh })

export const getProfile = () =>
  api.get('/auth/profile/')

export const updateProfile = (data) =>
  api.patch('/auth/profile/', data)

export const changePassword = (data) =>
  api.post('/auth/change-password/', data)
