/// ProofPlay Analytics Module
///
/// Provides comprehensive analytics and dashboard data for:
/// - Providers (players who submit match data)
/// - Consumers (prediction markets, analytics platforms)
/// - Protocol (overall platform metrics)
module proofplay::analytics {
    use sui::object::{Self, UID, ID};
    use sui::tx_context::{TxContext};
    use sui::table::{Self, Table};
    use sui::transfer;
    use std::string::String;
    use std::option::{Self, Option};

    // Import from main modules
    use proofplay::proofplay_v2::{MatchResult, ScheduledMatch, Subscription, MatchRegistry};

    // ==================== Structs ====================

    /// Provider analytics (per player)
    struct ProviderAnalytics has key, store {
        id: UID,
        provider: address,

        // Match statistics
        total_matches_submitted: u64,
        total_matches_verified: u64,
        matches_scheduled: u64,
        matches_completed: u64,

        // Revenue analytics
        total_revenue_earned: u64,
        total_queries_served: u64,
        average_revenue_per_match: u64,
        highest_earning_match_id: Option<String>,
        highest_earning_match_revenue: u64,

        // Performance metrics
        win_count: u64,
        loss_count: u64,
        draw_count: u64,
        win_rate: u64, // Percentage (0-100)

        // Game breakdown
        games_played: Table<String, u64>, // game_id -> count

        // Time tracking
        first_match_timestamp: u64,
        last_match_timestamp: u64,

        // Ranking
        provider_rank: u64, // Global rank by revenue
    }

    /// Consumer analytics (per prediction market / analytics platform)
    struct ConsumerAnalytics has key, store {
        id: UID,
        consumer: address,

        // Query statistics
        total_queries_made: u64,
        unique_matches_queried: u64,
        queries_this_month: u64,

        // Spending analytics
        total_spent: u64,
        average_cost_per_query: u64,

        // Subscription analytics
        has_active_subscription: bool,
        subscription_tier: Option<u8>,
        subscription_savings: u64, // Total saved via subscription

        // Usage patterns
        most_queried_game: Option<String>,
        most_queried_provider: Option<address>,
        peak_query_hour: u8,

        // ROI metrics
        query_value_generated: u64, // Estimated value from queries
        roi_percentage: u64, // Return on investment

        // Time tracking
        first_query_timestamp: u64,
        last_query_timestamp: u64,
        member_since: u64,
    }

    /// Protocol-wide analytics
    struct ProtocolAnalytics has key {
        id: UID,

        // Overall metrics
        total_matches_scheduled: u64,
        total_matches_completed: u64,
        total_queries_processed: u64,

        // Revenue analytics
        total_protocol_revenue: u64,
        total_provider_payouts: u64,
        total_validator_rewards: u64,
        protocol_revenue_this_month: u64,

        // User analytics
        total_providers: u64,
        total_consumers: u64,
        active_providers_this_month: u64,
        active_consumers_this_month: u64,

        // Subscription analytics
        total_subscriptions_active: u64,
        basic_subscribers: u64,
        pro_subscribers: u64,
        enterprise_subscribers: u64,
        subscription_revenue_monthly: u64,

        // Game analytics
        total_games_supported: u64,
        most_popular_game: Option<String>,
        most_popular_game_matches: u64,

        // Growth metrics
        daily_active_users: u64,
        monthly_active_users: u64,
        query_growth_rate: u64, // Percentage month-over-month
        revenue_growth_rate: u64,

        // Performance metrics
        average_query_response_time: u64,
        verification_success_rate: u64,

        // Top lists
        top_providers: Table<u64, address>, // rank -> address
        top_consumers: Table<u64, address>,
        top_games: Table<u64, String>, // rank -> game_id
    }

    /// Time-series data point
    struct TimeSeriesDataPoint has store, drop, copy {
        timestamp: u64,
        value: u64,
    }

    /// Historical analytics (for charts)
    struct HistoricalAnalytics has key, store {
        id: UID,

