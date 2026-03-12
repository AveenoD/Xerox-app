import axios from 'axios'

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    withCredentials: true,  // cookies ke liye zaroor
})

// Request interceptor — har request mein accessToken add karo
api.interceptors.request.use(
    (config) => {
        const token = window.__accessToken
        if(token){
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => Promise.reject(error)
)

// Response interceptor — 401 aaye toh refresh karo
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config

        if(error.response?.status === 401 && !originalRequest._retry){
            originalRequest._retry = true

            try {
                const res = await axios.post(
                    `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/refresh-token`,
                    {},
                    { withCredentials: true }
                )
                const newToken = res.data.data.accessToken
                window.__accessToken = newToken
                originalRequest.headers.Authorization = `Bearer ${newToken}`
                return api(originalRequest)
            } catch(err) {
                window.__accessToken = null
                window.location.href = '/login'
            }
        }
        return Promise.reject(error)
    }
)

export default api