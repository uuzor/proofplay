# 📊 ProofPlay Analytics System

Comprehensive analytics and dashboard system for providers, consumers, and protocol administrators.

---

## 🎯 Overview

The ProofPlay analytics system provides real-time insights into:

1. **Provider Analytics** - Players who submit match data
   - Earnings tracking
   - Performance metrics
   - Match history
   - Global ranking

2. **Consumer Analytics** - Prediction markets and platforms
   - Spending analysis
   - Query volume
   - ROI calculation
   - Cost optimization recommendations

3. **Protocol Analytics** - Platform-wide metrics
   - Revenue breakdown
   - User growth
   - Top performers
   - Health metrics

---

## 📦 Components

### 1. Smart Contract Analytics Module

**File:** `move/sources/analytics.move` (509 lines)

**Key Structures:**

```move
struct ProviderAnalytics {
    total_matches_submitted: u64,
    total_revenue_earned: u64,
    total_queries_served: u64,
    average_revenue_per_match: u64,
    win_count: u64,
    loss_count: u64,
    win_rate: u64,
    provider_rank: u64,
    // ... more fields
}

struct ConsumerAnalytics {
    total_queries_made: u64,
    total_spent: u64,
    subscription_savings: u64,
    roi_percentage: u64,
    // ... more fields
}

struct ProtocolAnalytics {
    total_matches_completed: u64,
    total_queries_processed: u64,
    total_protocol_revenue: u64,
    daily_active_users: u64,
    monthly_active_users: u64,
    // ... more fields
}
```

**View Functions:**

- `get_provider_summary()` - Provider dashboard summary
- `get_provider_earnings()` - Earnings breakdown
- `get_provider_performance()` - Win/loss stats
- `get_consumer_summary()` - Consumer dashboard summary
- `get_consumer_spending()` - Spending analysis
- `get_protocol_summary()` - Protocol-wide metrics
- `get_protocol_revenue()` - Revenue analytics
- `get_protocol_growth()` - Growth metrics
- `get_top_providers()` - Leaderboard

### 2. Analytics API

**File:** `api/src/analytics-api.ts` (695 lines)

**Provider Endpoints:**

```
GET /api/v1/analytics/provider/:address
GET /api/v1/analytics/provider/:address/earnings
GET /api/v1/analytics/provider/:address/performance
```

**Consumer Endpoints:**

```
GET /api/v1/analytics/consumer/:address
GET /api/v1/analytics/consumer/:address/spending
GET /api/v1/analytics/consumer/:address/roi
```

**Protocol Endpoints:**

```
GET /api/v1/analytics/protocol
GET /api/v1/analytics/protocol/revenue
GET /api/v1/analytics/protocol/growth
GET /api/v1/analytics/protocol/leaderboard
```

### 3. Frontend Dashboards

**File:** `client/provider-dashboard.html` (514 lines)

**Features:**
- Real-time revenue tracking
- Performance statistics
- Match history
- Charts and visualizations
- Global ranking
- Top earning matches

---

## 🎮 Provider Dashboard

### Key Metrics Displayed

**Summary Stats:**
- Total Revenue (SUI earned)
- Total Queries (how many times data was queried)
- Win Rate (% of matches won)
- Global Rank (leaderboard position)
- Avg Revenue per Match
- Total Matches Submitted

**Revenue Analytics:**
- Revenue over time (chart)
- Earnings breakdown:
  - This month
  - This week
  - Today
  - Avg per query
- Top earning matches
- Revenue by game

**Performance Statistics:**
- Wins / Losses / Draws
- Win rate percentage
- K/D ratio
- Query volume over time
- Recent match history

**Example Data:**

```json
{
  "totalRevenue": 350.5,
  "totalQueries": 10234,
  "avgRevenuePerMatch": 1.25,
  "winRate": 51.8,
  "globalRank": 42,
  "earnings": {
    "thisMonth": 120.5,
    "thisWeek": 28.7,
    "today": 5.2,
    "avgPerQuery": 0.0342
  },
  "topMatches": [
    {
      "matchId": "match_001",
      "revenue": 45.2,
      "queries": 1500
    }
  ]
}
```

