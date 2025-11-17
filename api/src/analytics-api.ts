/**
 * ProofPlay Analytics API
 *
 * Provides dashboard data for providers, consumers, and protocol
 */

import express, { Request, Response } from 'express';

const router = express.Router();

// Mock analytics data (in production, query from Sui blockchain)
interface ProviderAnalyticsData {
  provider: string;
  totalMatches: number;
  verifiedMatches: number;
  totalRevenue: number;
  totalQueries: number;
  avgRevenuePerMatch: number;
  winRate: number;
  globalRank: number;

  // Earnings breakdown
  earnings: {
    totalEarned: number;
    queriesServed: number;
    avgPerQuery: number;
    highestMatchRevenue: number;
  };

  // Performance
  performance: {
    wins: number;
    losses: number;
    draws: number;
    winRate: number;
  };

  // Match history
  recentMatches: MatchHistoryItem[];

  // Time series data for charts
  revenueOverTime: TimeSeriesData[];
  queriesOverTime: TimeSeriesData[];
}

interface ConsumerAnalyticsData {
  consumer: string;
  totalQueries: number;
  totalSpent: number;
  avgCostPerQuery: number;
  hasSubscription: boolean;
  totalSavings: number;
  roiPercentage: number;

  // Spending breakdown
  spending: {
    totalSpent: number;
    queriesMade: number;
    avgPerQuery: number;
    subscriptionSavings: number;
    effectiveCostPerQuery: number;
  };

  // Subscription status
  subscription: {
    hasActive: boolean;
    tier?: string;
    totalSavings: number;
    recommendedTier: string;
  };

  // Usage patterns
  topGamesQueried: { game: string; count: number }[];
  queryVolumeByHour: number[];

  // Time series
  spendingOverTime: TimeSeriesData[];
  queriesOverTime: TimeSeriesData[];
}

interface ProtocolAnalyticsData {
  totalMatches: number;
  totalQueries: number;
  totalRevenue: number;
  totalProviders: number;
  totalConsumers: number;
  activeSubscriptions: number;

  // Revenue breakdown
  revenue: {
    totalRevenue: number;
    protocolShare: number;
    providerPayouts: number;
    validatorRewards: number;
    monthlyRevenue: number;
    subscriptionRevenue: number;
    queryRevenue: number;
  };

  // Growth metrics
  growth: {
    dau: number;
    mau: number;
    queryGrowthRate: number;
    revenueGrowthRate: number;
    newProvidersThisMonth: number;
    newConsumersThisMonth: number;
  };

  // Top lists
  topProviders: LeaderboardEntry[];
  topConsumers: LeaderboardEntry[];
  topGames: { game: string; matches: number }[];

  // Time series
  revenueOverTime: TimeSeriesData[];
  queriesOverTime: TimeSeriesData[];
  userGrowthOverTime: TimeSeriesData[];
}

interface TimeSeriesData {
  timestamp: number;
  value: number;
}

interface MatchHistoryItem {
  matchId: string;
  gameId: string;
  outcome: 'win' | 'loss' | 'draw';
  revenue: number;
  queries: number;
  timestamp: number;
}

interface LeaderboardEntry {
  address: string;
  value: number;
  rank: number;
}

// ==================== Provider Analytics ====================

/**
 * GET /api/v1/analytics/provider/:address
 * Get comprehensive analytics for a data provider
 */
router.get('/provider/:address', async (req: Request, res: Response) => {
  const { address } = req.params;

  try {
    // In production: Query Sui blockchain for analytics
    const analytics: ProviderAnalyticsData = generateMockProviderAnalytics(address);

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch provider analytics',
    });
  }
});

/**
 * GET /api/v1/analytics/provider/:address/earnings
 * Get detailed earnings breakdown
 */
router.get('/provider/:address/earnings', async (req: Request, res: Response) => {
  const { address } = req.params;
  const { period = '30d' } = req.query;

  try {
    const earnings = {
      totalEarned: 350.5,
      queriesServed: 10234,
      avgPerQuery: 0.0342,
      highestMatchRevenue: 45.2,

      // Breakdown by time period
      thisMonth: 120.5,
      lastMonth: 98.3,
      thisWeek: 28.7,
      today: 5.2,

      // Breakdown by game
      byGame: [
        { game: 'CS2', revenue: 220.3, percentage: 62.8 },
        { game: 'Valorant', revenue: 95.7, percentage: 27.3 },
        { game: 'LoL', revenue: 34.5, percentage: 9.9 },
      ],

      // Top earning matches
      topMatches: [
        { matchId: 'match_001', revenue: 45.2, queries: 1500 },
        { matchId: 'match_042', revenue: 38.7, queries: 1200 },
        { matchId: 'match_128', revenue: 32.1, queries: 980 },
      ],
    };

    res.json({
      success: true,
      data: earnings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch earnings',
    });
  }
});

