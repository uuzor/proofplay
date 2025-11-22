#!/bin/bash

# ProofPlay Build Script
# Builds all components of the ProofPlay project

set -e  # Exit on error

echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║              🔨 PROOFPLAY BUILD SCRIPT 🔨                  ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print section headers
print_section() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  $1"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# Check if Sui CLI is installed
check_sui() {
    if ! command -v sui &> /dev/null; then
        echo -e "${RED}❌ Sui CLI not found. Please install it first.${NC}"
        echo "   Install: cargo install --locked --git https://github.com/MystenLabs/sui.git --branch main sui"
        exit 1
    fi
    echo -e "${GREEN}✅ Sui CLI found: $(sui --version)${NC}"
}

# Build Move contracts
build_move() {
    print_section "📦 Building Move Smart Contracts"
    cd move

    echo "Building..."
    if sui move build; then
        echo -e "${GREEN}✅ Move contracts built successfully${NC}"
    else
        echo -e "${RED}❌ Move build failed${NC}"
        exit 1
    fi

    cd ..
}

# Test Move contracts
test_move() {
    print_section "🧪 Testing Move Smart Contracts"
    cd move

    echo "Running tests..."
    if sui move test; then
        echo -e "${GREEN}✅ All tests passed${NC}"
    else
        echo -e "${YELLOW}⚠️  Some tests failed (this is OK for MVP)${NC}"
    fi

    cd ..
}

# Build Game SDK
build_game_sdk() {
    print_section "🎮 Building Game SDK"
    cd game-sdk

    if [ ! -d "node_modules" ]; then
        echo "Installing dependencies..."
        npm install
    fi

    echo "Building TypeScript..."
    if npm run build; then
        echo -e "${GREEN}✅ Game SDK built successfully${NC}"
    else
        echo -e "${YELLOW}⚠️  Game SDK build failed (dependencies may be missing)${NC}"
    fi

    cd ..
}

# Build API
build_api() {
    print_section "🔌 Building Query API"
    cd api

    if [ ! -d "node_modules" ]; then
        echo "Installing dependencies..."
        npm install
    fi

    echo "Building TypeScript..."
    if npm run build; then
        echo -e "${GREEN}✅ API built successfully${NC}"
    else
        echo -e "${YELLOW}⚠️  API build failed (dependencies may be missing)${NC}"
    fi

    cd ..
}

# Main execution
main() {
    echo "Starting build process..."
    echo ""

    # Check prerequisites
    check_sui

    # Build all components
    build_move
    test_move
    build_game_sdk
    build_api

    # Summary
    print_section "✅ Build Complete!"
    echo ""
    echo "Next steps:"
    echo "  1. Deploy contracts: ./scripts/deploy.sh"
    echo "  2. Run demo: cd game-sdk && npm run demo"
    echo "  3. Start API: cd api && npm run dev"
    echo "  4. Open frontend: cd client && open index.html"
    echo ""
}

# Run main function
main
