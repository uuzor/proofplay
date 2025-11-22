
#[allow(unused_const)]
module proofplay::proofplay_v2 {
    use sui::object::{Self, UID, ID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::balance::{Self, Balance};
    use sui::table::{Self, Table};
    use sui::event;
    use std::string::{Self, String};

    // ==================== IMPORTS ====================
    // We import the other two modules here to link the ecosystem
    use proofplay::analytics::{Self, ProviderAnalytics, ConsumerAnalytics, ProtocolAnalytics};
    use proofplay::walrus_integration::{Self, BlobRegistry, WalrusBlob};

    // ==================== Error Codes ====================
    const E_MATCH_ALREADY_SCHEDULED: u64 = 1;
    const E_MATCH_NOT_SCHEDULED: u64 = 2;
    const E_MATCH_ALREADY_COMPLETED: u64 = 3;
    const E_MATCH_NOT_STARTED: u64 = 4;
    const E_INSUFFICIENT_PAYMENT: u64 = 5;
    const E_NOT_AUTHORIZED: u64 = 6;
    const E_INVALID_SUBSCRIPTION: u64 = 7;
    const E_SUBSCRIPTION_EXPIRED: u64 = 8;
    const E_INVALID_QUERY_TYPE: u64 = 9;
    const E_MATCH_NOT_VERIFIED: u64 = 10;
    const E_MATCH_LOCKED: u64 = 11;
    const E_INVALID_WALRUS_BLOB: u64 = 12; // New error for Walrus

    // ==================== Constants ====================
    const QUERY_PRICE: u64 = 50_000_000; 
    const SUBSCRIPTION_BASIC: u64 = 5_000_000_000;    
    const SUBSCRIPTION_PRO: u64 = 20_000_000_000;     
    const SUBSCRIPTION_ENTERPRISE: u64 = 100_000_000_000; 

    const PROVIDER_SHARE: u64 = 70;  
    const PROTOCOL_SHARE: u64 = 20;  
    const VALIDATOR_SHARE: u64 = 10; 

    const MATCH_STATE_SCHEDULED: u8 = 0;
    const MATCH_STATE_COMPLETED: u8 = 1;
    const MATCH_STATE_VERIFIED: u8 = 2;
    const MATCH_STATE_DISPUTED: u8 = 3;

    const TIER_BASIC: u8 = 0;
    const TIER_PRO: u8 = 1;
    const TIER_ENTERPRISE: u8 = 2;

    // ==================== Structs ====================

    /// Scheduled match (Phase 1 - before match happens)
    public struct ScheduledMatch has key, store {
        id: UID,
        match_id: String,
        game_id: String,
        player_a: address,
        player_b: address,
        scheduled_time: u64,
        created_at: u64,
        state: u8,
        locked: bool, 
    }

    /// Player statistics for a match
    public struct PlayerStats has store, drop, copy {
        kills: u64,
        deaths: u64,
        assists: u64,
        score: u64,
        mvp: bool,
    }

    /// Match result with proof (Phase 2 - after match happens)
    public struct MatchResult has key, store {
        id: UID,
        match_id: String,
        scheduled_match_id: ID, 
        submitter: address,     
        winner: address,        
        player_a_stats: PlayerStats,
        player_b_stats: PlayerStats,
        walrus_blob_id: String, 
        proof_hash: String,     
        verified: bool,
        verifier: address,
        submitted_at: u64,
        query_count: u64,       
        revenue_earned: u64,    
    }

    /// Subscription for data consumers
    public struct Subscription has key, store {
        id: UID,
        subscriber: address,
        tier: u8,
        queries_remaining: u64,
        valid_until: u64,
        created_at: u64,
        total_queries_used: u64,
    }

    /// Provider earnings tracker
    public struct ProviderEarnings has key, store {
        id: UID,
        provider: address,
        total_earned: u64,
        pending_balance: Balance<SUI>,
        matches_submitted: u64,
        total_queries_served: u64,
        last_payout: u64,
    }

    /// Global registry
    public struct MatchRegistry has key {
        id: UID,
        scheduled_matches: Table<String, ID>,
        completed_matches: Table<String, ID>,
        total_matches_scheduled: u64,
        total_matches_completed: u64,
        total_queries: u64,
        protocol_balance: Balance<SUI>,
        validator_pool: Balance<SUI>,
    }

    /// Admin capability
    public struct AdminCap has key, store {
        id: UID,
    }

    // ==================== Events ====================

    public struct MatchScheduled has copy, drop {
        match_id: String,
        game_id: String,
        player_a: address,
        player_b: address,
        scheduled_time: u64,
    }

    public struct MatchResultSubmitted has copy, drop {
        match_id: String,
        submitter: address,
        winner: address,
        walrus_blob_id: String,
    }

    public struct MatchVerified has copy, drop {
        match_id: String,
        verifier: address,
    }

    public struct QueryExecuted has copy, drop {
        match_id: String,
        consumer: address,
        provider_paid: u64,
        query_type: u8,
    }

    public struct SubscriptionCreated has copy, drop {
        subscriber: address,
        tier: u8,
        valid_until: u64,
        queries_included: u64,
    }

    public struct ProviderPaid has copy, drop {
        provider: address,
        amount: u64,
        match_id: String,
    }

    // ==================== Init ====================

    fun init(ctx: &mut TxContext) {
        let admin = AdminCap {
            id: object::new(ctx),
        };
        transfer::public_transfer(admin, tx_context::sender(ctx));

        let registry = MatchRegistry {
            id: object::new(ctx),
            scheduled_matches: table::new(ctx),
            completed_matches: table::new(ctx),
            total_matches_scheduled: 0,
            total_matches_completed: 0,
            total_queries: 0,
            protocol_balance: balance::zero(),
            validator_pool: balance::zero(),
        };
        transfer::share_object(registry);
    }

    // ==================== Phase 1: Schedule Match ====================

    public fun schedule_match(
        registry: &mut MatchRegistry,
        match_id: vector<u8>,
        game_id: vector<u8>,
        player_b: address,
        scheduled_time: u64,
        ctx: &mut TxContext
    ) {
        let match_id_string = string::utf8(match_id);
        let game_id_string = string::utf8(game_id);
        let player_a = tx_context::sender(ctx);

        assert!(!table::contains(&registry.scheduled_matches, match_id_string), E_MATCH_ALREADY_SCHEDULED);

        let scheduled = ScheduledMatch {
            id: object::new(ctx),
            match_id: match_id_string,
            game_id: game_id_string,
            player_a,
            player_b,
            scheduled_time,
            created_at: tx_context::epoch(ctx),
            state: MATCH_STATE_SCHEDULED,
            locked: false,
        };

        let scheduled_id = object::id(&scheduled);

        table::add(&mut registry.scheduled_matches, match_id_string, scheduled_id);
        registry.total_matches_scheduled = registry.total_matches_scheduled + 1;

        event::emit(MatchScheduled {
            match_id: match_id_string,
            game_id: game_id_string,
            player_a,
            player_b,
            scheduled_time,
        });

        transfer::public_share_object(scheduled);
    }

    public fun lock_scheduled_match(
        scheduled: &mut ScheduledMatch,
        ctx: &mut TxContext
    ) {
        let current_time = tx_context::epoch(ctx);
        assert!(current_time >= scheduled.scheduled_time, E_MATCH_NOT_STARTED);
        assert!(!scheduled.locked, E_MATCH_LOCKED);
        scheduled.locked = true;
    }

    // ==================== Phase 2: Submit Result ====================

    public fun submit_match_result(
        registry: &mut MatchRegistry,
        scheduled: &mut ScheduledMatch,
        // Walrus Integration: We pass the blob object to verify it exists
        walrus_blob: &WalrusBlob, 
        winner_address: address, 
        player_a_kills: u64,
        player_a_deaths: u64,
        player_a_assists: u64,
        player_a_score: u64,
        player_a_mvp: bool,
        player_b_kills: u64,
        player_b_deaths: u64,
        player_b_assists: u64,
        player_b_score: u64,
        player_b_mvp: bool,
        proof_hash: vector<u8>,
        // Analytics Integration: Update provider stats immediately
        provider_analytics: &mut ProviderAnalytics,
        ctx: &mut TxContext
    ) {
        let submitter = tx_context::sender(ctx);

        assert!(
            submitter == scheduled.player_a || submitter == scheduled.player_b,
            E_NOT_AUTHORIZED
        );
        assert!(scheduled.locked, E_MATCH_NOT_STARTED);
        assert!(scheduled.state == MATCH_STATE_SCHEDULED, E_MATCH_ALREADY_COMPLETED);

        // Walrus Check: Verify the blob passed matches the submitter
        let (blob_id_str, _, _) = walrus_integration::get_blob(walrus_blob);
        // In a strict version, we could check if blob.uploader == submitter

        let player_a_stats = PlayerStats {
            kills: player_a_kills,
            deaths: player_a_deaths,
            assists: player_a_assists,
            score: player_a_score,
            mvp: player_a_mvp,
        };

        let player_b_stats = PlayerStats {
            kills: player_b_kills,
            deaths: player_b_deaths,
            assists: player_b_assists,
            score: player_b_score,
            mvp: player_b_mvp,
        };

        let result = MatchResult {
            id: object::new(ctx),
            match_id: scheduled.match_id,
            scheduled_match_id: object::id(scheduled),
            submitter,
            winner: winner_address,
            player_a_stats,
            player_b_stats,
            walrus_blob_id: blob_id_str, // Store the verified blob ID string
            proof_hash: string::utf8(proof_hash),
            verified: false,
            verifier: @0x0,
            submitted_at: tx_context::epoch(ctx),
            query_count: 0,
            revenue_earned: 0,
        };

        let result_id = object::id(&result);
        scheduled.state = MATCH_STATE_COMPLETED;

        table::add(&mut registry.completed_matches, scheduled.match_id, result_id);
        registry.total_matches_completed = registry.total_matches_completed + 1;

        event::emit(MatchResultSubmitted {
            match_id: scheduled.match_id,
            submitter,
            winner: winner_address,
            walrus_blob_id: blob_id_str,
        });

        // Analytics Update: Track win/loss/draw
        let is_win = submitter == winner_address;
        let is_draw = winner_address == @0x0;
        
        analytics::update_provider_on_match_submit(
            provider_analytics, 
            is_win, 
            is_draw, 
            ctx
        );

        initialize_provider_earnings_if_needed(submitter, ctx);
        transfer::public_share_object(result);
    }

    public fun verify_match_result(
        scheduled: &mut ScheduledMatch,
        result: &mut MatchResult,
        ctx: &mut TxContext
    ) {
        assert!(!result.verified, E_MATCH_ALREADY_COMPLETED);
        assert!(result.scheduled_match_id == object::id(scheduled), E_MATCH_NOT_SCHEDULED);

        result.verified = true;
        result.verifier = tx_context::sender(ctx);
        scheduled.state = MATCH_STATE_VERIFIED;

        event::emit(MatchVerified {
            match_id: result.match_id,
            verifier: tx_context::sender(ctx),
        });
    }

    // ==================== Pay-Per-View Query ====================

    public fun query_match_result(
        registry: &mut MatchRegistry,
        result: &mut MatchResult,
        payment: Coin<SUI>,
        query_type: u8,
        // Analytics Integration: All 3 analytics objects required
        provider_analytics: &mut ProviderAnalytics,
        consumer_analytics: &mut ConsumerAnalytics,
        protocol_analytics: &mut ProtocolAnalytics,
        ctx: &mut TxContext
    ) {
        assert!(result.verified, E_MATCH_NOT_VERIFIED);
        let payment_value = coin::value(&payment);
        assert!(payment_value >= QUERY_PRICE, E_INSUFFICIENT_PAYMENT);

        let provider_amount = (payment_value * PROVIDER_SHARE) / 100;
        let protocol_amount = (payment_value * PROTOCOL_SHARE) / 100;
        let validator_amount = (payment_value * VALIDATOR_SHARE) / 100;

        let mut payment_balance = coin::into_balance(payment);
        let provider_payment = balance::split(&mut payment_balance, provider_amount);
        
        let provider_coin = coin::from_balance(provider_payment, ctx);
        transfer::public_transfer(provider_coin, result.submitter);

        let protocol_payment = balance::split(&mut payment_balance, protocol_amount);
        balance::join(&mut registry.protocol_balance, protocol_payment);

        let validator_payment = balance::split(&mut payment_balance, validator_amount);
        balance::join(&mut registry.validator_pool, validator_payment);

        balance::destroy_zero(payment_balance);

        result.query_count = result.query_count + 1;
        result.revenue_earned = result.revenue_earned + provider_amount;
        registry.total_queries = registry.total_queries + 1;

        event::emit(QueryExecuted {
            match_id: result.match_id,
            consumer: tx_context::sender(ctx),
            provider_paid: provider_amount,
            query_type,
        });

        event::emit(ProviderPaid {
            provider: result.submitter,
            amount: provider_amount,
            match_id: result.match_id,
        });

        // Analytics Updates
        analytics::update_provider_on_query(
            provider_analytics, 
            result.match_id, 
            provider_amount
        );
        
        analytics::update_consumer_on_query(
            consumer_analytics, 
            payment_value, 
            ctx
        );

        analytics::update_protocol_on_query(
            protocol_analytics,
            protocol_amount,
            provider_amount,
            validator_amount
        );
    }

    // ==================== Subscription Service ====================

    public fun create_subscription(
        tier: u8,
        payment: Coin<SUI>,
        ctx: &mut TxContext
    ): Subscription {
        let payment_value = coin::value(&payment);
        let subscriber = tx_context::sender(ctx);

        let (required_payment, queries_included, duration) = if (tier == TIER_BASIC) {
            (SUBSCRIPTION_BASIC, 200, 30) 
        } else if (tier == TIER_PRO) {
            (SUBSCRIPTION_PRO, 1000, 30)
        } else if (tier == TIER_ENTERPRISE) {
            (SUBSCRIPTION_ENTERPRISE, 1000000, 30) 
        } else {
            abort E_INVALID_SUBSCRIPTION
        };

        assert!(payment_value >= required_payment, E_INSUFFICIENT_PAYMENT);

        let current_epoch = tx_context::epoch(ctx);
        let valid_until = current_epoch + duration;

        let subscription = Subscription {
            id: object::new(ctx),
            subscriber,
            tier,
            queries_remaining: queries_included,
            valid_until,
            created_at: current_epoch,
            total_queries_used: 0,
        };

        event::emit(SubscriptionCreated {
            subscriber,
            tier,
            valid_until,
            queries_included,
        });

        transfer::public_transfer(payment, @0x0); 
        
        subscription // Return object as per linter
    }

    public fun query_with_subscription(
        registry: &mut MatchRegistry,
        result: &mut MatchResult,
        subscription: &mut Subscription,
        query_type: u8,
        // Analytics Integration (Even free queries need tracking)
        provider_analytics: &mut ProviderAnalytics,
        consumer_analytics: &mut ConsumerAnalytics,
        ctx: &mut TxContext
    ) {
        assert!(subscription.subscriber == tx_context::sender(ctx), E_NOT_AUTHORIZED);
        assert!(subscription.queries_remaining > 0, E_INVALID_SUBSCRIPTION);
        assert!(tx_context::epoch(ctx) <= subscription.valid_until, E_SUBSCRIPTION_EXPIRED);
        assert!(result.verified, E_MATCH_NOT_VERIFIED);

        subscription.queries_remaining = subscription.queries_remaining - 1;
        subscription.total_queries_used = subscription.total_queries_used + 1;

        result.query_count = result.query_count + 1;
        registry.total_queries = registry.total_queries + 1;

        event::emit(QueryExecuted {
            match_id: result.match_id,
            consumer: tx_context::sender(ctx),
            provider_paid: 0, 
            query_type,
        });

        // Analytics Updates (0 revenue, but increment query counts)
        analytics::update_provider_on_query(
            provider_analytics, 
            result.match_id, 
            0 
        );

        // Update consumer stats (0 cost, but tracks usage)
        analytics::update_consumer_on_query(
            consumer_analytics, 
            0, 
            ctx
        );
    }

    // ==================== Helper Functions ====================

    fun initialize_provider_earnings_if_needed(
        provider: address,
        ctx: &mut TxContext
    ) {
        let earnings = ProviderEarnings {
            id: object::new(ctx),
            provider,
            total_earned: 0,
            pending_balance: balance::zero(),
            matches_submitted: 1,
            total_queries_served: 0,
            last_payout: 0,
        };
        transfer::public_share_object(earnings);
    }

    // ==================== View Functions ====================

    public fun get_match_state(scheduled: &ScheduledMatch): u8 {
        scheduled.state
    }

    public fun is_match_verified(result: &MatchResult): bool {
        result.verified
    }

    public fun get_query_count(result: &MatchResult): u64 {
        result.query_count
    }

    public fun get_revenue_earned(result: &MatchResult): u64 {
        result.revenue_earned
    }

    public fun get_subscription_queries_remaining(subscription: &Subscription): u64 {
        subscription.queries_remaining
    }

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(ctx);
    }
}

