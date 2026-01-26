// Replace with your deployed contract address
// For production, load from environment variable
export const CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';

export const CONTRACT_ABI = [
    {
        "inputs": [{ "internalType": "address", "name": "account", "type": "address" }],
        "name": "balanceOf",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "totalSupply",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "name",
        "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "symbol",
        "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "decimals",
        "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "address", "name": "to", "type": "address" },
            { "internalType": "uint256", "name": "amount", "type": "uint256" }
        ],
        "name": "transfer",
        "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "address", "name": "from", "type": "address" },
            { "indexed": true, "internalType": "address", "name": "to", "type": "address" },
            { "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" }
        ],
        "name": "Transfer",
        "type": "event"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "name",
        "outputs": [{ "name": "", "type": "string" }],
        "type": "function"
    }


];

export const NETWORKS = {
    1: 'Ethereum Mainnet',
    3: 'Ropsten Testnet',
    4: 'Rinkeby Testnet',
    5: 'Goerli Testnet',
    11155111: 'Sepolia Testnet',
    31337: 'Hardhat Local',  
    1337: 'Ganache Local',
    8545: 'Localhost'        
};

export const DEFAULT_NETWORK_ID = 31337;

// erc-721
export const NFT_CONTRACT_ADDRESS = '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0'

export const NFT_CONTRACT_ABI = [
    {
        "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }],
        "name": "balanceOf",
        "outputs": [{ "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }],
        "name": "ownerOf",
        "outputs": [{ "type": "address" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }],
        "name": "tokenURI",
        "outputs": [{ "type": "string" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "totalSupply",
        "outputs": [{ "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    }
]