        // Revenue over time
        daily_revenue: Table<u64, u64>, // epoch -> revenue
        monthly_revenue: Table<u64, u64>,

        // Queries over time
        daily_queries: Table<u64, u64>,
        monthly_queries: Table<u64, u64>,

        // User growth over time
        daily_new_providers: Table<u64, u64>,
        daily_new_consumers: Table<u64, u64>,

        // Match volume over time
        daily_matches: Table<u64, u64>,
        monthly_matches: Table<u64, u64>,
    }

    // ==================== View Functions for Providers ====================

    /// Get provider dashboard summary
    public fun get_provider_summary(analytics: &ProviderAnalytics): ProviderSummary {
        ProviderSummary {
            total_matches: analytics.total_matches_submitted,
            verified_matches: analytics.total_matches_verified,
            total_revenue: analytics.total_revenue_earned,
            total_queries: analytics.total_queries_served,
            avg_revenue_per_match: analytics.average_revenue_per_match,
            win_rate: analytics.win_rate,
            global_rank: analytics.provider_rank,
        }
    }

    /// Get provider earnings breakdown
    public fun get_provider_earnings(analytics: &ProviderAnalytics): ProviderEarnings {
        ProviderEarnings {
            total_earned: analytics.total_revenue_earned,
            queries_served: analytics.total_queries_served,
            avg_per_query: if (analytics.total_queries_served > 0) {
                analytics.total_revenue_earned / analytics.total_queries_served
            } else { 0 },
            highest_match_revenue: analytics.highest_earning_match_revenue,
        }
    }

    /// Get provider performance stats
    public fun get_provider_performance(analytics: &ProviderAnalytics): ProviderPerformance {
        ProviderPerformance {
            wins: analytics.win_count,
            losses: analytics.loss_count,
            draws: analytics.draw_count,
            win_rate: analytics.win_rate,
            total_matches: analytics.total_matches_submitted,
        }
    }

    // ==================== View Functions for Consumers ====================

    /// Get consumer dashboard summary
    public fun get_consumer_summary(analytics: &ConsumerAnalytics): ConsumerSummary {
        ConsumerSummary {
            total_queries: analytics.total_queries_made,
            total_spent: analytics.total_spent,
            avg_cost_per_query: analytics.average_cost_per_query,
            has_subscription: analytics.has_active_subscription,
            total_savings: analytics.subscription_savings,
            roi_percentage: analytics.roi_percentage,
        }
    }

    /// Get consumer spending analytics
    public fun get_consumer_spending(analytics: &ConsumerAnalytics): ConsumerSpending {
        ConsumerSpending {
            total_spent: analytics.total_spent,
            queries_made: analytics.total_queries_made,
            avg_per_query: analytics.average_cost_per_query,
            subscription_savings: analytics.subscription_savings,
            effective_cost_per_query: if (analytics.total_queries_made > 0) {
                (analytics.total_spent - analytics.subscription_savings) / analytics.total_queries_made
            } else { 0 },
        }
    }

    /// Get consumer subscription status
    public fun get_consumer_subscription_status(analytics: &ConsumerAnalytics): SubscriptionStatus {
        SubscriptionStatus {
            has_active: analytics.has_active_subscription,
            tier: analytics.subscription_tier,
            total_savings: analytics.subscription_savings,
            recommended_tier: calculate_recommended_tier(analytics.queries_this_month),
        }
    }

    // ==================== View Functions for Protocol ====================

    /// Get protocol dashboard summary
    public fun get_protocol_summary(analytics: &ProtocolAnalytics): ProtocolSummary {
        ProtocolSummary {
            total_matches: analytics.total_matches_completed,
            total_queries: analytics.total_queries_processed,
            total_revenue: analytics.total_protocol_revenue,
            total_providers: analytics.total_providers,
            total_consumers: analytics.total_consumers,
            active_subscriptions: analytics.total_subscriptions_active,
        }
    }

