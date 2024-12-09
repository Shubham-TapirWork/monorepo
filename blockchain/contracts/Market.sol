// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract LiquidityPool {
    address public tokenA;
    address public tokenB;

    uint256 public scalarRoot;
    uint256 public initAnchor;
    uint256 public lnFeeRateRoot;

    mapping(address => uint256) public liquidity;
    mapping(address => mapping(address => uint256)) public userLiquidity;

    event Swap(address indexed user, address tokenIn, uint256 inputAmount, uint256 outputAmount, uint256 fee);
    event AddLiquidity(address indexed user, address token, uint256 amount);
    event RemoveLiquidity(address indexed user, address token, uint256 amount);

    constructor(
        address _tokenA,
        address _tokenB,
        uint256 _scalarRoot,
        uint256 _initAnchor,
        uint256 _lnFeeRateRoot
    ) {
        tokenA = _tokenA;
        tokenB = _tokenB;
        scalarRoot = _scalarRoot;
        initAnchor = _initAnchor;
        lnFeeRateRoot = _lnFeeRateRoot;
    }

    function swap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external returns (uint256) {
        require(liquidity[tokenIn] > 0 && liquidity[tokenOut] > 0, "Insufficient liquidity");

        // Get current liquidity
        uint256 totalAssetIn = liquidity[tokenIn];
        uint256 totalAssetOut = liquidity[tokenOut];

        // Calculate fee using logarithmic function
        uint256 fee = (lnFeeRateRoot * log2(amountIn + initAnchor)) / 1e18;
        uint256 netAmountIn = amountIn - fee;

        // Calculate constant product invariant
        uint256 k = totalAssetIn * totalAssetOut;

        // Calculate output using ratio and constant product
        uint256 newTotalAssetIn = totalAssetIn + netAmountIn;
        uint256 newTotalAssetOut = k / newTotalAssetIn;

        // Amount of tokenOut to send
        uint256 amountOut = totalAssetOut - newTotalAssetOut;

        // Scale the output with scalarRoot
        uint256 finalAmountOut = (amountOut * scalarRoot) / 1e18;

        // Update liquidity
        liquidity[tokenIn] += amountIn; // Gross input added to the pool
        liquidity[tokenOut] -= finalAmountOut;

        // Transfer tokens
        require(IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn), "Token transfer failed");
        require(IERC20(tokenOut).transfer(msg.sender, finalAmountOut), "Token transfer failed");

        emit Swap(msg.sender, tokenIn, amountIn, finalAmountOut, fee);

        return finalAmountOut;
    }

    function calculateFee(uint256 amount) public view returns (uint256) {
        return (lnFeeRateRoot * log2(amount + initAnchor)) / 1e18;
    }

    function log2(uint256 x) internal pure returns (uint256) {
        uint256 result = 0;
        while (x > 1) {
            x /= 2;
            result++;
        }
        return result;
    }

    function addLiquidity(uint256 amountA, uint256 amountB) external {
        require(amountA > 0 && amountB > 0, "Amounts must be greater than zero");

        if (liquidity[tokenA] > 0 && liquidity[tokenB] > 0) {
            // Calculate the required amount of tokenB based on the ratio in the pool
            uint256 requiredAmountB = (amountA * liquidity[tokenB]) / liquidity[tokenA];

            // Ensure the provided amountB matches the required proportion
            require(amountB >= requiredAmountB, "Token amounts must be in the correct proportion");

            // Adjust amountB to the required proportion if there's excess
            amountB = requiredAmountB;
        }

        // Update liquidity
        liquidity[tokenA] += amountA;
        liquidity[tokenB] += amountB;

        userLiquidity[msg.sender][tokenA] += amountA;
        userLiquidity[msg.sender][tokenB] += amountB;

        // Transfer tokens from user to the contract
        require(IERC20(tokenA).transferFrom(msg.sender, address(this), amountA), "TokenA transfer failed");
        require(IERC20(tokenB).transferFrom(msg.sender, address(this), amountB), "TokenB transfer failed");

        emit AddLiquidity(msg.sender, tokenA, amountA);
        emit AddLiquidity(msg.sender, tokenB, amountB);
    }

    function removeLiquidity(address token, uint256 amount) external {
        require(token == tokenA || token == tokenB, "Invalid token");
        require(amount > 0, "Amount must be greater than zero");
        require(liquidity[token] >= amount, "Insufficient liquidity");
        require(userLiquidity[msg.sender][token] >= amount, "Insufficient user liquidity");

        liquidity[token] -= amount;
        userLiquidity[msg.sender][token] -= amount;

        require(IERC20(token).transfer(msg.sender, amount), "Token transfer failed");
        emit RemoveLiquidity(msg.sender, token, amount);
    }
}
