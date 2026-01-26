import { BlockchainService } from './blockchain.js';
import { UIManager } from './ui.js';
import { MarketManager } from './market.js';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from './config.js';
import { NFT_CONTRACT_ADDRESS } from './config.js'




class DApp {
    constructor() {
        this.blockchain = new BlockchainService(CONTRACT_ADDRESS, CONTRACT_ABI);
        this.ui = new UIManager();
        this.market = new MarketManager();
        this.isConnected = false;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkInitialConnection();
        
        this.market.initialize();
    }
    async checkInitialConnection() {
        try {
            if (typeof window.ethereum !== 'undefined') {
                const accounts = await window.ethereum.request({ 
                    method: 'eth_accounts' 
                });
                
                if (accounts && accounts.length > 0) {
                    await this.connectWallet();
                }
            }
        } catch (error) {
            console.error('Initial connection check failed:', error);
        }
    }

    setupEventListeners() {
        this.ui.elements.connectWallet.addEventListener('click', async () => {
            await this.connectWallet();
        });

        this.ui.elements.refreshBalance.addEventListener('click', async () => {
            await this.refreshBalance();
        });

        this.ui.elements.transferForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleTransfer();
        });

        this.ui.elements.estimateGasBtn.addEventListener('click', async () => {
            await this.estimateGas();
        });

        this.setupBlockchainListeners();
    }

    setupBlockchainListeners() {
        this.blockchain.onAccountChange(async (newAccount) => {
            if (newAccount) {
                this.ui.showNotification('Account changed', 'info');
                await this.updateAccountInfo(newAccount);
            } else {
                this.ui.showNotification('Wallet disconnected', 'info');
                this.handleDisconnect();
            }
        });

        this.blockchain.onNetworkChange(() => {
            this.ui.showNotification('Network changed - reloading...', 'info');
        });
    }

    async connectWallet() {
        try {
            this.ui.showLoading('Connecting to wallet...');
            this.ui.hideError();

            const connectionData = await this.blockchain.connectWallet();
            
            this.ui.updateConnectionStatus(
                connectionData.account, 
                connectionData.network
            );

            const tokenDetails = await this.blockchain.getTokenDetails();
            this.ui.updateContractInfo(
                CONTRACT_ADDRESS,
                tokenDetails.name,
                tokenDetails.symbol
            );

            await this.refreshBalance();
            await this.loadNFTs()

            this.setupTransferListener();

            this.isConnected = true;
            this.ui.showNotification('Wallet connected successfully!', 'success');

        } catch (error) {
            this.ui.showError(error.message);
            console.error('Connection error:', error);
        } finally {
            this.ui.hideLoading();
        }
    }

    async updateAccountInfo(newAccount) {
        try {
            this.ui.showLoading('Updating account...');
            
            const network = await this.blockchain.getNetwork();
            this.ui.updateConnectionStatus(newAccount, network);
            
            await this.refreshBalance();
            
        } catch (error) {
            this.ui.showError(error.message);
        } finally {
            this.ui.hideLoading();
        }
    }

    async refreshBalance() {
        try {
            this.ui.showLoading('Refreshing balance...');
            
            const balance = await this.blockchain.getBalance();
            this.ui.updateBalance(balance);
            
            this.market.updatePortfolioValue(balance);
            
        } catch (error) {
            this.ui.showError('Failed to refresh balance: ' + error.message);
        } finally {
            this.ui.hideLoading();
        }
    }

    async estimateGas() {
        try {
            const formData = this.ui.validateTransferForm();
            
            this.ui.showLoading('Estimating gas...');
            this.ui.hideError();

            const gasEstimates = await this.blockchain.compareGasEstimates(
                formData.recipient,
                formData.amount
            );

            this.ui.updateGasEstimation(gasEstimates);
            this.ui.showNotification('Gas estimated successfully', 'success');

        } catch (error) {
            this.ui.showError('Gas estimation failed: ' + error.message);
        } finally {
            this.ui.hideLoading();
        }
    }

    async handleTransfer() {
        try {
            const formData = this.ui.validateTransferForm();
            
            this.ui.showLoading('Initiating transfer...');
            this.ui.hideError();
            this.ui.setTransferButtonState(false);

            const txData = await this.blockchain.transfer(
                formData.recipient,
                formData.amount
            );

            const transaction = {
                hash: txData.hash,
                from: txData.from,
                to: txData.to,
                amount: txData.amount,
                status: 'pending',
                timestamp: Date.now()
            };
            this.ui.addTransaction(transaction);

            this.ui.hideLoading();
            this.ui.showNotification('Transaction submitted! Waiting for confirmation...', 'info');

            this.ui.showLoading('Waiting for confirmation...');
            const receipt = await txData.wait();

            if (receipt.status === 1) {
                this.ui.updateTransactionStatus(txData.hash, 'success');
                this.ui.showNotification('Transfer successful!', 'success');
                
                await this.refreshBalance();
                
                this.ui.resetTransferForm();
            } else {
                this.ui.updateTransactionStatus(txData.hash, 'failed');
                this.ui.showError('Transaction failed');
            }

        } catch (error) {
            if (error.message.includes('rejected')) {
                this.ui.showNotification('Transaction rejected by user', 'info');
            } else {
                this.ui.showError('Transfer failed: ' + error.message);
            }
            
            console.error('Transfer error:', error);
        } finally {
            this.ui.hideLoading();
            this.ui.setTransferButtonState(true);
        }
    }

    setupTransferListener() {
        this.blockchain.listenForTransfers(async (eventData) => {
            console.log('Transfer event detected:', eventData);
            
            if (eventData.to.toLowerCase() === this.blockchain.account.toLowerCase()) {
                this.ui.showNotification(
                    `Received ${eventData.amount} STM from ${this.ui.formatAddress(eventData.from)}`,
                    'success'
                );
            }

            await this.refreshBalance();
        });
    }

    handleDisconnect() {
        this.isConnected = false;
        this.blockchain.cleanup();
        
        this.ui.elements.connectionStatus.classList.add('hidden');
        this.ui.elements.mainContent.classList.add('hidden');
        this.ui.elements.connectWallet.textContent = 'Connect Wallet';
        this.ui.elements.connectWallet.disabled = false;
    }
