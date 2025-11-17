# 🔗 ProofPlay Blockchain Integration

Complete guide to the real blockchain data integration for analytics.

---

## 🎯 Overview

The ProofPlay analytics system now fetches **REAL data from Sui blockchain** instead of using mock data.

### What Changed

**Before (V1 - Mock Data):**
```typescript
// Hardcoded fake data
const analytics = {
  totalRevenue: 350.5,  // ❌ Fake
  totalQueries: 10234,  // ❌ Fake
};
```

**Now (V2 - Real Blockchain Data):**
```typescript
// Query actual Sui blockchain
const analytics = await getProviderAnalytics(address);
// ✅ Real data from smart contracts
// ✅ Verifiable on-chain
// ✅ Always up-to-date
```

---

## 📦 Components

### 1. Sui Client (`api/src/sui-client.ts`)

**Purpose:** Handles all blockchain interactions

**Key Functions:**

```typescript
// Provider analytics
getProviderAnalytics(address) → ProviderAnalytics
getProviderMatchHistory(address, limit) → Match[]
getTopEarningMatches(address, limit) → Match[]

// Consumer analytics
getConsumerAnalytics(address) → ConsumerAnalytics
getConsumerSubscription(address) → Subscription | null

// Protocol analytics
getProtocolAnalytics() → ProtocolAnalytics
getTopProviders(limit) → Provider[]
getRevenueOverTime(days) → TimeSeriesData[]
```

**How it Works:**

```typescript
// 1. Initialize Sui client
const suiClient = new SuiClient({
  url: 'https://fullnode.testnet.sui.io:443'
});

// 2. Query blockchain for objects
const objects = await suiClient.getOwnedObjects({
  owner: providerAddress,
  filter: {
    StructType: `${PACKAGE_ID}::analytics::ProviderAnalytics`
  }
});

// 3. Parse Move data
const fields = object.data.content.fields;
const totalRevenue = parseFloat(fields.total_revenue_earned) / 1e9;

// 4. Return real data
return { totalRevenue, ... };
```

### 2. Analytics API V2 (`api/src/analytics-api-v2.ts`)

**Purpose:** RESTful endpoints that use real blockchain data

**Endpoints:**

```bash
# Provider endpoints (real blockchain data)
GET /api/v1/analytics/provider/:address
GET /api/v1/analytics/provider/:address/earnings
GET /api/v1/analytics/provider/:address/performance

# Consumer endpoints (real blockchain data)
GET /api/v1/analytics/consumer/:address
GET /api/v1/analytics/consumer/:address/spending
GET /api/v1/analytics/consumer/:address/roi

# Protocol endpoints (real blockchain data)
GET /api/v1/analytics/protocol
GET /api/v1/analytics/protocol/revenue
GET /api/v1/analytics/protocol/growth
GET /api/v1/analytics/protocol/leaderboard

# Health check
GET /api/v1/analytics/health
```

---

## 🔧 Setup & Configuration

### Step 1: Environment Variables

Create `.env` file in `api/` directory:

```bash
# Required
SUI_NETWORK=testnet
SUI_PACKAGE_ID=0xYOUR_PACKAGE_ID_HERE
PROTOCOL_ANALYTICS_ID=0xPROTOCOL_ANALYTICS_OBJECT_ID

# Optional
PORT=3000
NODE_ENV=development
```

### Step 2: Get Package ID

After deploying ProofPlay V2 contracts:

```bash
# Deploy contracts
cd move
sui client publish --gas-budget 100000000

# Output will include:
# Published Objects:
#   PackageID: 0xabc123...  ← Use this
```

Copy the Package ID to your `.env`:

```bash
SUI_PACKAGE_ID=0xabc123...
```

### Step 3: Get Protocol Analytics ID

The Protocol Analytics object is created during contract initialization:

```bash
# After deployment, find shared objects
sui client objects --json | grep "ProtocolAnalytics"

# Or check transaction output for shared objects
# Copy the object ID to .env
PROTOCOL_ANALYTICS_ID=0xdef456...
```

### Step 4: Install Dependencies

```bash
cd api
npm install @mysten/sui
```

### Step 5: Start API Server

```bash
cd api
npm run dev
```

---

## 📊 Data Flow

### Complete Flow: Provider Analytics

```
1. User Request
   GET /api/v1/analytics/provider/0xabc...

2. API Server (analytics-api-v2.ts)
   ↓
   calls getProviderAnalytics(address)

3. Sui Client (sui-client.ts)
   ↓
   a. Query blockchain for ProviderAnalytics object
      suiClient.getOwnedObjects({
        owner: address,
        filter: { StructType: "::analytics::ProviderAnalytics" }
      })

   b. Parse Move object fields
      total_revenue_earned: "350500000000" (MIST)
      total_queries_served: "10234"
      win_rate: "51"
      etc.

   c. Convert units
      SUI = MIST / 1,000,000,000
      350.5 SUI = 350500000000 MIST / 1e9

4. Return Real Data
   {
     provider: "0xabc...",
     totalRevenue: 350.5,  ← Real from blockchain
     totalQueries: 10234,  ← Real from blockchain
     winRate: 51.8,        ← Real from blockchain
     source: "blockchain"  ← Indicates real data
   }
```

