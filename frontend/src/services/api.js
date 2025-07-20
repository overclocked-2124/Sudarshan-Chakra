import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// API service for radar data
export const radarAPI = {
  // Get latest radar data
  getLatest: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/radar/latest`);
      return response.data;
    } catch (error) {
      console.error('Error fetching latest radar data:', error);
      throw error;
    }
  },

  // Get recent radar data (last 5 points)
  getRecent: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/radar/recent`);
      return response.data;
    } catch (error) {
      console.error('Error fetching recent radar data:', error);
      throw error;
    }
  },

  // Get all radar data with pagination
  getAll: async (page = 1, limit = 10) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/radar/all`, {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching all radar data:', error);
      throw error;
    }
  },

  // Health check
  health: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/health`);
      return response.data;
    } catch (error) {
      console.error('Error checking health:', error);
      throw error;
    }
  }
};

export default radarAPI;
