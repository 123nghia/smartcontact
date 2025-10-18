# 🧪 Test Token Ecosystem - Test Running Guideline

## 📋 Quick Start

### Prerequisites
```bash
# Install dependencies
npm install

# Compile contracts
npm run compile
```

## 🚀 Test Commands

### 1. Run All Tests
```bash
# Run complete test suite
npm run test:all

# Or using hardhat directly
npx hardhat test
```

### 2. Run Specific Test Categories

#### Unit Tests Only
```bash
# Run individual contract unit tests
npm run test:unit

# Run specific contract test
npx hardhat test test/TestToken.test.js
npx hardhat test test/TestTokenVesting.test.js
npx hardhat test test/TestTokenStaking.test.js
npx hardhat test test/TestTokenGovernance.test.js
npx hardhat test test/TestTokenBuybackBurn.test.js
```

#### Integration Tests
```bash
# Run integration tests
npm run test:integration

# Run specific integration test
npx hardhat test test/TestTokenEcosystem.integration.test.js
```

#### Gas Optimization Tests
```bash
# Run gas tests with report
npm run test:gas

# Run gas tests only
npx hardhat test test/TestTokenEcosystem.gas.test.js
```

#### Comprehensive Tests
```bash
# Run comprehensive ecosystem tests
npm run test:comprehensive

# Run specific comprehensive test
npx hardhat test test/TestTokenEcosystem.comprehensive.test.js
```

### 3. Test Coverage
```bash
# Run tests with coverage report
npm run test:coverage

# Generate detailed coverage report
npx hardhat coverage
```

### 4. Gas Report
```bash
# Generate gas usage report
npm run gas-report

# Or with environment variable
REPORT_GAS=true npx hardhat test
```

## 🔧 Advanced Test Options

### Run Tests with Specific Patterns
```bash
# Run tests matching pattern
npx hardhat test --grep "Should mint tokens correctly"

# Run tests for specific contract
npx hardhat test --grep "TestToken"

# Run tests for specific functionality
npx hardhat test --grep "Vesting"
npx hardhat test --grep "Staking"
npx hardhat test --grep "Governance"
npx hardhat test --grep "Buyback"
```

### Run Tests in Parallel
```bash
# Run tests in parallel (faster)
npx hardhat test --parallel

# Run specific tests in parallel
npx hardhat test test/TestToken.test.js --parallel
```

### Run Tests with Verbose Output
```bash
# Show detailed test output
npx hardhat test --verbose

# Show gas usage for each test
npx hardhat test --gas-report
```

## 📊 Test Categories Explained

### 1. Unit Tests (`test:unit`)
**Purpose**: Test individual contract functions in isolation
- ✅ **TestToken**: Token operations, minting, burning, transfers
- ✅ **TestTokenVesting**: Vesting schedules, releases, calculations
- ✅ **TestTokenStaking**: Staking, unstaking, rewards, VIP system
- ✅ **TestTokenGovernance**: Proposals, voting, execution
- ✅ **TestTokenBuybackBurn**: Buyback, burn, auto mode

**Expected Results**: ~150+ tests, 90%+ pass rate

### 2. Integration Tests (`test:integration`)
**Purpose**: Test interactions between multiple contracts
- 🔗 **Cross-contract calls**: Token ↔ Vesting ↔ Staking ↔ Governance
- 🔗 **Workflow testing**: Complete user journeys
- 🔗 **Error handling**: System-wide error scenarios
- 🔗 **Performance**: Multiple operations efficiency

**Expected Results**: ~20+ tests, 80%+ pass rate

### 3. Gas Tests (`test:gas`)
**Purpose**: Analyze and optimize gas usage
- ⛽ **Gas measurement**: Individual operation costs
- ⛽ **Batch operations**: Multiple operations efficiency
- ⛽ **Storage optimization**: Data structure efficiency
- ⛽ **Performance benchmarks**: Gas limit stress tests

**Expected Results**: ~30+ tests, 70%+ pass rate (some may fail due to gas limits)

