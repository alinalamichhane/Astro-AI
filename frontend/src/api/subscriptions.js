import api from './axios'

export const getPlans = () =>
  api.get('/subscriptions/plans/')

export const initiatePayment = (plan_id, gateway) =>
  api.post('/subscriptions/initiate/', { plan_id, gateway })

export const getMySubscriptions = () =>
  api.get('/subscriptions/my/')

export const getPaymentHistory = () =>
  api.get('/subscriptions/payments/')