    /// Get protocol revenue analytics
    public fun get_protocol_revenue(analytics: &ProtocolAnalytics): ProtocolRevenue {
        ProtocolRevenue {
            total_revenue: analytics.total_protocol_revenue,
            protocol_share: analytics.total_protocol_revenue, // 20% of total
            provider_payouts: analytics.total_provider_payouts, // 70% of total
            validator_rewards: analytics.total_validator_rewards, // 10% of total
            monthly_revenue: analytics.protocol_revenue_this_month,
            subscription_revenue: analytics.subscription_revenue_monthly,
            query_revenue: analytics.protocol_revenue_this_month - analytics.subscription_revenue_monthly,
        }
    }

    /// Get protocol growth metrics
    public fun get_protocol_growth(analytics: &ProtocolAnalytics): ProtocolGrowth {
        ProtocolGrowth {
            dau: analytics.daily_active_users,
            mau: analytics.monthly_active_users,
            query_growth_rate: analytics.query_growth_rate,
            revenue_growth_rate: analytics.revenue_growth_rate,
            new_providers_this_month: analytics.active_providers_this_month,
            new_consumers_this_month: analytics.active_consumers_this_month,
        }
    }

    /// Get top providers leaderboard
    public fun get_top_providers(analytics: &ProtocolAnalytics, limit: u64): vector<address> {
        let mut result = vector::empty<address>();
        let mut i = 0;

        while (i < limit && table::contains(&analytics.top_providers, i)) {
            let provider = *table::borrow(&analytics.top_providers, i);
            vector::push_back(&mut result, provider);
            i = i + 1;
        };

        result
    }

    // ==================== Helper Functions ====================

    fun calculate_recommended_tier(monthly_queries: u64): u8 {
        if (monthly_queries > 1000) {
            2 // Enterprise
        } else if (monthly_queries > 200) {
            1 // Pro
        } else if (monthly_queries > 50) {
            0 // Basic
        } else {
            255 // Pay-per-query recommended
        }
    }

    // ==================== Return Structs (for view functions) ====================

    struct ProviderSummary has drop {
        total_matches: u64,
        verified_matches: u64,
        total_revenue: u64,
        total_queries: u64,
        avg_revenue_per_match: u64,
        win_rate: u64,
        global_rank: u64,
    }

    struct ProviderEarnings has drop {
        total_earned: u64,
        queries_served: u64,
        avg_per_query: u64,
        highest_match_revenue: u64,
    }

    struct ProviderPerformance has drop {
        wins: u64,
        losses: u64,
        draws: u64,
        win_rate: u64,
        total_matches: u64,
    }

    struct ConsumerSummary has drop {
        total_queries: u64,
        total_spent: u64,
        avg_cost_per_query: u64,
        has_subscription: bool,
        total_savings: u64,
        roi_percentage: u64,
    }

    struct ConsumerSpending has drop {
        total_spent: u64,
        queries_made: u64,
        avg_per_query: u64,
        subscription_savings: u64,
        effective_cost_per_query: u64,
    }

    struct SubscriptionStatus has drop {
        has_active: bool,
        tier: Option<u8>,
        total_savings: u64,
        recommended_tier: u8,
    }

    struct ProtocolSummary has drop {
        total_matches: u64,
        total_queries: u64,
        total_revenue: u64,
        total_providers: u64,
        total_consumers: u64,
        active_subscriptions: u64,
    }

    struct ProtocolRevenue has drop {
        total_revenue: u64,
        protocol_share: u64,
        provider_payouts: u64,
        validator_rewards: u64,
        monthly_revenue: u64,
        subscription_revenue: u64,
        query_revenue: u64,
    }

    struct ProtocolGrowth has drop {
        dau: u64,
        mau: u64,
        query_growth_rate: u64,
        revenue_growth_rate: u64,
        new_providers_this_month: u64,
        new_consumers_this_month: u64,
    }

    // ==================== Update Functions ====================

