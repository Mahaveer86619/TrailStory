import axios from 'axios';

// Types
export interface User {
  id: string;
  display_name: string;
  email: string;
  profile_pic_url?: string;
  created_at?: string;
}

export interface Checkpoint {
  id: string;
  title: string;
  time: string;
  coords: [number, number]; // [Lat, Lng]
  note: string;
  image?: string;
}

export interface Journey {
  id: string;
  title: string;
  description?: string;
  status: 'Ongoing' | 'Completed';
  start_date: string;
  visibility: 'Private' | 'Public';
  checkpoints?: Checkpoint[] | null;
}

export interface ApiResponse<T> {
  status_code: number;
  data: T;
  message: string;
}

export interface AuthData {
  token: string;
  refresh_token: string;
  user: User;
}

export interface CreateJourneyPayload {
  title: string;
  description?: string;
  is_public: boolean;
}

export interface CreateCheckpointPayload {
  lat: number;
  lng: number;
  note: string;
}

// Axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:7000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('trailstory_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = localStorage.getItem('trailstory_refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post<ApiResponse<AuthData>>(
            `${import.meta.env.VITE_API_URL || 'http://localhost:7000'}/auth/refresh`,
            { refresh_token: refreshToken }
          );
          
          const { token, refresh_token, user } = response.data.data;
          setAuthData(token, refresh_token, user);
          
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        } catch {
          clearAuthData();
          window.location.href = '/login';
        }
      } else {
        clearAuthData();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth functions
export const authApi = {
  login: async (email: string, password: string): Promise<AuthData> => {
    const response = await api.post<ApiResponse<AuthData>>('/auth/login', { email, password });
    return response.data.data;
  },
  
  register: async (email: string, password: string, displayName: string): Promise<AuthData> => {
    const response = await api.post<ApiResponse<AuthData>>('/auth/register', { 
      email, 
      password, 
      display_name: displayName 
    });
    return response.data.data;
  },
  
  refresh: async (refreshToken: string): Promise<AuthData> => {
    const response = await api.post<ApiResponse<AuthData>>('/auth/refresh', { 
      refresh_token: refreshToken 
    });
    return response.data.data;
  },
};

// User functions
export const userApi = {
  getMe: async (): Promise<User> => {
    const response = await api.get<ApiResponse<User>>('/users/me');
    return response.data.data;
  },
  
  updateMe: async (id: string, displayName: string): Promise<User> => {
    const response = await api.patch<ApiResponse<User>>('/users/me', {
      id,
      display_name: displayName
    });
    return response.data.data;
  },
  
  updateAvatar: async (file: File): Promise<User> => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await api.post<ApiResponse<User>>('/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data.data;
  },
  
  getAll: async (): Promise<User[]> => {
    const response = await api.get<ApiResponse<User[]>>('/users');
    return response.data.data;
  },
  
  getFollowers: async (userId: string): Promise<User[]> => {
    const response = await api.get<ApiResponse<User[]>>(`/users/${userId}/followers`);
    return response.data.data;
  },
  
  follow: async (userId: string): Promise<void> => {
    await api.post(`/users/follow/${userId}`);
  },
  
  unfollow: async (userId: string): Promise<void> => {
    await api.delete(`/users/unfollow/${userId}`);
  },
};

// Journey functions
export const journeyApi = {
  getAll: async (): Promise<Journey[]> => {
    const response = await api.get<ApiResponse<Journey[]>>('/journeys');
    return response.data.data;
  },

  getGlobalFeed: async (page = 1, limit = 10): Promise<Journey[]> => {
    const response = await api.get<ApiResponse<Journey[]>>('/feed', {
      params: { page, limit }
    });
    // Safety check: ensure we return an array
    return response.data.data || [];
  },
  
  getById: async (id: string): Promise<Journey> => {
    // Note: Ideally the backend should have a specific GET /journeys/:id endpoint.
    // This fallback fetches all and filters, which works for now but is inefficient.
    const response = await api.get<ApiResponse<Journey[]>>('/journeys');
    const journey = response.data.data.find(j => j.id === id);
    if (!journey) {
      throw new Error('Journey not found');
    }
    return journey;
  },
  
  create: async (payload: CreateJourneyPayload): Promise<Journey> => {
    const response = await api.post<ApiResponse<Journey>>('/journeys', payload);
    return response.data.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await api.delete(`/journeys/${id}`);
  },
};

// Checkpoint functions
export const checkpointApi = {
  create: async (journeyId: string, payload: CreateCheckpointPayload): Promise<Checkpoint> => {
    const response = await api.post<ApiResponse<Checkpoint>>(`/journeys/${journeyId}/checkpoints`, payload);
    return response.data.data;
  },
  
  delete: async (checkpointId: string): Promise<void> => {
    await api.delete(`/checkpoints/${checkpointId}`);
  },
};

// Auth helpers
export const getStoredUser = (): User | null => {
  const userStr = localStorage.getItem('trailstory_user');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }
  return null;
};

export const getStoredToken = (): string | null => {
  return localStorage.getItem('trailstory_token');
};

export const getStoredRefreshToken = (): string | null => {
  return localStorage.getItem('trailstory_refresh_token');
};

export const setAuthData = (token: string, refreshToken: string, user: User): void => {
  localStorage.setItem('trailstory_token', token);
  localStorage.setItem('trailstory_refresh_token', refreshToken);
  localStorage.setItem('trailstory_user', JSON.stringify(user));
};

export const clearAuthData = (): void => {
  localStorage.removeItem('trailstory_token');
  localStorage.removeItem('trailstory_refresh_token');
  localStorage.removeItem('trailstory_user');
};

export const isAuthenticated = (): boolean => {
  return !!getStoredToken();
};

export default api;