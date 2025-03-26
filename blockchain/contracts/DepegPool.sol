// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.27;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "./interfaces/ILiquidityPool.sol";
import "./interfaces/IWtETH.sol";
import "./interfaces/ItETH.sol";
import "./interfaces/IDPasset.sol";
import "./interfaces/IYBasset.sol";

contract DepegPool {

    /**
        EVENTS
    **/
    /// @dev split token event
    event SplitToken(address indexed sender, uint256 amount);
    /// @dev Un split event
    event UnSplitToken(address indexed sender, uint256 amount);


    // Name of the pool.
    string public name;

    // flag of the pool.
    string public flag;

    /// Address of the liquidity pool contract managing Ether.
    ILiquidityPool public liquidityPool;

    // Address of the wrapped Ether token (asset).
    IWtETH public immutable asset;

    // Address of the depegged version of asset (DP_asset).
    IDPasset public immutable DP_asset;

    // Address of the yield-bearing version of asset (YB_asset).
    IYBasset public immutable YB_asset;

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
     * @param _asset Address of the wrapped Ether (asset) token.
     * @param _DP_asset Address of the depegged version of asset (DP_asset).
     * @param _YB_asset Address of the yield-bearing version of asset (YB_asset).
     * @param _poolActiveDuration Duration in seconds for which the pool will remain active.
     * @param _name Name of the pool.
     */
    constructor(
        address _tPool,
        address _asset,
        address _DP_asset,
        address _YB_asset,
        uint256 _poolActiveDuration,
        string memory _name,
        string memory _flag
    ) {
        liquidityPool = ILiquidityPool(_tPool);
        asset = IWtETH(_asset);
        DP_asset = IDPasset(_DP_asset);
        YB_asset = IYBasset(_YB_asset);
        name = _name;
        poolActiveDuration = _poolActiveDuration;
        startTime = block.timestamp;
        startSharePrice = currentSharePrice();
        flag = _flag;
    }

    /**
     * @dev Splits the provided asset into DP_asset and YB_asset equally.
     * The pool must be active to perform the split.
     * @param _amount Amount of asset to split.
     */
    function splitToken(uint256 _amount) external {
        require(_amount > 0, "DepegPool: no zero amount");
        require(checkPoolIsActive(), "DepegPool: pool isn't active");

        asset.transferFrom(msg.sender, address(this), _amount);
        DP_asset.mint(msg.sender, _amount / 2);
        YB_asset.mint(msg.sender, _amount / 2);

        emit SplitToken(msg.sender, _amount);
    }

    /**
     * @dev Un-splits previously split DP_asset and YB_asset back into asset.
     * The pool must be active to perform the un-split.
     * @param _amount Total amount of tokens (DP + YB) to un-split into asset.
     */
    function unSplitToken(uint256 _amount) external {
        require(_amount > 0, "DepegPool: no zero amount");
        require(checkPoolIsActive(), "DepegPool: pool isn't active");

        DP_asset.burn(msg.sender, _amount / 2);
        YB_asset.burn(msg.sender, _amount / 2);
        asset.transfer(msg.sender, _amount);
        emit UnSplitToken(msg.sender, _amount);
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
            depegSize =
                10 ** depegDecimal -
                (currentSharePrice() * 10 ** depegDecimal) /
                startSharePrice;
            poolIsDepegged = true;
        }
        DepegResolved = true;
    }

    /**
     * @dev Redeems YB_asset and DP_asset tokens for asset based on whether a depeg occurred.
     * If no depeg, all tokens are returned 1:1. If depeg happened, depeg size is factored into the redemption.
     * @param _amountYB Amount of YB_asset to redeem.
     * @param _amountDP Amount of DP_asset to redeem.
     */
    function redeemTokens(uint256 _amountYB, uint256 _amountDP) external {
        require(DepegResolved, "DepegPool: the depeg is not resolved");

        uint256 _amountWtETHtoSend = 0;

        // If no depeg occurred, return full amount 1:1.
        if (poolIsDepegged == false) {
            _amountWtETHtoSend = _amountYB + _amountDP;
        }
        // If depeg occurred, adjust redemption amounts based on depeg size.
        else {
            _amountWtETHtoSend =
                _amountDP +
                (_amountDP * depegSize) /
                10 ** depegDecimal +
                _amountYB -
                (_amountYB * depegSize) /
                10 ** depegDecimal;
        }

        YB_asset.burn(msg.sender, _amountYB);
        DP_asset.burn(msg.sender, _amountDP);
        asset.transfer(msg.sender, _amountWtETHtoSend);
    }
}
