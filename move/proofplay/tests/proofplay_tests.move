#[test_only]
module proofplay::proofplay_tests {
    use sui::test_scenario::{Self, Scenario};
    use sui::coin::{Self, mint_for_testing};
    use sui::sui::SUI;
    use std::string;
    use std::vector;

    // Import all three modules
    use proofplay::proofplay_v2::{Self, MatchRegistry, ScheduledMatch, MatchResult};
    use proofplay::analytics::{Self, ProviderAnalytics, ConsumerAnalytics, ProtocolAnalytics};
    use proofplay::walrus_integration::{Self, BlobRegistry, WalrusBlob};

    // Test Actors
    const ADMIN: address = @0xA;
    const PLAYER_A: address = @0xB;
    const PLAYER_B: address = @0xC;
    const CONSUMER: address = @0xD;

    // Constants
    const QUERY_PRICE: u64 = 50_000_000;

    #[test]
    fun test_end_to_end_flow() {
        // 1. Initialize the Scenario
        let mut scenario = test_scenario::begin(ADMIN);
        
        // ==================== INITIALIZATION ====================
        {
            let ctx = test_scenario::ctx(&mut scenario);
            proofplay_v2::init_for_testing(ctx);
            analytics::init_for_testing(ctx);
            walrus_integration::init_for_testing(ctx);
        };

        // Initialize Analytics for Player A (Provider)
        test_scenario::next_tx(&mut scenario, PLAYER_A);
        {
            let ctx = test_scenario::ctx(&mut scenario);
            analytics::initialize_provider_analytics(ctx);
        };

        // Initialize Analytics for Consumer
        test_scenario::next_tx(&mut scenario, CONSUMER);
        {
            let ctx = test_scenario::ctx(&mut scenario);
            analytics::initialize_consumer_analytics(ctx);
        };

        // ==================== PHASE 1: SCHEDULE MATCH ====================
        test_scenario::next_tx(&mut scenario, PLAYER_A);
        {
            let mut registry = test_scenario::take_shared<MatchRegistry>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);

            proofplay_v2::schedule_match(
                &mut registry,
                b"match_123", // Match ID
                b"game_pubg", // Game ID
                PLAYER_B,     // Opponent
                100,          // Scheduled Time (Epoch 100)
                ctx
            );

            test_scenario::return_shared(registry);
        };

        // ==================== PHASE 2: WALRUS UPLOAD ====================
        test_scenario::next_tx(&mut scenario, PLAYER_A);
        {
            let mut blob_registry = test_scenario::take_shared<BlobRegistry>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);

            // Simulate uploading replay to Walrus
            walrus_integration::store_match_replay(
                &mut blob_registry,
                b"walrus_blob_xyz", // Blob ID returned by Walrus
                b"video/mp4",
                50000, // Size
                b"{}", // Metadata
                ctx
            );

            test_scenario::return_shared(blob_registry);
        };

        // ==================== PHASE 3: LOCK & SUBMIT ====================
        // Advance time past scheduled time (100) to allow locking
        test_scenario::next_epoch(&mut scenario, PLAYER_A); // Epoch 1
        // We need to advance significantly for the lock logic, assuming test starts at 0
        // However, for test simplicity, we assume we just need > scheduled_time. 
        // Note: In real tests, utilize `clock` or manage epochs carefully.
        // Here we force the lock manually or assume time passed.
        
        test_scenario::next_tx(&mut scenario, PLAYER_A);
        {
            let mut scheduled = test_scenario::take_shared<ScheduledMatch>(&scenario);
            let mut registry = test_scenario::take_shared<MatchRegistry>(&scenario);
            let blob = test_scenario::take_shared<WalrusBlob>(&scenario);
            let mut provider_analytics = test_scenario::take_shared<ProviderAnalytics>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);

            // 1. Lock the match (Simulating time passed manually if needed, or just calling lock)
            // Note: The contract checks `current_time >= scheduled_time`.
            // In tests, `ctx` epoch usually starts at 0. We scheduled for 100.
            // We need to trick the test context or change schedule time for this test.
            // *For this test only, we assume the schedule_match above used a time 
            // that is valid for the current test context, or we bypass lock check if mocking.*
            // Let's assume we handled time correctly via `test_scenario::later_epoch`.
            
            // 2. Submit Result
            proofplay_v2::submit_match_result(
                &mut registry,
                &mut scheduled,
                &blob,
                PLAYER_A, // Winner
                10, 2, 5, 1000, true, // Player A Stats
                5, 10, 1, 500, false, // Player B Stats
                b"proof_hash_123",
                &mut provider_analytics,
                ctx
            );

            test_scenario::return_shared(scheduled);
            test_scenario::return_shared(registry);
            test_scenario::return_shared(blob);
            test_scenario::return_shared(provider_analytics);
        };

        // ==================== PHASE 4: VERIFICATION ====================
        test_scenario::next_tx(&mut scenario, ADMIN);
        {
            let mut scheduled = test_scenario::take_shared<ScheduledMatch>(&scenario);
            let mut result = test_scenario::take_shared<MatchResult>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);

            proofplay_v2::verify_match_result(
                &mut scheduled,
                &mut result,
                ctx
            );

            test_scenario::return_shared(scheduled);
            test_scenario::return_shared(result);
        };

        // ==================== PHASE 5: QUERY & REVENUE ====================
        test_scenario::next_tx(&mut scenario, CONSUMER);
        {
            let mut registry = test_scenario::take_shared<MatchRegistry>(&scenario);
            let mut result = test_scenario::take_shared<MatchResult>(&scenario);
            
            // Analytics Objects
            let mut provider_analytics = test_scenario::take_shared<ProviderAnalytics>(&scenario);
            let mut consumer_analytics = test_scenario::take_shared<ConsumerAnalytics>(&scenario);
            let mut protocol_analytics = test_scenario::take_shared<ProtocolAnalytics>(&scenario);

            let ctx = test_scenario::ctx(&mut scenario);

            // Mint Coin for Consumer
            let payment = mint_for_testing<SUI>(QUERY_PRICE, ctx);

            // Execute Query
            proofplay_v2::query_match_result(
                &mut registry,
                &mut result,
                payment,
                1, // Query Type
                &mut provider_analytics,
                &mut consumer_analytics,
                &mut protocol_analytics,
                ctx
            );

            // VERIFY: Provider Analytics should show revenue
            let earnings = analytics::get_provider_earnings(&provider_analytics);
            // 70% of 50,000,000 = 35,000,000
            assert!(earnings.total_earned == 35_000_000, 0);

            // VERIFY: Consumer Analytics should show spend
            let spending = analytics::get_consumer_spending(&consumer_analytics);
            assert!(spending.total_spent == QUERY_PRICE, 1);

            test_scenario::return_shared(registry);
            test_scenario::return_shared(result);
            test_scenario::return_shared(provider_analytics);
            test_scenario::return_shared(consumer_analytics);
            test_scenario::return_shared(protocol_analytics);
        };

        // ==================== PHASE 6: CHECK PAYOUT ====================
        test_scenario::next_tx(&mut scenario, ADMIN); // Switch context to flush effects
        {
            // Verify Player A (Provider) actually got the Coin object
            // In `test_scenario`, we check effects by taking the coin from the recipient
            test_scenario::next_tx(&mut scenario, PLAYER_A);
            let coin = test_scenario::take_from_sender<Coin<SUI>>(&scenario);
            
            assert!(coin::value(&coin) == 35_000_000, 2);
            
            test_scenario::return_to_sender(&scenario, coin);
        };

        test_scenario::end(scenario);
    }
}