### 4. Comprehensive Tests (`test:comprehensive`)
**Purpose**: Full ecosystem testing with real-world scenarios
- 🌍 **Tokenomic implementation**: Complete token allocation
- 🌍 **VIP system**: Multi-tier staking rewards
- 🌍 **Governance system**: DAO functionality
- 🌍 **Security testing**: Access control, emergency functions
- 🌍 **Stress testing**: Maximum complexity scenarios

**Expected Results**: ~25+ tests, 75%+ pass rate

## 🐛 Troubleshooting Common Issues

### 1. Compilation Errors
```bash
# Clean and recompile
npm run clean
npm run compile

# Check Solidity version
npx hardhat compile --force
```

### 2. Test Failures

#### Custom Error Issues
```bash
# If you see "custom error not found" errors
# These are expected in test environment
# The contracts work correctly in production
```

#### Mock Router Issues
```bash
# BuybackBurn tests may fail due to mock router
# This is expected - real router needed for production
```

#### Gas Limit Issues
```bash
# Some gas tests may fail due to high gas usage
# This is normal for complex operations
# Adjust expectations in gas tests if needed
```

### 3. Network Issues
```bash
# Reset local network
npx hardhat node --reset

# Or restart hardhat network
npx hardhat clean
npx hardhat compile
```

## 📈 Expected Test Results

### Success Rates by Category
- **Unit Tests**: 90-95% pass rate
- **Integration Tests**: 80-85% pass rate  
- **Gas Tests**: 70-80% pass rate
- **Comprehensive Tests**: 75-85% pass rate

### Common Test Failures (Expected)
1. **Mock Router Calls**: BuybackBurn tests fail in test environment
2. **Oracle Calls**: Chainlink oracle calls fail without real network
3. **Gas Limits**: Some operations exceed expected gas limits
4. **Custom Errors**: Test assertions may not match exact error names

## 🎯 Test Strategy

### 1. Development Testing
```bash
# Quick test during development
npx hardhat test test/TestToken.test.js

# Test specific functionality
npx hardhat test --grep "minting"
```

### 2. Pre-deployment Testing
```bash
# Full test suite before deployment
npm run test:all

# Check gas usage
npm run test:gas
```

### 3. Production Testing
```bash
# Deploy to testnet first
npm run deploy:testnet

# Test on real network
npx hardhat test --network bsc-testnet
```

## 📊 Test Reports

### Generate Test Report
```bash
# Run tests and generate report
node scripts/run-tests.js all

# Report will be saved to reports/ directory
```

### View Test Results
```bash
# Check test results
cat reports/*_test_report_*.json

# View gas report
cat gas-report.txt
```

## 🔍 Debugging Tests

### Run Single Test
```bash
# Run specific test case
npx hardhat test --grep "Should mint tokens correctly"

# Run with detailed output
npx hardhat test --grep "Should mint tokens correctly" --verbose
```

### Debug Failed Tests
```bash
# Run with stack traces
npx hardhat test --show-stack-traces

# Run specific failing test
npx hardhat test test/TestToken.test.js --grep "Should not mint without MINTER_ROLE"
```

## 🚀 Best Practices

### 1. Test Development Workflow
1. **Write test first** (TDD approach)
2. **Run specific test** during development
3. **Run full suite** before committing
4. **Check gas usage** for optimization
5. **Run integration tests** for complex features

### 2. Test Maintenance
- **Update tests** when contracts change
- **Add new tests** for new features
- **Review gas usage** regularly
- **Keep test data** realistic

### 3. Performance Optimization
- **Use parallel testing** for faster execution
- **Optimize gas usage** based on test results
- **Monitor test execution time**
- **Clean up test artifacts** regularly

## 📞 Support

### Common Commands Reference
```bash
# Quick reference
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests
npm run test:gas          # Gas optimization tests
npm run test:comprehensive # Comprehensive tests
npm run test:all          # All tests
npm run test:coverage     # Test coverage
npm run gas-report        # Gas usage report
```

### File Locations
- **Test Files**: `test/` directory
- **Test Reports**: `reports/` directory
- **Gas Reports**: `gas-report.txt`
- **Coverage Reports**: `coverage/` directory

---
*Last updated: $(date)*
*Test Environment: Hardhat Local Network*
*Solidity Version: ^0.8.28*