### Value for Providers

✅ **See exactly how much you're earning**
- Track revenue in real-time
- Identify most valuable matches
- Optimize for high-earning games

✅ **Understand your performance**
- Win/loss tracking
- Performance trends
- Compare against others

✅ **Make data-driven decisions**
- Which games generate more revenue?
- What times are best for playing?
- How to improve ranking?

---

## 💰 Consumer Dashboard

### Key Metrics Displayed

**Summary Stats:**
- Total Queries Made
- Total Spent (SUI)
- Avg Cost per Query
- Subscription Status
- Total Savings (from subscription)
- ROI Percentage

**Spending Analytics:**
- Spending over time (chart)
- Cost breakdown:
  - Pay-per-query costs
  - Subscription costs
  - Total savings
  - Effective cost per query
- Spending by game
- Cost optimization recommendations

**Subscription Status:**
- Current plan (Basic/Pro/Enterprise)
- Queries remaining
- Recommended plan upgrade
- Potential savings

**ROI Analysis:**
- Total value generated
- ROI percentage
- Cost per value generated
- Industry comparison
- Projections

**Example Data:**

```json
{
  "totalQueries": 24500,
  "totalSpent": 1245.5,
  "avgCostPerQuery": 0.0508,
  "hasSubscription": true,
  "subscriptionTier": "Pro",
  "totalSavings": 280.3,
  "roiPercentage": 3578.2,
  "spending": {
    "effectiveCostPerQuery": 0.0394,
    "recommendedPlan": "Enterprise",
    "potentialSavings": 450.0
  },
  "roi": {
    "totalValueGenerated": 45820.0,
    "costEfficiency": 5.5
  }
}
```

### Value for Consumers

✅ **Optimize spending**
- See total costs
- Identify savings opportunities
- Get plan recommendations

✅ **Track ROI**
- Value generated from queries
- Cost efficiency
- Compare to industry

✅ **Make informed decisions**
- Should you upgrade subscription?
- Which data sources are best?
- How to maximize value?

---

## 🏢 Protocol Dashboard

### Key Metrics Displayed

**Summary Stats:**
- Total Matches
- Total Queries
- Total Revenue
- Total Providers
- Total Consumers
- Active Subscriptions

**Revenue Analytics:**
- Total revenue
- Revenue breakdown:
  - Protocol share (20%)
  - Provider payouts (70%)
  - Validator rewards (10%)
- Revenue sources:
  - Pay-per-query
  - Subscriptions
- Monthly/quarterly/annual
- Revenue by game
- Growth rates

**User Growth:**
- DAU (Daily Active Users)
- MAU (Monthly Active Users)
- New providers this month
- New consumers this month
- User retention rates
- Growth rates (MoM, QoQ, YoY)

**Top Lists:**
- Top providers (by revenue)
- Top consumers (by queries)
- Top games (by matches)
- Geographic distribution

**Example Data:**

```json
{
  "totalRevenue": 485200,
  "totalMatches": 125480,
  "totalQueries": 2845620,
  "revenue": {
    "protocolShare": 97040,
    "providerPayouts": 339640,
    "validatorRewards": 48520,
    "monthlyRevenue": 48520,
    "subscriptionRevenue": 17000,
    "queryRevenue": 31520
  },
  "growth": {
    "dau": 3250,
    "mau": 8920,
    "queryGrowthRate": 22.3,
    "revenueGrowthRate": 15.3,
    "newProvidersThisMonth": 1820
  },
  "topProviders": [
    { "address": "0xabc...123", "revenue": 4520.5, "rank": 1 },
    { "address": "0xdef...456", "revenue": 3890.2, "rank": 2 }
  ]
}
```

### Value for Protocol

✅ **Monitor health**
- Revenue trends
- User growth
- Query volume
- System performance

✅ **Make strategic decisions**
- Where to focus development?
- Which games to prioritize?
- Pricing optimization