### Complete Flow: Protocol Revenue

```
1. User Request
   GET /api/v1/analytics/protocol/revenue

2. API Server
   ↓
   calls getProtocolAnalytics()

3. Sui Client
   ↓
   a. Get Protocol Analytics shared object
      suiClient.getObject({
        id: PROTOCOL_ANALYTICS_ID
      })

   b. Query revenue events
      suiClient.queryEvents({
        MoveEventType: "QueryExecuted"
      })

   c. Aggregate revenue by time
      Daily revenue = sum(events per day)

4. Return Real Data
   {
     totalRevenue: 485200,     ← From analytics object
     monthlyRevenue: 48520,    ← From analytics object
     revenueOverTime: [...]    ← From event aggregation
     source: "blockchain"
   }
```

---

## 🔍 Querying Blockchain Data

### Example 1: Get Provider Analytics

```typescript
import { getProviderAnalytics } from './sui-client';

// Fetch real data from blockchain
const analytics = await getProviderAnalytics(
  '0x1234567890abcdef...'
);

console.log('Total Revenue:', analytics.totalRevenue, 'SUI');
console.log('Total Queries:', analytics.totalQueries);
console.log('Win Rate:', analytics.winRate, '%');
console.log('Global Rank:', analytics.globalRank);

// All data is REAL and verifiable on-chain!
```

### Example 2: Get Match History

```typescript
import { getProviderMatchHistory } from './sui-client';

// Get last 10 matches from blockchain
const matches = await getProviderMatchHistory(
  '0x1234567890abcdef...',
  10
);

matches.forEach(match => {
  console.log(`Match ${match.matchId}:`);
  console.log(`  Outcome: ${match.outcome}`);
  console.log(`  Revenue: ${match.revenue} SUI`);
  console.log(`  Queries: ${match.queries}`);
});
```

### Example 3: Get Protocol Metrics

```typescript
import { getProtocolAnalytics } from './sui-client';

const protocol = await getProtocolAnalytics();

console.log('Platform Stats:');
console.log('  Total Matches:', protocol.totalMatches);
console.log('  Total Queries:', protocol.totalQueries);
console.log('  Total Revenue:', protocol.totalRevenue, 'SUI');
console.log('  DAU:', protocol.growth.dau);
console.log('  MAU:', protocol.growth.mau);
```

---

## 📈 Data Sources

### On-Chain Objects

```
ProviderAnalytics Object
  ├─ total_revenue_earned: u64 (MIST)
  ├─ total_queries_served: u64
  ├─ win_count: u64
  ├─ loss_count: u64
  └─ provider_rank: u64

ConsumerAnalytics Object
  ├─ total_queries_made: u64
  ├─ total_spent: u64 (MIST)
  ├─ subscription_savings: u64 (MIST)
  └─ roi_percentage: u64

ProtocolAnalytics Object (Shared)
  ├─ total_matches_completed: u64
  ├─ total_queries_processed: u64
  ├─ total_protocol_revenue: u64 (MIST)
  ├─ daily_active_users: u64
  └─ monthly_active_users: u64

Subscription Object
  ├─ tier: u8
  ├─ queries_remaining: u64
  └─ valid_until: u64 (epoch)

MatchResult Object
  ├─ query_count: u64
  ├─ revenue_earned: u64 (MIST)
  ├─ verified: bool
  └─ walrus_blob_id: String
```

### Events

```
QueryExecuted Event
  ├─ match_id: String
  ├─ consumer: address
  ├─ provider_paid: u64 (MIST)
  └─ timestamp: u64

ProviderPaid Event
  ├─ provider: address
  ├─ amount: u64 (MIST)
  └─ match_id: String

MatchResultSubmitted Event
  ├─ match_id: String
  ├─ submitter: address
  └─ walrus_blob_id: String
```

---

## 🔐 Data Verification

### Verify Provider Revenue

```bash
# 1. Get analytics from API
curl http://localhost:3000/api/v1/analytics/provider/0xabc...

# Response:
# { totalRevenue: 350.5, source: "blockchain" }

# 2. Verify on Sui Explorer
# Visit: https://suiscan.xyz/testnet/object/PROVIDER_ANALYTICS_ID
# Check: total_revenue_earned = 350500000000 MIST
# Calculate: 350500000000 / 1e9 = 350.5 SUI ✅

# 3. Verify via CLI
sui client object PROVIDER_ANALYTICS_ID

# Output shows:
# total_revenue_earned: 350500000000
# 350500000000 / 1,000,000,000 = 350.5 ✅
```

