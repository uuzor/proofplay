/// Walrus Integration Module for ProofPlay
///
/// Handles storing and retrieving game replay data and cryptographic proofs
/// from Walrus decentralized storage network
module proofplay::walrus_integration {
    use sui::object::{Self, UID};
    use sui::tx_context::{TxContext};
    use sui::transfer;
    use sui::event;
    use std::string::{Self, String};
    use std::vector;

    // ==================== Error Codes ====================

    const E_BLOB_NOT_FOUND: u64 = 100;
    const E_INVALID_BLOB_ID: u64 = 101;
    const E_STORAGE_FAILED: u64 = 102;

    // ==================== Structs ====================

    /// Represents a blob stored on Walrus
    struct WalrusBlob has key, store {
        id: UID,
        blob_id: String,
        content_type: String, // e.g., "application/json", "video/mp4"
        size_bytes: u64,
        uploader: address,
        timestamp: u64,
        metadata: String, // JSON metadata about the blob
    }

    /// Registry of all blobs uploaded to Walrus
    struct BlobRegistry has key {
        id: UID,
        total_blobs: u64,
        total_bytes_stored: u64,
    }

    /// Metadata for match replay stored on Walrus
    struct MatchReplayMetadata has store, drop, copy {
        match_id: String,
        game_id: String,
        duration_seconds: u64,
        replay_format: String, // e.g., "demo", "replay", "json"
    }

    // ==================== Events ====================

    struct BlobStored has copy, drop {
        blob_id: String,
        uploader: address,
        size_bytes: u64,
        content_type: String,
        timestamp: u64,
    }

    struct BlobRetrieved has copy, drop {
        blob_id: String,
        requester: address,
        timestamp: u64,
    }

    // ==================== Init Function ====================

    fun init(ctx: &mut TxContext) {
        let registry = BlobRegistry {
            id: object::new(ctx),
            total_blobs: 0,
            total_bytes_stored: 0,
        };
        transfer::share_object(registry);
    }

    // ==================== Storage Functions ====================

    /// Store match replay data on Walrus
    /// In production, this would interact with Walrus HTTP API
    /// For MVP, we create a reference object
    public entry fun store_match_replay(
        registry: &mut BlobRegistry,
        blob_id: vector<u8>,
        content_type: vector<u8>,
        size_bytes: u64,
        metadata: vector<u8>,
        ctx: &mut TxContext
    ) {
        let blob_id_string = string::utf8(blob_id);
        let content_type_string = string::utf8(content_type);
        let metadata_string = string::utf8(metadata);

        let blob = WalrusBlob {
            id: object::new(ctx),
            blob_id: blob_id_string,
            content_type: content_type_string,
            size_bytes,
            uploader: tx_context::sender(ctx),
            timestamp: tx_context::epoch(ctx),
            metadata: metadata_string,
        };

        registry.total_blobs = registry.total_blobs + 1;
        registry.total_bytes_stored = registry.total_bytes_stored + size_bytes;

        event::emit(BlobStored {
            blob_id: blob_id_string,
            uploader: tx_context::sender(ctx),
            size_bytes,
            content_type: content_type_string,
            timestamp: tx_context::epoch(ctx),
        });

        transfer::share_object(blob);
    }

    /// Store cryptographic proof data on Walrus
    public entry fun store_proof_data(
        registry: &mut BlobRegistry,
        blob_id: vector<u8>,
        proof_data: vector<u8>,
        ctx: &mut TxContext
    ) {
        let blob_id_string = string::utf8(blob_id);
        let proof_json = string::utf8(proof_data);

        let blob = WalrusBlob {
            id: object::new(ctx),
            blob_id: blob_id_string,
            content_type: string::utf8(b"application/json"),
            size_bytes: vector::length(&proof_data),
            uploader: tx_context::sender(ctx),
            timestamp: tx_context::epoch(ctx),
            metadata: proof_json,
        };

        registry.total_blobs = registry.total_blobs + 1;
        registry.total_bytes_stored = registry.total_bytes_stored + vector::length(&proof_data);

        event::emit(BlobStored {
            blob_id: blob_id_string,
            uploader: tx_context::sender(ctx),
            size_bytes: vector::length(&proof_data),
            content_type: string::utf8(b"application/json"),
            timestamp: tx_context::epoch(ctx),
        });

        transfer::share_object(blob);
    }

    /// Retrieve blob metadata (actual data is fetched from Walrus HTTP API)
    public fun get_blob(blob: &WalrusBlob): (String, String, u64) {
        (blob.blob_id, blob.content_type, blob.size_bytes)
    }

    /// Emit event when blob is retrieved
    public entry fun log_blob_retrieval(
        blob: &WalrusBlob,
        ctx: &mut TxContext
    ) {
        event::emit(BlobRetrieved {
            blob_id: blob.blob_id,
            requester: tx_context::sender(ctx),
            timestamp: tx_context::epoch(ctx),
        });
    }

    // ==================== View Functions ====================

    public fun get_blob_id(blob: &WalrusBlob): String {
        blob.blob_id
    }

    public fun get_registry_stats(registry: &BlobRegistry): (u64, u64) {
        (registry.total_blobs, registry.total_bytes_stored)
    }

    // ==================== Test Functions ====================

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(ctx);
    }
}
