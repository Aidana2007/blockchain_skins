# Blockchain Skins Marketplace - AI Agent Instructions

## Architecture Overview

This is a **hybrid blockchain + traditional web app** - NOT a pure NFT marketplace:
- **Skins are stored in MongoDB** (like Steam), not as NFTs on blockchain
- **Blockchain handles payments only**: ETH crowdfunding and STM (ERC20) token economy
- **Event-driven sync**: Blockchain events trigger MongoDB updates via `blockchainListener.js`

**Key architectural decision**: Ownership is stored off-chain to avoid gas costs, but payments/token economy is on-chain for transparency.

## Project Structure

```
blockchain_skins/
├── contracts/          # Solidity smart contracts (Hardhat)
│   ├── SteamToken.sol     # ERC20 token (only Crowdfunding/SkinPayment can mint/burn)
│   ├── Crowdfunding.sol   # Campaign funding (95% to creator, 5% platform fee)
│   └── SkinPayment.sol    # Skin purchases (1% platform fee)
├── backend/            # Node.js + Express + MongoDB
│   ├── blockchainListener.js  # **CRITICAL**: Listens to blockchain events, updates MongoDB
│   ├── models/         # Mongoose schemas with blockchainId mapping
│   ├── controllers/    # MVC pattern business logic
│   └── config/contracts.js    # Contract ABIs and addresses
└── frontend/           # Multi-page vanilla JS + MetaMask
    ├── index.html         # Landing/auth page
    ├── wallet.html        # Token management
    └── [other pages]      # Skins, campaigns, etc.
```

## Critical Developer Workflows

### Local Development Setup
```bash
# 1. Start local blockchain (terminal 1)
npx hardhat node

# 2. Deploy contracts, SAVE the addresses (terminal 2)
npx hardhat run scripts/deploy.js --network localhost

# 3. Configure backend with contract addresses
cd backend && cp .env.example .env
# Edit .env: Add CROWDFUNDING_ADDRESS, SKIN_PAYMENT_ADDRESS, STEAM_TOKEN_ADDRESS

# 4. Start MongoDB (terminal 3)
mongod

# 5. Start backend (terminal 4)
cd backend && node server.js

# 6. Start frontend (terminal 5)
cd frontend && python -m http.server 8000
```

### Testing Contracts
```bash
npx hardhat test
```

## Project-Specific Patterns

### 1. Blockchain ↔ MongoDB ID Mapping
**Pattern**: Models use `blockchainId` field to map blockchain events to MongoDB documents.
```javascript
// Skin model has BOTH _id (MongoDB) and blockchainId (contract)
const skin = await Skin.findOne({ blockchainId: Number(skinId) });
```
**Why**: Blockchain emits numeric IDs, MongoDB uses ObjectIds. Must map between them.

### 2. Wei String Storage for Precision
**Pattern**: Store ETH/token amounts as strings (Wei), NOT numbers.
```javascript
goal: goal.toString(), // Store as Wei string to preserve precision
```
**Why**: JavaScript Number loses precision with large Wei values.

### 3. Event-Driven Ownership Updates
**Pattern**: Ownership updates ONLY via blockchain events, not API endpoints.
```javascript
// buySkin API endpoint does NOT update ownership
// blockchainListener.js updates ownership when SkinPurchased event fires
```
**Why**: Blockchain is source of truth for payments. API endpoints are for frontend status only.

### 4. Sparse Unique Indexes
**Pattern**: Models use `unique: true, sparse: true` for blockchain IDs.
```javascript
blockchainId: { type: Number, unique: true, sparse: true }
```
**Why**: Allows multiple null values (for items not yet on blockchain) while ensuring uniqueness for deployed items.

### 5. Rate Limiting by Route Type
- **Auth routes**: 5 requests/15min (strict)
- **API routes**: 100 requests/15min (general)
- **DB routes**: 50 requests/min (database operations)

See `backend/middleware/rateLimiter.js` for implementation.

## Integration Points

### Backend → Blockchain
- Uses `ethers.js` v6 JsonRpcProvider
- Contract ABIs in `backend/config/contracts.js`
- Event listeners run continuously after server starts

### Frontend → Backend
- REST API: `/api/auth/*`, `/api/skins/*`, `/api/campaigns/*`
- JWT auth with 1-hour expiration
- All authenticated routes require `Authorization` header

### Frontend → Blockchain
- MetaMask for wallet connection
- Direct contract calls for payments (buySkin, fundCampaign)
- Frontend does NOT write to MongoDB directly

## Common Gotchas

1. **Contract addresses**: Must be set in `backend/.env` after deployment or listener won't work
2. **MongoDB connection**: Backend expects MongoDB on default port 27017
3. **Network mismatch**: MetaMask must be on same network as Hardhat node (Chain ID 31337)
4. **Event listener**: Backend must be running to sync blockchain events to MongoDB
5. **Platform fees**: Hardcoded 5% (campaigns) and 1% (skins) in smart contracts

## Security Notes

- JWT_SECRET must be changed from default in production
- Rate limiting prevents brute force on all routes
- Password hashing uses bcryptjs
- No SQL injection risk (using Mongoose)
- Smart contracts use OpenZeppelin for security
- CodeQL security scan passes with 0 alerts
