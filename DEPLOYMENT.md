# 🚀 ProofPlay Deployment Guide

Complete step-by-step guide to deploy and run ProofPlay on Sui and Walrus.

## 📋 Prerequisites

- Node.js 18+ and npm
- Sui CLI (`sui`)
- Walrus CLI (optional, for production)
- Git

## 🔧 Installation

### 1. Install Dependencies

```bash
# Install Sui CLI
cargo install --locked --git https://github.com/MystenLabs/sui.git --branch main sui

# Verify installation
sui --version

# Install Node dependencies for game SDK
cd game-sdk
npm install

# Install Node dependencies for API
cd ../api
npm install
```

### 2. Set Up Sui Wallet

```bash
# Create new Sui address
sui client new-address ed25519

# Set active address
sui client active-address

# Get testnet tokens
sui client faucet

# Verify balance
sui client gas
```

### 3. Configure Environment

Create `.env` file in the project root:

```env
# Sui Configuration
SUI_NETWORK=testnet
SUI_PACKAGE_ID=<your_package_id_after_publishing>

# Walrus Configuration
WALRUS_PUBLISHER_URL=https://publisher.walrus-testnet.walrus.space
WALRUS_AGGREGATOR_URL=https://aggregator.walrus-testnet.walrus.space

# API Configuration
API_PORT=3000
```

## 📦 Deploy Smart Contracts

### 1. Build Move Contracts

```bash
cd move
sui move build
```

### 2. Test Contracts (Optional)

```bash
sui move test
```

### 3. Publish to Sui Testnet

```bash
sui client publish --gas-budget 100000000
```

Save the **Package ID** from the output and update your `.env` file.

### 4. Verify Deployment

```bash
# Check if package exists
sui client object <PACKAGE_ID>
```

## 🎮 Run the Demo

### Option 1: Quick Demo (Mock Mode)

Run the mock game client without real blockchain interaction:

```bash
cd game-sdk
npm run demo
```

This will:
- Simulate 3 PvP matches
- Generate cryptographic proofs
- Mock Walrus uploads
- Display statistics

### Option 2: Full Demo (with API)

#### Terminal 1: Start API Server

```bash
cd api
npm run dev
```

API will be available at `http://localhost:3000`

#### Terminal 2: Open Frontend Demo

```bash
cd client
# Open index.html in your browser
python3 -m http.server 8080
# or
npx serve .
```

Visit `http://localhost:8080` to see the interactive demo.

#### Terminal 3: Run Game Client (Optional)

```bash
cd game-sdk
npm run dev
```

## 🔗 Walrus Integration (Production)

### 1. Install Walrus CLI

```bash
# Download Walrus CLI
curl -o walrus https://download.walrus.space/walrus-cli-testnet
chmod +x walrus
sudo mv walrus /usr/local/bin/
```

### 2. Configure Walrus

```bash
# Initialize Walrus configuration
walrus init

# Test upload
echo "test" > test.txt
walrus store test.txt --epochs 5
```

### 3. Upload Proof to Walrus

```bash
# Using CLI
walrus store proof.json --epochs 5

# Using HTTP API
curl -X PUT "https://publisher.walrus-testnet.walrus.space/v1/blobs?epochs=5" \
  --upload-file proof.json
```

## 📊 Testing the Complete Flow

### 1. Submit a Proof

```bash
cd game-sdk
node -e "
const { MockGameClient } = require('./dist/mock-game-client');
const client = new MockGameClient({
  gameId: 'CS2',
  playerAddress: '0x123...',
  autoSubmit: true
});
client.playMatch();
"
```

### 2. Query via API

```bash
# Get all proofs
curl http://localhost:3000/api/v1/proofs

# Get specific proof
curl http://localhost:3000/api/v1/proof/match_001

# Query with payment (mock)
curl -X POST http://localhost:3000/api/v1/query \
  -H "Content-Type: application/json" \
  -d '{
    "matchId": "match_001",
    "queryType": "full",
    "paymentTxHash": "0xabc..."
  }'
```

## 🎯 Production Deployment

### 1. Deploy API to Cloud

#### Using Vercel/Netlify

```bash
cd api
npm run build

# Deploy to Vercel
vercel deploy

# Or deploy to Railway
railway up
```

#### Using Docker

```bash
# Build Docker image
docker build -t proofplay-api .

# Run container
docker run -p 3000:3000 -e SUI_NETWORK=testnet proofplay-api
```

### 2. Deploy Frontend

```bash
cd client

# Deploy to Vercel
vercel deploy

# Or upload to IPFS/Walrus Sites
# Follow: https://docs.wal.app/walrus-sites/intro.html
```

### 3. Configure DNS & SSL

- Point your domain to the deployed API
- Enable HTTPS via your hosting provider
- Update CORS settings in API

## 🔐 Security Considerations

### Smart Contract Security

1. **Audit Contracts**: Get professional audit before mainnet
2. **Access Control**: Verify admin functions are properly protected
3. **Payment Verification**: Ensure query payments are validated on-chain

### API Security

1. **Rate Limiting**: Add rate limiting to prevent abuse
```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

2. **Authentication**: Add API keys for production
3. **Input Validation**: Validate all inputs

### Walrus Security

1. **Blob Verification**: Always verify blob hashes
2. **Access Control**: Use Seal for sensitive data
3. **Redundancy**: Store critical data with higher epoch count

## 📈 Monitoring & Analytics

### 1. Set Up Monitoring

```bash
# Install monitoring dependencies
npm install @sentry/node prom-client

# Add to API server
const Sentry = require("@sentry/node");
Sentry.init({ dsn: "your-dsn" });
```

### 2. Track Metrics

- Total proofs submitted
- Query volume
- Revenue generated
- Response times
- Error rates

### 3. Sui Network Monitoring

```bash
# Check transaction status
sui client tx-block <TX_HASH>

# Monitor events
sui client events --package <PACKAGE_ID>
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Insufficient Gas

```bash
# Get more testnet SUI
sui client faucet
```

#### 2. Move Build Errors

```bash
# Clean build
cd move
sui move clean
sui move build
```

#### 3. Walrus Upload Fails

- Check network connectivity
- Verify file size (< 10 MiB for testnet)
- Try different publisher endpoint

#### 4. API Connection Issues

```bash
# Check if API is running
curl http://localhost:3000/health

# Check logs
cd api
npm run dev
```

## 📚 Additional Resources

- [Sui Documentation](https://docs.sui.io/)
- [Walrus Documentation](https://docs.wal.app/)
- [Move Language Book](https://move-book.com/)
- [ProofPlay GitHub Issues](https://github.com/yourusername/proofplay/issues)

## 🎓 Next Steps

1. **Integrate Real Game**: Connect actual game client
2. **Add Seal Validation**: Implement TEE-based proof verification
3. **Deploy to Mainnet**: Follow mainnet deployment checklist
4. **Partner with Prediction Markets**: Integrate with existing platforms
5. **Add More Games**: Expand to multiple game titles

## 💡 Tips for Hackathon Demo

1. **Record Demo Video**: Show complete flow
2. **Prepare Live Demo**: Have backup in case of network issues
3. **Showcase Stats**: Highlight scalability and revenue potential
4. **Explain Architecture**: Use diagrams to show data flow
5. **Demonstrate Queries**: Show prediction market perspective

## 📞 Support

- Discord: [Sui Discord](https://discord.gg/sui)
- Email: support@proofplay.io
- GitHub: [ProofPlay Issues](https://github.com/yourusername/proofplay/issues)