    /// Update provider analytics when match is submitted
    public(friend) fun update_provider_on_match_submit(
        analytics: &mut ProviderAnalytics,
        is_win: bool,
        is_draw: bool,
        ctx: &TxContext
    ) {
        analytics.total_matches_submitted = analytics.total_matches_submitted + 1;

        if (is_win) {
            analytics.win_count = analytics.win_count + 1;
        } else if (is_draw) {
            analytics.draw_count = analytics.draw_count + 1;
        } else {
            analytics.loss_count = analytics.loss_count + 1;
        };

        let total = analytics.total_matches_submitted;
        if (total > 0) {
            analytics.win_rate = (analytics.win_count * 100) / total;
        };

        analytics.last_match_timestamp = tx_context::epoch(ctx);
    }

    /// Update provider analytics when query is made
    public(friend) fun update_provider_on_query(
        analytics: &mut ProviderAnalytics,
        match_id: String,
        revenue_earned: u64
    ) {
        analytics.total_queries_served = analytics.total_queries_served + 1;
        analytics.total_revenue_earned = analytics.total_revenue_earned + revenue_earned;

        // Update average
        if (analytics.total_matches_submitted > 0) {
            analytics.average_revenue_per_match =
                analytics.total_revenue_earned / analytics.total_matches_submitted;
        };

        // Update highest earning match
        if (revenue_earned > analytics.highest_earning_match_revenue) {
            analytics.highest_earning_match_revenue = revenue_earned;
            analytics.highest_earning_match_id = option::some(match_id);
        };
    }

    /// Update consumer analytics when query is made
    public(friend) fun update_consumer_on_query(
        analytics: &mut ConsumerAnalytics,
        cost: u64,
        ctx: &TxContext
    ) {
        analytics.total_queries_made = analytics.total_queries_made + 1;
        analytics.queries_this_month = analytics.queries_this_month + 1;
        analytics.total_spent = analytics.total_spent + cost;

        if (analytics.total_queries_made > 0) {
            analytics.average_cost_per_query =
                analytics.total_spent / analytics.total_queries_made;
        };

        analytics.last_query_timestamp = tx_context::epoch(ctx);
    }

    /// Update protocol analytics
    public(friend) fun update_protocol_on_query(
        analytics: &mut ProtocolAnalytics,
        protocol_revenue: u64,
        provider_payout: u64,
        validator_reward: u64
    ) {
        analytics.total_queries_processed = analytics.total_queries_processed + 1;
        analytics.total_protocol_revenue = analytics.total_protocol_revenue + protocol_revenue;
        analytics.total_provider_payouts = analytics.total_provider_payouts + provider_payout;
        analytics.total_validator_rewards = analytics.total_validator_rewards + validator_reward;
        analytics.protocol_revenue_this_month = analytics.protocol_revenue_this_month + protocol_revenue;
    }

    // ==================== Initialization ====================

    fun init(ctx: &mut TxContext) {
        let protocol_analytics = ProtocolAnalytics {
            id: object::new(ctx),
            total_matches_scheduled: 0,
            total_matches_completed: 0,
            total_queries_processed: 0,
            total_protocol_revenue: 0,
            total_provider_payouts: 0,
            total_validator_rewards: 0,
            protocol_revenue_this_month: 0,
            total_providers: 0,
            total_consumers: 0,
            active_providers_this_month: 0,
            active_consumers_this_month: 0,
            total_subscriptions_active: 0,
            basic_subscribers: 0,
            pro_subscribers: 0,
            enterprise_subscribers: 0,
            subscription_revenue_monthly: 0,
            total_games_supported: 0,
            most_popular_game: option::none(),
            most_popular_game_matches: 0,
            daily_active_users: 0,
            monthly_active_users: 0,
            query_growth_rate: 0,
            revenue_growth_rate: 0,
            average_query_response_time: 0,
            verification_success_rate: 100,
            top_providers: table::new(ctx),
            top_consumers: table::new(ctx),
            top_games: table::new(ctx),
        };

        transfer::share_object(protocol_analytics);
    }

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(ctx);
    }
}
