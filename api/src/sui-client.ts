/**
 * Sui Blockchain Client
 *
 * Handles all interactions with Sui blockchain to fetch real data
 * for analytics dashboards
 */

import { SuiClient, SuiObjectResponse } from '@mysten/sui/client';
import { normalizeStructTag } from '@mysten/sui/utils';

// Configuration
const SUI_NETWORK = process.env.SUI_NETWORK || 'testnet';
const PACKAGE_ID = process.env.SUI_PACKAGE_ID || '';
const ANALYTICS_PACKAGE_ID = process.env.ANALYTICS_PACKAGE_ID || PACKAGE_ID;

// Initialize Sui client
const suiClient = new SuiClient({
  url: getSuiRpcUrl(SUI_NETWORK),
});

function getSuiRpcUrl(network: string): string {
  switch (network) {
    case 'mainnet':
      return 'https://fullnode.mainnet.sui.io:443';
    case 'testnet':
      return 'https://fullnode.testnet.sui.io:443';
    case 'devnet':
      return 'https://fullnode.devnet.sui.io:443';
    case 'localnet':
      return 'http://127.0.0.1:9000';
    default:
      return 'https://fullnode.testnet.sui.io:443';
  }
}

// ==================== Type Definitions ====================

interface ProviderAnalyticsOnChain {
  provider: string;
  total_matches_submitted: string;
  total_matches_verified: string;
  matches_scheduled: string;
  matches_completed: string;
  total_revenue_earned: string;
  total_queries_served: string;
  average_revenue_per_match: string;
  highest_earning_match_revenue: string;
  win_count: string;
  loss_count: string;
  draw_count: string;
  win_rate: string;
  provider_rank: string;
  first_match_timestamp: string;
  last_match_timestamp: string;
}

interface ConsumerAnalyticsOnChain {
  consumer: string;
  total_queries_made: string;
  unique_matches_queried: string;
  queries_this_month: string;
  total_spent: string;
  average_cost_per_query: string;
  has_active_subscription: boolean;
  subscription_tier: number | null;
  subscription_savings: string;
  roi_percentage: string;
  first_query_timestamp: string;
  last_query_timestamp: string;
  member_since: string;
}

interface ProtocolAnalyticsOnChain {
  total_matches_scheduled: string;
  total_matches_completed: string;
  total_queries_processed: string;
  total_protocol_revenue: string;
  total_provider_payouts: string;
  total_validator_rewards: string;
  protocol_revenue_this_month: string;
  total_providers: string;
  total_consumers: string;
  active_providers_this_month: string;
  active_consumers_this_month: string;
  total_subscriptions_active: string;
  basic_subscribers: string;
  pro_subscribers: string;
  enterprise_subscribers: string;
  subscription_revenue_monthly: string;
  daily_active_users: string;
  monthly_active_users: string;
  query_growth_rate: string;
  revenue_growth_rate: string;
}

interface MatchResultOnChain {
  id: { id: string };
  match_id: string;
  submitter: string;
  winner: string;
  query_count: string;
  revenue_earned: string;
  verified: boolean;
  walrus_blob_id: string;
  submitted_at: string;
}

// ==================== Provider Analytics ====================

/**
 * Get provider analytics from blockchain
 */
export async function getProviderAnalytics(providerAddress: string) {
  try {
    // Find ProviderAnalytics object for this address
    const analyticsObjects = await suiClient.getOwnedObjects({
      owner: providerAddress,
      filter: {
        StructType: `${ANALYTICS_PACKAGE_ID}::analytics::ProviderAnalytics`,
      },
      options: {
        showContent: true,
        showType: true,
      },
    });

    if (analyticsObjects.data.length === 0) {
      // No analytics yet, return empty data
      return createEmptyProviderAnalytics(providerAddress);
    }

    // Get the analytics object
    const analyticsObj = analyticsObjects.data[0];
    const content = analyticsObj.data?.content;

    if (content?.dataType !== 'moveObject') {
      throw new Error('Invalid analytics object');
    }

    const fields = content.fields as any;

    // Convert to our format
    return {
      provider: providerAddress,
      totalMatches: parseInt(fields.total_matches_submitted || '0'),
      verifiedMatches: parseInt(fields.total_matches_verified || '0'),
      totalRevenue: parseFloat(fields.total_revenue_earned || '0') / 1e9, // Convert from MIST to SUI
      totalQueries: parseInt(fields.total_queries_served || '0'),
      avgRevenuePerMatch: parseFloat(fields.average_revenue_per_match || '0') / 1e9,
      winRate: parseFloat(fields.win_rate || '0'),
      globalRank: parseInt(fields.provider_rank || '0'),

      earnings: {
        totalEarned: parseFloat(fields.total_revenue_earned || '0') / 1e9,
        queriesServed: parseInt(fields.total_queries_served || '0'),
        avgPerQuery: parseInt(fields.total_queries_served || '0') > 0
          ? (parseFloat(fields.total_revenue_earned || '0') / 1e9) / parseInt(fields.total_queries_served)
          : 0,
        highestMatchRevenue: parseFloat(fields.highest_earning_match_revenue || '0') / 1e9,
      },

      performance: {
        wins: parseInt(fields.win_count || '0'),
        losses: parseInt(fields.loss_count || '0'),
        draws: parseInt(fields.draw_count || '0'),
        winRate: parseFloat(fields.win_rate || '0'),
      },
    };
  } catch (error) {
    console.error('Error fetching provider analytics:', error);
    throw error;
  }
}

