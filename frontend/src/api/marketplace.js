import api from './axios'

export const getCategories = () =>
  api.get('/marketplace/categories/')

export const getProducts = (params) =>
  api.get('/marketplace/products/', { params })

export const getProduct = (slug) =>
  api.get(`/marketplace/products/${slug}/`)

export const reviewProduct = (slug, data) =>
  api.post(`/marketplace/products/${slug}/review/`, data)

export const createOrder = (data) =>
  api.post('/marketplace/orders/', data)

export const getMyOrders = () =>
  api.get('/marketplace/orders/my/')

export const getOrder = (id) =>
  api.get(`/marketplace/orders/${id}/`)

export const cancelOrder = (id) =>
  api.post(`/marketplace/orders/${id}/cancel/`)

export const initiateOrderPayment = (id, gateway) =>
  api.post(`/marketplace/orders/${id}/pay/`, { gateway })
