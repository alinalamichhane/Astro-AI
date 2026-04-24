import api from './axios'

export const getSessions = () =>
  api.get('/chat/sessions/')

export const getSession = (id) =>
  api.get(`/chat/sessions/${id}/`)

export const sendMessage = (message, session_id = null) =>
  api.post('/chat/send/', { message, ...(session_id && { session_id }) })

export const deleteSession = (id) =>
  api.delete(`/chat/sessions/${id}/delete/`)
