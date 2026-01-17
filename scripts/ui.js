// ui.js - UI Management Module

export class UIManager {
    constructor() {
        this.elements = this.getElements();
        this.transactions = [];
    }

    /**
     * Get all DOM elements
     */
    getElements() {
        return {
            // Buttons
            connectWallet: document.getElementById('connectWallet'),
            refreshBalance: document.getElementById('refreshBalance'),
            transferBtn: document.getElementById('transferBtn'),
            estimateGasBtn: document.getElementById('estimateGasBtn'),

            // Forms
            transferForm: document.getElementById('transferForm'),
            recipientAddress: document.getElementById('recipientAddress'),
            transferAmount: document.getElementById('transferAmount'),

            // Display elements
            connectionStatus: document.getElementById('connectionStatus'),
            accountAddress: document.getElementById('accountAddress'),
            userBalance: document.getElementById('userBalance'),
            availableBalance: document.getElementById('availableBalance'),
            estimatedGas: document.getElementById('estimatedGas'),
            gasComparison: document.getElementById('gasComparison'),
            transactionHistory: document.getElementById('transactionHistory'),
            contractAddress: document.getElementById('contractAddress'),
            tokenName: document.getElementById('tokenName'),
            tokenSymbol: document.getElementById('tokenSymbol'),
            networkName: document.getElementById('networkName'),
            errorDisplay: document.getElementById('errorDisplay'),
            mainContent: document.getElementById('mainContent'),
            loadingOverlay: document.getElementById('loadingOverlay'),
            loadingMessage: document.getElementById('loadingMessage')
        };
    }

    /**
     * Show loading overlay
     */
    showLoading(message = 'Processing...') {
        this.elements.loadingMessage.textContent = message;
        this.elements.loadingOverlay.classList.remove('hidden');
    }

    /**
     * Hide loading overlay
     */
    hideLoading() {
        this.elements.loadingOverlay.classList.add('hidden');
    }

    /**
     * Show error message
     */
    showError(message) {
        this.elements.errorDisplay.textContent = message;
        this.elements.errorDisplay.classList.remove('hidden');
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
            this.hideError();
        }, 10000);
    }

    /**
     * Hide error message
     */
    hideError() {
        this.elements.errorDisplay.classList.add('hidden');
    }

    /**
     * Update connection status
     */
    updateConnectionStatus(account, network) {
        this.elements.accountAddress.textContent = this.formatAddress(account);
        this.elements.networkName.textContent = network.name || `Chain ID: ${network.chainId}`;
        this.elements.connectionStatus.classList.remove('hidden');
        this.elements.mainContent.classList.remove('hidden');
        this.elements.connectWallet.textContent = 'Connected';
        this.elements.connectWallet.disabled = true;
    }

    /**
     * Update balance display
     */
    updateBalance(balance) {
        const formattedBalance = parseFloat(balance).toFixed(4);
        this.elements.userBalance.textContent = formattedBalance;
        this.elements.availableBalance.textContent = formattedBalance;
    }

    /**
     * Update contract information
     */
    updateContractInfo(address, name, symbol) {
        this.elements.contractAddress.textContent = this.formatAddress(address);
        this.elements.tokenName.textContent = name;
        this.elements.tokenSymbol.textContent = symbol;
    }

    /**
     * Update gas estimation display
     */
    updateGasEstimation(gasData) {
        this.elements.estimatedGas.textContent = gasData.successfulTransfer;
        
        const comparisonHTML = `
            <div style="margin-top: 10px;">
                <p style="margin: 5px 0;"><strong>✅ Successful Transfer Gas:</strong> ${gasData.successfulTransfer}</p>
                <p style="margin: 5px 0;"><strong>❌ Failing Transfer Gas:</strong> ${gasData.failingTransfer}</p>
                <p style="margin: 5px 0; color: var(--warning-color);"><strong>Note:</strong> ${gasData.comparison}</p>
            </div>
        `;
        
        this.elements.gasComparison.innerHTML = comparisonHTML;
        this.elements.gasComparison.classList.remove('hidden');
    }

    /**
     * Reset gas estimation display
     */
    resetGasEstimation() {
        this.elements.estimatedGas.textContent = '--';
        this.elements.gasComparison.classList.add('hidden');
    }

    /**
     * Add transaction to history
     */
    addTransaction(transaction) {
        this.transactions.unshift(transaction);
        this.renderTransactionHistory();
    }

    /**
     * Update transaction status
     */
    updateTransactionStatus(hash, status) {
        const transaction = this.transactions.find(tx => tx.hash === hash);
        if (transaction) {
            transaction.status = status;
            this.renderTransactionHistory();
        }
    }

    /**
     * Render transaction history
     */
    renderTransactionHistory() {
        if (this.transactions.length === 0) {
            this.elements.transactionHistory.innerHTML = '<p class="empty-state">No transactions yet</p>';
            return;
        }

        const transactionsHTML = this.transactions.map(tx => `
            <div class="transaction-item ${tx.status}">
                <div class="transaction-header">
                    <span class="transaction-type">Transfer</span>
                    <span class="transaction-status ${tx.status}">${this.formatStatus(tx.status)}</span>
                </div>
                <div class="transaction-details">
                    <div><strong>From:</strong> ${this.formatAddress(tx.from)}</div>
                    <div><strong>To:</strong> ${this.formatAddress(tx.to)}</div>
                    <div><strong>Amount:</strong> ${tx.amount} STM</div>
                    <div><strong>Hash:</strong> ${this.formatAddress(tx.hash)}</div>
                    ${tx.timestamp ? `<div><strong>Time:</strong> ${new Date(tx.timestamp).toLocaleString()}</div>` : ''}
                </div>
            </div>
        `).join('');

        this.elements.transactionHistory.innerHTML = transactionsHTML;
    }

    /**
     * Reset transfer form
     */
    resetTransferForm() {
        this.elements.transferForm.reset();
        this.resetGasEstimation();
    }

    /**
     * Enable/disable transfer button
     */
    setTransferButtonState(enabled) {
        this.elements.transferBtn.disabled = !enabled;
    }

    /**
     * Format Ethereum address (0x1234...5678)
     */
    formatAddress(address) {
        if (!address) return 'N/A';
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    }

    /**
     * Format transaction status
     */
    formatStatus(status) {
        const statusMap = {
            'pending': '⏳ Pending',
            'success': '✅ Success',
            'failed': '❌ Failed'
        };
        return statusMap[status] || status;
    }

    /**
     * Get form values
     */
    getTransferFormValues() {
        return {
            recipient: this.elements.recipientAddress.value.trim(),
            amount: this.elements.transferAmount.value.trim()
        };
    }

    /**
     * Validate form inputs
     */
    validateTransferForm() {
        const { recipient, amount } = this.getTransferFormValues();
        
        if (!recipient || !amount) {
            throw new Error('Please fill in all fields');
        }

        if (!ethers.utils.isAddress(recipient)) {
            throw new Error('Invalid recipient address');
        }

        if (isNaN(amount) || parseFloat(amount) <= 0) {
            throw new Error('Amount must be greater than 0');
        }

        return { recipient, amount };
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? 'var(--success-color)' : 'var(--error-color)'};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: var(--shadow-lg);
            z-index: 1001;
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Remove after 5 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);