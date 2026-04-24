import api from './axios'

export const getHoroscope = (sign, period = 'daily') =>
  api.get('/astrology/horoscope/', { params: { sign, period } })

export const getAllHoroscopes = (period = 'daily') =>
  api.get('/astrology/horoscope/', { params: { period } })

export const getPersonalizedHoroscope = (period = 'daily') =>
  api.get('/astrology/horoscope/personalized/', { params: { period } })

export const getBirthChart = () =>
  api.get('/astrology/birth-chart/')

export const generateBirthChart = () =>
  api.post('/astrology/birth-chart/')

export const getKundaliMatches = () =>
  api.get('/astrology/kundali-match/')

export const createKundaliMatch = (data) =>
  api.post('/astrology/kundali-match/', data)

export const updateKundaliMatch = (id, data) =>
  api.patch(`/astrology/kundali-match/${id}/`, data)

export const deleteKundaliMatch = (id) =>
  api.delete(`/astrology/kundali-match/${id}/`)

export const recalculateKundaliMatches = () =>
  api.post('/astrology/kundali-match/recalculate/')

export const recalculateSingleKundaliMatch = (id) =>
  api.patch(`/astrology/kundali-match/${id}/`, {})

export const getPlanetaryTransits = () =>
  api.get('/astrology/transits/')
