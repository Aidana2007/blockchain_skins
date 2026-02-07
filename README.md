# Blockchain Skins Marketplace

A full-stack blockchain project combining Ethereum smart contracts with a Node.js + MongoDB backend and a MetaMask-enabled frontend. Create crowdfunding campaigns for game skins, fund them with ETH, earn SteamToken (STM), and buy skins with STM.

## 🎯 Core Concept

**This is NOT an NFT marketplace.** Skins are stored in MongoDB like in real game platforms (Steam). The blockchain is used only for:
- Payments (ETH and ERC20 tokens)
- Token economy (STM rewards)
- Crowdfunding campaigns

### User Flow

1. **Create Crowdfunding Campaigns**: Users create campaigns to fund game skins
2. **Fund Campaigns with ETH**: Other users contribute ETH to campaigns
3. **Receive STM Rewards**: Funders receive ERC20 SteamToken (STM) as rewards
4. **Buy Skins with STM**: Use earned STM to purchase skins from the marketplace
5. **Platform Fees**:
   - 5% fee from crowdfunding campaigns (in ETH)
   - 1% fee from skin purchases (in STM)

## 🏗 Architecture

```
blockchain_skins/
├── contracts/           # Solidity smart contracts
│   ├── SteamToken.sol   # ERC20 token
│   ├── Crowdfunding.sol # Campaign management
│   └── SkinPayment.sol  # Skin purchase logic
├── backend/             # Node.js + Express + MongoDB
│   ├── config/          # Configuration
│   ├── controllers/     # Business logic
│   ├── middleware/      # Auth middleware
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── blockchainListener.js  # Event listener
│   └── server.js        # Entry point
├── frontend/            # Web interface
│   ├── index.html
│   ├── app.js
│   ├── blockchain.js
│   └── ...
└── scripts/             # Deployment scripts
```

## 🔗 Smart Contracts

### SteamToken (ERC20)
- Minted as reward when users fund campaigns
- Used to purchase skins
- Only Crowdfunding and SkinPayment contracts can mint/burn

### Crowdfunding
- Create campaigns with goal and deadline
- Users send ETH to fund campaigns
- Users receive STM reward (1 ETH = 1000 STM)
- After deadline: 95% ETH → creator, 5% ETH → platform

### SkinPayment
- Users pay STM to buy skins
- 1% STM → platform owner, 99% → contract
- Emits `SkinPurchased` event for backend to sync

## 💾 Backend (Node.js + Express + MongoDB)

### Responsibilities
- User registration/login with JWT authentication
- Store skins in MongoDB (name, priceSTM, owner, description, image)
- Store skin ownership (wallet address)
- Store campaign metadata
- Listen to blockchain events:
  - `CampaignCreated`: Save campaign to MongoDB
  - `SkinPurchased`: Update skin ownership in MongoDB

### MongoDB Collections

**users**
```javascript
{
  email: String,
  password: String (hashed),
  walletAddress: String,
  ownedSkins: [String]
}
```

**skins**
```javascript
{
  name: String,
  priceSTM: Number,
  description: String,
  image: String,
  owner: String (wallet address, null if not owned)
}
```

**campaigns**
```javascript
{
  title: String,
  goal: Number (in ETH),
  deadline: Date,
  blockchainId: Number,
  creator: String (wallet address),
  amountRaised: Number,
  finalized: Boolean
}
```

### API Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token
- `POST /api/auth/connect-wallet` - Connect wallet address to user (requires auth)

#### Skins
- `GET /api/skins` - Get all skins
- `POST /api/skins` - Create new skin (admin)
- `POST /api/skins/buy` - Buy a skin (requires auth)
- `GET /api/skins/owned` - Get user's owned skins (requires auth)

#### Campaigns
- `GET /api/campaigns` - Get all campaigns
- `POST /api/campaigns` - Create new campaign
- `PUT /api/campaigns/:id/blockchain` - Attach blockchain ID

## 🖥 Frontend

- Connect MetaMask wallet
- Show skins from backend
- Create crowdfunding campaigns
- Fund campaigns with ETH
- Buy skins with STM tokens
- Real-time balance updates

## 🚀 Quick Start

### Prerequisites
- Node.js (v14+)
- MongoDB (running)
- MetaMask browser extension
- Hardhat (for local blockchain)

### 1. Clone and Install

```bash
git clone https://github.com/Aidana2007/blockchain_skins.git
cd blockchain_skins
npm install
```

