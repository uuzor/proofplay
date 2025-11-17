# 🚀 ProofPlay V2 - Implementation Guide

Quick guide to integrate the enhanced V2 features into your application.

---

## 🎯 Quick Summary

**What's New in V2:**
1. **Two-Phase Submission** - Schedule matches before they happen
2. **Direct Provider Payment** - Revenue goes to data provider
3. **Subscription Service** - Bulk query discounts

---

## 📦 Smart Contract Usage

### 1. Two-Phase Match Submission

#### Phase 1: Schedule Match (Before)

```typescript
// Example: Schedule CS2 match for tomorrow
const tx = await client.executeTransaction({
  module: 'proofplay_v2',
  function: 'schedule_match',
  arguments: [
    registryId,
    'match_esl_finals_2024',           // match_id
    'CS2',                              // game_id
    opponentAddress,                    // player_b
    tomorrowEpoch,                      // scheduled_time
  ],
});

// Result: ScheduledMatch object created
// Prediction markets can now see this match
// and create betting pools before it happens
```

#### Phase 2: Submit Results (After)

```typescript
// After match completes
const tx = await client.executeTransaction({
  module: 'proofplay_v2',
  function: 'submit_match_result',
  arguments: [
    registryId,
    scheduledMatchId,                   // Links to scheduled match
    winnerAddress,                      // Who won (or 0x0 for draw)

    // Player A stats
    25,  // kills
    18,  // deaths
    10,  // assists
    8500, // score
    true, // mvp

    // Player B stats
    18,  // kills
    25,  // deaths
    8,   // assists
    6200, // score
    false, // mvp

    walrusBlobId,                       // Full proof on Walrus
    proofHash,                          // SHA256 hash
  ],
});

// Result: MatchResult object created
// Linked to ScheduledMatch
// Ready for queries
```

---

### 2. Pay-Per-View Queries

#### Direct Provider Payment

```typescript
// Query specific match result
const paymentCoin = // 0.05 SUI coin

const tx = await client.executeTransaction({
  module: 'proofplay_v2',
  function: 'query_match_result',
  arguments: [
    registryId,
    matchResultId,                      // Specific match result
    paymentCoin,                        // 0.05 SUI
    queryType,                          // 0=outcome, 1=stats, 2=full
  ],
});

// What happens:
// 1. Payment split:
//    - 0.035 SUI → Match data provider (instant)
//    - 0.010 SUI → Protocol treasury
//    - 0.005 SUI → Validator pool
//
// 2. Stats updated on MatchResult:
//    - query_count += 1
//    - revenue_earned += 0.035 SUI
//
// 3. Event emitted:
//    - QueryExecuted
//    - ProviderPaid
```

**Revenue Tracking:**

```typescript
// Check how much a match has earned
const matchResult = await client.getObject(matchResultId);

console.log('Queries:', matchResult.query_count);
console.log('Revenue:', matchResult.revenue_earned);
console.log('Provider:', matchResult.submitter);

// Example output:
// Queries: 10000
// Revenue: 350 SUI
// Provider: 0xabc...def
```

---

### 3. Subscription Service

#### Create Subscription

```typescript
// Option 1: Basic (5 SUI, 200 queries)
const tx = await client.executeTransaction({
  module: 'proofplay_v2',
  function: 'create_subscription',
  arguments: [
    0,                                  // TIER_BASIC
    paymentCoin,                        // 5 SUI
  ],
});

// Option 2: Pro (20 SUI, 1000 queries)
const tx = await client.executeTransaction({
  module: 'proofplay_v2',
  function: 'create_subscription',
  arguments: [
    1,                                  // TIER_PRO
    paymentCoin,                        // 20 SUI
  ],
});

// Option 3: Enterprise (100 SUI, unlimited)
const tx = await client.executeTransaction({
  module: 'proofplay_v2',
  function: 'create_subscription',
  arguments: [
    2,                                  // TIER_ENTERPRISE
    paymentCoin,                        // 100 SUI
  ],
});

// Result: Subscription object owned by subscriber
```

#### Query with Subscription

```typescript
// No additional payment needed!
const tx = await client.executeTransaction({
  module: 'proofplay_v2',
  function: 'query_with_subscription',
  arguments: [
    registryId,
    matchResultId,
    subscriptionId,                     // Your subscription object
    queryType,
  ],
});

// What happens:
// 1. Subscription verified (valid, not expired)
// 2. Query count decremented
// 3. No payment needed (already paid via subscription)
// 4. Match stats updated
```

**Check Subscription Status:**

```typescript
const subscription = await client.getObject(subscriptionId);

console.log('Tier:', subscription.tier);
console.log('Queries Remaining:', subscription.queries_remaining);
console.log('Valid Until:', subscription.valid_until);
console.log('Total Used:', subscription.total_queries_used);
```

---

## 🎮 Game Client Integration

### Updated SDK Flow

