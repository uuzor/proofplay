/// ProofPlay: Decentralized Gaming Oracle & Prediction Market Data Layer
///
/// This module enables players to submit verifiable proofs of match results,
/// stores them on Walrus, and allows prediction markets to query this data
/// while distributing revenue to data providers (players).
module proofplay::proofplay {
    use sui::object::{Self, UID, ID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::balance::{Self, Balance};
    use sui::table::{Self, Table};
    use sui::event;
    use std::string::{Self, String};
    use std::vector;

    // ==================== Error Codes ====================

    const E_PROOF_ALREADY_EXISTS: u64 = 1;
    const E_INVALID_PROOF: u64 = 2;
    const E_INSUFFICIENT_PAYMENT: u64 = 3;
    const E_PROOF_NOT_FOUND: u64 = 4;
    const E_NOT_AUTHORIZED: u64 = 5;
    const E_ALREADY_VERIFIED: u64 = 6;

    // ==================== Constants ====================

    const QUERY_PRICE: u64 = 50_000_000; // 0.05 SUI per query
    const PROVIDER_SHARE: u64 = 70; // 70% to data providers
    const PROTOCOL_SHARE: u64 = 20; // 20% to protocol
    const VALIDATOR_SHARE: u64 = 10; // 10% to validators

    // ==================== Structs ====================

    /// Core game proof structure stored on-chain with reference to Walrus storage
    struct GameProof has key, store {
        id: UID,
        game_id: String,
        match_id: String,
        player_address: address,
        opponent_address: address,
        outcome: u8, // 0=loss, 1=win, 2=draw
        kills: u64,
        deaths: u64,
        score: u64,
        timestamp: u64,
        walrus_blob_id: String, // Reference to full replay data on Walrus
        verified: bool,
        verifier: address,
    }

    /// Registry to track all submitted proofs
    struct ProofRegistry has key {
        id: UID,
        proofs: Table<String, ID>, // match_id -> GameProof ID
        proof_count: u64,
        total_queries: u64,
        revenue_pool: Balance<SUI>,
    }

    /// Data query record for prediction markets
    struct DataQuery has key, store {
        id: UID,
        consumer: address,
        match_id: String,
        query_type: u8, // 0=outcome, 1=stats, 2=full_data
        payment: u64,
        timestamp: u64,
    }

    /// Revenue claim tracker for data providers
    struct ProviderEarnings has key {
        id: UID,
        provider: address,
        total_earned: u64,
        pending_balance: Balance<SUI>,
        proofs_submitted: u64,
        queries_served: u64,
    }

    /// Admin capability for protocol management
    struct AdminCap has key, store {
        id: UID,
    }

    // ==================== Events ====================

    struct ProofSubmitted has copy, drop {
        match_id: String,
        player: address,
        game_id: String,
        walrus_blob_id: String,
        timestamp: u64,
    }

    struct ProofVerified has copy, drop {
        match_id: String,
        verifier: address,
        timestamp: u64,
    }

    struct DataQueried has copy, drop {
        match_id: String,
        consumer: address,
        payment: u64,
        timestamp: u64,
    }

    struct RevenueDistributed has copy, drop {
        provider: address,
        amount: u64,
        timestamp: u64,
    }

    // ==================== Init Function ====================

    fun init(ctx: &mut TxContext) {
        // Create admin capability
        let admin = AdminCap {
            id: object::new(ctx),
        };
        transfer::transfer(admin, tx_context::sender(ctx));

        // Create proof registry
        let registry = ProofRegistry {
            id: object::new(ctx),
            proofs: table::new(ctx),
            proof_count: 0,
            total_queries: 0,
            revenue_pool: balance::zero(),
        };
        transfer::share_object(registry);
    }

    // ==================== Player Functions ====================

    /// Submit a cryptographic proof of match results
    /// The actual replay data and detailed proofs are stored on Walrus
    public entry fun submit_proof(
        registry: &mut ProofRegistry,
        game_id: vector<u8>,
        match_id: vector<u8>,
        opponent_address: address,
        outcome: u8,
        kills: u64,
        deaths: u64,
        score: u64,
        walrus_blob_id: vector<u8>,
        ctx: &mut TxContext
    ) {
        let match_id_string = string::utf8(match_id);
        let game_id_string = string::utf8(game_id);
        let walrus_blob_string = string::utf8(walrus_blob_id);

        // Check if proof already exists
        assert!(!table::contains(&registry.proofs, match_id_string), E_PROOF_ALREADY_EXISTS);

        let proof = GameProof {
            id: object::new(ctx),
            game_id: game_id_string,
            match_id: match_id_string,
            player_address: tx_context::sender(ctx),
            opponent_address,
            outcome,
            kills,
            deaths,
            score,
            timestamp: tx_context::epoch(ctx),
            walrus_blob_id: walrus_blob_string,
            verified: false,
            verifier: @0x0,
        };

        let proof_id = object::id(&proof);

        // Add to registry
        table::add(&mut registry.proofs, match_id_string, proof_id);
        registry.proof_count = registry.proof_count + 1;

        // Emit event
        event::emit(ProofSubmitted {
            match_id: match_id_string,
            player: tx_context::sender(ctx),
            game_id: game_id_string,
            walrus_blob_id: walrus_blob_string,
            timestamp: tx_context::epoch(ctx),
        });

        // Share the proof object
        transfer::share_object(proof);

        // Initialize or update provider earnings
        create_provider_earnings_if_not_exists(tx_context::sender(ctx), ctx);
    }

    /// Verify a submitted proof (called by validators/Seal)
    public entry fun verify_proof(
        proof: &mut GameProof,
        ctx: &mut TxContext
    ) {
        // In production, this would check Seal validation
        // For MVP, we allow any verifier to validate
        assert!(!proof.verified, E_ALREADY_VERIFIED);

        proof.verified = true;
        proof.verifier = tx_context::sender(ctx);

        event::emit(ProofVerified {
            match_id: proof.match_id,
            verifier: tx_context::sender(ctx),
            timestamp: tx_context::epoch(ctx),
        });
    }

    // ==================== Prediction Market Functions ====================

    /// Query data from the oracle (prediction markets pay for this)
    public entry fun query_data(
        registry: &mut ProofRegistry,
        proof: &GameProof,
        query_type: u8,
        payment: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        // Verify proof exists and is verified
        assert!(proof.verified, E_INVALID_PROOF);

        let payment_value = coin::value(&payment);
        assert!(payment_value >= QUERY_PRICE, E_INSUFFICIENT_PAYMENT);

        // Add payment to revenue pool
        let payment_balance = coin::into_balance(payment);
        balance::join(&mut registry.revenue_pool, payment_balance);

        registry.total_queries = registry.total_queries + 1;

        // Create query record
        let query = DataQuery {
            id: object::new(ctx),
            consumer: tx_context::sender(ctx),
            match_id: proof.match_id,
            query_type,
            payment: payment_value,
            timestamp: tx_context::epoch(ctx),
        };

        event::emit(DataQueried {
            match_id: proof.match_id,
            consumer: tx_context::sender(ctx),
            payment: payment_value,
            timestamp: tx_context::epoch(ctx),
        });

        transfer::share_object(query);

        // Distribute revenue to provider
        distribute_query_revenue(
            registry,
            proof.player_address,
            payment_value,
            ctx
        );
    }

    // ==================== Revenue Distribution ====================

    /// Distribute revenue from a query to the data provider
    fun distribute_query_revenue(
        registry: &mut ProofRegistry,
        provider: address,
        total_payment: u64,
        ctx: &mut TxContext
    ) {
        // Calculate shares
        let provider_amount = (total_payment * PROVIDER_SHARE) / 100;
        let protocol_amount = (total_payment * PROTOCOL_SHARE) / 100;

        // Split from revenue pool
        let provider_balance = balance::split(&mut registry.revenue_pool, provider_amount);
        let provider_coin = coin::from_balance(provider_balance, ctx);

        // Transfer to provider
        transfer::public_transfer(provider_coin, provider);

        event::emit(RevenueDistributed {
            provider,
            amount: provider_amount,
            timestamp: tx_context::epoch(ctx),
        });
    }

    /// Withdraw protocol earnings (admin only)
    public entry fun withdraw_protocol_earnings(
        _admin: &AdminCap,
        registry: &mut ProofRegistry,
        amount: u64,
        ctx: &mut TxContext
    ) {
        let withdrawal = balance::split(&mut registry.revenue_pool, amount);
        let coin = coin::from_balance(withdrawal, ctx);
        transfer::public_transfer(coin, tx_context::sender(ctx));
    }

    // ==================== Helper Functions ====================

    fun create_provider_earnings_if_not_exists(
        provider: address,
        ctx: &mut TxContext
    ) {
        // In production, we'd check if it exists first
        // For MVP, we create a simple earnings tracker
        let earnings = ProviderEarnings {
            id: object::new(ctx),
            provider,
            total_earned: 0,
            pending_balance: balance::zero(),
            proofs_submitted: 1,
            queries_served: 0,
        };
        transfer::share_object(earnings);
    }

    // ==================== View Functions ====================

    public fun get_proof_outcome(proof: &GameProof): u8 {
        proof.outcome
    }

    public fun get_proof_stats(proof: &GameProof): (u64, u64, u64) {
        (proof.kills, proof.deaths, proof.score)
    }

    public fun get_walrus_blob_id(proof: &GameProof): String {
        proof.walrus_blob_id
    }

    public fun is_verified(proof: &GameProof): bool {
        proof.verified
    }

    public fun get_registry_stats(registry: &ProofRegistry): (u64, u64) {
        (registry.proof_count, registry.total_queries)
    }

    // ==================== Test Functions ====================

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(ctx);
    }
}
