// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract LiquidityPool {
    address public tokenA;
    address public tokenB;

    uint256 public scalarRoot;
    uint256 public initAnchor;
    uint256 public lnFeeRateRoot;

    uint256 public liquidityA;
    uint256 public liquidityB;

    mapping(address => uint256) public userLiquidityA;
    mapping(address => uint256) public userLiquidityB;

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

    function swap(address tokenIn, uint256 amountIn) external returns (uint256) {
        require(tokenIn == tokenA || tokenIn == tokenB, "Invalid token");

        address tokenOut = (tokenIn == tokenA) ? tokenB : tokenA;
        uint256 liquidityIn = (tokenIn == tokenA) ? liquidityA : liquidityB;
        uint256 liquidityOut = (tokenOut == tokenA) ? liquidityA : liquidityB;

        require(liquidityIn > 0 && liquidityOut > 0, "Insufficient liquidity");

        // Calculate fee and amount out
        uint256 fee = calculateFee(amountIn);
        uint256 amountOut = (amountIn - fee) * scalarRoot / 1e18;
        require(liquidityOut >= amountOut, "Insufficient output liquidity");

        // Update liquidity
        if (tokenIn == tokenA) {
            liquidityA += amountIn;
            liquidityB -= amountOut;
        } else {
            liquidityB += amountIn;
            liquidityA -= amountOut;
        }

        // Transfer tokens
        require(IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn), "Token transfer failed");
        require(IERC20(tokenOut).transfer(msg.sender, amountOut), "Token transfer failed");

        emit Swap(msg.sender, tokenIn, amountIn, amountOut, fee);
        return amountOut;
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

    function addLiquidity(address token, uint256 amount) external {
        require(token == tokenA || token == tokenB, "Invalid token");
        require(amount > 0, "Amount must be greater than zero");

        if (token == tokenA) {
            liquidityA += amount;
            userLiquidityA[msg.sender] += amount;
        } else {
            liquidityB += amount;
            userLiquidityB[msg.sender] += amount;
        }

        require(IERC20(token).transferFrom(msg.sender, address(this), amount), "Token transfer failed");
        emit AddLiquidity(msg.sender, token, amount);
    }

    function removeLiquidity(address token, uint256 amount) external {
        require(token == tokenA || token == tokenB, "Invalid token");
        require(amount > 0, "Amount must be greater than zero");

        if (token == tokenA) {
            require(liquidityA >= amount, "Insufficient liquidityA");
            require(userLiquidityA[msg.sender] >= amount, "Insufficient user liquidityA");
            liquidityA -= amount;
            userLiquidityA[msg.sender] -= amount;
        } else {
            require(liquidityB >= amount, "Insufficient liquidityB");
            require(userLiquidityB[msg.sender] >= amount, "Insufficient user liquidityB");
            liquidityB -= amount;
            userLiquidityB[msg.sender] -= amount;
        }

        require(IERC20(token).transfer(msg.sender, amount), "Token transfer failed");
        emit RemoveLiquidity(msg.sender, token, amount);
    }
}
