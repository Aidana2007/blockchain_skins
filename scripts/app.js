// app.js - Main Application Module

import { BlockchainService } from './blockchain.js';
import { UIManager } from './ui.js';
import { MarketManager } from './market.js';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from './config.js';



class DApp {
    constructor() {
        this.blockchain = new BlockchainService(CONTRACT_ADDRESS, CONTRACT_ABI);
        this.ui = new UIManager();
        this.market = new MarketManager();
        this.isConnected = false;
        this.init();
    }

    /**
     * Initialize the application
     */
    init() {
        this.setupEventListeners();
        this.checkInitialConnection();
        
        // Initialize market chart
        this.market.initialize();
    }

    /**
     * Check if wallet is already connected
     */
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

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Connect wallet button
        this.ui.elements.connectWallet.addEventListener('click', async () => {
            await this.connectWallet();
        });

        // Refresh balance button
        this.ui.elements.refreshBalance.addEventListener('click', async () => {
            await this.refreshBalance();
        });

        // Transfer form submission
        this.ui.elements.transferForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleTransfer();
        });

        // Gas estimation button
        this.ui.elements.estimateGasBtn.addEventListener('click', async () => {
            await this.estimateGas();
        });

        // Setup blockchain event listeners
        this.setupBlockchainListeners();
    }

    /**
     * Setup blockchain-specific event listeners
     */
    setupBlockchainListeners() {
        // Listen for account changes
        this.blockchain.onAccountChange(async (newAccount) => {
            if (newAccount) {
                this.ui.showNotification('Account changed', 'info');
                await this.updateAccountInfo(newAccount);
            } else {
                this.ui.showNotification('Wallet disconnected', 'info');
                this.handleDisconnect();
            }
        });

        // Listen for network changes
        this.blockchain.onNetworkChange(() => {
            this.ui.showNotification('Network changed - reloading...', 'info');
        });
    }

    /**
     * Connect to MetaMask wallet
     */
    async connectWallet() {
        try {
            this.ui.showLoading('Connecting to wallet...');
            this.ui.hideError();

            // Connect to blockchain
            const connectionData = await this.blockchain.connectWallet();
            
            // Update UI
            this.ui.updateConnectionStatus(
                connectionData.account, 
                connectionData.network
            );

            // Get token details
            const tokenDetails = await this.blockchain.getTokenDetails();
            this.ui.updateContractInfo(
                CONTRACT_ADDRESS,
                tokenDetails.name,
                tokenDetails.symbol
            );

            // Get initial balance
            await this.refreshBalance();

            // Setup transfer event listener
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

    /**
     * Update account information when account changes
     */
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

    /**
     * Refresh balance display
     */
    async refreshBalance() {
        try {
            this.ui.showLoading('Refreshing balance...');
            
            const balance = await this.blockchain.getBalance();
            this.ui.updateBalance(balance);
            
            // Update portfolio value based on current market price
            this.market.updatePortfolioValue(balance);
            
        } catch (error) {
            this.ui.showError('Failed to refresh balance: ' + error.message);
        } finally {
            this.ui.hideLoading();
        }
    }

    /**
     * Estimate gas for transfer
     */
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

    /**
     * Handle token transfer
     */
    async handleTransfer() {
        try {
            const formData = this.ui.validateTransferForm();
            
            this.ui.showLoading('Initiating transfer...');
            this.ui.hideError();
            this.ui.setTransferButtonState(false);

            // Execute transfer
            const txData = await this.blockchain.transfer(
                formData.recipient,
                formData.amount
            );

            // Add pending transaction to history
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

            // Wait for confirmation
            this.ui.showLoading('Waiting for confirmation...');
            const receipt = await txData.wait();

            // Update transaction status
            if (receipt.status === 1) {
                this.ui.updateTransactionStatus(txData.hash, 'success');
                this.ui.showNotification('Transfer successful!', 'success');
                
                // Refresh balance after successful transfer
                await this.refreshBalance();
                
                // Reset form
                this.ui.resetTransferForm();
            } else {
                this.ui.updateTransactionStatus(txData.hash, 'failed');
                this.ui.showError('Transaction failed');
            }

        } catch (error) {
            // Handle user rejection separately
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

    /**
     * Setup Transfer event listener
     */
    setupTransferListener() {
        this.blockchain.listenForTransfers(async (eventData) => {
            console.log('Transfer event detected:', eventData);
            
            // Show notification for incoming transfers
            if (eventData.to.toLowerCase() === this.blockchain.account.toLowerCase()) {
                this.ui.showNotification(
                    `Received ${eventData.amount} STM from ${this.ui.formatAddress(eventData.from)}`,
                    'success'
                );
            }

            // Refresh balance when any transfer involving current account occurs
            await this.refreshBalance();
        });
    }

    /**
     * Handle wallet disconnect
     */
    handleDisconnect() {
        this.isConnected = false;
        this.blockchain.cleanup();
        
        // Reset UI
        this.ui.elements.connectionStatus.classList.add('hidden');
        this.ui.elements.mainContent.classList.add('hidden');
        this.ui.elements.connectWallet.textContent = 'Connect Wallet';
        this.ui.elements.connectWallet.disabled = false;
    }
}

// Initialize the dApp when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new DApp();
    
    // Make app instance globally accessible for debugging
    window.dApp = app;
});

// Handle page unload
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