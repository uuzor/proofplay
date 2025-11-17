/**
 * ProofPlay Game Proof Generator
 *
 * Generates cryptographic proofs of match results that can be
 * verified and stored on Walrus
 */

import { createHash, randomBytes } from 'crypto';

export interface MatchData {
  gameId: string;
  matchId: string;
  playerAddress: string;
  opponentAddress: string;
  outcome: 0 | 1 | 2; // 0=loss, 1=win, 2=draw
  kills: number;
  deaths: number;
  score: number;
  timestamp: number;
  gameState: any;
}

export interface GameProof {
  matchData: MatchData;
  proofHash: string;
  signature: string;
  metadata: {
    version: string;
    algorithm: string;
    generatedAt: number;
  };
}

export class ProofGenerator {
  private gameId: string;

  constructor(gameId: string = 'CS2') {
    this.gameId = gameId;
  }

  /**
   * Generate a mock match with random data
   */
  generateMockMatch(playerAddress: string): MatchData {
    const outcomes = [0, 1, 2] as const;
    const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];

    return {
      gameId: this.gameId,
      matchId: this.generateMatchId(),
      playerAddress,
      opponentAddress: this.generateRandomAddress(),
      outcome,
      kills: Math.floor(Math.random() * 30),
      deaths: Math.floor(Math.random() * 30),
      score: Math.floor(Math.random() * 10000),
      timestamp: Date.now(),
      gameState: this.generateGameState(),
    };
  }

  /**
   * Generate cryptographic proof from match data
   */
  generateProof(matchData: MatchData): GameProof {
    // Create deterministic hash of match data
    const dataString = JSON.stringify(matchData);
    const proofHash = createHash('sha256')
      .update(dataString)
      .digest('hex');

    // Generate mock signature (in production, use player's private key)
    const signature = this.generateSignature(proofHash, matchData.playerAddress);

    return {
      matchData,
      proofHash,
      signature,
      metadata: {
        version: '1.0.0',
        algorithm: 'SHA256',
        generatedAt: Date.now(),
      },
    };
  }

  /**
   * Verify proof integrity
   */
  verifyProof(proof: GameProof): boolean {
    // Recalculate hash
    const dataString = JSON.stringify(proof.matchData);
    const calculatedHash = createHash('sha256')
      .update(dataString)
      .digest('hex');

    // Verify hash matches
    if (calculatedHash !== proof.proofHash) {
      console.error('Proof hash mismatch');
      return false;
    }

    // Verify signature (mock verification)
    // In production, verify against player's public key
    if (!proof.signature || proof.signature.length < 64) {
      console.error('Invalid signature');
      return false;
    }

    return true;
  }

  /**
   * Serialize proof for Walrus storage
   */
  serializeProof(proof: GameProof): Uint8Array {
    const jsonString = JSON.stringify(proof, null, 2);
    return new TextEncoder().encode(jsonString);
  }

  /**
   * Deserialize proof from Walrus storage
   */
  deserializeProof(data: Uint8Array): GameProof {
    const jsonString = new TextDecoder().decode(data);
    return JSON.parse(jsonString) as GameProof;
  }

  // ==================== Helper Methods ====================

  private generateMatchId(): string {
    return `match_${Date.now()}_${randomBytes(4).toString('hex')}`;
  }

  private generateRandomAddress(): string {
    return `0x${randomBytes(32).toString('hex')}`;
  }

  private generateSignature(hash: string, address: string): string {
    // Mock signature generation (in production, use actual cryptographic signing)
    const signatureData = `${hash}:${address}:${Date.now()}`;
    return createHash('sha256')
      .update(signatureData)
      .digest('hex');
  }

  private generateGameState(): any {
    return {
      mapName: 'de_dust2',
      duration: Math.floor(Math.random() * 3600),
      roundsWon: Math.floor(Math.random() * 16),
      roundsLost: Math.floor(Math.random() * 16),
      mvp: Math.random() > 0.5,
      weapons: ['AK-47', 'M4A4', 'AWP'][Math.floor(Math.random() * 3)],
      accuracy: Math.random(),
    };
  }
}

// Export convenience function
export function createProofGenerator(gameId?: string): ProofGenerator {
  return new ProofGenerator(gameId);
}
