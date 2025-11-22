module proofplay::analytics {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::table::{Self, Table};
    use sui::transfer;
    use std::string::String;
    use std::option::{Self, Option};
    use std::vector;

    // ==================== public Structs ====================

    /// Provider analytics (per player)
    public struct ProviderAnalytics has key, store {
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
    public struct ConsumerAnalytics has key, store {
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
        subscription_savings: u64, 

        // Usage patterns
        most_queried_game: Option<String>,
        most_queried_provider: Option<address>,
        peak_query_hour: u8,

        // ROI metrics
        query_value_generated: u64, 
        roi_percentage: u64, 

        // Time tracking
        first_query_timestamp: u64,
        last_query_timestamp: u64,
        member_since: u64,
    }

    /// Protocol-wide analytics
    public struct ProtocolAnalytics has key {
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
        query_growth_rate: u64, 
        revenue_growth_rate: u64,

        // Performance metrics
        average_query_response_time: u64,
        verification_success_rate: u64,

        // Top lists
        top_providers: Table<u64, address>, // rank -> address
        top_consumers: Table<u64, address>,
        top_games: Table<u64, String>, // rank -> game_id
    }

    // ==================== Return public Structs (for view functions) ====================

    public struct ProviderSummary has drop {
        total_matches: u64,
        verified_matches: u64,
        total_revenue: u64,
        total_queries: u64,
        avg_revenue_per_match: u64,
        win_rate: u64,
        global_rank: u64,
    }

    public struct ProviderEarnings has drop {
        total_earned: u64,
        queries_served: u64,
        avg_per_query: u64,
        highest_match_revenue: u64,
    }

    public struct ProviderPerformance has drop {
        wins: u64,
        losses: u64,
        draws: u64,
        win_rate: u64,
        total_matches: u64,
    }

    public struct ConsumerSummary has drop {
        total_queries: u64,
        total_spent: u64,
        avg_cost_per_query: u64,
        has_subscription: bool,
        total_savings: u64,
        roi_percentage: u64,
    }

    public struct ConsumerSpending has drop {
        total_spent: u64,
        queries_made: u64,
        avg_per_query: u64,
        subscription_savings: u64,
        effective_cost_per_query: u64,
    }

    public struct SubscriptionStatus has drop {
        has_active: bool,
        tier: Option<u8>,
        total_savings: u64,
        recommended_tier: u8,
    }

    public struct ProtocolSummary has drop {
        total_matches: u64,
        total_queries: u64,
        total_revenue: u64,
        total_providers: u64,
        total_consumers: u64,
        active_subscriptions: u64,
    }

    public struct ProtocolRevenue has drop {
        total_revenue: u64,
        protocol_share: u64,
        provider_payouts: u64,
        validator_rewards: u64,
        monthly_revenue: u64,
        subscription_revenue: u64,
        query_revenue: u64,
    }

    public struct ProtocolGrowth has drop {
        dau: u64,
        mau: u64,
        query_growth_rate: u64,
        revenue_growth_rate: u64,
        new_providers_this_month: u64,
        new_consumers_this_month: u64,
    }

    // ==================== Initialization Functions (NEW) ====================

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

    /// Create a new analytics tracker for a provider
    public fun initialize_provider_analytics(ctx: &mut TxContext) {
        let provider = tx_context::sender(ctx);
        let analytics = ProviderAnalytics {
            id: object::new(ctx),
            provider,
            total_matches_submitted: 0,
            total_matches_verified: 0,
            matches_scheduled: 0,
            matches_completed: 0,
            total_revenue_earned: 0,
            total_queries_served: 0,
            average_revenue_per_match: 0,
            highest_earning_match_id: option::none(),
            highest_earning_match_revenue: 0,
            win_count: 0,
            loss_count: 0,
            draw_count: 0,
            win_rate: 0,
            games_played: table::new(ctx),
            first_match_timestamp: tx_context::epoch(ctx),
            last_match_timestamp: 0,
            provider_rank: 0,
        };
        // Share it so anyone can view stats, or transfer to user if private
        transfer::public_share_object(analytics); 
    }

    /// Create a new analytics tracker for a consumer
    public fun initialize_consumer_analytics(ctx: &mut TxContext) {
        let consumer = tx_context::sender(ctx);
        let analytics = ConsumerAnalytics {
            id: object::new(ctx),
            consumer,
            total_queries_made: 0,
            unique_matches_queried: 0,
            queries_this_month: 0,
            total_spent: 0,
            average_cost_per_query: 0,
            has_active_subscription: false,
            subscription_tier: option::none(),
            subscription_savings: 0,
            most_queried_game: option::none(),
            most_queried_provider: option::none(),
            peak_query_hour: 0,
            query_value_generated: 0,
            roi_percentage: 0,
            first_query_timestamp: tx_context::epoch(ctx),
            last_query_timestamp: 0,
            member_since: tx_context::epoch(ctx),
        };
        transfer::public_share_object(analytics);
    }

    // ==================== Update Functions ====================

    /// Update provider analytics when match is submitted
    /// `public(package)` ensures only modules in your package (Main contract) can call this
    public(package) fun update_provider_on_match_submit(
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
    public(package) fun update_provider_on_query(
        analytics: &mut ProviderAnalytics,
        match_id: String,
        revenue_earned: u64
    ) {
        analytics.total_queries_served = analytics.total_queries_served + 1;
        analytics.total_revenue_earned = analytics.total_revenue_earned + revenue_earned;

        if (analytics.total_matches_submitted > 0) {
            analytics.average_revenue_per_match =
                analytics.total_revenue_earned / analytics.total_matches_submitted;
        };

        if (revenue_earned > analytics.highest_earning_match_revenue) {
            analytics.highest_earning_match_revenue = revenue_earned;
            analytics.highest_earning_match_id = option::some(match_id);
        };
    }

    /// Update consumer analytics when query is made
    public(package) fun update_consumer_on_query(
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
    public(package) fun update_protocol_on_query(
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

    // ==================== View Functions ====================

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

    public fun get_provider_performance(analytics: &ProviderAnalytics): ProviderPerformance {
        ProviderPerformance {
            wins: analytics.win_count,
            losses: analytics.loss_count,
            draws: analytics.draw_count,
            win_rate: analytics.win_rate,
            total_matches: analytics.total_matches_submitted,
        }
    }

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

    public fun get_consumer_subscription_status(analytics: &ConsumerAnalytics): SubscriptionStatus {
        SubscriptionStatus {
            has_active: analytics.has_active_subscription,
            tier: analytics.subscription_tier,
            total_savings: analytics.subscription_savings,
            recommended_tier: calculate_recommended_tier(analytics.queries_this_month),
        }
    }

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

    public fun get_protocol_revenue(analytics: &ProtocolAnalytics): ProtocolRevenue {
        ProtocolRevenue {
            total_revenue: analytics.total_protocol_revenue,
            protocol_share: analytics.total_protocol_revenue,
            provider_payouts: analytics.total_provider_payouts,
            validator_rewards: analytics.total_validator_rewards,
            monthly_revenue: analytics.protocol_revenue_this_month,
            subscription_revenue: analytics.subscription_revenue_monthly,
            query_revenue: analytics.protocol_revenue_this_month - analytics.subscription_revenue_monthly,
        }
    }

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

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(ctx);
    }
}