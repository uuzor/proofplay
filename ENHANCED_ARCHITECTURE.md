# 🚀 ProofPlay V2 - Enhanced Architecture

## Overview of Enhancements

ProofPlay V2 adds three critical features for production readiness:

1. **Two-Phase Match Submission** - Schedule matches before they happen
2. **Direct Provider Payment** - Pay the exact data provider whose data is accessed
3. **Subscription Service** - Allow prediction markets to subscribe for bulk queries

---

## 🎯 Two-Phase Prediction Submission

### Why Two-Phase?

**Problem with Single-Phase:**
- Can only submit data AFTER match completes
- Prediction markets can't create betting markets before the match
- No way to prove match was scheduled before results known
- Opens door to manipulation

**Solution with Two-Phase:**
```
BEFORE MATCH                    AFTER MATCH
    │                               │
    ▼                               ▼
Schedule Match                  Submit Results
  ├─ Match ID                     ├─ Must match scheduled ID
  ├─ Players                      ├─ Winner
  ├─ Scheduled time               ├─ Stats
  └─ Game                         ├─ Walrus proof
                                  └─ Cryptographic hash
    │                               │
    ▼                               ▼
Prediction markets             Markets settle with
create betting pools           verified results
```

### Phase 1: Schedule Match (Pre-Match)

**Function:** `schedule_match()`

```move
public entry fun schedule_match(
    registry: &mut MatchRegistry,
    match_id: vector<u8>,      // Unique match identifier
    game_id: vector<u8>,       // "CS2", "Valorant", etc.
    player_b: address,         // Opponent address
    scheduled_time: u64,       // When match will happen
    ctx: &mut TxContext
)
```

**Creates:**
```move
struct ScheduledMatch {
    match_id: String,
    game_id: String,
    player_a: address,        // Submitter
    player_b: address,
    scheduled_time: u64,
    state: MATCH_STATE_SCHEDULED,
    locked: false,            // Locked when time passes
}
```

**Use Case:**
```
Player A challenges Player B to CS2 match at 8pm
  ↓
Schedule match on-chain at 7pm
  ↓
Prediction market sees scheduled match
  ↓
Creates betting pool: "Will Player A win?"
  ↓
Users place bets before 8pm
  ↓
At 8pm, match is locked (no more schedule changes)
```

### Phase 2: Submit Results (Post-Match)

**Function:** `submit_match_result()`

```move
public entry fun submit_match_result(
    registry: &mut MatchRegistry,
    scheduled: &mut ScheduledMatch,  // MUST reference scheduled match
    winner_address: address,
    player_a_stats: PlayerStats,
    player_b_stats: PlayerStats,
    walrus_blob_id: vector<u8>,     // Full proof on Walrus
    proof_hash: vector<u8>,         // SHA256 hash
    ctx: &mut TxContext
)
```

**Creates:**
```move
struct MatchResult {
    match_id: String,
    scheduled_match_id: ID,      // Links to ScheduledMatch
    submitter: address,
    winner: address,
    player_a_stats: PlayerStats,
    player_b_stats: PlayerStats,
    walrus_blob_id: String,
    proof_hash: String,
    verified: bool,
    query_count: u64,            // Track queries to this result
    revenue_earned: u64,         // Revenue from queries
}
```

**Verification:**
- ✅ Submitter must be player_a or player_b
- ✅ Match must be locked (time passed)
- ✅ Must reference valid scheduled match
- ✅ Can only submit once per scheduled match

**Security Benefits:**
1. **No Retroactive Scheduling** - Can't claim you scheduled a match after knowing results
2. **Prediction Market Safety** - Markets created before match, can't be manipulated
3. **Verifiable Timeline** - On-chain proof of when match was scheduled vs completed
4. **Dispute Resolution** - Both players can see scheduled terms

---

## 💰 Direct Provider Payment (Pay-Per-View)

### Problem with Generic Payment

**Old Approach (V1):**
```
Prediction market queries ANY match
  → Pays 0.05 SUI
  → Revenue goes to "revenue pool"
  → Generic distribution
```

❌ **Issues:**
- Player who provided data doesn't get direct payment
- No incentive for high-quality data
- Can't track which data is valuable

### New Approach (V2)

**Direct Payment:**
```
Prediction market queries specific MatchResult
  → Pays 0.05 SUI
  → 70% (0.035 SUI) → result.submitter (data provider)
  → 20% (0.010 SUI) → Protocol treasury
  → 10% (0.005 SUI) → Validator pool
```

✅ **Benefits:**
- Provider gets paid immediately for THEIR data
- Popular matches earn more
- Incentive to provide high-quality, in-demand data
- Fair compensation based on usage

### Implementation