/**
 * Get provider's match history
 */
export async function getProviderMatchHistory(providerAddress: string, limit: number = 10) {
  try {
    // Query MatchResult objects where submitter = providerAddress
    const matchObjects = await suiClient.queryEvents({
      query: {
        MoveEventType: `${PACKAGE_ID}::proofplay_v2::MatchResultSubmitted`,
      },
    });

    // Filter for this provider and parse
    const matches = matchObjects.data
      .filter((event: any) => event.parsedJson?.submitter === providerAddress)
      .slice(0, limit)
      .map((event: any) => {
        const data = event.parsedJson;
        return {
          matchId: data.match_id,
          gameId: 'CS2', // Would need to look up from ScheduledMatch
          outcome: determineOutcome(data.winner, providerAddress),
          revenue: 0, // Would need to query MatchResult object for revenue_earned
          queries: 0, // Would need to query MatchResult object for query_count
          timestamp: event.timestampMs || Date.now(),
        };
      });

    return matches;
  } catch (error) {
    console.error('Error fetching match history:', error);
    return [];
  }
}

/**
 * Get top earning matches for a provider
 */
export async function getTopEarningMatches(providerAddress: string, limit: number = 3) {
  try {
    // Query all MatchResult objects for this provider
    const allObjects = await suiClient.getOwnedObjects({
      owner: providerAddress,
      filter: {
        StructType: `${PACKAGE_ID}::proofplay_v2::MatchResult`,
      },
      options: {
        showContent: true,
      },
    });

    // Parse and sort by revenue
    const matches = await Promise.all(
      allObjects.data.map(async (obj) => {
        const objDetails = await suiClient.getObject({
          id: obj.data?.objectId!,
          options: { showContent: true },
        });

        const content = objDetails.data?.content;
        if (content?.dataType !== 'moveObject') return null;

        const fields = content.fields as any;

        return {
          matchId: fields.match_id,
          gameId: 'CS2', // Would look up from scheduled match
          revenue: parseFloat(fields.revenue_earned || '0') / 1e9,
          queries: parseInt(fields.query_count || '0'),
        };
      })
    );

    // Filter nulls and sort by revenue
    return matches
      .filter((m): m is NonNullable<typeof m> => m !== null)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  } catch (error) {
    console.error('Error fetching top earning matches:', error);
    return [];
  }
}

// ==================== Consumer Analytics ====================

/**
 * Get consumer analytics from blockchain
 */
