import axios from 'axios'
import { useAuthStore } from '../stores/auth'

// Create axios instance
const api = axios.create({
  baseURL: (import.meta as any).env?.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const { refreshToken } = useAuthStore.getState()
        if (refreshToken) {
          const response = await axios.post('/api/auth/refresh', {
            refreshToken,
          })
          
          const { token: newToken } = response.data
          useAuthStore.getState().updateToken(newToken)
          
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return api(originalRequest)
        }
      } catch (refreshError) {
        useAuthStore.getState().logout()
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

// Auth API
export const authApi = {
  login: async (email: string, password: string, totpCode?: string) => {
    const response = await api.post('/auth/login', { email, password, totpCode })
    return response.data
  },

  register: async (data: {
    email: string
    password: string
    firstName: string
    lastName: string
  }) => {
    const response = await api.post('/auth/signup', data)
    return response.data
  },

  logout: async (refreshToken?: string) => {
    const response = await api.post('/auth/logout', { refreshToken })
    return response.data
  },

  me: async () => {
    const response = await api.get('/auth/me')
    return response.data
  },

  forgotPassword: async (email: string) => {
    const response = await api.post('/auth/forgot-password', { email })
    return response.data
  },

  resetPassword: async (token: string, password: string) => {
    const response = await api.post('/auth/reset-password', { token, password })
    return response.data
  },

  setup2FA: async () => {
    const response = await api.post('/auth/setup-2fa')
    return response.data
  },

  verify2FA: async (totpCode: string) => {
    const response = await api.post('/auth/verify-2fa', { totpCode })
    return response.data
  },

  disable2FA: async (password: string, totpCode: string) => {
    const response = await api.post('/auth/disable-2fa', { password, totpCode })
    return response.data
  },
}

// Mail API
export const mailApi = {
  getInbox: async (params: {
    page?: number
    limit?: number
    folder?: string
  } = {}) => {
    const response = await api.get('/mail/inbox', { params })
    return response.data
  },

  getThread: async (threadId: string) => {
    const response = await api.get(`/mail/thread/${threadId}`)
    return response.data
  },

  sendEmail: async (data: {
    to: Array<{ email: string; name?: string }>
    cc?: Array<{ email: string; name?: string }>
    bcc?: Array<{ email: string; name?: string }>
    subject: string
    bodyText?: string
    bodyHtml?: string
    scheduleAt?: string
    threadId?: string
    replyToMessageId?: string
  }) => {
    const response = await api.post('/mail/send', data)
    return response.data
  },

  starMessage: async (messageId: string, starred: boolean) => {
    const response = await api.patch(`/mail/message/${messageId}/star`, { starred })
    return response.data
  },

  moveMessage: async (messageId: string, folder: string) => {
    const response = await api.patch(`/mail/message/${messageId}/move`, { folder })
    return response.data
  },

  archiveThread: async (threadId: string) => {
    const response = await api.patch(`/mail/thread/${threadId}/archive`)
    return response.data
  },

  deleteThread: async (threadId: string) => {
    const response = await api.delete(`/mail/thread/${threadId}`)
    return response.data
  },

  markThreadAsSpam: async (threadId: string) => {
    const response = await api.patch(`/mail/thread/${threadId}/spam`)
    return response.data
  },

  toggleThreadStar: async (threadId: string) => {
    const response = await api.patch(`/mail/thread/${threadId}/star`)
    return response.data
  },

  toggleThreadImportant: async (threadId: string) => {
    const response = await api.patch(`/mail/thread/${threadId}/important`)
    return response.data
  },

  search: async (query: string, params: {
    page?: number
    limit?: number
    folder?: string
  } = {}) => {
    const response = await api.get('/search', { 
      params: { q: query, ...params }
    })
    return response.data
  },
}

// User API
export const userApi = {
  updateProfile: async (data: {
    firstName?: string
    lastName?: string
    phone?: string
    timezone?: string
    language?: string
  }) => {
    const response = await api.patch('/users/profile', data)
    return response.data
  },

  changePassword: async (data: {
    currentPassword: string
    newPassword: string
  }) => {
    const response = await api.patch('/users/password', data)
    return response.data
  },

  getQuotaUsage: async () => {
    const response = await api.get('/users/quota')
    return response.data
  },

  uploadAvatar: async (file: File) => {
    const formData = new FormData()
    formData.append('avatar', file)
    const response = await api.post('/users/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },
}

// Labels API
export const labelsApi = {
  getLabels: async () => {
    const response = await api.get('/labels')
    return response.data
  },

  createLabel: async (data: { name: string; color: string }) => {
    const response = await api.post('/labels', data)
    return response.data
  },

  updateLabel: async (labelId: string, data: { name?: string; color?: string }) => {
    const response = await api.patch(`/labels/${labelId}`, data)
    return response.data
  },

  deleteLabel: async (labelId: string) => {
    const response = await api.delete(`/labels/${labelId}`)
    return response.data
  },

  assignLabel: async (messageId: string, labelId: string) => {
    const response = await api.post(`/labels/${labelId}/messages`, { messageId })
    return response.data
  },

  removeLabel: async (messageId: string, labelId: string) => {
    const response = await api.delete(`/labels/${labelId}/messages/${messageId}`)
    return response.data
  },
}

// Attachments API
export const attachmentsApi = {
  upload: async (file: File, messageId?: string) => {
    const formData = new FormData()
    formData.append('file', file)
    if (messageId) {
      formData.append('messageId', messageId)
    }
    
    const response = await api.post('/attachments/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  download: async (attachmentId: string) => {
    const response = await api.get(`/attachments/${attachmentId}/download`, {
      responseType: 'blob',
    })
    return response.data
  },

  getAttachments: async (messageId: string) => {
    const response = await api.get(`/attachments/message/${messageId}`)
    return response.data
  },
}

export default api