```typescript
import { ProofPlayV2Client } from './proofplay-v2-client';

const client = new ProofPlayV2Client({
  suiNetwork: 'testnet',
  packageId: '0xPROOFPLAY_V2...',
});

// PHASE 1: Before match
async function scheduleMatch(opponent: string, scheduledTime: number) {
  const matchId = generateMatchId();

  await client.scheduleMatch({
    matchId,
    gameId: 'CS2',
    opponentAddress: opponent,
    scheduledTime,
  });

  console.log(`Match scheduled: ${matchId}`);
  console.log(`Time: ${new Date(scheduledTime)}`);

  return matchId;
}

// PHASE 2: After match
async function submitMatchResult(matchId: string, matchData: MatchData) {
  // Generate proof
  const proof = await generateProof(matchData);

  // Upload to Walrus
  const blobId = await uploadToWalrus(proof);

  // Submit to blockchain
  await client.submitMatchResult({
    matchId,
    winner: matchData.winner,
    playerAStats: matchData.playerA,
    playerBStats: matchData.playerB,
    walrusBlobId: blobId,
    proofHash: sha256(proof),
  });

  console.log(`Result submitted for match: ${matchId}`);
}

// Example usage:
async function playMatch() {
  // 1. Schedule match
  const matchId = await scheduleMatch(
    opponentAddress,
    Date.now() + 3600000  // 1 hour from now
  );

  // 2. Wait for scheduled time...
  // 3. Play match
  const result = await playGame();

  // 4. Submit result
  await submitMatchResult(matchId, result);
}
```

---

## 🔍 Prediction Market Integration

### For Prediction Market Developers

```typescript
import { ProofPlayV2API } from './proofplay-api';

const api = new ProofPlayV2API();

// STEP 1: Listen for scheduled matches
api.onMatchScheduled(async (match) => {
  console.log('New match scheduled:', match);

  // Create prediction market
  await createMarket({
    question: `Will ${match.player_a} beat ${match.player_b}?`,
    closeTime: match.scheduled_time,
    category: match.game_id,
  });
});

// STEP 2: When match completes, query result
api.onMatchCompleted(async (matchId) => {
  // Option A: Pay-per-query
  const result = await api.queryMatchPPV({
    matchId,
    payment: 0.05, // SUI
  });

  // Option B: Use subscription (if you have one)
  const result = await api.queryMatchSubscription({
    matchId,
    subscriptionId: mySubscriptionId,
  });

  // Settle market
  await settleMarket({
    winner: result.winner,
    proof: result.walrusBlobId,
  });
});

// STEP 3: Subscribe for bulk queries (recommended)
async function setupSubscription() {
  const expectedQueriesPerMonth = 1000;

  let tier;
  if (expectedQueriesPerMonth <= 200) {
    tier = 'BASIC'; // 5 SUI
  } else if (expectedQueriesPerMonth <= 1000) {
    tier = 'PRO'; // 20 SUI
  } else {
    tier = 'ENTERPRISE'; // 100 SUI, unlimited
  }

  const subscription = await api.createSubscription(tier);

  console.log(`Subscribed to ${tier} tier`);
  console.log(`Queries: ${subscription.queries_included}`);
  console.log(`Valid until: ${subscription.valid_until}`);

  return subscription;
}
```

---

## 📊 Analytics Platform Integration

### For Heavy Users

```typescript
import { ProofPlayV2Analytics } from './proofplay-analytics';

class AnalyticsPlatform {
  private subscription: Subscription;

  async initialize() {
    // Subscribe to Enterprise tier (unlimited queries)
    this.subscription = await client.createSubscription({
      tier: 'ENTERPRISE',
      payment: 100, // SUI/month
    });

    console.log('Analytics platform initialized');
    console.log('Unlimited queries for 100 SUI/month');
  }

  async queryAllMatches(gameId: string) {
    const matches = await api.getAllMatches({ gameId });

    const results = [];
    for (const match of matches) {
      // Use subscription - no additional cost!
      const result = await api.queryMatchSubscription({
        matchId: match.id,
        subscriptionId: this.subscription.id,
      });

      results.push(result);
    }

    return results;
  }

  async generateReport(playerId: string) {
    const matches = await this.queryAllMatches('CS2');
    const playerMatches = matches.filter(m =>
      m.player_a === playerId || m.player_b === playerId
    );

    return {
      totalMatches: playerMatches.length,
      wins: playerMatches.filter(m => m.winner === playerId).length,
      avgKills: average(playerMatches.map(m => m.kills)),
      // ... more analytics
    };
  }
}

// Usage
const platform = new AnalyticsPlatform();
await platform.initialize();

// Query thousands of matches
const report = await platform.generateReport(playerId);

// Cost: $0 (covered by subscription)
// vs V1 cost: $50/day = $1,500/month
```

---

## 🎨 Frontend Demo Updates

### Enhanced UI Components

