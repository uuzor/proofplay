/**
 * ProofPlay Analytics API V2
 *
 * Uses REAL blockchain data from Sui instead of mock data
 */

import express, { Request, Response } from 'express';
import {
  getProviderAnalytics,
  getProviderMatchHistory,
  getTopEarningMatches,
  getConsumerAnalytics,
  getConsumerSubscription,
  getProtocolAnalytics,
  getTopProviders,
  getRevenueOverTime,
} from './sui-client';

const router = express.Router();

// ==================== Provider Analytics ====================

/**
 * GET /api/v1/analytics/provider/:address
 * Get comprehensive analytics for a data provider FROM BLOCKCHAIN
 */
router.get('/provider/:address', async (req: Request, res: Response) => {
  const { address } = req.params;

  try {
    // Fetch real data from Sui blockchain
    const [analytics, matchHistory, topMatches] = await Promise.all([
      getProviderAnalytics(address),
      getProviderMatchHistory(address, 10),
      getTopEarningMatches(address, 3),
    ]);

    // Get revenue over time from events
    const revenueOverTime = await getRevenueOverTime(30);

    res.json({
      success: true,
      data: {
        ...analytics,
        recentMatches: matchHistory,
        topMatches,
        revenueOverTime,
      },
      source: 'blockchain', // Indicate this is real data
      network: process.env.SUI_NETWORK || 'testnet',
    });
  } catch (error: any) {
    console.error('Error fetching provider analytics:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch provider analytics',
      details: error.toString(),
    });
  }
});

/**
 * GET /api/v1/analytics/provider/:address/earnings
 * Get detailed earnings breakdown FROM BLOCKCHAIN
 */
router.get('/provider/:address/earnings', async (req: Request, res: Response) => {
  const { address } = req.params;

  try {
    const analytics = await getProviderAnalytics(address);
    const topMatches = await getTopEarningMatches(address, 5);
    const revenueOverTime = await getRevenueOverTime(30);

    // Calculate time-based earnings from events
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;

    const today = revenueOverTime.filter(r => r.timestamp >= oneDayAgo)
      .reduce((sum, r) => sum + r.value, 0);

    const thisWeek = revenueOverTime.filter(r => r.timestamp >= oneWeekAgo)
      .reduce((sum, r) => sum + r.value, 0);

    const thisMonth = revenueOverTime.filter(r => r.timestamp >= oneMonthAgo)
      .reduce((sum, r) => sum + r.value, 0);

    const earnings = {
      totalEarned: analytics.earnings.totalEarned,
      queriesServed: analytics.earnings.queriesServed,
      avgPerQuery: analytics.earnings.avgPerQuery,
      highestMatchRevenue: analytics.earnings.highestMatchRevenue,

      // Time-based breakdown
      thisMonth,
      thisWeek,
      today,

      // Top matches
      topMatches,

      // Historical data
      revenueOverTime,
    };

    res.json({
      success: true,
      data: earnings,
      source: 'blockchain',
    });
  } catch (error: any) {
    console.error('Error fetching earnings:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch earnings',
    });
  }
});

/**
 * GET /api/v1/analytics/provider/:address/performance
 * Get performance statistics FROM BLOCKCHAIN
 */
router.get('/provider/:address/performance', async (req: Request, res: Response) => {
  const { address } = req.params;

  try {
    const analytics = await getProviderAnalytics(address);
    const matchHistory = await getProviderMatchHistory(address, 50);

    // Calculate recent form (last 10 matches)
    const recentForm = matchHistory.slice(0, 10).map(m => {
      if (m.outcome === 'win') return 'W';
      if (m.outcome === 'loss') return 'L';
      return 'D';
    });

    // Calculate performance by game
    const gamePerformance = new Map<string, { wins: number; total: number }>();
    matchHistory.forEach(match => {
      const game = match.gameId;
      const current = gamePerformance.get(game) || { wins: 0, total: 0 };
      current.total++;
      if (match.outcome === 'win') current.wins++;
      gamePerformance.set(game, current);
    });

    const byGame = Array.from(gamePerformance.entries()).map(([game, stats]) => ({
      game,
      winRate: (stats.wins / stats.total) * 100,
      matches: stats.total,
    }));

    const performance = {
      wins: analytics.performance.wins,
      losses: analytics.performance.losses,
      draws: analytics.performance.draws,
      winRate: analytics.performance.winRate,
      totalMatches: analytics.totalMatches,

      // Recent form
      recentForm,

      // Performance by game
      byGame,

      // Rank info
      currentRank: analytics.globalRank,
    };

    res.json({
      success: true,
      data: performance,
      source: 'blockchain',
    });
  } catch (error: any) {
    console.error('Error fetching performance:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch performance',
    });
  }
});