### 2. Deploy Smart Contracts

```bash
# Start local Hardhat node (in one terminal)
npx hardhat node

# Deploy contracts (in another terminal)
npx hardhat run scripts/deploy.js --network localhost
```

Copy the deployed contract addresses.

### 3. Configure Backend

```bash
cd backend
cp .env.example .env
```

Edit `.env`:
```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/skinsDB
JWT_SECRET=your_secret_key

RPC_URL=http://127.0.0.1:8545
CROWDFUNDING_ADDRESS=0xYourCrowdfundingAddress
SKIN_PAYMENT_ADDRESS=0xYourSkinPaymentAddress
STEAM_TOKEN_ADDRESS=0xYourSteamTokenAddress
```

### 4. Start Backend

```bash
# Ensure MongoDB is running
mongod

# Start backend server
cd backend
node server.js
```

### 5. Configure Frontend

Update contract addresses in `frontend/config.js` or wherever they're defined.

### 6. Start Frontend

```bash
# Use a simple HTTP server
cd frontend
python -m http.server 8000
# Or
npx http-server -p 8000
```

Open http://localhost:8000 in your browser.

### 7. Configure MetaMask

1. Add Hardhat local network to MetaMask:
   - Network Name: Hardhat Local
   - RPC URL: http://127.0.0.1:8545
   - Chain ID: 31337
   - Currency Symbol: ETH

2. Import an account from Hardhat:
   - Copy private key from Hardhat console
   - MetaMask → Import Account → Paste private key

## 🔐 Security Features

- ✅ Passwords hashed with bcryptjs
- ✅ JWT token authentication
- ✅ Environment variables for secrets
- ✅ Input validation on all endpoints
- ✅ Protected routes with authentication middleware
- ✅ Smart contract access control (only authorized contracts can mint)

## 🧪 Testing

The backend can be tested using tools like:
- Postman
- curl
- Thunder Client (VS Code)

Smart contracts can be tested with Hardhat:
```bash
npx hardhat test
```

## 📚 Documentation

- [Backend README](./backend/README.md) - Detailed backend API documentation
- [Frontend README](./FRONTEND_README.md) - Frontend setup and UX documentation
- Contract Documentation - See comments in Solidity files

## 🔄 Blockchain ↔ Backend Bridge

### How it Works

1. **User Action**: User calls smart contract function (e.g., buySkin)
2. **Smart Contract**: Executes logic and emits event
3. **Backend Listener**: Catches the event in real-time
4. **Database Update**: Updates MongoDB with new state
5. **Frontend Query**: Frontend fetches updated data from backend

### Example: Buying a Skin

```
User → SkinPayment.buySkin() → Event: SkinPurchased
                                    ↓
Backend Listener → Update skin.owner in MongoDB
                                    ↓
Frontend → GET /api/skins/owned → See new skin
```

## 🎮 Use Cases

1. **Game Developer**: Create campaigns to fund new skin designs
2. **Investor**: Fund campaigns with ETH, earn STM tokens
3. **Gamer**: Use earned STM to buy skins for your account
4. **Platform**: Earn fees from campaigns and purchases

## ⚠️ Important Notes

- **Skins are NOT NFTs**: They're database records, not blockchain tokens
- **Blockchain is for payments only**: Token logic and transactions
- **Ownership is in MongoDB**: Not on blockchain
- **Platform earns fees**: 5% from campaigns, 1% from purchases
- **STM is minted**: As rewards for funding campaigns
- **This is a learning project**: Not production-ready

## 📝 Implementation Checklist

- [x] Smart Contracts (SteamToken, Crowdfunding, SkinPayment)
- [x] Backend Server Setup
- [x] MongoDB Models (User, Skin, Campaign)
- [x] Authentication Routes (Register, Login, Connect Wallet)
- [x] Skin Routes (Get, Create, Buy, Get Owned)
- [x] Campaign Routes (Get, Create, Attach Blockchain ID)
- [x] Blockchain Listener (CampaignCreated, SkinPurchased events)
- [x] Environment Configuration
- [x] Error Handling and Validation
- [x] Documentation

## 🤝 Contributing

This is an educational project. Feel free to fork and modify for learning purposes.

## 📄 License

MIT

## 👨‍💻 Author

Aidana2007

---

**Remember**: This is a demonstration project showing how to integrate blockchain with traditional web technologies. Always conduct thorough security audits before deploying to production!
