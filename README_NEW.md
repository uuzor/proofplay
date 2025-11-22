# 🎮 ProofPlay

**Decentralized Gaming Oracle & Prediction Market Data Layer**

> Built on Sui, Walrus, Seal, and Nautilus

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Sui](https://img.shields.io/badge/Sui-Blockchain-blue)](https://sui.io)
[![Walrus](https://img.shields.io/badge/Walrus-Storage-green)](https://walrus.storage)

## 🌟 What is ProofPlay?

ProofPlay is a decentralized gaming oracle that allows players to submit cryptographically verified proofs of their match results, stores them immutably on Walrus, and enables prediction markets to query this data while fairly compensating data providers (players).

### The Problem

- **Prediction markets** need reliable game outcome data
- **No trustless way** to verify match results
- **Centralized APIs** can be manipulated
- **Players** have no incentive to provide data

### The Solution

```
Player Completes Match
        ↓
Generate Cryptographic Proof
        ↓
Store on Walrus (Immutable)
        ↓
Record on Sui Blockchain
        ↓
Prediction Markets Query Data
        ↓
Revenue Distributed to Players
```

## ✨ Key Features

- 🔐 **Cryptographically Verified Proofs** - SHA256 hashing + digital signatures
- 🦭 **Immutable Storage** - Walrus decentralized storage
- ⛓️ **On-Chain Records** - Sui blockchain for transparency
- 💰 **Revenue Sharing** - 70% to players, 20% protocol, 10% validators
- 🔍 **Query API** - Easy integration for prediction markets
- 📊 **Real-time Stats** - Player analytics and match history
- 🎮 **Game Agnostic** - Works with any PvP game

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Sui CLI
- Git

### Run Demo in 30 Seconds

```bash
git clone <repo-url>
cd proofplay
./scripts/demo.sh
```

This will:
- ✓ Install dependencies
- ✓ Build TypeScript
- ✓ Simulate 3 matches
- ✓ Generate proofs
- ✓ Show complete flow

### Interactive Frontend Demo

```bash
cd client
python3 -m http.server 8080
open http://localhost:8080
```

## 📦 Installation

### 1. Install Sui CLI

```bash
cargo install --locked --git https://github.com/MystenLabs/sui.git --branch main sui
```

### 2. Build All Components

```bash
./scripts/build-all.sh
```

### 3. Deploy to Testnet

```bash
# Set up wallet and get testnet tokens
sui client new-address ed25519
sui client faucet

# Deploy contracts
./scripts/deploy.sh
```

See [BUILD_GUIDE.md](./BUILD_GUIDE.md) for detailed instructions.

## 🏗️ Architecture

### Tech Stack

- **Sui Move** - Smart contracts for proof submission, verification, and payments
- **Walrus** - Decentralized storage for match proofs and replay data
- **Seal** - TEE-based validation (planned)
- **Nautilus** - Off-chain indexing and queries (planned)
- **TypeScript** - Game SDK and API server

### Components

```
┌─────────────────┐
│   Game Client   │  Generates match proofs
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Walrus SDK    │  Uploads to decentralized storage
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Sui Contract   │  Records proof metadata on-chain
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Query API     │  Provides data to prediction markets
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Prediction Mkt  │  Queries and pays for data
└─────────────────┘
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for technical details.

## 💡 How It Works

### For Players

1. **Play Your Game** - Complete a PvP match
2. **Auto Submit** - Game client generates and submits proof
3. **Earn Revenue** - Get paid each time your data is queried
4. **Passive Income** - Past matches continue earning

### For Prediction Markets

1. **Query Match Data** - Request verified match outcomes
2. **Pay Per Query** - 0.05 SUI per query
3. **Get Verified Data** - Cryptographically proven results
4. **Build Markets** - Create prediction markets with confidence

### For Game Developers

1. **Integrate SDK** - Add ProofPlay to your game
2. **Enable Players** - Let players earn from gameplay
3. **Marketing Benefit** - "Play to Earn" without tokens
4. **Anti-Cheat** - Verifiable game state

## 📊 Economics

### Revenue Distribution

For each 0.05 SUI query:
- 💰 **0.035 SUI (70%)** → Data Provider (Player)
- 🏛️ **0.010 SUI (20%)** → Protocol Treasury
- ✅ **0.005 SUI (10%)** → Validators

### Market Opportunity

- **Gaming Market**: $388B by 2033
- **Esports Market**: $25.4B by 2035
- **Prediction Markets**: Growing rapidly (Polymarket $3.6B volume in 2024)

### At Scale (1 Year Projection)

- 100,000 active players
- 10,000 matches/day
- 1M queries/month
- **~$350K monthly revenue** (shared with community)

## 🎯 Use Cases

### 1. Esports Prediction Markets

```
"Will Team Liquid beat FaZe in CS2 Finals?"
→ ProofPlay provides verified match outcome
→ Prediction market settles with proof
```

### 2. Player Performance Betting

```
"Will s1mple get 25+ kills in next match?"
→ Real-time verified stats from ProofPlay
→ Automatic settlement based on proof
```

### 3. Gaming Achievement NFTs

```
"Mint NFT for 100 wins in Valorant"
→ ProofPlay verifies historical wins
→ NFT minted with proof of achievement
```

### 4. Anti-Cheat Verification

```
Game developer wants anti-cheat system
→ Players submit cryptographic game state
→ ProofPlay validates authenticity
```

## 🛠️ API Reference

### Submit Proof

```typescript
// Submit match proof to blockchain
await proofplay.submit_proof({
  gameId: "CS2",
  matchId: "match_12345",
  opponentAddress: "0x...",
  outcome: 1, // win
  kills: 25,
  deaths: 18,
  score: 8500,
  walrusBlobId: "blob_abc...",
});
```

### Query Match Data

```typescript
// Query verified match data
const response = await fetch('http://api.proofplay.io/v1/query', {
  method: 'POST',
  body: JSON.stringify({
    matchId: "match_12345",
    queryType: "full",
    paymentTxHash: "0x..."
  })
});
```

See full API documentation in [DEPLOYMENT.md](./DEPLOYMENT.md).

## 📈 Roadmap

### Phase 1: MVP (Current)
- ✅ Core smart contracts
- ✅ Walrus integration
- ✅ Mock game client
- ✅ Query API
- ✅ Frontend demo

### Phase 2: Enhanced Verification (Q1 2025)
- [ ] Seal TEE validation
- [ ] Multi-signature verification
- [ ] Opponent proof consensus
- [ ] Real game integration (CS2/Valorant)

### Phase 3: Scale & Partnerships (Q2 2025)
- [ ] Nautilus indexing
- [ ] 10+ game integrations
- [ ] Prediction market partnerships
- [ ] Mobile SDK

### Phase 4: Ecosystem (Q3-Q4 2025)
- [ ] Achievement NFTs
- [ ] Reputation system
- [ ] Analytics dashboard
- [ ] Mainnet launch

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### Development Setup

```bash
# Fork and clone
git clone https://github.com/yourusername/proofplay
cd proofplay

# Install dependencies
./scripts/build-all.sh

# Run tests
cd move && sui move test
cd ../game-sdk && npm test

# Submit PR
git checkout -b feature/amazing-feature
git commit -m "Add amazing feature"
git push origin feature/amazing-feature
```

## 📚 Documentation

- [BUILD_GUIDE.md](./BUILD_GUIDE.md) - Complete build instructions
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Production deployment guide
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Technical architecture
- [API.md](./API.md) - API reference (coming soon)

## 🔗 Links

- **Website**: [proofplay.io](https://proofplay.io) (coming soon)
- **Discord**: [Join Community](https://discord.gg/proofplay)
- **Twitter**: [@ProofPlayHQ](https://twitter.com/proofplayhq)
- **Docs**: [docs.proofplay.io](https://docs.proofplay.io)

## 🏆 Hackathon Submission

### Built For

- **Sui x Walrus Haulout Hackathon**
- **Track**: Gaming & Prediction Markets
- **Technologies**: Sui, Walrus, Seal, Nautilus

### Demo Video

[Watch Demo Video](https://youtube.com/watch?v=...) (coming soon)

### Live Demo

[Try Interactive Demo](https://demo.proofplay.io) (coming soon)

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

## 🙏 Acknowledgments

- Mysten Labs for Sui, Walrus, and Seal
- Sui Foundation
- Open source community

## 💬 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/proofplay/issues)
- **Discord**: [ProofPlay Community](https://discord.gg/proofplay)
- **Email**: support@proofplay.io

---

**Built with ❤️ by the ProofPlay team**

*Making gaming data verifiable, valuable, and accessible to all*
