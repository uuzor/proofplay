# 🏗️ ProofPlay Technical Architecture

Comprehensive technical architecture and design documentation for ProofPlay.

## 🎯 System Overview

ProofPlay is a decentralized gaming oracle that enables players to submit verifiable proofs of match results, stores them on Walrus, and allows prediction markets to query this data while distributing revenue to data providers.

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Game      │─────▶│  ProofPlay   │─────▶│   Walrus    │
│   Client    │      │  Smart       │      │  Storage    │
│             │      │  Contract    │      │             │
└─────────────┘      └──────────────┘      └─────────────┘
       │                     │                      │
       │                     │                      │
       ▼                     ▼                      ▼
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│  Generate   │      │   Verify     │      │   Store     │
│  Proof      │      │   & Record   │      │   Proof     │
└─────────────┘      └──────────────┘      └─────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │  Prediction  │
                     │   Markets    │
                     │  Query Data  │
                     └──────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │   Revenue    │
                     │ Distribution │
                     └──────────────┘
```

## 📦 Component Architecture

### 1. Smart Contract Layer (Sui Move)

#### Core Modules

**proofplay.move**
- Main oracle contract
- Handles proof submission and verification
- Manages queries and payments
- Distributes revenue

**walrus_integration.move**
- Walrus storage integration
- Blob management
- Metadata tracking

#### Key Data Structures

```move
struct GameProof {
    id: UID,
    game_id: String,
    match_id: String,
    player_address: address,
    opponent_address: address,
    outcome: u8,              // 0=loss, 1=win, 2=draw
    kills: u64,
    deaths: u64,
    score: u64,
    timestamp: u64,
    walrus_blob_id: String,   // Reference to Walrus
    verified: bool,
    verifier: address,
}

struct ProofRegistry {
    id: UID,
    proofs: Table<String, ID>,
    proof_count: u64,
    total_queries: u64,
    revenue_pool: Balance<SUI>,
}

struct DataQuery {
    id: UID,
    consumer: address,
    match_id: String,
    query_type: u8,
    payment: u64,
    timestamp: u64,
}
```

#### Key Functions

**submit_proof()**
- Validates match data
- Creates GameProof object
- Stores blob reference
- Emits ProofSubmitted event

**verify_proof()**
- Validates cryptographic proof
- Marks proof as verified
- Emits ProofVerified event

**query_data()**
- Accepts payment
- Returns proof data
- Distributes revenue
- Emits DataQueried event

**distribute_query_revenue()**
- Splits payment 70/20/10
- Pays data provider
- Retains protocol fee
- Updates earnings

### 2. Storage Layer (Walrus)

#### Data Types Stored

**Match Proofs (JSON)**
```json
{
  "matchData": {
    "gameId": "CS2",
    "matchId": "match_123",
    "playerAddress": "0x...",
    "outcome": 1,
    "kills": 25,
    "deaths": 18,
    "score": 8500
  },
  "proofHash": "sha256_hash",
  "signature": "cryptographic_signature",
  "metadata": {
    "version": "1.0.0",
    "algorithm": "SHA256",
    "generatedAt": 1234567890
  }
}
```

**Replay Files (Binary)**
- Full game replay data
- Video recordings
- Server logs
- Anti-cheat data

#### Storage Strategy

- **Proofs**: 5 epochs minimum (~5 days)
- **Replays**: 10 epochs for important matches
- **Historical Data**: Extended storage for high-value matches
- **Redundancy**: Multiple blob copies for critical data

### 3. Game SDK Layer

#### Proof Generation

```typescript
class ProofGenerator {
  generateMockMatch() → MatchData
  generateProof(matchData) → GameProof
  verifyProof(proof) → boolean
  serializeProof(proof) → Uint8Array
}
```

#### Proof Structure

1. **Match Data**: Raw game results
2. **Hash**: SHA256 of match data
3. **Signature**: Cryptographic signature (player's key)
4. **Metadata**: Version, algorithm, timestamp

#### Validation

- Hash integrity check
- Signature verification
- Timestamp validation
- Anti-replay protection

### 4. Walrus Uploader

#### Upload Flow

```typescript
class WalrusUploader {
  uploadProof(data: Uint8Array) → Promise<UploadResult>
  downloadProof(blobId: string) → Promise<Uint8Array>
  getDownloadUrl(blobId: string) → string
}
```

#### Upload Process

1. Serialize proof to JSON
2. Convert to Uint8Array
3. HTTP PUT to Walrus publisher
4. Extract blob ID from response
5. Return blob metadata

#### HTTP API Integration

```bash
PUT https://publisher.walrus-testnet.walrus.space/v1/blobs?epochs=5
Content-Type: application/json
Body: <proof_data>

