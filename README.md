# Blockchain Skins Marketplace

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start blockchain**
   ```bash
   npx hardhat node
   npx hardhat run scripts/deploy.js --network localhost
   ```

3. **Configure backend**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with contract addresses
   ```

4. **Start MongoDB**
   ```bash
   mongod
   ```

5. **Start backend**
   ```bash
   cd backend
   node server.js
   ```

6. **Start frontend**
   ```bash
   cd frontend
   python -m http.server 8000
   ```

7. **Open browser**: http://localhost:8000
