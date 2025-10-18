#!/bin/bash

# Test Token Ecosystem - Quick Test Script
# This script provides easy commands to run different types of tests

echo "🧪 Test Token Ecosystem - Quick Test Runner"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to run tests with error handling
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_result="$3"
    
    echo -e "\n${BLUE}📋 Running: $test_name${NC}"
    echo -e "${YELLOW}Command: $test_command${NC}"
    echo -e "${YELLOW}Expected: $expected_result${NC}"
    echo "----------------------------------------"
    
    if eval "$test_command"; then
        echo -e "${GREEN}✅ $test_name - PASSED${NC}"
        return 0
    else
        echo -e "${RED}❌ $test_name - FAILED${NC}"
        return 1
    fi
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Please run this script from the project root directory${NC}"
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  Installing dependencies...${NC}"
    npm install
fi

# Compile contracts
echo -e "\n${BLUE}🔨 Compiling contracts...${NC}"
if npm run compile; then
    echo -e "${GREEN}✅ Contracts compiled successfully${NC}"
else
    echo -e "${RED}❌ Contract compilation failed${NC}"
    exit 1
fi

# Menu system
while true; do
    echo -e "\n${BLUE}🎯 Select test type:${NC}"
    echo "1) Quick Demo Tests (5 key tests)"
    echo "2) Unit Tests (All individual contract tests)"
    echo "3) Integration Tests (Cross-contract interactions)"
    echo "4) Gas Tests (Performance analysis)"
    echo "5) Comprehensive Tests (Full ecosystem)"
    echo "6) All Tests (Complete test suite)"
    echo "7) Test Coverage Report"
    echo "8) Gas Usage Report"
    echo "9) Run Custom Test"
    echo "0) Exit"
    
    read -p "Enter your choice (0-9): " choice
    
    case $choice in
        1)
            echo -e "\n${BLUE}🚀 Running Quick Demo Tests...${NC}"
            node scripts/demo-tests.js
            ;;
        2)
            echo -e "\n${BLUE}🧪 Running Unit Tests...${NC}"
            run_test "TestToken Unit Tests" "npx hardhat test test/TestToken.test.js" "43 tests should pass"
            run_test "TestTokenVesting Unit Tests" "npx hardhat test test/TestTokenVesting.test.js" "28 tests should pass"
            run_test "TestTokenStaking Unit Tests" "npx hardhat test test/TestTokenStaking.test.js" "28 tests should pass"
            run_test "TestTokenGovernance Unit Tests" "npx hardhat test test/TestTokenGovernance.test.js" "30 tests should pass"
            run_test "TestTokenBuybackBurn Unit Tests" "npx hardhat test test/TestTokenBuybackBurn.test.js" "30 tests should pass"
            ;;
        3)
            echo -e "\n${BLUE}🔗 Running Integration Tests...${NC}"
            run_test "Integration Tests" "npx hardhat test test/TestTokenEcosystem.integration.test.js" "Cross-contract interactions"
            ;;
        4)
            echo -e "\n${BLUE}⛽ Running Gas Tests...${NC}"
            run_test "Gas Optimization Tests" "npx hardhat test test/TestTokenEcosystem.gas.test.js" "Gas usage analysis"
            ;;
        5)
            echo -e "\n${BLUE}🌍 Running Comprehensive Tests...${NC}"
            run_test "Comprehensive Tests" "npx hardhat test test/TestTokenEcosystem.comprehensive.test.js" "Full ecosystem testing"
            ;;
        6)
            echo -e "\n${BLUE}🎯 Running All Tests...${NC}"
            run_test "Complete Test Suite" "npx hardhat test" "All 300+ tests"
            ;;
        7)
            echo -e "\n${BLUE}📊 Generating Test Coverage Report...${NC}"
            run_test "Coverage Report" "npx hardhat coverage" "Coverage analysis"
            ;;
        8)
            echo -e "\n${BLUE}⛽ Generating Gas Usage Report...${NC}"
            run_test "Gas Report" "REPORT_GAS=true npx hardhat test" "Gas usage analysis"
            ;;
        9)
            echo -e "\n${BLUE}🔧 Custom Test Options:${NC}"
            echo "a) Test specific contract"
            echo "b) Test specific functionality"
            echo "c) Test with pattern matching"
            echo "d) Test with verbose output"
            
            read -p "Enter custom option (a-d): " custom_choice
            
            case $custom_choice in
                a)
                    echo "Available contracts: TestToken, TestTokenVesting, TestTokenStaking, TestTokenGovernance, TestTokenBuybackBurn"
                    read -p "Enter contract name: " contract_name
                    run_test "$contract_name Tests" "npx hardhat test test/$contract_name.test.js" "Contract-specific tests"
                    ;;
                b)
                    echo "Available functionalities: minting, burning, vesting, staking, governance, buyback"
                    read -p "Enter functionality: " functionality
                    run_test "$functionality Tests" "npx hardhat test --grep '$functionality'" "Functionality-specific tests"
                    ;;
                c)
                    read -p "Enter test pattern: " pattern
                    run_test "Pattern Tests" "npx hardhat test --grep '$pattern'" "Pattern-matched tests"
                    ;;
                d)
                    read -p "Enter test file: " test_file
                    run_test "Verbose Tests" "npx hardhat test $test_file --verbose" "Verbose test output"
                    ;;
                *)
                    echo -e "${RED}❌ Invalid custom option${NC}"
                    ;;
            esac
            ;;
        0)
            echo -e "\n${GREEN}👋 Goodbye! Happy testing!${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}❌ Invalid choice. Please enter 0-9.${NC}"
            ;;
    esac
    
    echo -e "\n${YELLOW}Press Enter to continue...${NC}"
    read
done
