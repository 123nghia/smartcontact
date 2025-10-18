const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
    unit: {
        description: "Unit Tests - Individual contract testing",
        files: [
            "test/TestToken.test.js",
            "test/TestTokenVesting.test.js", 
            "test/TestTokenStaking.test.js",
            "test/TestTokenGovernance.test.js",
            "test/TestTokenBuybackBurn.test.js"
        ]
    },
    integration: {
        description: "Integration Tests - Cross-contract interactions",
        files: [
            "test/TestTokenEcosystem.integration.test.js"
        ]
    },
    gas: {
        description: "Gas Optimization Tests - Performance analysis",
        files: [
            "test/TestTokenEcosystem.gas.test.js"
        ]
    },
    comprehensive: {
        description: "Comprehensive Tests - Full ecosystem testing",
        files: [
            "test/TestTokenEcosystem.comprehensive.test.js"
        ]
    },
    all: {
        description: "All Tests - Complete test suite",
        files: [
            "test/TestToken.test.js",
            "test/TestTokenVesting.test.js",
            "test/TestTokenStaking.test.js", 
            "test/TestTokenGovernance.test.js",
            "test/TestTokenBuybackBurn.test.js",
            "test/TestTokenEcosystem.integration.test.js",
            "test/TestTokenEcosystem.gas.test.js",
            "test/TestTokenEcosystem.comprehensive.test.js"
        ]
    }
};

function runTests(testType, options = {}) {
    console.log(`🧪 Running ${testType.toUpperCase()} Tests`);
    console.log(`📋 ${TEST_CONFIG[testType].description}`);
    console.log("=".repeat(60));

    const testFiles = TEST_CONFIG[testType].files;
    const results = {
        passed: 0,
        failed: 0,
        total: 0,
        errors: []
    };

    for (const testFile of testFiles) {
        if (!fs.existsSync(testFile)) {
            console.log(`⚠️  Test file not found: ${testFile}`);
            continue;
        }

        console.log(`\n📄 Running: ${testFile}`);
        console.log("-".repeat(40));

        try {
            const startTime = Date.now();
            
            // Build hardhat test command
            let command = `npx hardhat test ${testFile}`;
            
            if (options.grep) {
                command += ` --grep "${options.grep}"`;
            }
            
            if (options.gasReport) {
                command += ` --reporter hardhat-gas-reporter`;
            }
            
            if (options.parallel) {
                command += ` --parallel`;
            }

            // Execute test
            const output = execSync(command, { 
                encoding: 'utf8',
                stdio: 'pipe',
                cwd: process.cwd()
            });

            const endTime = Date.now();
            const duration = endTime - startTime;

            console.log(`✅ ${testFile} - PASSED (${duration}ms)`);
            results.passed++;
            results.total++;

            // Extract test results from output
            const lines = output.split('\n');
            for (const line of lines) {
                if (line.includes('passing') && line.includes('failing')) {
                    const match = line.match(/(\d+) passing.*?(\d+) failing/);
                    if (match) {
                        results.passed += parseInt(match[1]) - 1; // Subtract 1 for the file itself
                        results.failed += parseInt(match[2]);
                    }
                }
            }

        } catch (error) {
            console.log(`❌ ${testFile} - FAILED`);
            console.log(`Error: ${error.message}`);
            results.failed++;
            results.total++;
            results.errors.push({
                file: testFile,
                error: error.message
            });
        }
    }

    return results;
}

function generateReport(results, testType) {
    console.log("\n" + "=" * 60);
    console.log(`📊 ${testType.toUpperCase()} TEST REPORT`);
    console.log("=".repeat(60));
    
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`📈 Total: ${results.total}`);
    console.log(`📊 Success Rate: ${((results.passed / results.total) * 100).toFixed(2)}%`);

    if (results.errors.length > 0) {
        console.log("\n🚨 ERRORS:");
        results.errors.forEach((error, index) => {
            console.log(`${index + 1}. ${error.file}: ${error.error}`);
        });
    }

    // Save report to file
    const reportDir = path.join(__dirname, "..", "reports");
    if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
    }

    const reportFile = path.join(reportDir, `${testType}_test_report_${Date.now()}.json`);
    const reportData = {
        testType,
        timestamp: new Date().toISOString(),
        results,
        summary: {
            successRate: (results.passed / results.total) * 100,
            status: results.failed === 0 ? "PASSED" : "FAILED"
        }
    };

    fs.writeFileSync(reportFile, JSON.stringify(reportData, null, 2));
    console.log(`\n💾 Report saved to: ${reportFile}`);

    return results.failed === 0;
}

function main() {
    const args = process.argv.slice(2);
    const testType = args[0] || 'all';
    const options = {};

    // Parse options
    for (let i = 1; i < args.length; i++) {
        switch (args[i]) {
            case '--grep':
                options.grep = args[++i];
                break;
            case '--gas-report':
                options.gasReport = true;
                break;
            case '--parallel':
                options.parallel = true;
                break;
            case '--help':
                showHelp();
                return;
        }
    }

    if (!TEST_CONFIG[testType]) {
        console.log(`❌ Unknown test type: ${testType}`);
        console.log("Available test types:", Object.keys(TEST_CONFIG).join(', '));
        return;
    }

    console.log("🚀 Test Token Ecosystem - Test Runner");
    console.log(`🎯 Test Type: ${testType}`);
    console.log(`⚙️  Options:`, options);
    console.log("");

    const startTime = Date.now();
    const results = runTests(testType, options);
    const endTime = Date.now();
    const totalDuration = endTime - startTime;

    console.log(`\n⏱️  Total execution time: ${totalDuration}ms`);

    const success = generateReport(results, testType);
    
    if (success) {
        console.log("\n🎉 All tests passed successfully!");
        process.exit(0);
    } else {
        console.log("\n💥 Some tests failed!");
        process.exit(1);
    }
}

function showHelp() {
    console.log(`
🧪 Test Token Ecosystem - Test Runner

Usage: node scripts/run-tests.js [test-type] [options]

Test Types:
  unit          - Run unit tests for individual contracts
  integration   - Run integration tests for cross-contract interactions  
  gas           - Run gas optimization tests
  comprehensive - Run comprehensive ecosystem tests
  all           - Run all tests (default)

Options:
  --grep <pattern>    - Run only tests matching pattern
  --gas-report        - Generate gas usage report
  --parallel          - Run tests in parallel
  --help              - Show this help message

Examples:
  node scripts/run-tests.js unit
  node scripts/run-tests.js integration --grep "Vesting"
  node scripts/run-tests.js gas --gas-report
  node scripts/run-tests.js all --parallel
`);
}

// Handle script execution
if (require.main === module) {
    main();
}

module.exports = { runTests, generateReport, TEST_CONFIG };
