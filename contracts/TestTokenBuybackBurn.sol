// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./ITestToken.sol";
import "./IBuybackBurn.sol";

// Interface for PancakeSwap Router
interface IPancakeRouter {
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
    
    function getAmountsOut(uint amountIn, address[] calldata path) 
        external view returns (uint[] memory amounts);
}

// Interface for Chainlink Price Feed
interface AggregatorV3Interface {
    function latestRoundData() external view returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    );
}

/// @title Test Token Buyback & Burn Contract (Production)
/// @notice Deflationary mechanism với real DEX integration
/// @dev Tích hợp PancakeSwap và Chainlink Oracle
contract TestTokenBuybackBurn is AccessControl, ReentrancyGuard, IBuybackBurn {
    // ===== Roles =====
    bytes32 public constant BUYBACK_MANAGER_ROLE = keccak256("BUYBACK_MANAGER_ROLE");
    
    // ===== State Variables =====
    ITestToken public immutable testToken;
    IERC20 public immutable stablecoin; // BUSD/USDT
    IPancakeRouter public immutable router;
    AggregatorV3Interface public priceOracle;
    
    BuybackInfo public buybackInfo;
    
    uint256 public buybackInterval = 7 days;
    uint256 public lastBuybackTime;
    uint256 public buybackBudget = 10000 * 10**18; // 10K BUSD budget
    uint256 public maxSlippage = 500; // 5% = 500/10000
    bool public autoMode = false;
    bool public useOracle = true;
    
    // ===== Events =====
    event BuybackBudgetUpdated(uint256 newBudget);
    event SlippageUpdated(uint256 newSlippage);
    event OracleUpdated(address newOracle);
    event RouterUpdated(address newRouter);
    
    constructor(
        address _testToken,
        address _stablecoin,
        address _router,
        address _oracle,
        address admin
    ) {
        if (_testToken == address(0)) revert ITestToken.ZeroAddress();
        if (_stablecoin == address(0)) revert ITestToken.ZeroAddress();
        if (_router == address(0)) revert ITestToken.ZeroAddress();
        if (admin == address(0)) revert ITestToken.ZeroAddress();
        
        testToken = ITestToken(_testToken);
        stablecoin = IERC20(_stablecoin);
        router = IPancakeRouter(_router);
        priceOracle = AggregatorV3Interface(_oracle);
        
        _setupRole(DEFAULT_ADMIN_ROLE, admin);
        _setupRole(BUYBACK_MANAGER_ROLE, admin);
        
        lastBuybackTime = block.timestamp;
        
        buybackInfo = BuybackInfo({
            totalBought: 0,
            totalBurned: 0,
            lastBuybackTime: block.timestamp,
            buybackAmount: 0,
            burnAmount: 0,
            autoMode: false
        });
    }
    
    // ===== Buyback Functions =====
    function executeBuyback() external onlyRole(BUYBACK_MANAGER_ROLE) nonReentrant {
        if (block.timestamp < lastBuybackTime + buybackInterval) {
            revert("Too early for buyback");
        }
        _executeBuyback();
    }
    
    function executeBurn(uint256 amount) external onlyRole(BUYBACK_MANAGER_ROLE) nonReentrant {
        if (amount == 0) revert ITestToken.ZeroAmount();
        _executeBurn(amount);
    }
    
    function executeAutoBuyback() external {
        if (!autoMode) revert("Auto mode disabled");
        if (block.timestamp < lastBuybackTime + buybackInterval) {
            revert("Too early for buyback");
        }
        
        _executeBuyback();
        
        // Auto burn 50% of bought tokens
        uint256 balance = testToken.balanceOf(address(this));
        uint256 burnAmount = balance / 2;
        if (burnAmount > 0) {
            _executeBurn(burnAmount);
        }
    }
    
    // ===== Core Buyback Logic - PRODUCTION VERSION =====
    function _executeBuyback() internal {
        uint256 budget = buybackBudget;
        if (budget == 0) revert ITestToken.ZeroAmount();
        
        uint256 stablecoinBalance = stablecoin.balanceOf(address(this));
        if (stablecoinBalance < budget) {
            revert("Insufficient stablecoin balance");
        }
        
        // Get expected tokens from DEX
        address[] memory path = new address[](2);
        path[0] = address(stablecoin);
        path[1] = address(testToken);
        
        uint256[] memory amountsOut = router.getAmountsOut(budget, path);
        uint256 expectedTokens = amountsOut[1];
        
        // Calculate minimum with slippage protection
        uint256 minTokens = (expectedTokens * (10000 - maxSlippage)) / 10000;
        
        // Approve router
        stablecoin.approve(address(router), budget);
        
        // Execute swap
        uint256[] memory amounts = router.swapExactTokensForTokens(
            budget,
            minTokens,
            path,
            address(this),
            block.timestamp + 300 // 5 min deadline
        );
        
        uint256 tokensBought = amounts[1];
        
        // Get actual price
        uint256 price = useOracle ? _getOraclePrice() : _getMarketPrice(budget, tokensBought);
        
        // Update stats
        buybackInfo.totalBought += tokensBought;
        buybackInfo.lastBuybackTime = block.timestamp;
        buybackInfo.buybackAmount = tokensBought;
        lastBuybackTime = block.timestamp;
        
        emit BuybackExecuted(tokensBought, price, block.timestamp);
    }
    
    function _executeBurn(uint256 amount) internal {
        if (amount == 0) revert ITestToken.ZeroAmount();
        
        uint256 balance = testToken.balanceOf(address(this));
        if (balance < amount) revert ITestToken.InsufficientBalance();
        
        // Burn tokens
        testToken.burn(amount);
        
        // Update stats
        buybackInfo.totalBurned += amount;
        buybackInfo.burnAmount = amount;
        
        emit BurnExecuted(amount, block.timestamp);
    }
    
    // ===== Price Functions =====
    function _getOraclePrice() internal view returns (uint256) {
        try priceOracle.latestRoundData() returns (
            uint80,
            int256 answer,
            uint256,
            uint256 updatedAt,
            uint80
        ) {
            // Check if price is stale (> 1 hour old)
            if (block.timestamp - updatedAt > 3600) {
                revert("Oracle price stale");
            }
            
            // Convert to 18 decimals (Chainlink typically uses 8)
            return uint256(answer) * 10**10;
        } catch {
            revert("Oracle price unavailable");
        }
    }
    
    function _getMarketPrice(uint256 stablecoinIn, uint256 tokensOut) 
        internal 
        pure 
        returns (uint256) 
    {
        // Price = stablecoinIn / tokensOut (in 18 decimals)
        return (stablecoinIn * 1e18) / tokensOut;
    }
    
    function getBuybackPrice() public view returns (uint256) {
        if (useOracle) {
            try priceOracle.latestRoundData() returns (
                uint80,
                int256 answer,
                uint256,
                uint256 updatedAt,
                uint80
            ) {
                // Check if price is stale (> 1 hour old)
                if (block.timestamp - updatedAt > 3600) {
                    return _getMarketPriceEstimate();
                }
                
                // Convert to 18 decimals (Chainlink typically uses 8)
                return uint256(answer) * 10**10;
            } catch {
                return _getMarketPriceEstimate();
            }
        } else {
            return _getMarketPriceEstimate();
        }
    }
    
    function _getMarketPriceEstimate() internal view returns (uint256) {
        // Get from DEX directly
        address[] memory path = new address[](2);
        path[0] = address(stablecoin);
        path[1] = address(testToken);
        
        try router.getAmountsOut(1e18, path) returns (uint256[] memory amounts) {
            return (1e18 * 1e18) / amounts[1];
        } catch {
            return 1e18; // Fallback to 1:1
        }
    }
    
    // ===== Admin Functions =====
    function setBuybackBudget(uint256 budget) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (budget == 0) revert ITestToken.ZeroAmount();
        buybackBudget = budget;
        emit BuybackBudgetUpdated(budget);
    }
    
    function setBuybackAmount(uint256) external pure {
        revert("Use setBuybackBudget instead");
    }
    
    function setBuybackInterval(uint256 interval) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (interval == 0) revert("Invalid interval");
        buybackInterval = interval;
        emit BuybackConfigUpdated(buybackBudget, interval);
    }
    
    function setMaxSlippage(uint256 slippage) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (slippage > 1000) revert("Slippage too high"); // Max 10%
        maxSlippage = slippage;
        emit SlippageUpdated(slippage);
    }
    
    function setOracle(address oracle) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (oracle == address(0)) revert ITestToken.ZeroAddress();
        priceOracle = AggregatorV3Interface(oracle);
        emit OracleUpdated(oracle);
    }
    
    function toggleUseOracle() external onlyRole(DEFAULT_ADMIN_ROLE) {
        useOracle = !useOracle;
    }
    
    function toggleAutoMode() external onlyRole(DEFAULT_ADMIN_ROLE) {
        autoMode = !autoMode;
        buybackInfo.autoMode = autoMode;
        emit AutoModeToggled(autoMode);
    }
    
    function emergencyWithdraw() external onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 tokenBalance = testToken.balanceOf(address(this));
        if (tokenBalance > 0) {
            testToken.transfer(_msgSender(), tokenBalance);
        }
        
        uint256 stableBalance = stablecoin.balanceOf(address(this));
        if (stableBalance > 0) {
            stablecoin.transfer(_msgSender(), stableBalance);
        }
    }
    
    // ===== View Functions =====
    function getBuybackInfo() external view returns (BuybackInfo memory) {
        return buybackInfo;
    }
    
    function getNextBuybackTime() external view returns (uint256) {
        return lastBuybackTime + buybackInterval;
    }
    
    function getTotalBurned() external view returns (uint256) {
        return buybackInfo.totalBurned;
    }
    
    function getTotalBought() external view returns (uint256) {
        return buybackInfo.totalBought;
    }
    
    function isAutoMode() external view returns (bool) {
        return autoMode;
    }
    
    function getContractBalance() external view returns (uint256) {
        return testToken.balanceOf(address(this));
    }
    
    function getStablecoinBalance() external view returns (uint256) {
        return stablecoin.balanceOf(address(this));
    }
    
    function canExecuteBuyback() external view returns (bool) {
        return block.timestamp >= lastBuybackTime + buybackInterval &&
               stablecoin.balanceOf(address(this)) >= buybackBudget;
    }
    
    function getTimeUntilNextBuyback() external view returns (uint256) {
        uint256 nextTime = lastBuybackTime + buybackInterval;
        if (block.timestamp >= nextTime) return 0;
        return nextTime - block.timestamp;
    }
    
    function estimateTokensFromBudget(uint256 budget) external view returns (uint256) {
        address[] memory path = new address[](2);
        path[0] = address(stablecoin);
        path[1] = address(testToken);
        
        try router.getAmountsOut(budget, path) returns (uint256[] memory amounts) {
            return amounts[1];
        } catch {
            return 0;
        }
    }
}