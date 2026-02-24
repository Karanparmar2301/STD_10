import axios from 'axios';

// Use absolute URL for backend in development, relative in production
const isDevelopment = import.meta.env.MODE === 'development';
const API_BASE_URL = isDevelopment 
    ? 'http://127.0.0.1:8000/api'  // Direct backend URL in development
    : '/api';                        // Proxy path in production

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add request interceptor to include auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// API methods
export const apiService = {
    // Student data
    getStudentData: (uid) => api.get(`/dashboard/${uid}`),

    // Profile management
    checkProfile: (uid) => api.get(`/profile/check/${uid}`),
    createProfile: (profileData) => api.post('/profile/create', profileData),
    updateProfile: (uid, profileData) => api.patch(`/profile/${uid}`, profileData),

    // Game completion
    completeGame: (gameData) => api.post('/game/complete', gameData),
    completeAlphabetGame: (gameData) => api.post('/game/alphabet/complete', gameData),
    getGamesStats: (uid) => api.get(`/games/stats/${uid}`),

    // Homework
    getHomework: (uid) => api.get(`/homework/${uid}`),
    submitHomework: (homeworkData) => api.post('/homework/submit', homeworkData),

    // Analytics
    getStudentAnalytics: (uid) => api.get(`/analytics/student/${uid}`),
    getAlphabetAnalytics: (uid) => api.get(`/analytics/alphabet/${uid}`),

    // Announcements
    getAnnouncements: (uid) => api.get(`/announcements/${uid}`),
    markAnnouncementRead: (data) => api.post('/announcement/read', data),

    // Gamification Engine
    processGamificationEvent: (data) => api.post('/gamification/process', data),
    getGamificationStatus: (uid) => api.get(`/gamification/status/${uid}`),

    // Unified action trigger (single source of truth)
    completeAction: (data) => api.post('/action/complete', data),

    // Performance Analytics
    getPerformanceAnalytics: (uid) => api.get(`/analytics/performance/${uid}`),

    // AI Insights
    getAIInsights: (uid) => api.get(`/insights/${uid}`),

    // AI Learning Assistant
    sendChatMessage: (data) => api.post('/assistant/chat', data),
    getChatHistory: (uid) => api.get(`/assistant/history/${uid}`),
};

export default api;
