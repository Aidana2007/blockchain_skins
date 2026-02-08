export const CONFIG = {
  API_BASE_URL: 'http://localhost:5000',
  CONTRACTS: {
    STEAM_TOKEN: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    CROWDFUNDING: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
    SKIN_PAYMENT: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0'
  },
  NETWORK: {
    CHAIN_ID: 31337, 
    NAME: 'Hardhat Local',
    RPC_URL: 'http://127.0.0.1:8545',
  },
  STORAGE_KEYS: {
    AUTH_TOKEN: 'blockchain_skins_auth_token',
    USER_DATA: 'blockchain_skins_user_data',
    WALLET_ADDRESS: 'blockchain_skins_wallet_address'
  },
  UI: {
    ITEMS_PER_PAGE: 12,
    TOAST_DURATION: 3000,
    REFRESH_INTERVAL: 10000 
  },
  TOKEN: {
    SYMBOL: 'STM',
    NAME: 'SteamToken',
    DECIMALS: 18,
    REWARD_RATIO: 1000 
  }
};
export default CONFIG;