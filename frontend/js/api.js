import CONFIG from './config.js';
export const API = {
  getAuthHeader() {
    const token = localStorage.getItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  },
  async request(endpoint, options = {}) {
    const url = `${CONFIG.API_BASE_URL}${endpoint}`;
    const config = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
        ...options.headers
      }
    };
    if (options.body) {
      config.body = JSON.stringify(options.body);
    }
    const { body, headers, method, ...otherOptions } = options;
    Object.assign(config, otherOptions);
    try {
      const response = await fetch(url, config);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },
  async register(email, password, walletAddress) {
    const data = await this.request('/api/auth/register', {
      method: 'POST',
      body: { email, password, walletAddress }
    });
    if (data.data?.token) {
      localStorage.setItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN, data.data.token);
      localStorage.setItem(CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(data.data.user));
    }
    return data;
  },
  async login(email, password) {
    const data = await this.request('/api/auth/login', {
      method: 'POST',
      body: { email, password }
    });
    if (data.data?.token) {
      localStorage.setItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN, data.data.token);
      localStorage.setItem(CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(data.data.user));
    }
    return data;
  },
  async getCurrentUser() {
    return await this.request('/api/auth/me');
  },
  logout() {
    localStorage.removeItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(CONFIG.STORAGE_KEYS.USER_DATA);
    localStorage.removeItem(CONFIG.STORAGE_KEYS.WALLET_ADDRESS);
  },
  async connectWallet(walletAddress) {
    return await this.request('/api/auth/update-wallet', {
      method: 'PUT',
      body: { walletAddress }
    });
  },
  isLoggedIn() {
    return !!localStorage.getItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
  },
  getStoredUser() {
    const userData = localStorage.getItem(CONFIG.STORAGE_KEYS.USER_DATA);
    return userData ? JSON.parse(userData) : null;
  },
  async getSkins(params = {}) {
    const query = new URLSearchParams(params).toString();
    return await this.request(`/api/skins${query ? '?' + query : ''}`);
  },
  async getSkinById(id) {
    return await this.request(`/api/skins/${id}`);
  },
  async getPopularSkins(limit = 10) {
    return await this.request(`/api/skins/popular?limit=${limit}`);
  },
  async getOwnedSkins() {
    return await this.request('/api/skins/user/owned');
  },
  async checkSkinOwnership(skinId) {
    return await this.request(`/api/skins/${skinId}/check-ownership`, {
      method: 'POST'
    });
  },
  async createSkin(skinData) {
    return await this.request('/api/skins', {
      method: 'POST',
      body: skinData
    });
  },
  async getCampaigns(params = {}) {
    const query = new URLSearchParams(params).toString();
    return await this.request(`/api/campaigns${query ? '?' + query : ''}`);
  },
  async getActiveCampaigns() {
    return await this.request('/api/campaigns/active');
  },
  async getCampaignById(id) {
    return await this.request(`/api/campaigns/${id}`);
  },
  async getCampaignByBlockchainId(blockchainId) {
    return await this.request(`/api/campaigns/blockchain/${blockchainId}`);
  },
  async getMyCampaigns() {
    return await this.request('/api/campaigns/user/my-campaigns');
  },
  async getCampaignBlockchainData(id) {
    return await this.request(`/api/campaigns/${id}/blockchain-data`);
  },
  async getUserContribution(campaignId, walletAddress) {
    return await this.request(`/api/campaigns/${campaignId}/contribution/${walletAddress}`);
  },
  async syncCampaign(id) {
    return await this.request(`/api/campaigns/${id}/sync`, {
      method: 'POST'
    });
  },
  async createCampaign(title, goalETH, durationDays, blockchainId, txHash) {
    return await this.request('/api/campaigns', {
      method: 'POST',
      body: { title, goalETH, durationDays, blockchainId, txHash }
    });
  }
};
if (typeof module !== 'undefined' && module.exports) {
  module.exports = API;
}