Response:
{
  "newlyCreated": {
    "blobObject": {
      "blobId": "abc123...",
      "size": 1234
    }
  }
}
```

### 5. Query API Layer

#### Endpoints

**GET /api/v1/proof/:matchId**
- Returns specific proof data
- Free access (for testing)

**POST /api/v1/query**
- Paid query endpoint
- Verifies payment on-chain
- Returns detailed data
- Records query for revenue distribution

**GET /api/v1/player/:address/stats**
- Player statistics
- Win rate, K/D ratio
- Historical performance

#### Query Types

1. **outcome**: Basic win/loss/draw
2. **stats**: Kills, deaths, score
3. **full**: Complete match data + Walrus blob ID

#### Payment Verification

```typescript
async function verifyPayment(txHash: string) {
  // Query Sui blockchain
  const tx = await suiClient.getTransactionBlock(txHash);

  // Verify:
  // 1. Transaction succeeded
  // 2. Correct amount (0.05 SUI)
  // 3. Correct recipient (oracle address)
  // 4. Recent timestamp

  return isValid;
}
```

### 6. Frontend Demo

#### Architecture

- **Pure HTML/CSS/JS**: No build step required
- **Mock Mode**: Simulates blockchain interactions
- **Real-time Updates**: Live statistics and logs
- **Interactive**: Play matches, query data

#### Features

- Match simulation
- Proof generation visualization
- Walrus upload simulation
- Blockchain submission tracking
- Revenue calculation
- Match history
- Statistics dashboard

## 🔄 Data Flow

### Submit Proof Flow

```
1. Game Client
   ├─ Player completes match
   ├─ Generate match data
   └─ Create cryptographic proof
        │
2. Walrus Upload
   ├─ Serialize proof
   ├─ Upload to Walrus
   └─ Receive blob ID
        │
3. Smart Contract
   ├─ Submit transaction
   ├─ Store proof metadata
   ├─ Emit ProofSubmitted event
   └─ Create shared GameProof object
```

### Query Data Flow

```
1. Prediction Market
   ├─ Request match data
   └─ Submit payment (0.05 SUI)
        │
2. Smart Contract
   ├─ Verify payment
   ├─ Check proof exists
   ├─ Retrieve proof metadata
   └─ Return Walrus blob ID
        │
3. Walrus Retrieval
   ├─ Download proof data
   ├─ Verify integrity
   └─ Return to consumer
        │
4. Revenue Distribution
   ├─ 70% to data provider (player)
   ├─ 20% to protocol treasury
   └─ 10% to validators
```

## 🔐 Security Architecture

### Proof Integrity

1. **Cryptographic Hash**: SHA256 of match data
2. **Digital Signature**: Signed by player's private key
3. **Immutable Storage**: Walrus ensures data cannot be modified
4. **Blockchain Record**: Permanent on-chain reference

### Attack Vectors & Mitigations

#### 1. Fake Proof Submission
- **Risk**: Player submits false match results
- **Mitigation**: Seal validation, cross-verification with opponent

#### 2. Replay Attacks
- **Risk**: Resubmit old proofs
- **Mitigation**: Timestamp checking, unique match IDs

#### 3. Payment Evasion
- **Risk**: Query without paying
- **Mitigation**: On-chain payment verification

#### 4. Blob Tampering
- **Risk**: Modify stored proof
- **Mitigation**: Walrus immutability, hash verification

### Access Control

```move
// Only player can submit their own proofs
assert!(tx_context::sender(ctx) == player_address, E_NOT_AUTHORIZED);

