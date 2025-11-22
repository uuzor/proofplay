#!/bin/bash

# ProofPlay Quick Demo Script
# Runs a complete demo of the ProofPlay system

set -e  # Exit on error

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║              🎮 PROOFPLAY QUICK DEMO 🎮                    ║"
echo "║                                                            ║"
echo "║     Decentralized Gaming Oracle Demo                      ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}This demo will:${NC}"
echo "  1. Simulate 3 PvP game matches"
echo "  2. Generate cryptographic proofs"
echo "  3. Upload proofs to Walrus (mock)"
echo "  4. Submit to Sui blockchain (mock)"
echo "  5. Query match data (prediction market)"
echo "  6. Calculate revenue distribution"
echo ""

read -p "Press Enter to start the demo..."

# Navigate to game-sdk
cd "$(dirname "$0")/../game-sdk"

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo ""
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
fi

# Check if built
if [ ! -d "dist" ]; then
    echo ""
    echo -e "${YELLOW}Building TypeScript...${NC}"
    npm run build
fi

# Run the demo
echo ""
echo -e "${GREEN}Starting demo...${NC}"
echo ""

npm run demo

echo ""
echo -e "${GREEN}✅ Demo complete!${NC}"
echo ""
echo "What happened:"
echo "  ✓ Generated 3 match proofs"
echo "  ✓ Uploaded to Walrus storage"
echo "  ✓ Recorded on Sui blockchain"
echo "  ✓ Demonstrated data queries"
echo ""
echo "Next steps:"
echo "  • Open client/index.html for interactive demo"
echo "  • Run 'cd api && npm run dev' to start API"
echo "  • Read DEPLOYMENT.md for full deployment guide"
echo ""
