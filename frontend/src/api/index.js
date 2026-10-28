import { api, unwrap } from './client'

/* One module per backend app. Every function returns parsed data. */

export const authApi = {
  register: (payload) => unwrap(api.post('/auth/register/', payload)),
  login: (email, password) => unwrap(api.post('/auth/login/', { email, password })),
  logout: (refresh) => unwrap(api.post('/auth/logout/', { refresh })),
  me: () => unwrap(api.get('/auth/me/')),
  updateMe: (payload) => unwrap(api.patch('/auth/me/', payload)),
  uploadAvatar: (file) => {
    const form = new FormData()
    form.append('avatar', file)
    return unwrap(api.patch('/auth/me/', form))
  },
  deleteAccount: () => unwrap(api.delete('/auth/me/')),
  changePassword: (current_password, new_password) =>
    unwrap(api.post('/auth/me/password/', { current_password, new_password })),
  changePlan: (plan) => unwrap(api.post('/auth/me/plan/', { plan })),
  requestReset: (email) => unwrap(api.post('/auth/password/reset/', { email })),
  confirmReset: (payload) => unwrap(api.post('/auth/password/reset/confirm/', payload)),
}

export const systemApi = {
  health: () => unwrap(api.get('/health/')),
}

export const documentsApi = {
  list: (params) => unwrap(api.get('/documents/', { params })),
  get: (id) => unwrap(api.get(`/documents/${id}/`)),
  status: (id) => unwrap(api.get(`/documents/${id}/status/`)),
  upload: (file, subjectId, onProgress) => {
    const form = new FormData()
    form.append('file', file)
    if (subjectId) form.append('subject_id', subjectId)
    return unwrap(api.post('/documents/', form, {
      onUploadProgress: (e) => onProgress?.(e.total ? Math.round((e.loaded / e.total) * 100) : 0),
    }))
  },
  update: (id, payload) => unwrap(api.patch(`/documents/${id}/`, payload)),
  remove: (id) => unwrap(api.delete(`/documents/${id}/`)),
  reprocess: (id) => unwrap(api.post(`/documents/${id}/reprocess/`)),
  toggleFavorite: (id) => unwrap(api.post(`/documents/${id}/favorite/`)),
  opened: (id, page) => unwrap(api.post(`/documents/${id}/opened/`, { page })),
  pages: (id, params) => unwrap(api.get(`/documents/${id}/pages/`, { params })),
  find: (id, q) => unwrap(api.get(`/documents/${id}/find/`, { params: { q } })),
}

export const subjectsApi = {
  list: () => unwrap(api.get('/subjects/')),
  create: (payload) => unwrap(api.post('/subjects/', payload)),
  update: (id, payload) => unwrap(api.patch(`/subjects/${id}/`, payload)),
  remove: (id) => unwrap(api.delete(`/subjects/${id}/`)),
}

export const chatApi = {
  list: (params) => unwrap(api.get('/conversations/', { params })),
  get: (id) => unwrap(api.get(`/conversations/${id}/`)),
  create: (document) => unwrap(api.post('/conversations/', { document })),
  rename: (id, title) => unwrap(api.patch(`/conversations/${id}/`, { title })),
  pin: (id, is_pinned) => unwrap(api.patch(`/conversations/${id}/`, { is_pinned })),
  remove: (id) => unwrap(api.delete(`/conversations/${id}/`)),
  ask: (id, content) => unwrap(api.post(`/conversations/${id}/ask/`, { content })),
  feedback: (messageId, value) => unwrap(api.post(`/messages/${messageId}/feedback/`, { value })),
  exportUrl: (id) => `/conversations/${id}/export/`,
}

export const quizzesApi = {
  list: (params) => unwrap(api.get('/quizzes/', { params })),
  get: (id) => unwrap(api.get(`/quizzes/${id}/`)),
  generate: (payload) => unwrap(api.post('/quizzes/generate/', payload)),
  remove: (id) => unwrap(api.delete(`/quizzes/${id}/`)),
  submit: (id, payload) => unwrap(api.post(`/quizzes/${id}/submit/`, payload)),
  mistakes: (id) => unwrap(api.get(`/quizzes/${id}/mistakes/`)),
  attempts: (params) => unwrap(api.get('/attempts/', { params })),
  attempt: (id) => unwrap(api.get(`/attempts/${id}/`)),
}

export const flashcardsApi = {
  decks: (params) => unwrap(api.get('/decks/', { params })),
  deck: (id) => unwrap(api.get(`/decks/${id}/`)),
  createDeck: (payload) => unwrap(api.post('/decks/', payload)),
  updateDeck: (id, payload) => unwrap(api.patch(`/decks/${id}/`, payload)),
  removeDeck: (id) => unwrap(api.delete(`/decks/${id}/`)),
  generate: (document, count) => unwrap(api.post('/decks/generate/', { document, count })),
  cards: (params) => unwrap(api.get('/cards/', { params })),
  due: (params) => unwrap(api.get('/cards/due/', { params })),
  createCard: (payload) => unwrap(api.post('/cards/', payload)),
  updateCard: (id, payload) => unwrap(api.patch(`/cards/${id}/`, payload)),
  removeCard: (id) => unwrap(api.delete(`/cards/${id}/`)),
  review: (id, grade) => unwrap(api.post(`/cards/${id}/review/`, { grade })),
}

export const notesApi = {
  list: (params) => unwrap(api.get('/notes/', { params })),
  create: (payload) => unwrap(api.post('/notes/', payload)),
  update: (id, payload) => unwrap(api.patch(`/notes/${id}/`, payload)),
  remove: (id) => unwrap(api.delete(`/notes/${id}/`)),
  exportUrl: '/notes/export/',
}

export const plannerApi = {
  exams: (params) => unwrap(api.get('/planner/exams/', { params })),
  createExam: (payload) => unwrap(api.post('/planner/exams/', payload)),
  updateExam: (id, payload) => unwrap(api.patch(`/planner/exams/${id}/`, payload)),
  removeExam: (id) => unwrap(api.delete(`/planner/exams/${id}/`)),
  plan: (id) => unwrap(api.get(`/planner/exams/${id}/plan/`)),
  planToTasks: (id) => unwrap(api.post(`/planner/exams/${id}/plan/tasks/`)),
  tasks: (params) => unwrap(api.get('/planner/tasks/', { params })),
  createTask: (payload) => unwrap(api.post('/planner/tasks/', payload)),
  updateTask: (id, payload) => unwrap(api.patch(`/planner/tasks/${id}/`, payload)),
  removeTask: (id) => unwrap(api.delete(`/planner/tasks/${id}/`)),
  sessions: (params) => unwrap(api.get('/planner/sessions/', { params })),
  logSession: (payload) => unwrap(api.post('/planner/sessions/', payload)),
}

export const analyticsApi = {
  dashboard: () => unwrap(api.get('/analytics/dashboard/')),
  activity: (days = 120) => unwrap(api.get('/analytics/activity/', { params: { days } })),
  progress: () => unwrap(api.get('/analytics/progress/')),
  search: (q) => unwrap(api.get('/analytics/search/', { params: { q } })),
}

export const supportApi = {
  contact: (payload) => unwrap(api.post('/support/contact/', payload)),
  newsletter: (email) => unwrap(api.post('/support/newsletter/', { email })),
}

/** Download an authenticated text export (Markdown) as a file. */
export async function downloadExport(path, filename) {
  const res = await api.get(path, { responseType: 'blob' })
  const url = URL.createObjectURL(res.data)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
