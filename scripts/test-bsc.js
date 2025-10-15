const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

/**
 * 🧪 BSC Integration Test Script for TestToken
 *
 * This scenario will:
 * 1. Connect to the configured BSC network (testnet or mainnet)
 * 2. Deploy a fresh TestToken contract
 * 3. Exercise mint/transfer/allowance/blacklist/pause/burn/admin flows
 * 4. Persist a JSON summary with executed steps and final balances
 *
 * Required environment variables:
 * - PRIVATE_KEY or BSC_ADMIN_KEY: admin wallet with DEFAULT_ADMIN/MINTER/PAUSER roles
 * - BSC_TEST_USER1_KEY: wallet used as primary user
 * - BSC_TEST_USER2_KEY: wallet used as secondary user
 *
 * All wallets must be funded with enough BNB to cover gas on the target network.
 *
 * Optional environment variables:
 * - BSC_DEPLOY_CONFIRMATIONS: number of block confirmations to wait for after deployment (default: 3, set to 0 to skip)
 */

function normalizeKey(key, label) {
    if (!key) {
        throw new Error(`Missing private key for ${label}. Please set the required environment variable.`);
    }
    const trimmed = key.trim();
    if (!/^0x[0-9a-fA-F]{64}$/.test(trimmed)) {
        throw new Error(`Invalid private key format for ${label}. Expected 0x-prefixed 64 hex characters.`);
    }
    return trimmed;
}

function createWalletFromEnv(envKey, label, provider, { optional = false } = {}) {
    const raw = process.env[envKey];
    if (!raw) {
        if (optional) {
            return null;
        }
        throw new Error(`Environment variable ${envKey} is required for ${label}.`);
    }
    return new hre.ethers.Wallet(normalizeKey(raw, label), provider);
}

function createWalletFromKey(rawKey, label, provider) {
    return new hre.ethers.Wallet(normalizeKey(rawKey, label), provider);
}

async function ensureGasBalance(wallet, minimumBnB, label) {
    const { ethers } = hre;
    const required = ethers.parseEther(minimumBnB);
    const balance = await wallet.provider.getBalance(wallet.address);
    const readable = Number(ethers.formatEther(balance)).toFixed(6);
    console.log(`   ${label} balance: ${readable} BNB`);
    if (balance < required) {
        throw new Error(`${label} needs at least ${minimumBnB} BNB to run this test (current ${readable}). Top up and retry.`);
    }
    return balance;
}

async function waitForTx(txPromise, description, summary) {
    const tx = await txPromise;
    const receipt = await tx.wait();
    console.log(`   ✅ ${description} (tx: ${receipt.hash})`);
    summary.steps.push({
        description,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
    });
    return receipt;
}

async function expectRevert(promise, description) {
    try {
        await promise;
        throw new Error(`Expected revert for: ${description}`);
    } catch (error) {
        const reason = error.shortMessage || error.reason || error.message;
        console.log(`   ✅ ${description} (reverted as expected: ${reason})`);
    }
}

