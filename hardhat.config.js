require("@nomicfoundation/hardhat-toolbox");
require("hardhat-gas-reporter");
require("dotenv").config();

const {
    DEV_PRIVATE_KEY,
    PROD_PRIVATE_KEY,
    PRIVATE_KEY,
    BSC_TESTNET_RPC_URL,
    BSC_MAINNET_RPC_URL,
    SEPOLIA_RPC_URL,
    ETHERSCAN_API_KEY,
    BSCSCAN_API_KEY,
    REPORT_GAS,
    COINMARKETCAP_API_KEY,
    GAS_REPORTER_OFFLINE,
    LOCAL_CHAIN_ID,
} = process.env;

const parseChainId = (value, fallback) => {
    if (!value) return fallback;
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? fallback : parsed;
};

const devAccounts = (DEV_PRIVATE_KEY || PRIVATE_KEY)
    ? [DEV_PRIVATE_KEY || PRIVATE_KEY]
    : [];

const prodAccounts = PROD_PRIVATE_KEY
    ? [PROD_PRIVATE_KEY]
    : devAccounts;

module.exports = {
    solidity: {
        version: "0.8.28",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
            evmVersion: "london",
            viaIR: true,
        },
    },

    networks: {
        // Local development (defaults to Hardhat chainId unless overridden)
        hardhat: {
            chainId: parseChainId(LOCAL_CHAIN_ID, 31337),
            // Configure for BNB simulation
            gasPrice: 5000000000, // 5 gwei (similar to BSC)
            blockGasLimit: 30000000, // BSC block gas limit
            accounts: {
                mnemonic: "test test test test test test test test test test test junk",
                count: 20,
                accountsBalance: "10000000000000000000000", // 10,000 BNB per account
            },
        },
        localhost: {
            url: "http://127.0.0.1:8545",
            chainId: parseChainId(LOCAL_CHAIN_ID, 31337),
            accounts: devAccounts,
            gasPrice: 5000000000, // 5 gwei
        },

        // Ethereum Sepolia Testnet
        sepolia: {
            url: SEPOLIA_RPC_URL || "https://eth-sepolia.g.alchemy.com/v2/demo",
            accounts: devAccounts,
            chainId: 11155111,
        },

        // BSC Testnet (primary staging network)
        bscTestnet: {
            url: BSC_TESTNET_RPC_URL || "https://data-seed-prebsc-1-s1.binance.org:8545",
            accounts: devAccounts,
            chainId: 97,
        },

        // BSC Mainnet (production)
        bscMainnet: {
            url: BSC_MAINNET_RPC_URL || "https://bsc-dataseed1.bnbchain.org",
            accounts: prodAccounts,
            chainId: 56,
        },
    },

    etherscan: {
        apiKey: BSCSCAN_API_KEY,
        
        customChains: [
            {
                network: "bscTestnet",
                chainId: 97,
                urls: {
                    apiURL: "https://api-testnet.bscscan.com/api",
                    browserURL: "https://testnet.bscscan.com",
                },
            },
            {
                network: "bsc",
                chainId: 56,
                urls: {
                    apiURL: "https://api.bscscan.com/api",
                    browserURL: "https://bscscan.com",
                },
            },
        ],
    },

    gasReporter: {
        enabled: REPORT_GAS === "true",
        currency: "USD",
        token: "BNB", // report gas in BNB to match BSC pricing
        coinmarketcap: COINMARKETCAP_API_KEY || "",
        outputFile: "gas-report.txt",
        noColors: true,
        offline: GAS_REPORTER_OFFLINE === "true",
    },

    paths: {
        sources: "./contracts",
        tests: "./test",
        cache: "./cache",
        artifacts: "./artifacts",
    },
};