/**
 * GET /api/v1/analytics/provider/:address/performance
 * Get performance statistics
 */
router.get('/provider/:address/performance', async (req: Request, res: Response) => {
  const { address } = req.params;

  try {
    const performance = {
      wins: 145,
      losses: 112,
      draws: 23,
      winRate: 51.8,
      totalMatches: 280,

      // KDA stats
      avgKills: 22.5,
      avgDeaths: 18.3,
      kdRatio: 1.23,

      // Recent performance (last 10 matches)
      recentForm: ['W', 'W', 'L', 'W', 'D', 'L', 'W', 'W', 'W', 'L'],

      // Performance by game
      byGame: [
        { game: 'CS2', winRate: 53.2, matches: 180 },
        { game: 'Valorant', winRate: 48.5, matches: 70 },
        { game: 'LoL', winRate: 50.0, matches: 30 },
      ],

      // Rank progression
      currentRank: 42,
      previousRank: 58,
      rankChange: 16,
      peakRank: 28,
    };

    res.json({
      success: true,
      data: performance,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch performance',
    });
  }
});

// ==================== Consumer Analytics ====================

/**
 * GET /api/v1/analytics/consumer/:address
 * Get comprehensive analytics for a data consumer
 */
router.get('/consumer/:address', async (req: Request, res: Response) => {
  const { address } = req.params;

  try {
    const analytics: ConsumerAnalyticsData = generateMockConsumerAnalytics(address);

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch consumer analytics',
    });
  }
});

/**
 * GET /api/v1/analytics/consumer/:address/spending
 * Get spending analysis and cost optimization recommendations
 */
router.get('/consumer/:address/spending', async (req: Request, res: Response) => {
  const { address } = req.params;

  try {
    const spending = {
      totalSpent: 1245.5,
      queriesMade: 24500,
      avgPerQuery: 0.0508,

      // Cost breakdown
      payPerQueryCost: 1050.0,
      subscriptionCost: 195.5,
      totalSavings: 280.3,

      // Effective costs
      effectiveCostPerQuery: 0.0394, // After subscription savings

      // Spending by category
      byGame: [
        { game: 'CS2', spent: 720.5, queries: 14200 },
        { game: 'Valorant', spent: 385.0, queries: 7600 },
        { game: 'LoL', spent: 140.0, queries: 2700 },
      ],

      // Cost optimization
      currentPlan: 'Pro',
      recommendedPlan: 'Enterprise',
      potentialSavings: 450.0, // Per month if switched to Enterprise

      // Forecast
      projectedMonthlySpend: 1200.0,
      projectedYearlySpend: 14400.0,
      withRecommendedPlan: 4800.0, // 66% savings
    };

    res.json({
      success: true,
      data: spending,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch spending analytics',
    });
  }
});

/**
 * GET /api/v1/analytics/consumer/:address/roi
 * Get ROI analysis
 */
router.get('/consumer/:address/roi', async (req: Request, res: Response) => {
  const { address } = req.params;

  try {
    const roi = {
      totalSpent: 1245.5,
      totalValueGenerated: 45820.0, // Value from prediction markets
      roiPercentage: 3578.2, // (45820 - 1245.5) / 1245.5 * 100

      // Value sources
      predictionMarketRevenue: 42500.0,
      analyticsValue: 2800.0,
      otherValue: 520.0,

      // Cost efficiency
      costPerValueGenerated: 0.027, // $0.027 spent per $1 value generated

      // Comparison
      industryAverage: 0.15,
      yourEfficiency: 5.5, // 5.5x better than industry average

      // Projections
      projectedAnnualValue: 550000.0,
      projectedAnnualCost: 14400.0,
      projectedROI: 3719.4,
    };

    res.json({
      success: true,
      data: roi,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ROI analytics',
    });
  }
});

// ==================== Protocol Analytics ====================

/**
 * GET /api/v1/analytics/protocol
 * Get comprehensive protocol-wide analytics
 */
router.get('/protocol', async (req: Request, res: Response) => {
  try {
    const analytics: ProtocolAnalyticsData = generateMockProtocolAnalytics();

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch protocol analytics',
    });
  }
});

