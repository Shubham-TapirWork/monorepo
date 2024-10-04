// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

interface ILiquidityPool {
    function sharesForAmount(uint256 _amount) external view returns (uint256);
    function amountForShare(uint256 _share) external view returns (uint256);
}