export async function getConsumerAnalytics(consumerAddress: string) {
  try {
    const analyticsObjects = await suiClient.getOwnedObjects({
      owner: consumerAddress,
      filter: {
        StructType: `${ANALYTICS_PACKAGE_ID}::analytics::ConsumerAnalytics`,
      },
      options: {
        showContent: true,
      },
    });

    if (analyticsObjects.data.length === 0) {
      return createEmptyConsumerAnalytics(consumerAddress);
    }

    const analyticsObj = analyticsObjects.data[0];
    const content = analyticsObj.data?.content;

    if (content?.dataType !== 'moveObject') {
      throw new Error('Invalid analytics object');
    }

    const fields = content.fields as any;

    return {
      consumer: consumerAddress,
      totalQueries: parseInt(fields.total_queries_made || '0'),
      totalSpent: parseFloat(fields.total_spent || '0') / 1e9,
      avgCostPerQuery: parseFloat(fields.average_cost_per_query || '0') / 1e9,
      hasSubscription: fields.has_active_subscription || false,
      totalSavings: parseFloat(fields.subscription_savings || '0') / 1e9,
      roiPercentage: parseFloat(fields.roi_percentage || '0'),

      spending: {
        totalSpent: parseFloat(fields.total_spent || '0') / 1e9,
        queriesMade: parseInt(fields.total_queries_made || '0'),
        avgPerQuery: parseFloat(fields.average_cost_per_query || '0') / 1e9,
        subscriptionSavings: parseFloat(fields.subscription_savings || '0') / 1e9,
        effectiveCostPerQuery: calculateEffectiveCost(fields),
      },

      subscription: {
        hasActive: fields.has_active_subscription || false,
        tier: fields.subscription_tier?.vec?.[0] !== undefined
          ? getTierName(fields.subscription_tier.vec[0])
          : undefined,
        totalSavings: parseFloat(fields.subscription_savings || '0') / 1e9,
        recommendedTier: calculateRecommendedTier(parseInt(fields.queries_this_month || '0')),
      },
    };
  } catch (error) {
    console.error('Error fetching consumer analytics:', error);
    throw error;
  }
}

/**
 * Get consumer's subscription status
 */
export async function getConsumerSubscription(consumerAddress: string) {
  try {
    const subscriptions = await suiClient.getOwnedObjects({
      owner: consumerAddress,
      filter: {
        StructType: `${PACKAGE_ID}::proofplay_v2::Subscription`,
      },
      options: {
        showContent: true,
      },
    });

    if (subscriptions.data.length === 0) {
      return null;
    }

    const subObj = subscriptions.data[0];
    const content = subObj.data?.content;

    if (content?.dataType !== 'moveObject') {
      return null;
    }

    const fields = content.fields as any;

    return {
      tier: getTierName(parseInt(fields.tier)),
      queriesRemaining: parseInt(fields.queries_remaining || '0'),
      validUntil: parseInt(fields.valid_until || '0'),
      totalQueriesUsed: parseInt(fields.total_queries_used || '0'),
    };
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return null;
  }
}

// ==================== Protocol Analytics ====================

/**
 * Get protocol-wide analytics from blockchain
 */
export async function getProtocolAnalytics() {
  try {
    // Protocol analytics is a shared object, need to find it
    // In production, we'd store the object ID in environment variable
    const protocolAnalyticsId = process.env.PROTOCOL_ANALYTICS_ID;

    if (!protocolAnalyticsId) {
      throw new Error('PROTOCOL_ANALYTICS_ID not set');
    }

    const analyticsObj = await suiClient.getObject({
      id: protocolAnalyticsId,
      options: {
        showContent: true,
      },
    });

    const content = analyticsObj.data?.content;

    if (content?.dataType !== 'moveObject') {
      throw new Error('Invalid protocol analytics object');
    }

    const fields = content.fields as any;

    return {
      totalMatches: parseInt(fields.total_matches_completed || '0'),
      totalQueries: parseInt(fields.total_queries_processed || '0'),
      totalRevenue: parseFloat(fields.total_protocol_revenue || '0') / 1e9,
      totalProviders: parseInt(fields.total_providers || '0'),
      totalConsumers: parseInt(fields.total_consumers || '0'),
      activeSubscriptions: parseInt(fields.total_subscriptions_active || '0'),

      revenue: {
        totalRevenue: parseFloat(fields.total_protocol_revenue || '0') / 1e9,
        protocolShare: parseFloat(fields.total_protocol_revenue || '0') / 1e9,
        providerPayouts: parseFloat(fields.total_provider_payouts || '0') / 1e9,
        validatorRewards: parseFloat(fields.total_validator_rewards || '0') / 1e9,
        monthlyRevenue: parseFloat(fields.protocol_revenue_this_month || '0') / 1e9,
        subscriptionRevenue: parseFloat(fields.subscription_revenue_monthly || '0') / 1e9,
        queryRevenue: (parseFloat(fields.protocol_revenue_this_month || '0') - parseFloat(fields.subscription_revenue_monthly || '0')) / 1e9,
      },

      growth: {
        dau: parseInt(fields.daily_active_users || '0'),
        mau: parseInt(fields.monthly_active_users || '0'),
        queryGrowthRate: parseFloat(fields.query_growth_rate || '0'),
        revenueGrowthRate: parseFloat(fields.revenue_growth_rate || '0'),
        newProvidersThisMonth: parseInt(fields.active_providers_this_month || '0'),
        newConsumersThisMonth: parseInt(fields.active_consumers_this_month || '0'),
      },
    };
  } catch (error) {
    console.error('Error fetching protocol analytics:', error);
    throw error;
  }
}

