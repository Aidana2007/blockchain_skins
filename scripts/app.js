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
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new DApp();
    
    window.dApp = app;
});

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