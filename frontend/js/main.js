import { API } from './api.js';
import { Web3Service } from './web3.js';
import CONFIG from './config.js';
import { showToast, showLoading, hideLoading, formatAmount, formatAddress, formatDate } from './utils.js';
class App {
    constructor() {
        this.authScreen = document.getElementById('authScreen');
        this.appScreen = document.getElementById('appScreen');
        this.isAuthenticated = false;
        this.currentPage = 'dashboard';
        this.skins = [];
        this.campaigns = [];
        this.filteredSkins = [];
        this.currentFilter = 'all';
        this.currentSort = 'price-low';
        this.init();
    }
    async init() {
        await Web3Service.init();
        const savedWallet = localStorage.getItem(CONFIG.STORAGE_KEYS.WALLET_ADDRESS);
        if (savedWallet) {
            try {
                await Web3Service.connect();
            } catch (error) {
                console.log('Auto-reconnect failed:', error.message);
            }
        }
        const token = localStorage.getItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
        if (token) {
            this.showApp();
            await this.loadDashboardData();
        } else {
            this.showAuth();
        }
        this.setupAuthHandlers();
        this.setupAppHandlers();
    }
    showAuth() {
        this.authScreen.classList.remove('hidden');
        this.appScreen.classList.add('hidden');
        this.isAuthenticated = false;
    }
    showApp() {
        this.authScreen.classList.add('hidden');
        this.appScreen.classList.remove('hidden');
        this.isAuthenticated = true;
    }
    setupAuthHandlers() {
        const authTabs = document.querySelectorAll('.auth-tab');
        const tabPanels = document.querySelectorAll('.tab-panel');
        authTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.dataset.tab;
                authTabs.forEach(t => t.classList.remove('active'));
                tabPanels.forEach(p => p.classList.remove('active'));
                tab.classList.add('active');
                document.getElementById(`${targetTab}-panel`).classList.add('active');
            });
        });
        const loginForm = document.getElementById('loginForm');
        const loginMessage = document.getElementById('loginMessage');
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            try {
                loginMessage.textContent = 'Signing in...';
                loginMessage.className = 'form-message info';
                await API.login(email, password);
                loginMessage.textContent = '✓ Login successful!';
                loginMessage.className = 'form-message success';
                setTimeout(() => {
                    this.showApp();
                    this.loadDashboardData();
                    loginForm.reset();
                    loginMessage.textContent = '';
                }, 800);
            } catch (error) {
                loginMessage.textContent = '✗ ' + error.message;
                loginMessage.className = 'form-message error';
            }
        });
        const registerForm = document.getElementById('registerForm');
        const registerMessage = document.getElementById('registerMessage');
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            try {
                registerMessage.textContent = 'Connecting wallet...';
                registerMessage.className = 'form-message info';
                const walletAddress = await Web3Service.connect();
                registerMessage.textContent = 'Creating account...';
                await API.register(email, password, walletAddress);
                registerMessage.textContent = '✓ Account created! Please sign in.';
                registerMessage.className = 'form-message success';
                setTimeout(() => {
                    authTabs[0].click();
                    registerForm.reset();
                    registerMessage.textContent = '';
                }, 1500);
            } catch (error) {
                registerMessage.textContent = '✗ ' + error.message;
                registerMessage.className = 'form-message error';
            }
        });
    }
    setupAppHandlers() {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const pageName = link.dataset.page;
                this.showPage(pageName);
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            });
        });
        const connectWalletBtn = document.getElementById('connectWalletBtn');
        const walletConnected = document.getElementById('walletConnected');
        const walletAddress = document.getElementById('walletAddress');
        connectWalletBtn.addEventListener('click', async () => {
            try {
                showLoading('Connecting wallet...');
                const address = await Web3Service.connect();
                await API.connectWallet(address);
                connectWalletBtn.classList.add('hidden');
                walletConnected.classList.remove('hidden');
                walletAddress.textContent = this.formatAddress(address);
                this.updateWalletInfo();
                hideLoading();
                showToast('Wallet connected successfully!', 'success');
            } catch (error) {
                hideLoading();
                showToast(error.message, 'error');
            }
        });
        const logoutBtn = document.getElementById('logoutBtn');
        logoutBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to logout?')) {
                API.logout();
                Web3Service.disconnect();
                this.showAuth();
                showToast('Logged out successfully', 'info');
            }
        });
        const transferForm = document.getElementById('transferForm');
        const transferMessage = document.getElementById('transferMessage');
        transferForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const recipient = document.getElementById('recipientAddress').value.trim();
            const amount = document.getElementById('transferAmount').value;
            try {
                transferMessage.textContent = 'Processing transfer...';
                transferMessage.className = 'form-message info';
                await this.transferTokens(recipient, amount);
                transferMessage.textContent = '✓ Transfer successful!';
                transferMessage.className = 'form-message success';
                transferForm.reset();
                await this.loadStats();
                setTimeout(() => {
                    transferMessage.textContent = '';
                }, 3000);
            } catch (error) {
                transferMessage.textContent = '✗ ' + error.message;
                transferMessage.className = 'form-message error';
            }
        });
        this.setupMarketplaceHandlers();
        this.setupCampaignsHandlers();
    }
    showPage(pageName) {
        const pages = document.querySelectorAll('.page');
        pages.forEach(page => {
            page.classList.remove('active');
        });
        const targetPage = document.getElementById(`${pageName}-page`);
        if (targetPage) {
            targetPage.classList.add('active');
            this.currentPage = pageName;
            if (pageName === 'marketplace') {
                this.loadMarketplace();
            } else if (pageName === 'campaigns') {
                this.loadCampaigns();
            }
        }
    }
    async loadDashboardData() {
        try {
            const response = await API.getCurrentUser();
            const profile = response.data?.user || response.data || response;
            document.getElementById('accountEmail').textContent = profile.email || 'N/A';
            if (Web3Service.account) {
                this.updateWalletInfo();
                document.getElementById('connectWalletBtn').classList.add('hidden');
                document.getElementById('walletConnected').classList.remove('hidden');
                document.getElementById('walletAddress').textContent = 
                    this.formatAddress(Web3Service.account);
            }
            await this.loadStats();
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            showToast('Failed to load dashboard data', 'error');
        }
    }
    async loadStats() {
        try {
            if (Web3Service.account) {
                const balance = await Web3Service.getSTMBalance(Web3Service.account);
                document.getElementById('stmBalance').textContent = `${balance} STM`;
            } else {
                document.getElementById('stmBalance').textContent = '0 STM';
            }
            const skins = await API.getOwnedSkins();
            const skinsData = skins.data?.skins || skins.data || skins || [];
            document.getElementById('ownedSkinsCount').textContent = skinsData.length;
            this.displayOwnedSkins(skinsData);
            const campaigns = await API.getCampaigns();
            const campaignsData = campaigns.data?.campaigns || campaigns.data || campaigns || [];
            const activeCampaigns = campaignsData.filter(c => !c.completed);
            document.getElementById('activeCampaigns').textContent = activeCampaigns.length;
        } catch (error) {
            console.error('Failed to load stats:', error);
        }
    }
    displayOwnedSkins(skins) {
        const container = document.getElementById('ownedSkinsList');
        if (!skins || skins.length === 0) {
            container.innerHTML = '<p style="color: #888; text-align: center; padding: 20px;">You don\'t own any skins yet. Visit the marketplace to purchase some!</p>';
            return;
        }
        container.innerHTML = skins.map(skin => `
            <div class="owned-skin-item">
                <div class="owned-skin-icon">${this.getRarityIcon(skin.rarity)}</div>
                <div class="owned-skin-details">
                    <div class="owned-skin-name">${skin.name}</div>
                    <div class="owned-skin-info">
                        <span class="owned-skin-rarity ${skin.rarity?.toLowerCase()}">${skin.rarity}</span>
                        <span class="owned-skin-category">${skin.category}</span>
                    </div>
                </div>
                <div class="owned-skin-price">${skin.priceSTM} STM</div>
            </div>
        `).join('');
    }
    getRarityIcon(rarity) {
        const icons = {
            'Common': '⚪',
            'Uncommon': '🟢',
            'Rare': '🔵',
            'Epic': '🟣',
            'Legendary': '🟡'
        };
        return icons[rarity] || '⚪';
    }
    async updateWalletInfo() {
        try {
            const walletStatus = document.getElementById('walletStatus');
            const contractAddress = document.getElementById('contractAddress');
            const networkName = document.getElementById('networkName');
            if (Web3Service.account) {
                walletStatus.textContent = '✓ Connected';
                if (Web3Service.contract) {
                    contractAddress.textContent = this.formatAddress(Web3Service.contract.target);
                } else {
                    contractAddress.textContent = 'Not available';
                }
                if (Web3Service.provider) {
                    const network = await Web3Service.provider.getNetwork();
                    networkName.textContent = network.name || 'Unknown';
                } else {
                    networkName.textContent = 'Not connected';
                }
            } else {
                walletStatus.textContent = 'Not Connected';
                contractAddress.textContent = 'Not connected';
                networkName.textContent = 'Not connected';
            }
        } catch (error) {
            console.error('Failed to update wallet info:', error);
        }
    }
    async transferTokens(recipient, amount) {
        if (!Web3Service.account) {
            throw new Error('Please connect your wallet first');
        }
        if (!recipient || !recipient.startsWith('0x') || recipient.length !== 42) {
            throw new Error('Invalid recipient address');
        }
        if (!amount || parseFloat(amount) <= 0) {
            throw new Error('Amount must be greater than 0');
        }
        try {
            showLoading('Transferring tokens...');
            await Web3Service.transferTokens(recipient, amount);
            hideLoading();
            showToast('Tokens transferred successfully!', 'success');
        } catch (error) {
            hideLoading();
            throw error;
        }
    }
    setupMarketplaceHandlers() {
        const sortSelect = document.getElementById('sortSkins');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.currentSort = e.target.value;
                this.applySorting();
            });
        }
        const searchInput = document.getElementById('searchSkins');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchSkins(e.target.value);
            });
        }
        const refreshBtn = document.getElementById('refreshMarketplace');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadMarketplace());
        }
    }
    async loadMarketplace() {
        try {
            showLoading('Loading skins...');
            const response = await API.getSkins();
            this.skins = response.data?.skins || response.data || response;
            this.filteredSkins = [...this.skins];
            this.renderSkins();
            hideLoading();
        } catch (error) {
            hideLoading();
            showToast('Failed to load marketplace', 'error');
        }
    }
    applySorting() {
        switch (this.currentSort) {
            case 'price-low':
                this.filteredSkins.sort((a, b) => a.priceSTM - b.priceSTM);
                break;
            case 'price-high':
                this.filteredSkins.sort((a, b) => b.priceSTM - a.priceSTM);
                break;
            case 'rarity':
                const rarityOrder = { 'common': 1, 'uncommon': 2, 'rare': 3, 'epic': 4, 'legendary': 5 };
                this.filteredSkins.sort((a, b) => 
                    (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0)
                );
                break;
            case 'name':
                this.filteredSkins.sort((a, b) => a.name.localeCompare(b.name));
                break;
        }
        this.renderSkins();
    }
    searchSkins(query) {
        const lowerQuery = query.toLowerCase().trim();
        if (!lowerQuery) {
            this.filteredSkins = [...this.skins];
            this.renderSkins();
            return;
        }
        this.filteredSkins = this.skins.filter(skin =>
            skin.name.toLowerCase().includes(lowerQuery) ||
            skin.description.toLowerCase().includes(lowerQuery)
        );
        this.renderSkins();
    }
    renderSkins() {
        const grid = document.getElementById('skinsGrid');
        if (!grid) return;
        if (this.filteredSkins.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <p>No skins found</p>
                </div>
            `;
            return;
        }
        grid.innerHTML = this.filteredSkins.map(skin => this.createSkinCard(skin)).join('');
    }
    createSkinCard(skin) {
        const rarityColors = {
            'common': '#b0b0b0',
            'uncommon': '#5e98d9',
            'rare': '#4b69ff',
            'epic': '#8847ff',
            'legendary': '#d32ce6'
        };
        return `
            <div class="skin-card" data-skin-id="${skin._id}">
                <div class="skin-image">
                    <img src="${skin.imageUrl}" alt="${skin.name}" onerror="this.src='images/placeholder.png'">
                    <div class="skin-rarity" style="background: ${rarityColors[skin.rarity] || '#b0b0b0'}">
                        ${skin.rarity}
                    </div>
                </div>
                <div class="skin-info">
                    <h3 class="skin-name">${skin.name}</h3>
                    <p class="skin-description">${skin.description}</p>
                    <div class="skin-footer">
                        <div class="skin-price">${skin.priceSTM} STM</div>
                        <button class="btn btn-primary btn-buy" onclick="window.app.purchaseSkin('${skin._id}')">
                            Buy Now
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    async purchaseSkin(skinId) {
        if (!Web3Service.account) {
            showToast('Please connect your wallet first', 'error');
            return;
        }
        const skin = this.skins.find(s => s._id === skinId);
        if (!skin) {
            showToast('Skin not found', 'error');
            return;
        }
        if (!skin.tokenId) {
            showToast('Invalid skin data - missing tokenId', 'error');
            console.error('Skin missing tokenId:', skin);
            return;
        }
        try {
            showLoading('Processing purchase...');
            console.log('Purchasing skin:', {
                tokenId: skin.tokenId,
                priceSTM: skin.priceSTM,
                name: skin.name
            });
            await Web3Service.buySkin(skin.tokenId, skin.priceSTM);
            hideLoading();
            showToast(`Successfully purchased ${skin.name}!`, 'success');
            await this.loadMarketplace();
            await this.loadStats();
        } catch (error) {
            hideLoading();
            showToast(error.message, 'error');
        }
    }
    setupCampaignsHandlers() {
        const tabs = document.querySelectorAll('.campaign-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                tabs.forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                this.switchCampaignTab(e.target.dataset.tab);
            });
        });
        const createForm = document.getElementById('createCampaignForm');
        if (createForm) {
            createForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.createCampaign();
            });
        }
        const refreshBtn = document.getElementById('refreshCampaigns');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadCampaigns());
        }
    }
    switchCampaignTab(tab) {
        const allTab = document.getElementById('allCampaignsTab');
        const myTab = document.getElementById('myCampaignsTab');
        const createTab = document.getElementById('createCampaignTab');
        allTab.classList.add('hidden');
        myTab.classList.add('hidden');
        createTab.classList.add('hidden');
        if (tab === 'all') {
            allTab.classList.remove('hidden');
            this.renderCampaigns();
        } else if (tab === 'my') {
            myTab.classList.remove('hidden');
            this.renderMyCampaigns();
        } else if (tab === 'create') {
            createTab.classList.remove('hidden');
        }
    }
    async loadCampaigns() {
        try {
            showLoading('Loading campaigns...');
            const response = await API.getCampaigns();
            this.campaigns = response.data?.campaigns || response.data || response;
            this.renderCampaigns();
            hideLoading();
        } catch (error) {
            hideLoading();
            showToast('Failed to load campaigns', 'error');
        }
    }
    renderCampaigns() {
        const grid = document.getElementById('campaignsGrid');
        if (!grid) return;
        if (this.campaigns.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <p>No campaigns available</p>
                </div>
            `;
            return;
        }
        grid.innerHTML = this.campaigns.map(campaign => this.createCampaignCard(campaign)).join('');
    }
    renderMyCampaigns() {
        const grid = document.getElementById('myCampaignsGrid');
        if (!grid) return;
        const userAddress = Web3Service.account;
        const userCampaigns = this.campaigns.filter(c => {
            const creatorAddress = c.creatorWalletAddress || (typeof c.creator === 'string' ? c.creator : null);
            return creatorAddress && userAddress && creatorAddress.toLowerCase() === userAddress.toLowerCase();
        });
        if (userCampaigns.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <p>You haven't created any campaigns yet</p>
                </div>
            `;
            return;
        }
        grid.innerHTML = userCampaigns.map(campaign => this.createCampaignCard(campaign)).join('');
    }
    createCampaignCard(campaign) {
        const progress = campaign.goalETH > 0 ? (campaign.raisedETH / campaign.goalETH) * 100 : 0;
        const isCompleted = campaign.completed || progress >= 100;
        const daysLeft = campaign.deadline ? Math.max(0, Math.ceil((new Date(campaign.deadline) - new Date()) / (1000 * 60 * 60 * 24))) : 0;
        return `
            <div class="campaign-card ${isCompleted ? 'completed' : ''}">
                <div class="campaign-header">
                    <h3 class="campaign-title">${campaign.title}</h3>
                    <span class="campaign-status">${isCompleted ? 'Completed' : 'Active'}</span>
                </div>
                <div class="campaign-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${Math.min(progress, 100)}%"></div>
                    </div>
                    <div class="progress-info">
                        <span>${campaign.raisedETH || 0} ETH raised</span>
                        <span>Goal: ${campaign.goalETH} ETH</span>
                    </div>
                </div>
                <div class="campaign-footer">
                    <div class="campaign-meta">
                        <span>⏱️ ${daysLeft} days left</span>
                        <span>👥 ${campaign.contributorsCount || 0} backers</span>
                    </div>
                    ${!isCompleted ? `
                        <button class="btn btn-primary" onclick="window.app.fundCampaign('${campaign.blockchainId}')">
                            Fund Campaign
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }
    async createCampaign() {
        try {
            const title = document.getElementById('campaignTitle').value.trim();
            const goalETH = parseFloat(document.getElementById('campaignGoal').value);
            const durationDays = parseInt(document.getElementById('campaignDuration').value);
            if (!title || title.length < 5) {
                showToast('Title must be at least 5 characters', 'error');
                return;
            }
            if (!goalETH || goalETH <= 0) {
                showToast('Goal must be greater than 0', 'error');
                return;
            }
            if (!durationDays || durationDays < 1 || durationDays > 90) {
                showToast('Duration must be between 1 and 90 days', 'error');
                return;
            }
            if (!Web3Service.account) {
                showToast('Please connect your wallet first', 'error');
                return;
            }
            showLoading('Creating campaign...');
            const receipt = await Web3Service.createCampaign(title, goalETH, durationDays);
            let blockchainId = null;
            const cwInterface = Web3Service.contracts?.crowdfunding?.interface;
            for (const log of receipt.logs || []) {
                try {
                    if (log.fragment?.name === 'CampaignCreated' && log.args?.length) {
                        blockchainId = Number(log.args[0]);
                        break;
                    }
                    if (cwInterface && log.topics) {
                        const parsed = cwInterface.parseLog({ topics: log.topics, data: log.data });
                        if (parsed?.name === 'CampaignCreated') {
                            blockchainId = Number(parsed.args[0]);
                            break;
                        }
                    }
                } catch (e) {
                }
            }
            if (blockchainId === null || Number.isNaN(blockchainId)) {
                try {
                    const count = await Web3Service.contracts.crowdfunding.campaignCount();
                    blockchainId = Number(count) - 1;
                } catch (e) {
                }
            }
            if (blockchainId === null || Number.isNaN(blockchainId)) {
                hideLoading();
                showToast('Could not read campaign ID from transaction. Please try again.', 'error');
                return;
            }
            await API.createCampaign(title, goalETH, durationDays, blockchainId, receipt.hash);
            showToast('Campaign created successfully!', 'success');
            document.getElementById('createCampaignForm').reset();
            await new Promise(resolve => setTimeout(resolve, 2000));
            await this.loadCampaigns();
            document.querySelector('[data-tab="all"]').click();
            hideLoading();
        } catch (error) {
            hideLoading();
            showToast(error.message, 'error');
        }
    }
    async fundCampaign(campaignId) {
        const numericId = Number(campaignId);
        const campaign = this.campaigns.find(c => c.blockchainId === numericId);
        if (!campaign) return;
        if (!Web3Service.account) {
            showToast('Please connect your wallet first', 'error');
            return;
        }
        const amount = prompt('Enter amount in ETH:');
        if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
            showToast('Invalid amount', 'error');
            return;
        }
        try {
            showLoading('Processing contribution...');
            await Web3Service.fundCampaign(campaign.blockchainId, parseFloat(amount));
            hideLoading();
            showToast(`Successfully funded ${campaign.title}! STM tokens received!`, 'success');
            await this.loadCampaigns();
            await this.loadStats();
        } catch (error) {
            hideLoading();
            showToast(error.message, 'error');
        }
    }
    formatAddress(address) {
        if (!address) return 'N/A';
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    }
}
let appInstance;
document.addEventListener('DOMContentLoaded', () => {
    appInstance = new App();
    window.app = appInstance; 
});
export default App;
