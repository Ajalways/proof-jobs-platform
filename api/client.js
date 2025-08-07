const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://proof-jobs-platform-cj7f9.ondigitalocean.app/api';

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return response.text();
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  // Auth methods
  async getCurrentUser() {
    return await this.request('/auth/me');
  }

  async login(email, password) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: { email, password }
    });
    
    if (response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  async logout() {
    this.setToken(null);
  }

  // Jobs methods
  async getJobs(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return await this.request(`/jobs${queryString ? `?${queryString}` : ''}`);
  }

  async createJob(jobData) {
    return await this.request('/jobs', {
      method: 'POST',
      body: jobData
    });
  }
}

const apiClient = new ApiClient();
export default apiClient;
