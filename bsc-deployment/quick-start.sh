#!/bin/bash

# 🚀 BSC Testnet Quick Start Script
# Deploy TestToken Ecosystem lên BSC Testnet

echo "🚀 BSC Testnet Quick Start - TestToken Ecosystem"
echo "================================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if .env exists
if [ ! -f "../.env" ]; then
    print_error ".env file not found!"
    print_info "Please copy env.example to .env and configure it:"
    print_info "cp bsc-deployment/env.example .env"
    print_info "Then edit .env with your actual values"
    exit 1
fi

# Check if hardhat is installed
if ! command -v npx &> /dev/null; then
    print_error "npx not found! Please install Node.js and npm"
    exit 1
fi

print_info "Starting BSC Testnet deployment..."

# Step 1: Compile contracts
print_info "Step 1: Compiling contracts..."
npx hardhat compile
if [ $? -eq 0 ]; then
    print_status "Contracts compiled successfully"
else
    print_error "Contract compilation failed"
    exit 1
fi

# Step 2: Deploy contracts
print_info "Step 2: Deploying contracts to BSC Testnet..."
npx hardhat run bsc-deployment/scripts/deploy-bsc.js --network bscTestnet
if [ $? -eq 0 ]; then
    print_status "Contracts deployed successfully"
else
    print_error "Contract deployment failed"
    exit 1
fi

# Step 3: Verify contracts
print_info "Step 3: Verifying contracts on BSCScan..."
npx hardhat run bsc-deployment/scripts/verify-contracts.js --network bscTestnet
if [ $? -eq 0 ]; then
    print_status "Contracts verified successfully"
else
    print_warning "Contract verification failed (contracts may already be verified)"
fi

# Step 4: Test contracts
print_info "Step 4: Testing deployed contracts..."
npx hardhat run bsc-deployment/scripts/test-bsc.js --network bscTestnet
if [ $? -eq 0 ]; then
    print_status "Contract tests passed successfully"
else
    print_error "Contract tests failed"
    exit 1
fi

# Final summary
echo ""
echo "🎉 BSC Testnet Deployment Completed Successfully!"
echo "================================================"
echo ""
print_info "Next steps:"
print_info "1. Check contract addresses in bsc-deployment/config/contract-addresses.json"
print_info "2. Import TestToken to MetaMask with symbol TEST"
print_info "3. Test functions on BSCScan"
print_info "4. Share contract addresses with your team"
echo ""
print_info "Useful links:"
print_info "- BSCScan: https://testnet.bscscan.com/"
print_info "- BSC Faucet: https://testnet.binance.org/faucet-smart"
print_info "- Contract addresses: bsc-deployment/config/contract-addresses.json"
echo ""
print_status "Happy testing on BSC Testnet! 🚀"