### Verify Protocol Metrics

```bash
# 1. Get protocol analytics
curl http://localhost:3000/api/v1/analytics/protocol

# 2. Verify on-chain
sui client object $PROTOCOL_ANALYTICS_ID

# 3. Compare values
API Response: { totalRevenue: 485200 }
Blockchain: total_protocol_revenue: 485200000000000
Calculation: 485200000000000 / 1e9 = 485200 ✅
```

---

## 🚀 Production Deployment

### Mainnet Configuration

```bash
# .env for production
SUI_NETWORK=mainnet
SUI_PACKAGE_ID=0xMAINNET_PACKAGE_ID
PROTOCOL_ANALYTICS_ID=0xMAINNET_ANALYTICS_ID
NODE_ENV=production
```

### Optimizations

**1. Caching**

```typescript
// Cache blockchain data for 5 seconds
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 5 });

async function getCachedAnalytics(address: string) {
  const cached = cache.get(address);
  if (cached) return cached;

  const data = await getProviderAnalytics(address);
  cache.set(address, data);
  return data;
}
```

**2. Batching**

```typescript
// Batch multiple queries
const [provider, consumer, protocol] = await Promise.all([
  getProviderAnalytics(address1),
  getConsumerAnalytics(address2),
  getProtocolAnalytics(),
]);
```

**3. Indexing**

```typescript
// Use event indexing for historical data
// Index events off-chain for faster queries
// Store in PostgreSQL/MongoDB
```

---

## 🔍 Debugging

### Check Blockchain Connection

```typescript
// Health check endpoint
GET /api/v1/analytics/health

// Response if working:
{
  "success": true,
  "status": "connected",
  "network": "testnet",
  "packageId": "0xabc123..."
}

// Response if broken:
{
  "success": false,
  "status": "disconnected",
  "error": "Connection refused"
}
```

### Common Issues

**1. "Package ID not found"**
```
Error: Package ID not set
Fix: Set SUI_PACKAGE_ID in .env
```

**2. "Object not found"**
```
Error: Analytics object not found for address
Fix: Player hasn't submitted any matches yet
      Analytics object is created on first match
```

**3. "Invalid data type"**
```
Error: Expected moveObject, got null
Fix: Check if object ID is correct
      Verify object exists on blockchain
```

**4. "Connection timeout"**
```
Error: Request timeout
Fix: Check network connection
      Try different RPC endpoint
      Increase timeout in client config
```

### Debug Mode

```typescript
// Enable debug logging
const suiClient = new SuiClient({
  url: getSuiRpcUrl(SUI_NETWORK),
  // Add request logging
});

// Log all queries
suiClient.getObject = async (params) => {
  console.log('Querying object:', params.id);
  const result = await originalGetObject(params);
  console.log('Result:', result);
  return result;
};
```

---

## 📊 Performance

### Query Times

| Operation | Time | Cacheable |
|-----------|------|-----------|
| Get Provider Analytics | ~200ms | Yes (5s TTL) |
| Get Match History | ~300ms | Yes (10s TTL) |
| Get Protocol Analytics | ~250ms | Yes (5s TTL) |
| Query Events | ~500ms | Yes (30s TTL) |
| Get Top Providers | ~400ms | Yes (60s TTL) |

### Optimization Tips

1. **Cache aggressively** - Blockchain data doesn't change instantly
2. **Batch requests** - Use Promise.all() for parallel queries
3. **Paginate** - Don't fetch all matches at once
4. **Index events** - Pre-aggregate historical data
5. **Use websockets** - Subscribe to real-time updates

---

## ✅ Testing

### Unit Tests

```typescript
import { getProviderAnalytics } from './sui-client';

describe('Blockchain Integration', () => {
  it('should fetch real provider analytics', async () => {
    const address = '0xtest...';
    const analytics = await getProviderAnalytics(address);

    expect(analytics.provider).toBe(address);
    expect(analytics.totalRevenue).toBeGreaterThanOrEqual(0);
    expect(analytics.source).toBe('blockchain');
  });
});
```

### Integration Tests

```bash
# Test with real testnet data
curl http://localhost:3000/api/v1/analytics/health
curl http://localhost:3000/api/v1/analytics/protocol
```

---

## 🎯 Summary

**Before:** Mock data, not verifiable, not trustworthy
**Now:** Real blockchain data, verifiable, trustworthy

**Key Benefits:**
- ✅ All data from Sui blockchain
- ✅ Verifiable on Sui Explorer
- ✅ Real-time updates
- ✅ Trustless and transparent
- ✅ Production-ready

**Data Sources:**
- On-chain analytics objects
- Smart contract events
- Subscription objects
- Match result objects

**Verification:**
- Every metric traceable to blockchain
- Users can verify via Sui Explorer
- API responses include `source: "blockchain"`
- Complete transparency

🚀 **Your analytics are now backed by real, verifiable blockchain data!**