//     async loadNFTs() {
//     const section = document.getElementById('nftSection')
//     const ownedList = document.getElementById('ownedNFTs')
//     const mintedList = document.getElementById('mintedNFTs')

//     ownedList.innerHTML = ''
//     mintedList.innerHTML = ''

//     const account = this.blockchain.getAccount()

//     const owned = await this.blockchain.getOwnedNFTs(account)
//     const minted = await this.blockchain.getAllMintedNFTs()

//     owned.forEach(id => {
//         const li = document.createElement('li')
//         li.textContent = `Token #${id}`
//         ownedList.appendChild(li)
//     })

//     minted.forEach(id => {
//         const li = document.createElement('li')
//         li.textContent = `Token #${id}`
//         mintedList.appendChild(li)
//     })

//     section.classList.remove('hidden')
// }
async loadNFTs() {
    try {
        const section = document.getElementById('nftSection')
        const ownedList = document.getElementById('ownedNFTs')
        const mintedList = document.getElementById('mintedNFTs')

        // Check if elements exist
        if (!section || !ownedList || !mintedList) {
            console.log('NFT elements not found')
            return
        }

        ownedList.innerHTML = ''
        mintedList.innerHTML = ''

        const account = this.blockchain.getAccount()

        // Check if the blockchain object has these methods
        if (typeof this.blockchain.getOwnedNFTs !== 'function' || 
            typeof this.blockchain.getAllMintedNFTs !== 'function') {
            console.log('NFT functions not available on this contract - hiding NFT section')
            section.classList.add('hidden')
            return
        }

        let owned = []
        let minted = []

        // Try to call the functions with additional error handling
        try {
            owned = await this.blockchain.getOwnedNFTs(account)
        } catch (e) {
            console.log('getOwnedNFTs not available:', e.message)
        }

        try {
            minted = await this.blockchain.getAllMintedNFTs()
        } catch (e) {
            console.log('getAllMintedNFTs not available:', e.message)
        }

        // If both calls failed, hide the section
        if (owned.length === 0 && minted.length === 0) {
            console.log('No NFT data available - hiding section')
            section.classList.add('hidden')
            return
        }

        // Show empty state if no NFTs
        if (owned.length === 0) {
            ownedList.innerHTML = '<li class="empty-state">No NFTs owned yet</li>'
        } else {
            owned.forEach(id => {
                const li = document.createElement('li')
                li.textContent = `Token #${id}`
                ownedList.appendChild(li)
            })
        }

        if (minted.length === 0) {
            mintedList.innerHTML = '<li class="empty-state">No tokens minted yet</li>'
        } else {
            minted.forEach(id => {
                const li = document.createElement('li')
                li.textContent = `Token #${id}`
                mintedList.appendChild(li)
            })
        }

        // Update stats
        document.getElementById('totalOwnedNFTs').textContent = owned.length
        document.getElementById('totalMintedNFTs').textContent = minted.length

        section.classList.remove('hidden')

    } catch (error) {
        console.error('Error loading NFTs:', error)
        // Hide NFT section if there's an error
        const section = document.getElementById('nftSection')
        if (section) section.classList.add('hidden')
    }
}

}