/**
 * Get top providers leaderboard
 */
export async function getTopProviders(limit: number = 10) {
  try {
    // Query all provider analytics objects
    const allProviders = await suiClient.queryEvents({
      query: {
        MoveEventType: `${PACKAGE_ID}::proofplay_v2::ProviderPaid`,
      },
    });

    // Aggregate by provider
    const providerRevenue = new Map<string, number>();

    allProviders.data.forEach((event: any) => {
      const provider = event.parsedJson?.provider;
      const amount = parseFloat(event.parsedJson?.amount || '0') / 1e9;

      if (provider) {
        providerRevenue.set(
          provider,
          (providerRevenue.get(provider) || 0) + amount
        );
      }
    });

    // Sort and return top N
    return Array.from(providerRevenue.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([address, revenue], index) => ({
        rank: index + 1,
        address,
        revenue,
      }));
  } catch (error) {
    console.error('Error fetching top providers:', error);
    return [];
  }
}

/**
 * Get revenue over time from events
 */
export async function getRevenueOverTime(days: number = 30) {
  try {
    const events = await suiClient.queryEvents({
      query: {
        MoveEventType: `${PACKAGE_ID}::proofplay_v2::QueryExecuted`,
      },
    });

    // Aggregate by day
    const dailyRevenue = new Map<string, number>();

    events.data.forEach((event: any) => {
      const timestamp = event.timestampMs || Date.now();
      const day = new Date(timestamp).toISOString().split('T')[0];
      const amount = parseFloat(event.parsedJson?.provider_paid || '0') / 1e9;

      dailyRevenue.set(day, (dailyRevenue.get(day) || 0) + amount);
    });

    // Convert to array and fill missing days
    const result = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const day = date.toISOString().split('T')[0];

      result.push({
        timestamp: date.getTime(),
        value: dailyRevenue.get(day) || 0,
      });
    }

    return result;
  } catch (error) {
    console.error('Error fetching revenue over time:', error);
    return [];
  }
}

// ==================== Helper Functions ====================

function createEmptyProviderAnalytics(address: string) {
  return {
    provider: address,
    totalMatches: 0,
    verifiedMatches: 0,
    totalRevenue: 0,
    totalQueries: 0,
    avgRevenuePerMatch: 0,
    winRate: 0,
    globalRank: 0,
    earnings: {
      totalEarned: 0,
      queriesServed: 0,
      avgPerQuery: 0,
      highestMatchRevenue: 0,
    },
    performance: {
      wins: 0,
      losses: 0,
      draws: 0,
      winRate: 0,
    },
  };
}

function createEmptyConsumerAnalytics(address: string) {
  return {
    consumer: address,
    totalQueries: 0,
    totalSpent: 0,
    avgCostPerQuery: 0,
    hasSubscription: false,
    totalSavings: 0,
    roiPercentage: 0,
    spending: {
      totalSpent: 0,
      queriesMade: 0,
      avgPerQuery: 0,
      subscriptionSavings: 0,
      effectiveCostPerQuery: 0,
    },
    subscription: {
      hasActive: false,
      tier: undefined,
      totalSavings: 0,
      recommendedTier: 'pay-per-query',
    },
  };
}

function determineOutcome(winner: string, playerAddress: string): 'win' | 'loss' | 'draw' {
  if (winner === '0x0' || winner === '0x0000000000000000000000000000000000000000000000000000000000000000') {
    return 'draw';
  }
  return winner === playerAddress ? 'win' : 'loss';
}

function getTierName(tier: number): string {
  switch (tier) {
    case 0: return 'Basic';
    case 1: return 'Pro';
    case 2: return 'Enterprise';
    default: return 'Unknown';
  }
}

function calculateEffectiveCost(fields: any): number {
  const totalSpent = parseFloat(fields.total_spent || '0') / 1e9;
  const savings = parseFloat(fields.subscription_savings || '0') / 1e9;
  const queries = parseInt(fields.total_queries_made || '0');

  if (queries === 0) return 0;
  return (totalSpent - savings) / queries;
}

function calculateRecommendedTier(monthlyQueries: number): string {
  if (monthlyQueries > 1000) return 'Enterprise';
  if (monthlyQueries > 200) return 'Pro';
  if (monthlyQueries > 50) return 'Basic';
  return 'pay-per-query';
}

// Export client for direct use
export { suiClient };