// ==================== Consumer Analytics ====================

/**
 * GET /api/v1/analytics/consumer/:address
 * Get comprehensive analytics for a data consumer FROM BLOCKCHAIN
 */
router.get('/consumer/:address', async (req: Request, res: Response) => {
  const { address } = req.params;

  try {
    const [analytics, subscription] = await Promise.all([
      getConsumerAnalytics(address),
      getConsumerSubscription(address),
    ]);

    res.json({
      success: true,
      data: {
        ...analytics,
        subscriptionDetails: subscription,
      },
      source: 'blockchain',
      network: process.env.SUI_NETWORK || 'testnet',
    });
  } catch (error: any) {
    console.error('Error fetching consumer analytics:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch consumer analytics',
    });
  }
});

/**
 * GET /api/v1/analytics/consumer/:address/spending
 * Get spending analysis FROM BLOCKCHAIN
 */
router.get('/consumer/:address/spending', async (req: Request, res: Response) => {
  const { address } = req.params;

  try {
    const analytics = await getConsumerAnalytics(address);
    const subscription = await getConsumerSubscription(address);

    // Calculate potential savings
    const currentMonthlyQueries = analytics.totalQueries / 12; // Rough estimate
    const currentMonthlyCost = analytics.spending.totalSpent / 12;

    let recommendedPlan = 'pay-per-query';
    let potentialSavings = 0;

    if (currentMonthlyQueries > 1000) {
      recommendedPlan = 'Enterprise';
      potentialSavings = currentMonthlyCost - 100; // Enterprise is 100 SUI/month
    } else if (currentMonthlyQueries > 200) {
      recommendedPlan = 'Pro';
      potentialSavings = currentMonthlyCost - 20; // Pro is 20 SUI/month
    } else if (currentMonthlyQueries > 50) {
      recommendedPlan = 'Basic';
      potentialSavings = currentMonthlyCost - 5; // Basic is 5 SUI/month
    }

    const spending = {
      totalSpent: analytics.spending.totalSpent,
      queriesMade: analytics.spending.queriesMade,
      avgPerQuery: analytics.spending.avgPerQuery,
      subscriptionSavings: analytics.spending.subscriptionSavings,
      effectiveCostPerQuery: analytics.spending.effectiveCostPerQuery,

      // Current plan
      currentPlan: subscription?.tier || 'pay-per-query',

      // Recommendation
      recommendedPlan,
      potentialSavings: Math.max(0, potentialSavings),

      // Projections
      projectedMonthlySpend: currentMonthlyCost,
      projectedYearlySpend: currentMonthlyCost * 12,
    };

    res.json({
      success: true,
      data: spending,
      source: 'blockchain',
    });
  } catch (error: any) {
    console.error('Error fetching spending analytics:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch spending analytics',
    });
  }
});

/**
 * GET /api/v1/analytics/consumer/:address/roi
 * Get ROI analysis FROM BLOCKCHAIN
 */
router.get('/consumer/:address/roi', async (req: Request, res: Response) => {
  const { address } = req.params;

  try {
    const analytics = await getConsumerAnalytics(address);

    // In production, we'd track actual value generated
    // For now, estimate based on query volume
    const estimatedValuePerQuery = 2.0; // SUI
    const totalValueGenerated = analytics.totalQueries * estimatedValuePerQuery;

    const roi = {
      totalSpent: analytics.totalSpent,
      totalValueGenerated,
      roiPercentage: analytics.totalSpent > 0
        ? ((totalValueGenerated - analytics.totalSpent) / analytics.totalSpent) * 100
        : 0,

      // Cost efficiency
      costPerValueGenerated: totalValueGenerated > 0
        ? analytics.totalSpent / totalValueGenerated
        : 0,

      // Projections (simple extrapolation)
      projectedAnnualValue: totalValueGenerated * 12,
      projectedAnnualCost: analytics.totalSpent * 12,
      projectedROI: analytics.totalSpent > 0
        ? ((totalValueGenerated * 12 - analytics.totalSpent * 12) / (analytics.totalSpent * 12)) * 100
        : 0,
    };

    res.json({
      success: true,
      data: roi,
      source: 'blockchain',
      note: 'Value generated is estimated. In production, track actual prediction market revenue.',
    });
  } catch (error: any) {
    console.error('Error fetching ROI analytics:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch ROI analytics',
    });
  }
});