```move
public entry fun query_match_result(
    registry: &mut MatchRegistry,
    result: &mut MatchResult,      // Specific match result
    payment: Coin<SUI>,
    query_type: u8,
    ctx: &mut TxContext
) {
    // Split payment
    let provider_amount = (payment_value * 70) / 100;
    let protocol_amount = (payment_value * 20) / 100;
    let validator_amount = (payment_value * 10) / 100;

    // Direct payment to provider
    transfer::public_transfer(provider_coin, result.submitter);

    // Update stats on THIS specific result
    result.query_count = result.query_count + 1;
    result.revenue_earned = result.revenue_earned + provider_amount;
}
```

### Revenue Tracking

Each `MatchResult` tracks its own economics:
```move
struct MatchResult {
    query_count: u64,        // How many times queried
    revenue_earned: u64,     // Total SUI earned from queries
    submitter: address,      // Who gets paid
}
```

**Example:**
```
Match #1: CS2 Finals - FaZe vs Team Liquid
  ├─ Queried 10,000 times
  ├─ Revenue earned: 350 SUI (0.035 x 10,000)
  └─ Paid to: match_submitter_address

Match #2: Random casual game
  ├─ Queried 5 times
  ├─ Revenue earned: 0.175 SUI
  └─ Paid to: casual_player_address
```

Popular matches = More revenue for provider!

---

## 📅 Subscription Service

### Problem

**Pay-per-query is expensive for heavy users:**
- Prediction market queries 1000 matches/day
- Cost: 1000 × 0.05 SUI = 50 SUI/day
- Monthly: 1500 SUI (~$1500)

### Solution: Subscription Tiers

**Tier 1: Basic**
- Cost: 5 SUI/month
- Queries: 200/month
- Effective: 0.025 SUI/query (50% savings)

**Tier 2: Pro**
- Cost: 20 SUI/month
- Queries: 1000/month
- Effective: 0.02 SUI/query (60% savings)

**Tier 3: Enterprise**
- Cost: 100 SUI/month
- Queries: Unlimited
- Effective: Pennies per query

### Implementation

```move
struct Subscription {
    subscriber: address,
    tier: u8,                    // BASIC, PRO, ENTERPRISE
    queries_remaining: u64,      // Countdown
    valid_until: u64,            // Expiration epoch
    total_queries_used: u64,     // Analytics
}
```

**Create Subscription:**
```move
public entry fun create_subscription(
    tier: u8,              // 0=Basic, 1=Pro, 2=Enterprise
    payment: Coin<SUI>,    // Must match tier price
    ctx: &mut TxContext
)
```

**Query with Subscription:**
```move
public entry fun query_with_subscription(
    registry: &mut MatchRegistry,
    result: &mut MatchResult,
    subscription: &mut Subscription,  // Owned by subscriber
    query_type: u8,
    ctx: &mut TxContext
) {
    // Verify subscription valid
    assert!(subscription.queries_remaining > 0);
    assert!(current_epoch <= subscription.valid_until);

    // Decrement queries
    subscription.queries_remaining -= 1;

    // No payment needed - already paid via subscription
}
```

### Subscription Economics

**For Prediction Markets:**
```
Pay-Per-Query (1000 queries/month):
  1000 × 0.05 = 50 SUI/month

Pro Subscription:
  20 SUI/month for 1000 queries

Savings: 60% (30 SUI/month)
```

**For Protocol:**
```
Revenue from subscriptions:
  - 100 Basic subscribers: 500 SUI/month
  - 50 Pro subscribers: 1000 SUI/month
  - 10 Enterprise: 1000 SUI/month

Total: 2500 SUI/month recurring revenue
```

**Note:** Subscription payments can be distributed:
- Part to protocol treasury
- Part distributed among active data providers
- Part to validator pool

---

## 🔄 Complete Flow Examples

### Example 1: Esports Match with Betting

**1. Week Before Match**
```move
schedule_match(
    match_id: "esl_finals_2024",
    game_id: "CS2",
    player_a: team_liquid_address,
    player_b: faze_address,
    scheduled_time: epoch_3500
)
```

**2. Prediction Markets React**
```
Polymarket sees scheduled match
  ↓
Creates market: "Will Team Liquid win ESL Finals?"
  ↓
Users bet over the week
  ↓
Total pool: $100,000 in bets
```

**3. Match Day**
```
Match happens at epoch_3500
  ↓
Match is auto-locked (no more changes)
  ↓
Players compete
```

**4. Post-Match**
```move
submit_match_result(
    scheduled_match: esl_finals_2024,
    winner: team_liquid_address,
    team_liquid_stats: {kills: 100, deaths: 75, ...},
    faze_stats: {kills: 75, deaths: 100, ...},
    walrus_blob_id: "full_game_replay_and_proof",
    proof_hash: "sha256_of_proof"
)
```

**5. Market Settlement**
```
Prediction market queries result
  ↓
Pays 0.05 SUI
  ↓
0.035 SUI → team_liquid_address (data provider)
  ↓
Market settles: Team Liquid won
  ↓
$100,000 distributed to winners
```

