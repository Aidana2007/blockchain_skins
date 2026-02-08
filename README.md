# Project Complete: Blockchain Skins Marketplace

### Quick Start 

1. **Extract the archive**

2. **Install dependencies**
npm install

3. **Set up environment**
cp .env.example backend/.env
# Edit backend/.env if needed

4. **Start services** (5 terminals)

```bash
# Terminal 1: Blockchain (Hardhat node)
npm run node

# Terminal 2: Deploy contracts
npm run deploy
# Copy contract addresses to backend/.env

# Terminal 3: MongoDB
mongod

# Terminal 4: Seed + Backend
npm run seed    
npm run backend 

# Terminal 5: Frontend (static server)
npx http-server frontend -p 3000
```

5. **Open frontend**
- Open http://localhost:3000/index.html in browser
- Connect MetaMask

## 📦 Complete Project Structure

### 1. Smart Contracts (Solidity)

 **SteamToken.sol** - Enhanced ERC20 token
- Minting for crowdfunding rewards
- Burning for deflationary economy
- Authorization system for contracts
- Full event logging

 **Crowdfunding.sol** - Advanced campaign management
- Create campaigns with goals and deadlines
- Fund with test ETH, receive STM tokens
- Automatic fee distribution (95% creator, 5% platform)
- Contribution tracking
- Campaign finalization

 **SkinPayment.sol** - Skin purchase logic
- Pay with STM tokens
- 1% platform fee, 99% burned
- Emits events for backend sync
- Price calculation helpers

### 2. Backend (Node.js + Express + MongoDB)

 **Complete REST API**
- Authentication with JWT
- User management
- Skin CRUD operations
- Campaign queries
- Protected routes

 **Blockchain Event Listener** (CRITICAL!)
- Listens to `CampaignCreated` events
- Listens to `SkinPurchased` events
- Automatically syncs blockchain → MongoDB
- Real-time ownership updates

 **Database Models**
- User (with password hashing, wallet validation)
- Skin (with rarity, category, ownership tracking)
- Campaign (with contributors, status management)

**Middleware**
- JWT authentication
- Optional authentication for public routes
- Error handling

### 3. Configuration & Deployment

**Deployment Script**
- Automated contract deployment
- Contract linking and authorization
- Environment file generation
- Deployment info logging

**Seed Script**
- 15 pre-configured skins
- Multiple categories and rarities
- Ready-to-use marketplace data

**Hardhat Configuration**
- Local development network
- Sepolia testnet support

---
### Key Features Implemented

### 1. Hybrid Architecture (Blockchain + MongoDB)
- **Skins are NOT NFTs** - ownership in MongoDB
- **Blockchain for payments only** - token transfers, fees
- **Event-driven sync** - blockchain events update database
- **Best of both worlds** - decentralization + performance

### 3. Platform Revenue Model
- **5% fee** from crowdfunding campaigns (in ETH)
- **1% fee** from skin purchases (in STM)
- Sustainable and fair for all parties


## What Makes This Special

### 1. Production-Ready Code
- Full error handling
- Input validation
- Security best practices
- Scalable architecture

### 2. Educational Value
- Demonstrates hybrid blockchain architecture
- Shows event-driven programming
- Teaches smart contract authorization
- Explains token economics

### 3. Real-World Approach
- Similar to actual gaming platforms (Steam, Epic)
- Practical use of blockchain (payments, not ownership)
- Sustainable business model (platform fees)

---

## Next Steps to Run the Project


### Key Points to Highlight

1. **Hybrid Architecture**: Explain why you chose MongoDB over full NFT
2. **Event Listener**: Demonstrate real-time sync between blockchain and database
3. **Token Economy**: Show the circular flow of ETH and STM
4. **Platform Sustainability**: Explain the fee structure

### Add More Skins
Edit `scripts/seed.js` and add to the `initialSkins` array:
```javascript
{
  name: 'Your Skin Name',
  description: 'Description',
  priceSTM: 1500,
  rarity: 'Rare',
  category: 'Weapon'
}
```
## 🎉 Conclusion
 This project demonstrates not just basic blockchain knowledge, but understanding of:
- Smart contract authorization patterns
- Event-driven architecture
- Hybrid blockchain/database systems
- Token economics
- Production-ready code structure

