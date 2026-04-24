import api from './axios'

export const getCourses = (params) =>
  api.get('/courses/', { params })

export const getCourse = (slug) =>
  api.get(`/courses/${slug}/`)

export const enrollCourse = (slug) =>
  api.post(`/courses/${slug}/enroll/`)

export const getMyEnrollments = () =>
  api.get('/courses/my/enrollments/')

export const updateProgress = (slug, lesson_id) =>
  api.post(`/courses/${slug}/progress/`, { lesson_id })