async function main() {
    const { ethers } = hre;
    const provider = ethers.provider;

    console.log("\n🧪 ====== BSC TEST SCENARIO FOR TESTTOKEN ======\n");

    // ---- Network information ------------------------------------------------
    const network = await provider.getNetwork();
    const networkName = hre.network?.name || network.name || "unknown";
    console.log(`🌐 Connected network: ${networkName} (chainId: ${network.chainId})`);
    if (network.chainId !== 97n && network.chainId !== 56n) {
        console.warn("⚠️  Warning: This script is intended for BSC Testnet (97) or Mainnet (56). Proceed with caution.");
    }
    const isLocalNetwork = ["hardhat", "localhost"].includes(networkName) || network.chainId === 31337n || network.chainId === 1337n;

    // ---- Load wallets -------------------------------------------------------
    const adminKey = process.env.BSC_ADMIN_KEY || process.env.PRIVATE_KEY;
    const admin = createWalletFromKey(adminKey, "Admin", provider);
    const user1 = createWalletFromEnv("BSC_TEST_USER1_KEY", "User1", provider);
    const user2 = createWalletFromEnv("BSC_TEST_USER2_KEY", "User2", provider);

    console.log("\n👥 Participants:");
    console.log(`   Admin : ${admin.address}`);
    console.log(`   User1 : ${user1.address}`);
    console.log(`   User2 : ${user2.address}`);

    console.log("\n💰 Checking gas balances...");
    await ensureGasBalance(admin, "0.02", "Admin");
    await ensureGasBalance(user1, "0.01", "User1");
    await ensureGasBalance(user2, "0.01", "User2");

    const summary = {
        timestamp: new Date().toISOString(),
        network: {
            name: networkName,
            chainId: network.chainId.toString(),
        },
        admin: admin.address,
        user1: user1.address,
        user2: user2.address,
        contract: null,
        steps: [],
        balances: {},
    };

    // ---- Deploy contract ----------------------------------------------------
    console.log("\n🏗️  Deploying TestToken to BSC...");
    const Token = await ethers.getContractFactory("TestToken", admin);
    const token = await Token.deploy(admin.address);
    await token.waitForDeployment();
    const tokenAddress = await token.getAddress();
    summary.contract = tokenAddress;
    console.log(`   ✅ Deployed TestToken at ${tokenAddress}`);

    const confirmationsEnv = process.env.BSC_DEPLOY_CONFIRMATIONS;
    let confirmationsToWait = 3;
    if (confirmationsEnv) {
        const parsed = Number.parseInt(confirmationsEnv, 10);
        if (!Number.isNaN(parsed) && parsed >= 0) {
            confirmationsToWait = parsed;
        } else {
            console.warn(`⚠️  Invalid BSC_DEPLOY_CONFIRMATIONS value "${confirmationsEnv}", falling back to ${confirmationsToWait}.`);
        }
    }

    if (!isLocalNetwork && confirmationsToWait > 0) {
        console.log(`   ⏳ Waiting for ${confirmationsToWait} block confirmation(s)...`);
        await token.deploymentTransaction()?.wait(confirmationsToWait);
    } else if (isLocalNetwork) {
        console.log("   ⏭️ Skipping confirmation wait on local network.");
    } else {
        console.log("   ⏭️ Skipping confirmation wait (BSC_DEPLOY_CONFIRMATIONS=0).");
    }

    summary.steps.push({
        description: "Deploy TestToken",
        txHash: token.deploymentTransaction().hash,
        blockNumber: await provider.getBlockNumber(),
    });

    const tokenAdmin = token.connect(admin);
    const tokenUser1 = token.connect(user1);
    const tokenUser2 = token.connect(user2);

    const DEFAULT_ADMIN_ROLE = await tokenAdmin.DEFAULT_ADMIN_ROLE();
    const MINTER_ROLE = await tokenAdmin.MINTER_ROLE();
    const PAUSER_ROLE = await tokenAdmin.PAUSER_ROLE();
    const BLACKLISTER_ROLE = await tokenAdmin.BLACKLISTER_ROLE();

    // ---- Initial token info -------------------------------------------------
    const info = await tokenAdmin.getTokenInfo();
    console.log("\n📊 Token Info:");
    console.log(`   Name       : ${info.tokenName}`);
    console.log(`   Symbol     : ${info.tokenSymbol}`);
    console.log(`   Decimals   : ${info.tokenDecimals}`);
    console.log(`   TotalSupply: ${ethers.formatUnits(info.tokenTotalSupply, 18)}`);
    console.log(`   Cap        : ${ethers.formatUnits(info.tokenCap, 18)}`);

    // ---- Mint operations ----------------------------------------------------
    console.log("\n🪙 Minting tokens...");
    const mintUser1Amount = ethers.parseUnits("2000", 18);
    const mintUser2Amount = ethers.parseUnits("1500", 18);

    await waitForTx(
        tokenAdmin.mint(user1.address, mintUser1Amount),
        "Mint 2000 TEST to User1",
        summary
    );
    await waitForTx(
        tokenAdmin.mint(user2.address, mintUser2Amount),
        "Mint 1500 TEST to User2",
        summary
    );

    // ---- Transfers ----------------------------------------------------------
    console.log("\n💸 Testing transfers...");
    const transferAmount = ethers.parseUnits("250", 18);
    await waitForTx(
        tokenUser1.transfer(user2.address, transferAmount),
        "User1 transfers 250 TEST to User2",
        summary
    );

    const transferBackAmount = ethers.parseUnits("125", 18);
    await waitForTx(
        tokenUser2.transfer(user1.address, transferBackAmount),
        "User2 transfers 125 TEST back to User1",
        summary
    );

    // ---- Allowance & transferFrom ------------------------------------------
    console.log("\n✅ Testing allowance + transferFrom...");
    const approveAmount = ethers.parseUnits("400", 18);
    await waitForTx(
        tokenUser2.approve(admin.address, approveAmount),
        "User2 approves Admin for 400 TEST",
        summary
    );

    const transferFromAmount = ethers.parseUnits("180", 18);
    await waitForTx(
        tokenAdmin.transferFrom(user2.address, admin.address, transferFromAmount),
        "Admin pulls 180 TEST from User2 via transferFrom",
        summary
    );

    // ---- Pause/Unpause flow -------------------------------------------------
    console.log("\n⏸️  Testing pause/unpause...");
    await waitForTx(
        tokenAdmin.pause(),
        "Admin pauses the contract",
        summary
    );

    await expectRevert(
        tokenUser1.transfer(user2.address, ethers.parseUnits("10", 18)),
        "Transfer while contract is paused"
    );

    await waitForTx(
        tokenAdmin.unpause(),
        "Admin unpauses the contract",
        summary
    );

    // ---- Blacklist flow -----------------------------------------------------
    console.log("\n🚫 Testing blacklist...");
    await waitForTx(
        tokenAdmin.setBlacklisted(user2.address, true),
        "Admin blacklists User2",
        summary
    );

    await expectRevert(
        tokenUser2.transfer(user1.address, ethers.parseUnits("5", 18)),
        "Blacklisted user cannot transfer"
    );

    await waitForTx(
        tokenAdmin.setBlacklisted(user2.address, false),
        "Admin removes User2 from blacklist",
        summary
    );

    // ---- Role management ----------------------------------------------------
    console.log("\n🛡️  Testing role management...");
    await waitForTx(
        tokenAdmin.grantRole(DEFAULT_ADMIN_ROLE, user1.address),
        "Grant DEFAULT_ADMIN_ROLE to User1",
        summary
    );

    await waitForTx(
        tokenAdmin.grantRole(MINTER_ROLE, user1.address),
        "Grant MINTER_ROLE to User1",
        summary
    );

    await waitForTx(
        tokenAdmin.grantRole(PAUSER_ROLE, user1.address),
        "Grant PAUSER_ROLE to User1",
        summary
    );

    const mintByUser1 = ethers.parseUnits("300", 18);
    await waitForTx(
        tokenUser1.mint(user2.address, mintByUser1),
        "User1 (as new minter) mints 300 TEST to User2",
        summary
    );

    await waitForTx(
        tokenAdmin.revokeRole(PAUSER_ROLE, user1.address),
        "Revoke PAUSER_ROLE from User1",
        summary
    );

    await waitForTx(
        tokenAdmin.revokeRole(MINTER_ROLE, user1.address),
        "Revoke MINTER_ROLE from User1",
        summary
    );

    await waitForTx(
        tokenAdmin.revokeRole(DEFAULT_ADMIN_ROLE, user1.address),
        "Revoke DEFAULT_ADMIN_ROLE from User1",
        summary
    );

    // ---- Burn operations ----------------------------------------------------
    console.log("\n🔥 Testing burns...");
    const burnAmount = ethers.parseUnits("100", 18);
    await waitForTx(
        tokenUser1.burn(burnAmount),
        "User1 burns 100 TEST",
        summary
    );

    const burnFromAmount = ethers.parseUnits("50", 18);
    await waitForTx(
        tokenAdmin.approve(user1.address, burnFromAmount),
        "Admin approves User1 for burnFrom",
        summary
    );

    await waitForTx(
        tokenUser1.burnFrom(admin.address, burnFromAmount),
        "User1 burns 50 TEST from Admin using burnFrom",
        summary
    );

    // ---- Final state --------------------------------------------------------
    console.log("\n📈 Fetching final balances...");
    const [adminBalance, user1Balance, user2Balance, totalSupply] = await Promise.all([
        tokenAdmin.balanceOf(admin.address),
        tokenAdmin.balanceOf(user1.address),
        tokenAdmin.balanceOf(user2.address),
        tokenAdmin.totalSupply(),
    ]);

    summary.balances = {
        admin: ethers.formatUnits(adminBalance, 18),
        user1: ethers.formatUnits(user1Balance, 18),
        user2: ethers.formatUnits(user2Balance, 18),
        totalSupply: ethers.formatUnits(totalSupply, 18),
    };

    console.log(`   Admin : ${summary.balances.admin} TEST`);
    console.log(`   User1 : ${summary.balances.user1} TEST`);
    console.log(`   User2 : ${summary.balances.user2} TEST`);
    console.log(`   Total : ${summary.balances.totalSupply} TEST`);

    // ---- Persist report -----------------------------------------------------
    const reportsDir = path.join(__dirname, "..", "reports");
    if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
    }
    const reportPath = path.join(
        reportsDir,
        `bsc-test-report-${Date.now()}.json`
    );
    fs.writeFileSync(reportPath, JSON.stringify(summary, null, 2));
    console.log(`\n💾 Saved report to ${reportPath}`);

    console.log("\n🎉 BSC integration test completed successfully!\n");
}

main().catch((error) => {
    console.error("\n❌ BSC test scenario failed:");
    console.error(error);
    process.exitCode = 1;
});
