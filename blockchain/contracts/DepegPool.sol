// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "./interfaces/ILiquidityPool.sol";
import "./interfaces/IWtETH.sol";
import "./interfaces/ItETH.sol";
import "./interfaces/IDPwtETH.sol";
import "./interfaces/IYBwtETH.sol";

contract DepegPool {

    // Testing-only placeholder for share price; replace with a price oracle in production.
    uint256 public sharePrice = 100;

    // Name of the pool.
    string public name;

    /// Address of the liquidity pool contract managing Ether.
    ILiquidityPool public liquidityPool;

    // Address of the wrapped Ether token (wtETH).
    IWtETH public immutable wtETH;

    // Address of the depegged version of wtETH (DP_wtETH).
    IDPwtETH public immutable DP_wtETH;

    // Address of the yield-bearing version of wtETH (YB_wtETH).
    IYBwtETH public immutable YB_wtETH;

    // Duration (in seconds) for which the pool remains active.
    uint256 public poolActiveDuration;

    // Share price at the time the pool starts.
    uint256 public startSharePrice;

    // Boolean indicating whether the price depeg issue has been resolved.
    bool public DepegResolved;

    // Boolean indicating whether the pool has experienced a depeg.
    bool public poolIsDepegged;

    // Size of the depeg, represented in a fixed-point decimal format.
    uint256 public depegSize;

    // Decimal precision used for calculating depeg size.
    uint256 public constant depegDecimal = 5;

    // Timestamp (in seconds) marking the start time of the pool.
    uint256 public startTime;

    /**
     * @dev Constructor initializes the pool with token addresses, duration, and pool name.
     * @param _wtETH Address of the wrapped Ether (wtETH) token.
     * @param _DP_wtETH Address of the depegged version of wtETH (DP_wtETH).
     * @param _YB_wtETH Address of the yield-bearing version of wtETH (YB_wtETH).
     * @param _poolActiveDuration Duration in seconds for which the pool will remain active.
     * @param _name Name of the pool.
     */
    constructor(
        address _tPool,
        address _wtETH,
        address _DP_wtETH,
        address _YB_wtETH,
        uint256 _poolActiveDuration,
        string memory _name
    )
    {
        liquidityPool = ILiquidityPool(_tPool);
        wtETH = IWtETH(_wtETH);
        DP_wtETH = IDPwtETH(_DP_wtETH);
        YB_wtETH = IYBwtETH(_YB_wtETH);
        name = _name;
        poolActiveDuration = _poolActiveDuration;
        startTime = block.timestamp;
        startSharePrice = currentSharePrice();
    }

    /**
     * @dev Splits the provided wtETH into DP_wtETH and YB_wtETH equally.
     * The pool must be active to perform the split.
     * @param _amount Amount of wtETH to split.
     */
    function splitToken(uint256 _amount) external {
        require(_amount > 0, "DepegPool: no zero amount");
        require(checkPoolIsActive(), "DepegPool: pool isn't active");


        wtETH.transferFrom(msg.sender, address(this), _amount);
        DP_wtETH.mint(msg.sender, _amount / 2);
        YB_wtETH.mint(msg.sender, _amount / 2);
    }

    /**
     * @dev Un-splits previously split DP_wtETH and YB_wtETH back into wtETH.
     * The pool must be active to perform the un-split.
     * @param _amount Total amount of tokens (DP + YB) to un-split into wtETH.
     */
    function unSplitToken(uint256 _amount) external {
        require(_amount > 0, "DepegPool: no zero amount");
        require(checkPoolIsActive(), "DepegPool: pool isn't active");

        DP_wtETH.burn(msg.sender, _amount / 2);
        YB_wtETH.burn(msg.sender, _amount / 2);
        wtETH.transferFrom(address(this), msg.sender, _amount);
    }

    /**
     * @dev Checks if the pool is still active based on the pool's duration and start time.
     * @return bool Returns true if the pool is active, otherwise false.
     */
    function checkPoolIsActive() public view returns (bool) {
        return block.timestamp < startTime + poolActiveDuration;
    }

    /**
     * @dev Retrieves the current share price.
     * @return uint256 The current share price.
     */
    function currentSharePrice() public view returns (uint256) {
        return liquidityPool.amountForShare(1 ether);
    }

    /**
     * @dev Resolves the price depeg issue by calculating the depeg size.
     * This function can only be called once the pool is inactive and not previously resolved.
     */
    function resolvePriceDepeg() external {
        require(!checkPoolIsActive(), "DepegPool: the pool is still active");
        require(!DepegResolved, "DepegPool: the depeg is already resolved");

        if (startSharePrice > currentSharePrice()) {
            depegSize = 10 ** depegDecimal - (currentSharePrice() * 10 ** depegDecimal) / startSharePrice;
            poolIsDepegged = true;
        }
        DepegResolved = true;
    }

    /**
     * @dev Redeems YB_wtETH and DP_wtETH tokens for wtETH based on whether a depeg occurred.
     * If no depeg, all tokens are returned 1:1. If depeg happened, depeg size is factored into the redemption.
     * @param _amountYB Amount of YB_wtETH to redeem.
     * @param _amountDP Amount of DP_wtETH to redeem.
     */
    function redeemTokens(uint256 _amountYB, uint256 _amountDP) external {
        require(DepegResolved, "DepegPool: the depeg is not resolved");

        uint256 _amountWtETHtoSend = 0;

        // If no depeg occurred, return full amount 1:1.
        if (poolIsDepegged == false) {
            _amountWtETHtoSend = _amountYB + _amountDP;
        }
        // If depeg occurred, adjust redemption amounts based on depeg size.
        else if (poolIsDepegged) {
            _amountWtETHtoSend =
                _amountDP + (_amountDP * depegSize) / 10**depegDecimal +
                _amountYB - (_amountYB * depegSize) / 10**depegDecimal;
        }

        wtETH.transfer(msg.sender, _amountWtETHtoSend);
    }
}