**6. High Volume Queries**
```
Match result queried 10,000 times over next month
  ├─ By prediction markets
  ├─ By analytics platforms
  ├─ By gaming stats websites
  └─ By NFT minters (achievement verification)

Total revenue to Team Liquid: 350 SUI (~$350)
```

### Example 2: Casual Match

**1. Players Schedule**
```move
schedule_match(
    match_id: "casual_valorant_123",
    player_a: alice,
    player_b: bob,
    scheduled_time: epoch_now + 10  // In 10 epochs
)
```

**2. Friends Bet**
```
Their friend creates small prediction pool
  ↓
"Will Alice beat Bob?"
  ↓
5 friends bet small amounts
```

**3. Match Completes**
```move
submit_match_result(...)
```

**4. Small Number of Queries**
```
Queried 3 times:
  - Friend's prediction market
  - Alice's stats dashboard
  - Bob's gaming profile

Revenue to Alice: 0.105 SUI
```

### Example 3: Pro Analytics Platform

**1. Analytics Platform Subscribes**
```move
create_subscription(
    tier: TIER_ENTERPRISE,  // 100 SUI
    payment: 100_000_000_000  // 100 SUI
)
```

**2. Daily Usage**
```
Platform queries 1000 matches/day
  ↓
Uses subscription (no per-query payment)
  ↓
Subscription.queries_remaining -= 1000
```

**3. Economics**
```
Without subscription: 1000 × 0.05 = 50 SUI/day
With subscription: 100 SUI/month ≈ 3.3 SUI/day

Savings: 93% cheaper!
```

---

## 📊 Economic Model Comparison

### V1 (Generic Payment)
```
Query → 0.05 SUI → Revenue Pool → Generic distribution
```

**Issues:**
- ❌ No direct provider compensation
- ❌ Can't track data value
- ❌ No incentive for quality data

### V2 (Direct Payment + Subscriptions)

**Pay-Per-View:**
```
Query → 0.05 SUI → Direct to provider (0.035)
                 → Protocol (0.010)
                 → Validators (0.005)
```

**Benefits:**
- ✅ Provider paid immediately
- ✅ Revenue tracks data value
- ✅ Popular data = more earnings

**Subscriptions:**
```
Monthly Payment → Bulk queries → Cost savings
                               → Predictable revenue
```

**Benefits:**
- ✅ 50-95% cost savings for consumers
- ✅ Recurring revenue for protocol
- ✅ Encourages high-volume usage

---

## 🔐 Security Considerations

### Two-Phase Security

**Prevention of Manipulation:**
1. **Can't schedule retroactively** - Match must be scheduled before time passes
2. **Match locking** - After scheduled_time, no modifications
3. **Verifiable timeline** - On-chain proof of schedule → result timeline
4. **Dual authorization** - Both players must be involved

**Dispute Resolution:**
```
If Player A and Player B submit different results:
  ↓
Both results visible on-chain
  ↓
Validators/Seal can arbitrate
  ↓
Consensus mechanism resolves
```

### Payment Security

**Direct Payment Protection:**
- ✅ Payment goes immediately to provider
- ✅ No intermediate custody
- ✅ Transparent on-chain
- ✅ Can't be redirected

**Subscription Security:**
- ✅ Subscription owned by subscriber
- ✅ Can't be transferred without permission
- ✅ Expiration enforced on-chain
- ✅ Query counting tamper-proof

---

## 🚀 Migration Path

### For Existing V1 Users

**Backward Compatibility:**
- V1 contracts remain deployed
- V2 is separate package
- Users can choose which to use

**Migration Strategy:**
1. Deploy V2 contracts
2. Test with new matches
3. Gradually sunset V1
4. Full migration when ready

### For New Integrations

**Start with V2:**
- Use two-phase submission
- Choose pay-per-view or subscription
- Full feature set available

---

## 📈 Future Enhancements

### Phase 3 Additions

1. **Multi-signature Results**
   - Require both players to confirm result
   - Reduces disputes

2. **Stake-based Verification**
   - Validators stake SUI to verify
   - Slashing for bad verification

3. **Dynamic Pricing**
   - High-demand matches cost more
   - Low-demand matches cheaper

4. **Fractional Revenue**
   - Multiple data providers per match
   - Revenue split among contributors

---

## 💡 Summary

### Key Improvements in V2

1. **Two-Phase Submission**
   - Enables pre-match prediction markets
   - Prevents manipulation
   - Verifiable timeline

2. **Direct Provider Payment**
   - Fair compensation
   - Revenue tracks value
   - Immediate payment

3. **Subscription Service**
   - Cost savings for consumers
   - Recurring revenue
   - Scalable for high volume

### Implementation Status

- ✅ Smart contracts written
- ✅ Architecture documented
- 🔄 SDK updates needed
- 🔄 API updates needed
- 🔄 Frontend updates needed

See [V2_IMPLEMENTATION.md](./V2_IMPLEMENTATION.md) for integration guide.
