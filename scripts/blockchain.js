// blockchain.js – hardened & CALL_EXCEPTION-safe version

export class BlockchainService {
    constructor(contractAddress, abi) {
        this.contractAddress = contractAddress;
        this.abi = abi;

        this.provider = null;
        this.signer = null;

        this.readContract = null;   
        this.writeContract = null; 

        this.account = null;
        this.eventListeners = new Map();
        this._decimalsCache = null;
    }

    async initialize() {
        if (!window.ethereum) {
            throw new Error('MetaMask is not installed');
        }

        this.provider = new ethers.providers.Web3Provider(window.ethereum);

        this.readContract = new ethers.Contract(
            this.contractAddress,
            this.abi,
            this.provider
        );

        return this.provider;
    }

    async connectWallet() {
        try {
            await this.initialize();

            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            if (!accounts?.length) {
                throw new Error('No wallet accounts available');
            }

            this.account = accounts[0];
            this.signer = this.provider.getSigner();

            this.writeContract = new ethers.Contract(
                this.contractAddress,
                this.abi,
                this.signer
            );

            return {
                account: this.account,
                network: await this.getNetwork()
            };
        } catch (err) {
            throw this.handleError(err);
        }
    }

    async getNetwork() {
        const net = await this.provider.getNetwork();
        return { name: net.name, chainId: net.chainId };
    }

    getAccount() {
        if (!this.account) throw new Error('Wallet not connected');
        return this.account;
    }

    async _safeCall(fn, fallback = null) {
        try {
            return await fn();
        } catch {
            return fallback;
        }
    }

    async getDecimals() {
        if (this._decimalsCache !== null) return this._decimalsCache;

        const decimals = await this._safeCall(
            () => this.readContract.decimals(),
            18
        );

        this._decimalsCache = Number(decimals);
        return this._decimalsCache;
    }

    async getTokenDetails() {
        const [name, symbol, decimals] = await Promise.all([
            this._safeCall(() => this.readContract.name(), 'Unknown'),
            this._safeCall(() => this.readContract.symbol(), 'TOKEN'),
            this.getDecimals()
        ]);

        return { name, symbol, decimals };
    }

    async getBalance(address = null) {
        try {
            const target = address || this.account;
            if (!target) throw new Error('No address provided');

            const raw = await this._safeCall(
                () => this.readContract.balanceOf(target),
                null
            );

            if (!raw) return '0';

            const decimals = await this.getDecimals();
            return ethers.utils.formatUnits(raw, decimals);
        } catch (err) {
            throw this.handleError(err);
        }
    }

    async transfer(to, amount) {
        try {
            if (!ethers.utils.isAddress(to)) {
                throw new Error('Invalid recipient address');
            }

            if (!this.writeContract) {
                throw new Error('Wallet not connected');
            }

            const decimals = await this.getDecimals();
            const value = ethers.utils.parseUnits(
                amount.toString(),
                decimals
            );

            const tx = await this.writeContract.transfer(to, value);

            return {
                hash: tx.hash,
                wait: () => tx.wait()
            };
        } catch (err) {
            throw this.handleError(err);
        }
    }

    async estimateTransferGas(to, amount) {
        try {
            const decimals = await this.getDecimals();
            const value = ethers.utils.parseUnits(amount.toString(), decimals);

            const gas = await this.writeContract.estimateGas.transfer(to, value);
            return gas.toString();
        } catch (err) {
            return 'Transaction would fail';
        }
    }

    async compareGasEstimates(to, amount) {
        try {
            if (!this.writeContract) {
                throw new Error('Wallet not connected');
            }

            const decimals = await this.getDecimals();
            const value = ethers.utils.parseUnits(amount.toString(), decimals);

            const successfulGas = await this.writeContract.estimateGas.transfer(to, value);

            let failingGas;
            try {
                const hugeAmount = ethers.utils.parseUnits("9999999999999", decimals);
                failingGas = await this.writeContract.estimateGas.transfer(to, hugeAmount);
            } catch (error) {
                failingGas = 'Transaction would fail (reverts)';
            }

            return {
                successfulTransfer: successfulGas.toString(),
                failingTransfer: failingGas,
                comparison: failingGas === 'Transaction would fail (reverts)'
                    ? 'Failing transactions revert before using all gas'
                    : 'Both transactions estimate similar gas'
            };
        } catch (error) {
            throw this.handleError(error);
        }
    }

    listenForTransfers(callback) {
        if (!this.readContract || !this.account) return;

        this.removeTransferListener();

        const filter = this.readContract.filters.Transfer(null, null);

        const listener = (from, to, value, event) => {
            if (
                from.toLowerCase() === this.account.toLowerCase() ||
                to.toLowerCase() === this.account.toLowerCase()
            ) {
                callback({
                    from,
                    to,
                    amount: value.toString(),
                    txHash: event.transactionHash,
                    block: event.blockNumber
                });
            }
        };

        this.readContract.on(filter, listener);
        this.eventListeners.set('Transfer', { filter, listener });
    }

    removeTransferListener() {
        const data = this.eventListeners.get('Transfer');
        if (data && this.readContract) {
            this.readContract.off(data.filter, data.listener);
            this.eventListeners.delete('Transfer');
        }
    }
    onAccountChange(cb) {
        window.ethereum?.on('accountsChanged', (accs) => {
            this.account = accs?.[0] || null;
            cb(this.account);
        });
    }

    onNetworkChange(cb) {
        window.ethereum?.on('chainChanged', () => {
            cb();
            window.location.reload();
        });
    }

    handleError(error) {
        console.error('Blockchain Error:', error);

        if (error?.code === 4001) {
            return new Error('User rejected the request');
        }

        if (error?.code === 'CALL_EXCEPTION') {
            return new Error('Contract call failed (wrong network or ABI)');
        }

        if (error?.code === 'UNPREDICTABLE_GAS_LIMIT') {
            return new Error('Transaction would fail');
        }

        return error instanceof Error
            ? error
            : new Error('Unknown blockchain error');
    }

    cleanup() {
        this.removeTransferListener();
        this.eventListeners.clear();
    }
}
