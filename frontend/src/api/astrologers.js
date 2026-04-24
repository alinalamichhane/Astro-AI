import api from './axios'

export const getAstrologers = (params) =>
  api.get('/astrologers/', { params })

export const getAstrologer = (id) =>
  api.get(`/astrologers/${id}/`)

export const bookConsultation = (data) =>
  api.post('/astrologers/book/', data)

export const getMyConsultations = () =>
  api.get('/astrologers/consultations/')

export const reviewConsultation = (id, data) =>
  api.post(`/astrologers/consultations/${id}/review/`, data)

// ── Astrologer registration & dashboard ──────────────────────────────────────

export const registerAsAstrologer = (data) =>
  api.post('/astrologers/register/', data)

export const getAstrologerDashboard = () =>
  api.get('/astrologers/dashboard/')

export const getAstrologerProfile = () =>
  api.get('/astrologers/profile/')

export const updateAstrologerProfile = (data) =>
  api.patch('/astrologers/profile/', data)

export const toggleAvailability = () =>
  api.post('/astrologers/toggle-availability/')

export const getAstrologerConsultations = (params) =>
  api.get('/astrologers/my-consultations/', { params })

export const updateConsultationStatus = (id, status, cancellation_reason = '') =>
  api.patch(`/astrologers/my-consultations/${id}/status/`, { status, cancellation_reason })

export const getConsultationClient = (id) =>
  api.get(`/astrologers/my-consultations/${id}/client/`)

export const getAstrologerAvailability = () =>
  api.get('/astrologers/availability/')

export const saveAstrologerAvailability = (slots) =>
  api.post('/astrologers/availability/', { slots })
