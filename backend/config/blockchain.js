const { ethers } = require('ethers');
const rpcUrl = process.env.RPC_URL || 'http://127.0.0.1:8545';
const wsUrl = process.env.RPC_WS_URL || rpcUrl.replace(/^http/, 'ws');
let provider;
try {
  provider = new ethers.WebSocketProvider(wsUrl);
  console.log(`🔌 Using WebSocket provider at ${wsUrl}`);
} catch (err) {
  console.warn('⚠️ WebSocket provider failed, falling back to HTTP:', err.message);
  provider = new ethers.JsonRpcProvider(rpcUrl);
}
const addresses = {
  steamToken: process.env.STEAM_TOKEN_ADDRESS,
  crowdfunding: process.env.CROWDFUNDING_ADDRESS,
  skinPayment: process.env.SKIN_PAYMENT_ADDRESS,
};
const abis = {
  steamToken: [
    "function balanceOf(address owner) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)",
    "function name() view returns (string)",
    "event Transfer(address indexed from, address indexed to, uint256 value)",
    "event Approval(address indexed owner, address indexed spender, uint256 value)"
  ],
  crowdfunding: [
    "function createCampaign(string title, uint256 goal, uint256 durationInDays) returns (uint256)",
    "function fundCampaign(uint256 campaignId) payable",
    "function finalizeCampaign(uint256 campaignId)",
    "function getCampaign(uint256 campaignId) view returns (string title, uint256 goal, uint256 deadline, uint256 amountRaised, address creator, bool finalized, bool cancelled)",
    "function campaignCount() view returns (uint256)",
    "function isCampaignActive(uint256 campaignId) view returns (bool)",
    "function getContribution(uint256 campaignId, address contributor) view returns (uint256)",
    "event CampaignCreated(uint256 indexed campaignId, string title, uint256 goal, uint256 deadline, address indexed creator)",
    "event CampaignFunded(uint256 indexed campaignId, address indexed contributor, uint256 amount, uint256 tokensRewarded)",
    "event CampaignFinalized(uint256 indexed campaignId, uint256 totalRaised, uint256 creatorAmount, uint256 platformFee)"
  ],
  skinPayment: [
    "function buySkin(uint256 skinId, uint256 price)",
    "function calculatePrice(uint256 basePrice) view returns (uint256 totalPrice, uint256 platformFee)",
    "function canAffordSkin(address buyer, uint256 price) view returns (bool)",
    "event SkinPurchased(address indexed buyer, uint256 indexed skinId, uint256 price, uint256 platformFee, uint256 timestamp)"
  ]
};
function getContract(contractName) {
  if (!addresses[contractName]) {
    throw new Error(`Contract address for ${contractName} not configured`);
  }
  return new ethers.Contract(
    addresses[contractName],
    abis[contractName],
    provider
  );
}
function getContractWithSigner(contractName, privateKey) {
  if (!addresses[contractName]) {
    throw new Error(`Contract address for ${contractName} not configured`);
  }
  const wallet = new ethers.Wallet(privateKey, provider);
  return new ethers.Contract(
    addresses[contractName],
    abis[contractName],
    wallet
  );
}
async function verifyConnection() {
  try {
    const network = await provider.getNetwork();
    console.log(`✅ Connected to blockchain network: ${network.name} (Chain ID: ${network.chainId})`);
    for (const [name, address] of Object.entries(addresses)) {
      if (address) {
        const code = await provider.getCode(address);
        if (code === '0x') {
          console.warn(`⚠️  Warning: No contract code at ${name} address ${address}`);
        } else {
          console.log(`✅ ${name} contract verified at ${address}`);
        }
      } else {
        console.warn(`⚠️  Warning: ${name} contract address not set`);
      }
    }
    return true;
  } catch (error) {
    console.error('❌ Blockchain connection error:', error.message);
    return false;
  }
}
module.exports = {
  provider,
  addresses,
  abis,
  getContract,
  getContractWithSigner,
  verifyConnection
};