/**
 * GET /api/v1/analytics/protocol/revenue
 * Get detailed revenue analytics
 */
router.get('/protocol/revenue', async (req: Request, res: Response) => {
  try {
    const revenue = {
      total: 485200.0,

      // Breakdown
      protocolShare: 97040.0, // 20%
      providerPayouts: 339640.0, // 70%
      validatorRewards: 48520.0, // 10%

      // By source
      payPerQuery: 285200.0,
      subscriptions: 200000.0,

      // Time periods
      today: 1580.0,
      thisWeek: 11250.0,
      thisMonth: 48520.0,
      lastMonth: 42100.0,

      // Growth
      monthOverMonth: 15.3, // %
      quarterOverQuarter: 45.8, // %
      yearOverYear: 285.4, // %

      // Projections
      projectedMonthly: 52000.0,
      projectedAnnual: 624000.0,

      // Revenue by game
      byGame: [
        { game: 'CS2', revenue: 298400.0, percentage: 61.5 },
        { game: 'Valorant', revenue: 135600.0, percentage: 27.9 },
        { game: 'LoL', revenue: 51200.0, percentage: 10.6 },
      ],
    };

    res.json({
      success: true,
      data: revenue,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch revenue analytics',
    });
  }
});

/**
 * GET /api/v1/analytics/protocol/growth
 * Get growth metrics and user analytics
 */
router.get('/protocol/growth', async (req: Request, res: Response) => {
  try {
    const growth = {
      // Users
      totalProviders: 12450,
      totalConsumers: 3280,
      newProvidersThisMonth: 1820,
      newConsumersThisMonth: 485,

      // Activity
      dau: 3250,
      mau: 8920,
      dauToMau: 36.4, // %

      // Growth rates
      userGrowthMoM: 18.5, // %
      queryGrowthMoM: 22.3, // %
      revenueGrowthMoM: 15.3, // %

      // Retention
      providerRetention: 78.5, // %
      consumerRetention: 85.2, // %

      // Engagement
      avgQueriesPerConsumer: 42.5,
      avgMatchesPerProvider: 8.3,
      avgSessionTime: 25.5, // minutes

      // Geographic distribution
      byRegion: [
        { region: 'North America', users: 5820, percentage: 37.0 },
        { region: 'Europe', users: 4950, percentage: 31.5 },
        { region: 'Asia', users: 3480, percentage: 22.1 },
        { region: 'Other', users: 1480, percentage: 9.4 },
      ],
    };

    res.json({
      success: true,
      data: growth,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch growth analytics',
    });
  }
});

/**
 * GET /api/v1/analytics/protocol/leaderboard
 * Get top providers and consumers
 */
router.get('/protocol/leaderboard', async (req: Request, res: Response) => {
  const { type = 'providers', limit = 10 } = req.query;

  try {
    const topProviders = [
      { rank: 1, address: '0xabc...123', revenue: 4520.5, matches: 1250 },
      { rank: 2, address: '0xdef...456', revenue: 3890.2, matches: 1180 },
      { rank: 3, address: '0xghi...789', revenue: 3420.8, matches: 980 },
      { rank: 4, address: '0xjkl...012', revenue: 2980.5, matches: 850 },
      { rank: 5, address: '0xmno...345', revenue: 2750.3, matches: 720 },
      { rank: 6, address: '0xpqr...678', revenue: 2450.0, matches: 650 },
      { rank: 7, address: '0xstu...901', revenue: 2180.5, matches: 580 },
      { rank: 8, address: '0xvwx...234', revenue: 1920.3, matches: 520 },
      { rank: 9, address: '0xyz...567', revenue: 1750.0, matches: 480 },
      { rank: 10, address: '0x123...890', revenue: 1580.8, matches: 420 },
    ];

    const topConsumers = [
      { rank: 1, address: '0xaaa...111', queries: 125000, spent: 5200.0 },
      { rank: 2, address: '0xbbb...222', queries: 98000, spent: 4100.0 },
      { rank: 3, address: '0xccc...333', queries: 75000, spent: 3150.0 },
      { rank: 4, address: '0xddd...444', queries: 62000, spent: 2580.0 },
      { rank: 5, address: '0xeee...555', queries: 51000, spent: 2150.0 },
    ];

    const data = type === 'providers' ? topProviders : topConsumers;

    res.json({
      success: true,
      data: data.slice(0, Number(limit)),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch leaderboard',
    });
  }
});

// ==================== Helper Functions ====================

