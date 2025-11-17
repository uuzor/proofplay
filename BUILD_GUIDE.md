# 🎮 ProofPlay - Build Guide

Complete guide to building and running ProofPlay locally.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Sui CLI installed
- Git

### One-Command Demo

```bash
# Clone and run demo
git clone <repo>
cd proofplay
./scripts/demo.sh
```

This will:
1. Install dependencies
2. Build TypeScript code
3. Run 3 simulated matches
4. Show complete ProofPlay flow

## 📦 Project Structure

```
proofplay/
├── move/                    # Sui Move smart contracts
│   ├── sources/
│   │   ├── proofplay.move           # Core oracle contract
│   │   └── walrus_integration.move  # Walrus storage
│   ├── Move.toml
│   └── tests/
│
├── game-sdk/                # Game integration SDK
│   ├── src/
│   │   ├── proof-generator.ts       # Proof generation
│   │   ├── walrus-uploader.ts       # Walrus integration
│   │   └── mock-game-client.ts      # Demo client
│   └── package.json
│
├── api/                     # Query API for prediction markets
│   ├── src/
│   │   └── server.ts                # Express API server
│   └── package.json
│
├── client/                  # Frontend demo
│   └── index.html                   # Interactive demo
│
├── scripts/                 # Build and deployment scripts
│   ├── build-all.sh                 # Build everything
│   ├── deploy.sh                    # Deploy to Sui testnet
│   └── demo.sh                      # Run quick demo
│
└── docs/
    ├── DEPLOYMENT.md                # Deployment guide
    └── ARCHITECTURE.md              # Technical architecture
```

## 🔨 Building from Source

### Step 1: Install Sui CLI

```bash
# Install Rust (if not already installed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Sui CLI
cargo install --locked --git https://github.com/MystenLabs/sui.git --branch main sui

# Verify installation
sui --version
```

### Step 2: Build All Components

```bash
# Option 1: Use build script (recommended)
./scripts/build-all.sh

# Option 2: Build manually
# Build Move contracts
cd move && sui move build

# Build game SDK
cd ../game-sdk && npm install && npm run build

# Build API
cd ../api && npm install && npm run build
```

### Step 3: Run Tests

```bash
# Test Move contracts
cd move
sui move test

# Test TypeScript code
cd ../game-sdk
npm test
```

## 🎯 Running the Demo

### Option 1: Quick Demo (Recommended)

```bash
./scripts/demo.sh
```

Output:
```
🎮 Starting New Match
⚔️ Match completed: WIN - 25K/18D
🔐 Generating cryptographic proof...
📤 Uploaded to Walrus: Blob ID abc123...
⛓️ Submitted to Sui: TX 0xdef456...
✅ Match recorded successfully!
```

### Option 2: Interactive Frontend Demo

```bash
# Option A: Python HTTP server
cd client
python3 -m http.server 8080

# Option B: Node HTTP server
cd client
npx serve .

# Open browser
open http://localhost:8080
```

### Option 3: Run API Server

```bash
# Terminal 1: Start API
cd api
npm run dev

# Terminal 2: Test API
curl http://localhost:3000/health
curl http://localhost:3000/api/v1/proofs
```

## 🚀 Deploying to Sui Testnet

### Step 1: Set Up Wallet

```bash
# Create new address
sui client new-address ed25519

# Get testnet tokens
sui client faucet

# Check balance
sui client gas
```

### Step 2: Deploy Contracts

```bash
# Use deployment script
./scripts/deploy.sh

# Or manually
cd move
sui client publish --gas-budget 100000000
```

### Step 3: Configure Environment

The deployment script creates `.env` automatically:

```env
SUI_NETWORK=testnet
SUI_PACKAGE_ID=0xabc123...
WALRUS_PUBLISHER_URL=https://publisher.walrus-testnet.walrus.space
WALRUS_AGGREGATOR_URL=https://aggregator.walrus-testnet.walrus.space
API_PORT=3000
```

## 🔧 Development Workflow

### Making Changes to Smart Contracts

```bash
cd move

# Edit contracts
vim sources/proofplay.move

# Build
sui move build

# Test
sui move test

# Deploy
sui client publish --gas-budget 100000000
```

### Making Changes to Game SDK

```bash
cd game-sdk

# Edit TypeScript
vim src/proof-generator.ts

# Build
npm run build

# Test
npm run demo
```

### Making Changes to API

```bash
cd api

# Edit server code
vim src/server.ts

# Run in dev mode (auto-reload)
npm run dev

# Build for production
npm run build
npm start
```

## 🧪 Testing

### Unit Tests

```bash
# Move contracts
cd move
sui move test

# TypeScript (if configured)
cd game-sdk
npm test
```

### Integration Testing

```bash
# Run complete flow
./scripts/demo.sh

# Test API endpoints
curl http://localhost:3000/api/v1/proofs
curl http://localhost:3000/api/v1/proof/match_001
```

### Manual Testing Checklist

- [ ] Submit proof succeeds
- [ ] Proof uploaded to Walrus
- [ ] Transaction recorded on Sui
- [ ] Query returns correct data
- [ ] Revenue distribution works
- [ ] Frontend displays correctly

## 🐛 Troubleshooting

### Build Issues

**Problem**: `sui: command not found`

```bash
# Install Sui CLI
cargo install --locked --git https://github.com/MystenLabs/sui.git --branch main sui
```

**Problem**: `npm install` fails

```bash
# Clear cache and retry
rm -rf node_modules package-lock.json
npm install
```

**Problem**: Move build fails

```bash
# Clean and rebuild
cd move
sui move clean
sui move build
```

### Runtime Issues

**Problem**: Transaction fails with "Insufficient gas"

```bash
# Get more testnet SUI
sui client faucet
```

**Problem**: API won't start

```bash
# Check port availability
lsof -i :3000

# Use different port
PORT=3001 npm run dev
```

**Problem**: TypeScript errors

```bash
# Rebuild from scratch
rm -rf dist
npm run build
```

## 📚 Additional Resources

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Production deployment
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Technical architecture
- [Sui Documentation](https://docs.sui.io/)
- [Walrus Documentation](https://docs.wal.app/)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Make changes
4. Test thoroughly
5. Commit (`git commit -m 'Add amazing feature'`)
6. Push (`git push origin feature/amazing-feature`)
7. Open Pull Request

## 📝 License

MIT License - see LICENSE file for details

## 💡 Tips

- Use `./scripts/build-all.sh` to ensure everything is built correctly
- Run `./scripts/demo.sh` to verify the complete flow works
- Check `deployed-package-id.txt` for your deployed contract address
- Use the interactive frontend demo for presentations
- Monitor Sui transactions at https://suiscan.xyz/testnet

## 🎯 Next Steps

After building:

1. **Test locally**: Run `./scripts/demo.sh`
2. **Deploy testnet**: Run `./scripts/deploy.sh`
3. **Integrate game**: Use game SDK in your game client
4. **Launch API**: Deploy API to cloud (Vercel, Railway, etc.)
5. **Go live**: Switch to mainnet configuration

Happy building! 🚀
