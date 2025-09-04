// API utilities for avatar and profile management
import { API_CONFIG } from '../config/api.js';

// Get authorization header
const getAuthHeader = () => {
  const token = localStorage.getItem('accessToken');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// Avatar upload functions
export const avatarAPI = {
  // Upload avatar file
  uploadFile: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_CONFIG.BASE_URL}/users/avatar/upload`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Upload failed');
    }

    return response.json();
  },

  // Upload avatar from base64
  uploadBase64: async (base64Data) => {
    const formData = new FormData();
    formData.append('base64_data', base64Data);

    const response = await fetch(`${API_CONFIG.BASE_URL}/users/avatar/upload-base64`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Upload failed');
    }

    return response.json();
  },

  // Delete avatar
  delete: async () => {
    const response = await fetch(`${API_CONFIG.BASE_URL}/users/avatar`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Delete failed');
    }

    return response.json();
  },
};

// Profile management functions
export const profileAPI = {
  // Get user profile
  getProfile: async () => {
    const response = await fetch(`${API_CONFIG.BASE_URL}/users/profile`, {
      headers: getAuthHeader(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch profile');
    }

    return response.json();
  },

  // Update profile
  updateProfile: async (profileData) => {
    const response = await fetch(`${API_CONFIG.BASE_URL}/users/profile`, {
      method: 'PUT',
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profileData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update profile');
    }

    return response.json();
  },
};

export default { avatarAPI, profileAPI };