```typescript
// ScheduleMatchComponent.tsx
function ScheduleMatchComponent() {
  const [scheduledTime, setScheduledTime] = useState(Date.now() + 3600000);

  const handleSchedule = async () => {
    const tx = await scheduleMatch({
      gameId: 'CS2',
      opponent: opponentAddress,
      scheduledTime,
    });

    toast.success('Match scheduled! Prediction markets can now create pools.');
  };

  return (
    <div>
      <h2>Schedule Match (Phase 1)</h2>
      <DateTimePicker value={scheduledTime} onChange={setScheduledTime} />
      <button onClick={handleSchedule}>Schedule Match</button>

      <p>After scheduling, prediction markets will see your match and can create betting pools.</p>
    </div>
  );
}

// SubmitResultComponent.tsx
function SubmitResultComponent({ scheduledMatch }) {
  const canSubmit = Date.now() >= scheduledMatch.scheduled_time;

  const handleSubmit = async (resultData) => {
    const proof = await generateProof(resultData);
    const blobId = await uploadToWalrus(proof);

    await submitMatchResult({
      matchId: scheduledMatch.id,
      ...resultData,
      walrusBlobId: blobId,
    });

    toast.success('Result submitted! Prediction markets will settle now.');
  };

  return (
    <div>
      <h2>Submit Result (Phase 2)</h2>
      {!canSubmit && (
        <p>Match locked until: {scheduledMatch.scheduled_time}</p>
      )}
      <button disabled={!canSubmit} onClick={handleSubmit}>
        Submit Result
      </button>
    </div>
  );
}

// SubscriptionComponent.tsx
function SubscriptionComponent() {
  const tiers = [
    { name: 'Basic', price: 5, queries: 200 },
    { name: 'Pro', price: 20, queries: 1000 },
    { name: 'Enterprise', price: 100, queries: 'Unlimited' },
  ];

  return (
    <div>
      <h2>Choose Subscription Tier</h2>
      {tiers.map((tier, index) => (
        <TierCard
          key={tier.name}
          tier={index}
          {...tier}
          onSubscribe={handleSubscribe}
        />
      ))}
    </div>
  );
}
```

---

## 🧪 Testing

### Test Scenarios

```typescript
// Test 1: Two-phase submission
describe('Two-phase submission', () => {
  it('should schedule match before time', async () => {
    const futureTime = Date.now() + 1000;
    const matchId = await scheduleMatch(futureTime);

    const match = await getScheduledMatch(matchId);
    expect(match.state).toBe('SCHEDULED');
    expect(match.locked).toBe(false);
  });

  it('should lock match after scheduled time', async () => {
    await advanceTime(2000);
    await lockMatch(matchId);

    const match = await getScheduledMatch(matchId);
    expect(match.locked).toBe(true);
  });

  it('should submit result after lock', async () => {
    const result = await submitResult(matchId, resultData);
    expect(result.scheduled_match_id).toBe(matchId);
  });
});

// Test 2: Direct provider payment
describe('Direct provider payment', () => {
  it('should pay provider directly', async () => {
    const balanceBefore = await getBalance(provider);

    await queryMatch(matchId, { payment: 0.05 });

    const balanceAfter = await getBalance(provider);
    expect(balanceAfter - balanceBefore).toBe(0.035); // 70%
  });

  it('should track revenue per match', async () => {
    await queryMatch(matchId, { payment: 0.05 });
    await queryMatch(matchId, { payment: 0.05 });

    const match = await getMatchResult(matchId);
    expect(match.query_count).toBe(2);
    expect(match.revenue_earned).toBe(0.07); // 2 × 0.035
  });
});

// Test 3: Subscriptions
describe('Subscriptions', () => {
  it('should create subscription', async () => {
    const sub = await createSubscription('PRO', 20);
    expect(sub.queries_remaining).toBe(1000);
  });

  it('should query with subscription', async () => {
    await queryWithSubscription(matchId, subscriptionId);

    const sub = await getSubscription(subscriptionId);
    expect(sub.queries_remaining).toBe(999);
  });

  it('should reject expired subscription', async () => {
    await advanceTime(31 * 24 * 60 * 60); // 31 days

    await expect(
      queryWithSubscription(matchId, subscriptionId)
    ).rejects.toThrow('SUBSCRIPTION_EXPIRED');
  });
});
```

---

## 🚀 Deployment Checklist

- [ ] Build V2 contracts: `cd move && sui move build`
- [ ] Test V2 contracts: `sui move test`
- [ ] Deploy V2 to testnet: `sui client publish`
- [ ] Update SDK with V2 functions
- [ ] Update API endpoints
- [ ] Update frontend components
- [ ] Test two-phase flow
- [ ] Test subscriptions
- [ ] Test provider payments
- [ ] Deploy to production

---

## 📚 Additional Resources

- [ENHANCED_ARCHITECTURE.md](./ENHANCED_ARCHITECTURE.md) - Full V2 architecture
- [V1_VS_V2_COMPARISON.md](./V1_VS_V2_COMPARISON.md) - Feature comparison
- [Sui Documentation](https://docs.sui.io/)
- [Walrus Documentation](https://docs.wal.app/)

---

## 💡 Pro Tips

1. **Always use two-phase for public matches** - Enables prediction markets
2. **Subscribe if querying >400 times/month** - Cheaper than pay-per-view
3. **Track match revenue** - Shows which data is valuable
4. **Schedule matches early** - Gives prediction markets time to create pools
5. **Verify proofs** - Always wait for verification before trusting data

Happy building! 🚀
