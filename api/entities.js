import apiClient from './client.js';

// User Entity
export const User = {
  async me() {
    return await apiClient.getCurrentUser();
  },

  async loginWithRedirect(redirectUrl) {
    // For custom backend, redirect to login page instead
    window.location.href = '/Auth';
  },

  async list() {
    const response = await apiClient.getAdminUsers();
    return response.users || response;
  },

  async update(id, data) {
    if (id === 'me') {
      return await apiClient.updateUser(data);
    }
    return await apiClient.updateUserAsAdmin(id, data);
  }
};

// UserEntity (alias for compatibility)
export const UserEntity = {
  async me() {
    return await apiClient.getCurrentUser();
  },

  async updateMyUserData(data) {
    return await apiClient.updateUser(data);
  },

  async logout() {
    return await apiClient.logout();
  }
};

// JobseekerBio Entity
export const JobseekerBio = {
  async filter(params) {
    if (params.user_id) {
      try {
        const profile = await apiClient.getUserProfile();
        return profile ? [profile] : [];
      } catch (error) {
        return [];
      }
    }
    return [];
  },

  async create(data) {
    return await apiClient.updateUserProfile(data);
  },

  async update(id, data) {
    return await apiClient.updateUserProfile(data);
  }
};

// JobPost Entity
export const JobPost = {
  async list(params = {}) {
    const response = await apiClient.getJobs(params);
    return response.jobs || response;
  },

  async filter(params) {
    if (params.company_user_id) {
      return await apiClient.getMyJobs();
    }
    const response = await apiClient.getJobs(params);
    return response.jobs || response;
  },

  async create(data) {
    return await apiClient.createJob(data);
  },

  async update(id, data) {
    return await apiClient.updateJob(id, data);
  },

  async delete(id) {
    return await apiClient.deleteJob(id);
  }
};

export default {
  User,
  UserEntity,
  JobseekerBio,
  JobPost
};
