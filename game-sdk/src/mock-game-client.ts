/**
 * Mock Game Client for ProofPlay Demo
 *
 * Simulates a PvP game that generates match results,
 * creates cryptographic proofs, and submits them to ProofPlay
 */

import { ProofGenerator, MatchData, GameProof } from './proof-generator';
import { MockWalrusUploader, UploadResult } from './walrus-uploader';

export interface GameClientConfig {
  gameId: string;
  playerAddress: string;
  autoSubmit?: boolean;
}

export interface MatchResult {
  matchData: MatchData;
  proof: GameProof;
  walrusUpload: UploadResult;
  blockchainTx?: string;
}

export class MockGameClient {
  private config: GameClientConfig;
  private proofGenerator: ProofGenerator;
  private walrusUploader: MockWalrusUploader;
  private matchHistory: MatchResult[] = [];

  constructor(config: GameClientConfig) {
    this.config = {
      autoSubmit: true,
      ...config,
    };

    this.proofGenerator = new ProofGenerator(config.gameId);
    this.walrusUploader = new MockWalrusUploader();
  }

  /**
   * Simulate playing a match
   */
  async playMatch(): Promise<MatchResult> {
    console.log('\n🎮 ================================');
    console.log('🎮 Starting New Match');
    console.log('🎮 ================================\n');

    // Step 1: Generate match data
    console.log('⚔️  Playing match...');
    const matchData = this.proofGenerator.generateMockMatch(this.config.playerAddress);

    console.log(`   Game: ${matchData.gameId}`);
    console.log(`   Match ID: ${matchData.matchId}`);
    console.log(`   Outcome: ${this.getOutcomeString(matchData.outcome)}`);
    console.log(`   Stats: ${matchData.kills}K/${matchData.deaths}D (Score: ${matchData.score})`);

    // Step 2: Generate cryptographic proof
    console.log('\n🔐 Generating cryptographic proof...');
    const proof = this.proofGenerator.generateProof(matchData);

    console.log(`   Proof Hash: ${proof.proofHash.substring(0, 16)}...`);
    console.log(`   Signature: ${proof.signature.substring(0, 16)}...`);

    // Step 3: Verify proof locally
    console.log('\n✅ Verifying proof locally...');
    const isValid = this.proofGenerator.verifyProof(proof);

    if (!isValid) {
      throw new Error('❌ Proof verification failed!');
    }

    console.log('   ✓ Proof verified successfully');

    // Step 4: Upload to Walrus
    console.log('\n📤 Uploading proof to Walrus...');
    const serializedProof = this.proofGenerator.serializeProof(proof);
    const uploadResult = await this.walrusUploader.uploadProof(serializedProof);

    // Step 5: Submit to blockchain (mock)
    let blockchainTx: string | undefined;

    if (this.config.autoSubmit) {
      console.log('\n⛓️  Submitting to Sui blockchain...');
      blockchainTx = await this.submitToBlockchain(matchData, uploadResult.blobId);
      console.log(`   Transaction: ${blockchainTx}`);
    }

    // Store result
    const result: MatchResult = {
      matchData,
      proof,
      walrusUpload: uploadResult,
      blockchainTx,
    };

    this.matchHistory.push(result);

    console.log('\n✅ Match completed successfully!');
    console.log(`   Walrus Blob ID: ${uploadResult.blobId.substring(0, 16)}...`);
    if (blockchainTx) {
      console.log(`   Blockchain TX: ${blockchainTx.substring(0, 16)}...`);
    }

    return result;
  }

  /**
   * Simulate submitting to blockchain
   */
  private async submitToBlockchain(matchData: MatchData, walrusBlobId: string): Promise<string> {
    // In production, this would use @mysten/sui to submit a transaction
    // For MVP, we generate a mock transaction hash

    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

    const txData = {
      function: 'proofplay::proofplay::submit_proof',
      arguments: [
        matchData.gameId,
        matchData.matchId,
        matchData.opponentAddress,
        matchData.outcome,
        matchData.kills,
        matchData.deaths,
        matchData.score,
        walrusBlobId,
      ],
    };

    // Generate mock transaction hash
    const txHash = `0x${Buffer.from(JSON.stringify(txData)).toString('hex').substring(0, 64)}`;

    return txHash;
  }

