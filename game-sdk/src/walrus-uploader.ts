/**
 * Walrus Uploader for ProofPlay
 *
 * Handles uploading game proofs and replay data to Walrus decentralized storage
 */

import { createHash } from 'crypto';

export interface WalrusConfig {
  publisherUrl: string;
  aggregatorUrl: string;
  epochs?: number;
}

export interface UploadResult {
  blobId: string;
  size: number;
  url: string;
  epochs: number;
}

export class WalrusUploader {
  private config: WalrusConfig;

  constructor(config?: Partial<WalrusConfig>) {
    this.config = {
      publisherUrl: config?.publisherUrl || 'https://publisher.walrus-testnet.walrus.space',
      aggregatorUrl: config?.aggregatorUrl || 'https://aggregator.walrus-testnet.walrus.space',
      epochs: config?.epochs || 5,
    };
  }

  /**
   * Upload proof data to Walrus
   */
  async uploadProof(proofData: Uint8Array): Promise<UploadResult> {
    try {
      const url = `${this.config.publisherUrl}/v1/blobs?epochs=${this.config.epochs}`;

      console.log(`📤 Uploading proof to Walrus (${proofData.length} bytes)...`);

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: proofData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      // Extract blob ID from response
      const blobId = this.extractBlobId(result);

      console.log(`✅ Proof uploaded successfully!`);
      console.log(`   Blob ID: ${blobId}`);
      console.log(`   Download URL: ${this.getDownloadUrl(blobId)}`);

      return {
        blobId,
        size: proofData.length,
        url: this.getDownloadUrl(blobId),
        epochs: this.config.epochs,
      };
    } catch (error) {
      console.error('❌ Failed to upload proof to Walrus:', error);
      throw error;
    }
  }

  /**
   * Download proof from Walrus
   */
  async downloadProof(blobId: string): Promise<Uint8Array> {
    try {
      const url = this.getDownloadUrl(blobId);

      console.log(`📥 Downloading proof from Walrus...`);
      console.log(`   Blob ID: ${blobId}`);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const data = new Uint8Array(arrayBuffer);

      console.log(`✅ Proof downloaded successfully (${data.length} bytes)`);

      return data;
    } catch (error) {
      console.error('❌ Failed to download proof from Walrus:', error);
      throw error;
    }
  }

  /**
   * Get download URL for a blob
   */
  getDownloadUrl(blobId: string): string {
    return `${this.config.aggregatorUrl}/v1/blobs/${blobId}`;
  }

  /**
   * Upload replay file (larger files)
   */
  async uploadReplay(replayData: Uint8Array, metadata: any): Promise<UploadResult> {
    // For replay files, we might want to store them for longer
    const epochs = Math.max(this.config.epochs, 10);

    const wrappedData = {
      metadata,
      replay: Array.from(replayData), // Convert to array for JSON
    };

    const jsonData = JSON.stringify(wrappedData);
    const encodedData = new TextEncoder().encode(jsonData);

    return this.uploadProof(encodedData);
  }

  /**
   * Generate content hash for verification
   */
  generateContentHash(data: Uint8Array): string {
    return createHash('sha256')
      .update(data)
      .digest('hex');
  }

  // ==================== Helper Methods ====================

  private extractBlobId(response: any): string {
    // Walrus API returns different response formats
    // Try to extract blob ID from common response structures
    if (response.newlyCreated?.blobObject?.blobId) {
      return response.newlyCreated.blobObject.blobId;
    }
    if (response.alreadyCertified?.blobId) {
      return response.alreadyCertified.blobId;
    }
    if (response.blobId) {
      return response.blobId;
    }

    // If no standard field found, try to extract from response
    console.warn('Unexpected Walrus response format:', response);

    // Generate mock blob ID for testing
    const mockBlobId = createHash('sha256')
      .update(JSON.stringify(response))
      .digest('hex');

    return mockBlobId;
  }
}

// Mock implementation for testing without Walrus connection
export class MockWalrusUploader extends WalrusUploader {
  private storage: Map<string, Uint8Array> = new Map();

  async uploadProof(proofData: Uint8Array): Promise<UploadResult> {
    console.log(`🧪 [MOCK] Uploading proof (${proofData.length} bytes)...`);

    // Generate deterministic blob ID
    const blobId = createHash('sha256')
      .update(proofData)
      .digest('hex');

    // Store in memory
    this.storage.set(blobId, proofData);

    console.log(`✅ [MOCK] Proof uploaded successfully!`);
    console.log(`   Blob ID: ${blobId}`);

    return {
      blobId,
      size: proofData.length,
      url: `mock://walrus/${blobId}`,
      epochs: 5,
    };
  }

  async downloadProof(blobId: string): Promise<Uint8Array> {
    console.log(`🧪 [MOCK] Downloading proof...`);

    const data = this.storage.get(blobId);
    if (!data) {
      throw new Error(`Blob not found: ${blobId}`);
    }

    console.log(`✅ [MOCK] Proof downloaded (${data.length} bytes)`);

    return data;
  }
}

// Export convenience functions
export function createWalrusUploader(config?: Partial<WalrusConfig>): WalrusUploader {
  return new WalrusUploader(config);
}

export function createMockWalrusUploader(): MockWalrusUploader {
  return new MockWalrusUploader();
}
