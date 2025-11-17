/**
 * ProofPlay Query API Server
 *
 * Provides REST API for prediction markets to query verified game data
 */

import express, { Request, Response } from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Mock database (in production, this would query Sui blockchain)
interface GameProofData {
  matchId: string;
  gameId: string;
  playerAddress: string;
  opponentAddress: string;
  outcome: number;
  kills: number;
  deaths: number;
  score: number;
  timestamp: number;
  walrusBlobId: string;
  verified: boolean;
  blockchainTxHash: string;
}

const mockDatabase: Map<string, GameProofData> = new Map();

// Initialize with some mock data
function initMockData() {
  const sampleProofs: GameProofData[] = [
    {
      matchId: 'match_001',
      gameId: 'CS2',
      playerAddress: '0x1234...abcd',
      opponentAddress: '0x5678...efgh',
      outcome: 1, // win
      kills: 25,
      deaths: 18,
      score: 8500,
      timestamp: Date.now() - 3600000,
      walrusBlobId: 'walrus_blob_001',
      verified: true,
      blockchainTxHash: '0xabc123...',
    },
    {
      matchId: 'match_002',
      gameId: 'CS2',
      playerAddress: '0x1234...abcd',
      opponentAddress: '0x9abc...ijkl',
      outcome: 0, // loss
      kills: 15,
      deaths: 22,
      score: 6200,
      timestamp: Date.now() - 7200000,
      walrusBlobId: 'walrus_blob_002',
      verified: true,
      blockchainTxHash: '0xdef456...',
    },
  ];

  sampleProofs.forEach(proof => {
    mockDatabase.set(proof.matchId, proof);
  });
}

initMockData();

// ==================== API Routes ====================

/**
 * Health check
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    service: 'ProofPlay Query API',
  });
});

/**
 * Get API info
 */
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'ProofPlay Query API',
    version: '1.0.0',
    description: 'Query API for prediction markets to access verified game data',
    endpoints: {
      'GET /': 'API information',
      'GET /health': 'Health check',
      'GET /api/v1/proof/:matchId': 'Get proof by match ID',
      'GET /api/v1/player/:address/stats': 'Get player statistics',
      'GET /api/v1/proofs': 'List all proofs (with pagination)',
      'POST /api/v1/query': 'Query match data (paid endpoint)',
    },
  });
});

/**
 * Get specific match proof
 */
app.get('/api/v1/proof/:matchId', (req: Request, res: Response) => {
  const { matchId } = req.params;

  const proof = mockDatabase.get(matchId);

  if (!proof) {
    return res.status(404).json({
      error: 'Proof not found',
      matchId,
    });
  }

  res.json({
    success: true,
    data: proof,
  });
});

/**
 * Get player statistics
 */
app.get('/api/v1/player/:address/stats', (req: Request, res: Response) => {
  const { address } = req.params;

  // Filter proofs by player address
  const playerProofs = Array.from(mockDatabase.values())
    .filter(proof => proof.playerAddress === address);

  if (playerProofs.length === 0) {
    return res.status(404).json({
      error: 'No proofs found for this player',
      address,
    });
  }

  // Calculate statistics
  const wins = playerProofs.filter(p => p.outcome === 1).length;
  const losses = playerProofs.filter(p => p.outcome === 0).length;
  const draws = playerProofs.filter(p => p.outcome === 2).length;

  const totalKills = playerProofs.reduce((sum, p) => sum + p.kills, 0);
  const totalDeaths = playerProofs.reduce((sum, p) => sum + p.deaths, 0);

  res.json({
    success: true,
    data: {
      playerAddress: address,
      totalMatches: playerProofs.length,
      wins,
      losses,
      draws,
      winRate: (wins / playerProofs.length) * 100,
      avgKills: totalKills / playerProofs.length,
      avgDeaths: totalDeaths / playerProofs.length,
      kdRatio: totalDeaths > 0 ? totalKills / totalDeaths : totalKills,
      recentMatches: playerProofs.slice(-5),
    },
  });
});

/**
 * List all proofs with pagination
 */
app.get('/api/v1/proofs', (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const gameId = req.query.gameId as string;

  let proofs = Array.from(mockDatabase.values());

  // Filter by game ID if provided
  if (gameId) {
    proofs = proofs.filter(p => p.gameId === gameId);
  }

  // Sort by timestamp (most recent first)
  proofs.sort((a, b) => b.timestamp - a.timestamp);

  // Paginate
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedProofs = proofs.slice(startIndex, endIndex);

  res.json({
    success: true,
    data: {
      proofs: paginatedProofs,
      pagination: {
        page,
        limit,
        total: proofs.length,
        totalPages: Math.ceil(proofs.length / limit),
      },
    },
  });
});

/**
 * Query match data (paid endpoint for prediction markets)
 * In production, this would verify payment on-chain before returning data
 */
app.post('/api/v1/query', (req: Request, res: Response) => {
  const { matchId, queryType, paymentTxHash } = req.body;

  if (!matchId) {
    return res.status(400).json({
      error: 'Match ID required',
    });
  }

  // In production, verify payment transaction on Sui blockchain
  // For MVP, we just check if paymentTxHash is provided
  if (!paymentTxHash) {
    return res.status(402).json({
      error: 'Payment required',
      message: 'Please submit payment transaction to query data',
      pricePerQuery: '0.05 SUI',
    });
  }

  const proof = mockDatabase.get(matchId);

  if (!proof) {
    return res.status(404).json({
      error: 'Proof not found',
      matchId,
    });
  }

  // Return data based on query type
  let responseData: any;

  switch (queryType) {
    case 'outcome':
      responseData = {
        matchId: proof.matchId,
        outcome: proof.outcome,
        verified: proof.verified,
      };
      break;

    case 'stats':
      responseData = {
        matchId: proof.matchId,
        kills: proof.kills,
        deaths: proof.deaths,
        score: proof.score,
        verified: proof.verified,
      };
      break;

    case 'full':
    default:
      responseData = proof;
      break;
  }

  res.json({
    success: true,
    data: responseData,
    queryInfo: {
      queryType: queryType || 'full',
      paymentTxHash,
      timestamp: Date.now(),
    },
  });
});

/**
 * Submit new proof (for testing)
 */
app.post('/api/v1/proof', (req: Request, res: Response) => {
  const proof: GameProofData = req.body;

  if (!proof.matchId) {
    return res.status(400).json({
      error: 'Invalid proof data: matchId required',
    });
  }

  mockDatabase.set(proof.matchId, proof);

  res.json({
    success: true,
    message: 'Proof stored successfully',
    matchId: proof.matchId,
  });
});

// ==================== Server Start ====================

app.listen(PORT, () => {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║              🔌 PROOFPLAY QUERY API 🔌                     ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log('\n📖 API Endpoints:');
  console.log(`   GET  http://localhost:${PORT}/`);
  console.log(`   GET  http://localhost:${PORT}/health`);
  console.log(`   GET  http://localhost:${PORT}/api/v1/proof/:matchId`);
  console.log(`   GET  http://localhost:${PORT}/api/v1/player/:address/stats`);
  console.log(`   GET  http://localhost:${PORT}/api/v1/proofs`);
  console.log(`   POST http://localhost:${PORT}/api/v1/query`);
  console.log('\n💡 Example query:');
  console.log(`   curl http://localhost:${PORT}/api/v1/proof/match_001`);
  console.log('');
});

export default app;