// ==================== Protocol Analytics ====================

/**
 * GET /api/v1/analytics/protocol
 * Get comprehensive protocol-wide analytics FROM BLOCKCHAIN
 */
router.get('/protocol', async (req: Request, res: Response) => {
  try {
    const [analytics, topProviders, revenueOverTime] = await Promise.all([
      getProtocolAnalytics(),
      getTopProviders(10),
      getRevenueOverTime(30),
    ]);

    res.json({
      success: true,
      data: {
        ...analytics,
        topProviders,
        revenueOverTime,
      },
      source: 'blockchain',
      network: process.env.SUI_NETWORK || 'testnet',
    });
  } catch (error: any) {
    console.error('Error fetching protocol analytics:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch protocol analytics',
      details: error.toString(),
    });
  }
});

/**
 * GET /api/v1/analytics/protocol/revenue
 * Get detailed revenue analytics FROM BLOCKCHAIN
 */
router.get('/protocol/revenue', async (req: Request, res: Response) => {
  try {
    const analytics = await getProtocolAnalytics();
    const revenueOverTime = await getRevenueOverTime(30);

    // Calculate time-based metrics
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;

    const today = revenueOverTime.filter(r => r.timestamp >= oneDayAgo)
      .reduce((sum, r) => sum + r.value, 0);

    const thisWeek = revenueOverTime.filter(r => r.timestamp >= oneWeekAgo)
      .reduce((sum, r) => sum + r.value, 0);

    const revenue = {
      total: analytics.revenue.totalRevenue,
      protocolShare: analytics.revenue.protocolShare,
      providerPayouts: analytics.revenue.providerPayouts,
      validatorRewards: analytics.revenue.validatorRewards,

      // Time periods
      today,
      thisWeek,
      thisMonth: analytics.revenue.monthlyRevenue,

      // Sources
      subscriptions: analytics.revenue.subscriptionRevenue,
      payPerQuery: analytics.revenue.queryRevenue,

      // Historical
      revenueOverTime,
    };

    res.json({
      success: true,
      data: revenue,
      source: 'blockchain',
    });
  } catch (error: any) {
    console.error('Error fetching revenue analytics:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch revenue analytics',
    });
  }
});

/**
 * GET /api/v1/analytics/protocol/growth
 * Get growth metrics FROM BLOCKCHAIN
 */
router.get('/protocol/growth', async (req: Request, res: Response) => {
  try {
    const analytics = await getProtocolAnalytics();

    const growth = {
      totalProviders: analytics.totalProviders,
      totalConsumers: analytics.totalConsumers,
      newProvidersThisMonth: analytics.growth.newProvidersThisMonth,
      newConsumersThisMonth: analytics.growth.newConsumersThisMonth,

      dau: analytics.growth.dau,
      mau: analytics.growth.mau,
      dauToMau: analytics.growth.mau > 0
        ? (analytics.growth.dau / analytics.growth.mau) * 100
        : 0,

      queryGrowthMoM: analytics.growth.queryGrowthRate,
      revenueGrowthMoM: analytics.growth.revenueGrowthRate,
    };

    res.json({
      success: true,
      data: growth,
      source: 'blockchain',
    });
  } catch (error: any) {
    console.error('Error fetching growth analytics:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch growth analytics',
    });
  }
});

/**
 * GET /api/v1/analytics/protocol/leaderboard
 * Get top providers and consumers FROM BLOCKCHAIN
 */
router.get('/protocol/leaderboard', async (req: Request, res: Response) => {
  const { type = 'providers', limit = 10 } = req.query;

  try {
    const topProviders = await getTopProviders(Number(limit));

    // For now, only providers leaderboard is implemented
    // Consumer leaderboard would require similar implementation

    res.json({
      success: true,
      data: type === 'providers' ? topProviders : [],
      source: 'blockchain',
    });
  } catch (error: any) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch leaderboard',
    });
  }
});

// ==================== Health Check ====================

/**
 * GET /api/v1/analytics/health
 * Check if blockchain connection is working
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    // Try to fetch protocol analytics to verify connection
    await getProtocolAnalytics();

    res.json({
      success: true,
      status: 'connected',
      network: process.env.SUI_NETWORK || 'testnet',
      packageId: process.env.SUI_PACKAGE_ID || 'not_set',
      timestamp: Date.now(),
    });
  } catch (error: any) {
    res.status(503).json({
      success: false,
      status: 'disconnected',
      error: error.message,
      network: process.env.SUI_NETWORK || 'testnet',
    });
  }
});

export default router;