✅ **Identify opportunities**
- Top performers
- Growth areas
- Market trends

---

## 📈 Analytics Features

### Real-Time Tracking

All metrics update in real-time:
- Revenue as queries happen
- User activity as it occurs
- Performance stats immediately

### Historical Data

Time-series data for trends:
- Daily/weekly/monthly views
- Revenue over time
- Query volume trends
- User growth charts

### Comparative Analysis

Compare performance:
- Your rank vs others
- This month vs last month
- Different games
- Provider vs provider

### Actionable Insights

Data-driven recommendations:
- Subscription tier suggestions
- Cost optimization tips
- Performance improvements
- Growth opportunities

---

## 🔧 Implementation

### On-Chain Analytics

**Update on Match Submission:**

```move
public(friend) fun update_provider_on_match_submit(
    analytics: &mut ProviderAnalytics,
    is_win: bool,
    is_draw: bool,
    ctx: &TxContext
) {
    analytics.total_matches_submitted += 1;
    if (is_win) analytics.win_count += 1;
    analytics.win_rate = (analytics.win_count * 100) / analytics.total_matches_submitted;
    // ...
}
```

**Update on Query:**

```move
public(friend) fun update_provider_on_query(
    analytics: &mut ProviderAnalytics,
    match_id: String,
    revenue_earned: u64
) {
    analytics.total_queries_served += 1;
    analytics.total_revenue_earned += revenue_earned;
    // ...
}
```

### API Integration

**Fetch Provider Analytics:**

```typescript
const response = await fetch('/api/v1/analytics/provider/0xabc...123');
const data = await response.json();

console.log('Total Revenue:', data.totalRevenue);
console.log('Win Rate:', data.winRate);
console.log('Global Rank:', data.globalRank);
```

**Fetch Consumer Analytics:**

```typescript
const response = await fetch('/api/v1/analytics/consumer/0xdef...456');
const data = await response.json();

console.log('Total Spent:', data.totalSpent);
console.log('ROI:', data.roiPercentage);
console.log('Savings:', data.totalSavings);
```

### Frontend Display

**Provider Dashboard:**

```html
<div class="stat-card">
    <div class="stat-label">Total Revenue</div>
    <div class="stat-value" id="totalRevenue">350.5 SUI</div>
    <div class="stat-change">+12.3% this month</div>
</div>
```

**Charts:**

```javascript
new Chart(ctx, {
    type: 'line',
    data: {
        labels: last30Days,
        datasets: [{
            label: 'Revenue (SUI)',
            data: revenueData,
            borderColor: '#667eea',
        }]
    }
});
```

---

## 📊 Dashboard Screenshots (Conceptual)

### Provider Dashboard

```
┌─────────────────────────────────────────────────────┐
│  🎮 Provider Dashboard                              │
│  Address: 0x1234...abcd                             │
├─────────────────────────────────────────────────────┤
│  Total Revenue    Total Queries    Win Rate   Rank  │
│  350.5 SUI       10,234           51.8%      #42    │
│  +12.3%          +8.5%            +2.1%      ↑16    │
├─────────────────────────────────────────────────────┤
│  📈 Revenue Over Time                               │
│  [Line Chart: 30-day revenue trend]                 │
├─────────────────────────────────────────────────────┤
│  💰 Top Earning Matches                             │
│  match_001 - CS2         1,500 queries   45.2 SUI   │
│  match_042 - Valorant    1,200 queries   38.7 SUI   │
└─────────────────────────────────────────────────────┘
```

### Consumer Dashboard

```
┌─────────────────────────────────────────────────────┐
│  💼 Consumer Dashboard                              │
│  Address: 0x5678...efgh                             │
├─────────────────────────────────────────────────────┤
│  Total Queries  Total Spent  Subscription  Savings  │
│  24,500        1,245.5 SUI  Pro          280.3 SUI  │
│  +15.2%        +12.8%       Active       +22.5%     │
├─────────────────────────────────────────────────────┤
│  📊 ROI Analysis                                     │
│  ROI: 3,578%  |  Value Generated: 45,820 SUI        │
│  Recommendation: Upgrade to Enterprise (-66% cost)   │
└─────────────────────────────────────────────────────┘
```