function generateMockProviderAnalytics(address: string): ProviderAnalyticsData {
  return {
    provider: address,
    totalMatches: 280,
    verifiedMatches: 265,
    totalRevenue: 350.5,
    totalQueries: 10234,
    avgRevenuePerMatch: 1.25,
    winRate: 51.8,
    globalRank: 42,

    earnings: {
      totalEarned: 350.5,
      queriesServed: 10234,
      avgPerQuery: 0.0342,
      highestMatchRevenue: 45.2,
    },

    performance: {
      wins: 145,
      losses: 112,
      draws: 23,
      winRate: 51.8,
    },

    recentMatches: generateMockMatchHistory(10),
    revenueOverTime: generateMockTimeSeries(30, 5, 20),
    queriesOverTime: generateMockTimeSeries(30, 100, 500),
  };
}

function generateMockConsumerAnalytics(address: string): ConsumerAnalyticsData {
  return {
    consumer: address,
    totalQueries: 24500,
    totalSpent: 1245.5,
    avgCostPerQuery: 0.0508,
    hasSubscription: true,
    totalSavings: 280.3,
    roiPercentage: 3578.2,

    spending: {
      totalSpent: 1245.5,
      queriesMade: 24500,
      avgPerQuery: 0.0508,
      subscriptionSavings: 280.3,
      effectiveCostPerQuery: 0.0394,
    },

    subscription: {
      hasActive: true,
      tier: 'Pro',
      totalSavings: 280.3,
      recommendedTier: 'Enterprise',
    },

    topGamesQueried: [
      { game: 'CS2', count: 14200 },
      { game: 'Valorant', count: 7600 },
      { game: 'LoL', count: 2700 },
    ],

    queryVolumeByHour: Array(24).fill(0).map((_, i) =>
      Math.floor(Math.random() * 500) + 100
    ),

    spendingOverTime: generateMockTimeSeries(30, 20, 80),
    queriesOverTime: generateMockTimeSeries(30, 400, 1200),
  };
}

function generateMockProtocolAnalytics(): ProtocolAnalyticsData {
  return {
    totalMatches: 125480,
    totalQueries: 2845620,
    totalRevenue: 485200,
    totalProviders: 12450,
    totalConsumers: 3280,
    activeSubscriptions: 850,

    revenue: {
      totalRevenue: 485200,
      protocolShare: 97040,
      providerPayouts: 339640,
      validatorRewards: 48520,
      monthlyRevenue: 48520,
      subscriptionRevenue: 17000,
      queryRevenue: 31520,
    },

    growth: {
      dau: 3250,
      mau: 8920,
      queryGrowthRate: 22.3,
      revenueGrowthRate: 15.3,
      newProvidersThisMonth: 1820,
      newConsumersThisMonth: 485,
    },

    topProviders: [
      { address: '0xabc...123', value: 4520.5, rank: 1 },
      { address: '0xdef...456', value: 3890.2, rank: 2 },
      { address: '0xghi...789', value: 3420.8, rank: 3 },
    ],

    topConsumers: [
      { address: '0xaaa...111', value: 125000, rank: 1 },
      { address: '0xbbb...222', value: 98000, rank: 2 },
    ],

    topGames: [
      { game: 'CS2', matches: 77000 },
      { game: 'Valorant', matches: 35000 },
      { game: 'LoL', matches: 13480 },
    ],

    revenueOverTime: generateMockTimeSeries(30, 1000, 2000),
    queriesOverTime: generateMockTimeSeries(30, 50000, 100000),
    userGrowthOverTime: generateMockTimeSeries(30, 100, 500),
  };
}

function generateMockMatchHistory(count: number): MatchHistoryItem[] {
  const outcomes: ('win' | 'loss' | 'draw')[] = ['win', 'loss', 'draw'];
  return Array(count).fill(0).map((_, i) => ({
    matchId: `match_${1000 + i}`,
    gameId: ['CS2', 'Valorant', 'LoL'][Math.floor(Math.random() * 3)],
    outcome: outcomes[Math.floor(Math.random() * outcomes.length)],
    revenue: Math.random() * 50,
    queries: Math.floor(Math.random() * 1000),
    timestamp: Date.now() - i * 86400000,
  }));
}

function generateMockTimeSeries(days: number, min: number, max: number): TimeSeriesData[] {
  return Array(days).fill(0).map((_, i) => ({
    timestamp: Date.now() - (days - i - 1) * 86400000,
    value: Math.floor(Math.random() * (max - min)) + min,
  }));
}

export default router;
