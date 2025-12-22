// Configuração da API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export default {
  baseURL: API_BASE_URL,
  endpoints: {
    auth: {
      login: '/api/auth/login',
      logout: '/api/auth/logout',
      currentUser: '/api/auth/me'
    },
    chat: {
      history: (userId, conversationId) => {
        const base = `/api/chat/history/${userId}`;
        return conversationId ? `${base}?conversationId=${conversationId}` : base;
      },
      send: (userId) => `/api/chat/send/${userId}`,
      clear: (userId) => `/api/chat/history/${userId}`,
      stats: (userId) => `/api/chat/stats/${userId}`,
      conversations: {
        list: (userId) => `/api/chat/conversations/${userId}`,
        create: (userId) => `/api/chat/conversations/${userId}`,
        get: (userId, conversationId) => `/api/chat/conversations/${userId}/${conversationId}`,
        updateTitle: (userId, conversationId) => `/api/chat/conversations/${userId}/${conversationId}/title`,
        delete: (userId, conversationId) => `/api/chat/conversations/${userId}/${conversationId}`
      }
    },
    users: {
      get: (userId) => `/api/users/${userId}`,
      create: '/api/users',
      update: (userId) => `/api/users/${userId}`
    },
    activities: {
      list: '/api/activities',
      create: '/api/activities',
      delete: (id) => `/api/activities/${id}`
    },
    studentActivities: {
      list: (userId) => `/api/student-activities/user/${userId}`,
      create: '/api/student-activities',
      update: (id) => `/api/student-activities/${id}`,
      delete: (id) => `/api/student-activities/${id}`,
      progress: (userId) => `/api/student-activities/user/${userId}/progress`
    },
    trail: {
      getProgress: (userId) => `/api/trail/progress/${userId}`,
      saveProgress: (userId) => `/api/trail/progress/${userId}`,
      completeVideo: (userId, videoId) => `/api/trail/progress/${userId}/video/${videoId}/complete`,
      unlockArea: (userId, areaId) => `/api/trail/progress/${userId}/area/${areaId}/unlock`,
      unlockAchievement: (userId, achievementId) => `/api/trail/progress/${userId}/achievement/${achievementId}/unlock`
    },
    simulados: {
      list: (category) => category ? `/api/simulados?category=${category}` : '/api/simulados',
      get: (id) => `/api/simulados/${id}`,
      create: '/api/simulados',
      update: (id) => `/api/simulados/${id}`,
      delete: (id) => `/api/simulados/${id}`,
      start: (simuladoId) => `/api/simulados/${simuladoId}/start`,
      submitAnswer: (resultId) => `/api/simulados/results/${resultId}/answer`,
      complete: (resultId) => `/api/simulados/results/${resultId}/complete`,
      getResults: (userId) => `/api/simulados/results/user/${userId}`,
      getResult: (resultId) => `/api/simulados/results/${resultId}`,
      getInProgress: (userId) => `/api/simulados/results/user/${userId}/in-progress`,
      getStats: (userId) => `/api/simulados/results/user/${userId}/stats`,
      getSimuladoResults: (simuladoId) => `/api/simulados/${simuladoId}/results`
    }
  }
};
