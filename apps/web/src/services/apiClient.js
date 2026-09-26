import axios from 'axios'
import { z } from 'zod'
import { API_BASE_URL } from './authClient.js'

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.error || 'Something went wrong.'
    const status = error.response?.status
    
    const enhancedError = new Error(message)
    enhancedError.status = status
    return Promise.reject(enhancedError)
  }
)

export const validatedRequest = async (config, schema) => {
  const data = await api(config)
  
  if (schema) {
    const result = schema.safeParse(data)
    if (!result.success) {
      console.error('[API Validation Error]:', result.error.format())
    }
  }
  
  return data
}

export const AlbumSchema = z.object({
  id: z.string(),
  name: z.string(),
  artists: z.array(z.string()),
  cover: z.string().optional().nullable(),
  releaseYear: z.number().optional().nullable(),
  genres: z.array(z.string()).optional(),
  communityRating: z.number().optional(),
  reviewCount: z.number().optional(),
})

export default api