// Only verified proofs can be queried
assert!(proof.verified, E_INVALID_PROOF);

// Only admin can withdraw protocol fees
public entry fun withdraw_protocol_earnings(_admin: &AdminCap, ...)
```

## 📊 Economic Model

### Revenue Streams

**1. Data Queries**
- Price: 0.05 SUI per query
- Volume: Est. 1M queries/day at scale
- Daily Revenue: 50,000 SUI (~$50,000)

**2. Subscriptions (Future)**
- Real-time data feeds
- Bulk query packages
- API access tiers

**3. Premium Features (Future)**
- Extended storage
- Priority verification
- Analytics dashboard

### Revenue Distribution

```
Query Payment: 0.05 SUI
├─ 70% (0.035 SUI) → Data Provider (Player)
├─ 20% (0.010 SUI) → Protocol Treasury
└─ 10% (0.005 SUI) → Validators
```

### Incentive Alignment

- **Players**: Earn passive income from gameplay
- **Prediction Markets**: Access verified data
- **Protocol**: Revenue from query fees
- **Validators**: Rewarded for verification

## 🚀 Scalability

### Current Capacity (MVP)

- **Proofs/Second**: ~100 (Sui TPS limit)
- **Storage**: Unlimited (Walrus)
- **Queries/Second**: 1000+ (API)

### Scaling Strategies

**Horizontal Scaling**
- Multiple API instances
- Load balancer
- CDN for static content

**Sui Scaling**
- Batch proof submissions
- Off-chain indexing (Nautilus)
- Layer 2 aggregation (future)

**Walrus Optimization**
- Blob compression
- Dedupe similar proofs
- Tiered storage (hot/cold)

### Performance Targets (1 Year)

- 10,000 proofs/day
- 1M queries/month
- 100,000 active players
- 10 integrated games

## 🔮 Future Enhancements

### Phase 2: Enhanced Verification

- **Seal Integration**: TEE-based validation
- **Multi-signature**: Require opponent verification
- **AI Detection**: Anti-cheat via machine learning

### Phase 3: Advanced Features

- **Real-time Feeds**: WebSocket streaming
- **Historical Analytics**: Time-series queries
- **NFT Achievements**: Verifiable gaming milestones

### Phase 4: Ecosystem Expansion

- **Game Studio SDK**: Easy integration
- **Prediction Market Plugins**: Turnkey solutions
- **Mobile App**: iOS/Android clients

## 📈 Monitoring & Observability

### Key Metrics

**On-Chain**
- Proof submission rate
- Query volume
- Revenue generated
- Active players

**Off-Chain**
- API response times
- Walrus upload success rate
- Error rates
- Cache hit ratio

### Logging

```typescript
// Structured logging
logger.info('proof_submitted', {
  matchId: match.id,
  gameId: match.game,
  blobId: walrus.blobId,
  txHash: sui.txHash,
});
```

### Alerts

- Failed proof submissions
- Payment verification errors
- Walrus upload failures
- API downtime

## 🧪 Testing Strategy

### Unit Tests

- Move contract functions
- Proof generation logic
- Walrus upload/download
- Revenue calculation

### Integration Tests

- End-to-end proof submission
- Query payment flow
- Multi-player scenarios

### Load Tests

- Concurrent proof submissions
- High-volume queries
- Storage limits

## 📚 API Reference

See [API.md](./API.md) for complete API documentation.

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines.