  /**
   * Get match history
   */
  getMatchHistory(): MatchResult[] {
    return [...this.matchHistory];
  }

  /**
   * Get statistics
   */
  getStats() {
    const wins = this.matchHistory.filter(m => m.matchData.outcome === 1).length;
    const losses = this.matchHistory.filter(m => m.matchData.outcome === 0).length;
    const draws = this.matchHistory.filter(m => m.matchData.outcome === 2).length;

    return {
      totalMatches: this.matchHistory.length,
      wins,
      losses,
      draws,
      winRate: this.matchHistory.length > 0 ? (wins / this.matchHistory.length) * 100 : 0,
    };
  }

  /**
   * Simulate querying data (prediction market perspective)
   */
  async queryMatchData(matchId: string): Promise<MatchResult | null> {
    const match = this.matchHistory.find(m => m.matchData.matchId === matchId);

    if (!match) {
      console.log(`❌ Match not found: ${matchId}`);
      return null;
    }

    console.log('\n🔍 Querying match data...');
    console.log(`   Match ID: ${matchId}`);

    // Download proof from Walrus
    const proofData = await this.walrusUploader.downloadProof(match.walrusUpload.blobId);
    const proof = this.proofGenerator.deserializeProof(proofData);

    // Verify proof
    const isValid = this.proofGenerator.verifyProof(proof);

    console.log(`   Outcome: ${this.getOutcomeString(proof.matchData.outcome)}`);
    console.log(`   Verified: ${isValid ? '✅' : '❌'}`);
    console.log(`   Stats: ${proof.matchData.kills}K/${proof.matchData.deaths}D`);

    return match;
  }

  // ==================== Helper Methods ====================

  private getOutcomeString(outcome: number): string {
    switch (outcome) {
      case 0: return '❌ Loss';
      case 1: return '✅ Win';
      case 2: return '🤝 Draw';
      default: return '❓ Unknown';
    }
  }
}

// ==================== Demo Script ====================

async function runDemo() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║              🎮 PROOFPLAY DEMO CLIENT 🎮                   ║');
  console.log('║                                                            ║');
  console.log('║     Decentralized Gaming Oracle for Prediction Markets    ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('\n');

  const mockPlayerAddress = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

  const client = new MockGameClient({
    gameId: 'CS2',
    playerAddress: mockPlayerAddress,
    autoSubmit: true,
  });

  try {
    // Play 3 matches
    console.log('🎯 Playing 3 demo matches...\n');

    for (let i = 1; i <= 3; i++) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Match ${i} of 3`);
      console.log('='.repeat(60));

      await client.playMatch();

      // Wait between matches
      if (i < 3) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Show statistics
    console.log('\n\n📊 ================================');
    console.log('📊 Player Statistics');
    console.log('📊 ================================\n');

    const stats = client.getStats();
    console.log(`   Total Matches: ${stats.totalMatches}`);
    console.log(`   Wins: ${stats.wins}`);
    console.log(`   Losses: ${stats.losses}`);
    console.log(`   Draws: ${stats.draws}`);
    console.log(`   Win Rate: ${stats.winRate.toFixed(1)}%`);

    // Demo querying
    console.log('\n\n🔍 ================================');
    console.log('🔍 Demo: Prediction Market Query');
    console.log('🔍 ================================\n');

    const history = client.getMatchHistory();
    if (history.length > 0) {
      const firstMatch = history[0];
      console.log(`Querying match: ${firstMatch.matchData.matchId}\n`);
      await client.queryMatchData(firstMatch.matchData.matchId);
    }

    console.log('\n\n✅ ================================');
    console.log('✅ Demo Completed Successfully!');
    console.log('✅ ================================\n');

    console.log('💡 What just happened:');
    console.log('   1. Generated cryptographic proofs of match results');
    console.log('   2. Uploaded proofs to Walrus decentralized storage');
    console.log('   3. Submitted proof references to Sui blockchain');
    console.log('   4. Demonstrated data queries for prediction markets');
    console.log('\n');

  } catch (error) {
    console.error('\n❌ Demo failed:', error);
    process.exit(1);
  }
}

// Run demo if executed directly
if (require.main === module) {
  runDemo().catch(console.error);
}

export { runDemo };