### Protocol Dashboard

```
┌─────────────────────────────────────────────────────┐
│  🏢 Protocol Dashboard                              │
├─────────────────────────────────────────────────────┤
│  Total Revenue  Total Queries  DAU     MAU          │
│  485,200 SUI   2,845,620      3,250   8,920         │
│  +15.3%        +22.3%         +8.5%   +12.1%        │
├─────────────────────────────────────────────────────┤
│  📈 Growth Metrics                                   │
│  New Providers: 1,820  |  New Consumers: 485        │
│  Query Growth: +22.3%  |  Revenue Growth: +15.3%    │
├─────────────────────────────────────────────────────┤
│  🏆 Top Providers                                    │
│  #1  0xabc...123    4,520.5 SUI   1,250 matches     │
│  #2  0xdef...456    3,890.2 SUI   1,180 matches     │
└─────────────────────────────────────────────────────┘
```

---

## 🚀 Benefits

### For Providers

1. **Transparency** - See exactly what you earn
2. **Optimization** - Know which matches are valuable
3. **Motivation** - Track progress and ranking
4. **Decision Making** - Data-driven game selection

### For Consumers

1. **Cost Control** - Monitor spending
2. **ROI Tracking** - Measure value
3. **Optimization** - Get subscription recommendations
4. **Planning** - Forecast costs

### For Protocol

1. **Health Monitoring** - Track all metrics
2. **Growth Analysis** - Identify trends
3. **User Insights** - Understand behavior
4. **Strategic Planning** - Data-driven decisions

---

## 📈 Future Enhancements

### Phase 2

- [ ] Real-time websocket updates
- [ ] Custom date range selectors
- [ ] Export to CSV/PDF
- [ ] Email reports
- [ ] Mobile app dashboards

### Phase 3

- [ ] Predictive analytics (ML-based forecasting)
- [ ] Anomaly detection
- [ ] Custom alerts/notifications
- [ ] API webhooks
- [ ] Advanced filtering

### Phase 4

- [ ] Social features (compare with friends)
- [ ] Achievement system
- [ ] Gamification elements
- [ ] Community insights
- [ ] Market intelligence

---

## 🔐 Privacy & Security

**Data Protection:**
- On-chain data is public (by design)
- Personal info never stored on-chain
- API requires authentication
- Rate limiting to prevent abuse

**Access Control:**
- Providers see own detailed data
- Consumers see own detailed data
- Protocol metrics are public
- Leaderboards show anonymized addresses

---

## 📊 Metrics Summary

**Total Lines of Code:** 1,718 lines

- Smart Contracts: 509 lines
- API Endpoints: 695 lines
- Frontend Dashboard: 514 lines

**API Endpoints:** 12 endpoints

**Dashboard Types:** 3 dashboards

**Chart Types:** Multiple (line, bar, pie, area)

**Update Frequency:** Real-time

---

## 🎯 Usage Examples

### Check Provider Earnings

```bash
curl http://localhost:3000/api/v1/analytics/provider/0xabc.../earnings
```

### Check Consumer ROI

```bash
curl http://localhost:3000/api/v1/analytics/consumer/0xdef.../roi
```

### Check Protocol Growth

```bash
curl http://localhost:3000/api/v1/analytics/protocol/growth
```

### View Provider Dashboard

```bash
open http://localhost:8080/provider-dashboard.html
```

---

## ✅ Summary

The ProofPlay analytics system provides **comprehensive, real-time insights** for all stakeholders:

- **Providers** maximize earnings with performance tracking
- **Consumers** optimize spending with ROI analysis
- **Protocol** makes data-driven decisions with growth metrics

All backed by on-chain data for transparency and trust.

🚀 **Ready to use!** Simply deploy the contracts, start the API, and open the dashboards.