document.addEventListener('DOMContentLoaded', () => {
    const app = new DApp();
    
    window.dApp = app;
});
// NFT Tab Switching Functionality
document.addEventListener('DOMContentLoaded', function() {
    const nftTabs = document.querySelectorAll('.nft-tab');
    const nftTabContents = document.querySelectorAll('.nft-tab-content');

    nftTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            
            // Remove active class from all tabs
            nftTabs.forEach(t => t.classList.remove('active'));
            
            // Hide all tab contents
            nftTabContents.forEach(content => content.classList.add('hidden'));
            
            // Add active class to clicked tab
            this.classList.add('active');
            
            // Show corresponding tab content
            if (tabName === 'owned') {
                document.getElementById('ownedNFTsTab').classList.remove('hidden');
            } else if (tabName === 'minted') {
                document.getElementById('mintedNFTsTab').classList.remove('hidden');
            }
        });
    });
});

// Function to add NFT to the grid (example)
function addNFTToGrid(nftData, isMinted = false) {
    const gridId = isMinted ? 'mintedNFTsGrid' : 'ownedNFTsGrid';
    const grid = document.getElementById(gridId);
    
    // Remove empty state if exists
    const emptyState = grid.parentElement.querySelector('.empty-state');
    if (emptyState) {
        emptyState.style.display = 'none';
    }
    
    const nftItem = document.createElement('div');
    nftItem.className = 'nft-item';
    nftItem.innerHTML = `
        <div class="nft-item-image">${nftData.icon || '🎨'}</div>
        <div class="nft-item-name">${nftData.name}</div>
        <div class="nft-item-id">ID: ${nftData.id}</div>
    `;
    
    grid.appendChild(nftItem);
    
    // Update stats
    updateNFTStats();
}

// Function to update NFT statistics
function updateNFTStats() {
    const ownedCount = document.getElementById('ownedNFTsGrid').children.length;
    const mintedCount = document.getElementById('mintedNFTsGrid').children.length;
    
    document.getElementById('totalOwnedNFTs').textContent = ownedCount;
    document.getElementById('totalMintedNFTs').textContent = mintedCount;
    
    // Calculate estimated value (example: 0.01 ETH per NFT)
    const totalValue = (ownedCount + mintedCount) * 0.01;
    document.getElementById('nftCollectionValue').textContent = totalValue.toFixed(2) + ' ETH';
}

// Example: Add sample NFTs (call this after wallet connects)
function loadSampleNFTs() {
    // Sample owned NFTs
    addNFTToGrid({ name: 'AK-47 Skin', id: '001', icon: '🔫' }, false);
    addNFTToGrid({ name: 'Butterfly Knife', id: '002', icon: '🔪' }, false);
    
    // Sample minted NFTs
    addNFTToGrid({ name: 'Dragon Lore', id: '101', icon: '🎨' }, true);
}

// Call this function when you want to test (e.g., after connecting wallet)
loadSampleNFTs();
window.addEventListener('beforeunload', () => {
    if (window.dApp) {
        if (window.dApp.blockchain) {
            window.dApp.blockchain.cleanup();
        }
        if (window.dApp.market) {
            window.dApp.market.cleanup();
        }
    }
});