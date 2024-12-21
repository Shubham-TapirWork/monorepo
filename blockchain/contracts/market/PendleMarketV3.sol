// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "../../interfaces/IPMarketFactoryV3.sol";
import "../PendleERC20.sol";
import "./MarketMathCore.sol";

/**
Invariance to maintain:
- Internal balances totalPt & totalSy not interfered by people transferring tokens in directly
- address(0) & address(this) should never have any rewards & activeBalance accounting done. This is
    guaranteed by address(0) & address(this) check in each updateForTwo function
*/
contract PendleMarketV3 is PendleERC20 {
    using PMath for uint256;
    using PMath for int256;
    using MarketMathCore for MarketState;
    using SafeERC20 for IERC20;
    using PYIndexLib for IPYieldToken;

    struct MarketStorage {
        int128 totalPt;
        int128 totalSy;
        // 1 SLOT = 256 bits
        uint96 lastLnImpliedRate;
        uint16 observationIndex;
        uint16 observationCardinality;
        uint16 observationCardinalityNext;
        // 1 SLOT = 144 bits
    }

    string private constant NAME = "Pendle Market";
    string private constant SYMBOL = "PENDLE-LPT";

    IPPrincipalToken internal immutable PT;
    IStandardizedYield internal immutable SY;
    IPYieldToken internal immutable YT;

    address public immutable factory;
    uint256 public immutable expiry;

    int256 internal immutable scalarRoot;
    int256 internal immutable initialAnchor;
    uint80 internal immutable lnFeeRateRoot;

    MarketStorage public _storage;

    modifier notExpired() {
        if (isExpired()) revert Errors.MarketExpired();
        _;
    }

    constructor(
        address _PT,
        int256 _scalarRoot,
        int256 _initialAnchor,
        uint80 _lnFeeRateRoot,
        address _vePendle,
        address _gaugeController
    ) PendleERC20(NAME, SYMBOL, 18) PendleGauge(IPPrincipalToken(_PT).SY(), _vePendle, _gaugeController) {
        PT = IPPrincipalToken(_PT);
        SY = IStandardizedYield(PT.SY());
        YT = IPYieldToken(PT.YT());

        (_storage.observationCardinality, _storage.observationCardinalityNext) = observations.initialize(
            uint32(block.timestamp)
        );

        if (_scalarRoot <= 0) revert Errors.MarketScalarRootBelowZero(_scalarRoot);

        scalarRoot = _scalarRoot;
        initialAnchor = _initialAnchor;
        lnFeeRateRoot = _lnFeeRateRoot;
        expiry = IPPrincipalToken(_PT).expiry();
        factory = msg.sender;
    }

    /**
     * @notice Pendle Market allows swaps between PT & SY it is holding. This function
     * aims to swap an exact amount of PT to SY.
     * @dev steps working of this contract
       - The outcome amount of SY will be precomputed by MarketMathLib
       - Release the calculated amount of SY to receiver
       - Callback to msg.sender if data.length > 0
       - Ensure exactPtIn amount of PT has been transferred to this address
     * @dev will revert if PT is expired
     * @param data bytes data to be sent in the callback (if any)
     */
    function swapExactPtForSy(
        address receiver,
        uint256 exactPtIn,
        bytes calldata data
    ) external nonReentrant notExpired returns (uint256 netSyOut, uint256 netSyFee) {
        MarketState memory market = readState(msg.sender);

        uint256 netSyToReserve;
        (netSyOut, netSyFee, netSyToReserve) = market.swapExactPtForSy(YT.newIndex(), exactPtIn, block.timestamp);

        if (receiver != address(this)) IERC20(SY).safeTransfer(receiver, netSyOut);
        IERC20(SY).safeTransfer(market.treasury, netSyToReserve);

        _writeState(market);

//        emit Swap(msg.sender, receiver, exactPtIn.neg(), netSyOut.Int(), netSyFee, netSyToReserve);
    }

    /**
     * @notice Pendle Market allows swaps between PT & SY it is holding. This function
     * aims to swap SY for an exact amount of PT.
     * @dev steps working of this function
       - The exact outcome amount of PT will be transferred to receiver
       - Callback to msg.sender if data.length > 0
       - Ensure the calculated required amount of SY is transferred to this address
     * @dev will revert if PT is expired
     * @param data bytes data to be sent in the callback (if any)
     */
    function swapSyForExactPt(
        address receiver,
        uint256 exactPtOut,
        bytes calldata data
    ) external nonReentrant notExpired returns (uint256 netSyIn, uint256 netSyFee) {
        MarketState memory market = readState(msg.sender);

        uint256 netSyToReserve;
        (netSyIn, netSyFee, netSyToReserve) = market.swapSyForExactPt(YT.newIndex(), exactPtOut, block.timestamp);

        if (receiver != address(this)) IERC20(PT).safeTransfer(receiver, exactPtOut);
        IERC20(SY).safeTransfer(market.treasury, netSyToReserve);

        _writeState(market);

//        emit Swap(msg.sender, receiver, exactPtOut.Int(), netSyIn.neg(), netSyFee, netSyToReserve);
    }

    /// @notice forces balances to match reserves
    function skim() external nonReentrant {
        MarketState memory market = readState(msg.sender);
        uint256 excessPt = _selfBalance(PT) - market.totalPt.Uint();
        uint256 excessSy = _selfBalance(SY) - market.totalSy.Uint();
        if (excessPt != 0) IERC20(PT).safeTransfer(market.treasury, excessPt);
        if (excessSy != 0) IERC20(SY).safeTransfer(market.treasury, excessSy);
    }


    /*///////////////////////////////////////////////////////////////
                                READ/WRITE STATES
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice read the state of the market from storage into memory for gas-efficient manipulation
     */
    function readState(address router) public view returns (MarketState memory market) {
        market.totalPt = _storage.totalPt;
        market.totalSy = _storage.totalSy;
        market.totalLp = totalSupply().Int();

        uint80 overriddenFee;

        (market.treasury, overriddenFee, market.reserveFeePercent) = IPMarketFactoryV3(factory).getMarketConfig(
            address(this),
            router
        );

        market.lnFeeRateRoot = overriddenFee == 0 ? lnFeeRateRoot : overriddenFee;
        market.scalarRoot = scalarRoot;
        market.expiry = expiry;

        market.lastLnImpliedRate = _storage.lastLnImpliedRate;
    }

    /// @notice write back the state of the market from memory to storage
    function _writeState(MarketState memory market) internal {
        uint96 lastLnImpliedRate96 = market.lastLnImpliedRate.Uint96();
        int128 totalPt128 = market.totalPt.Int128();
        int128 totalSy128 = market.totalSy.Int128();

        (uint16 observationIndex, uint16 observationCardinality) = observations.write(
            _storage.observationIndex,
            uint32(block.timestamp),
            _storage.lastLnImpliedRate,
            _storage.observationCardinality,
            _storage.observationCardinalityNext
        );

        _storage.totalPt = totalPt128;
        _storage.totalSy = totalSy128;
        _storage.lastLnImpliedRate = lastLnImpliedRate96;
        _storage.observationIndex = observationIndex;
        _storage.observationCardinality = observationCardinality;

        emit UpdateImpliedRate(block.timestamp, market.lastLnImpliedRate);
    }

    function getNonOverrideLnFeeRateRoot() external view returns (uint80) {
        return lnFeeRateRoot;
    }

}