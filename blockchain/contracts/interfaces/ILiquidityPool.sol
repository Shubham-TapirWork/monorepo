// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

interface ILiquidityPool {

    // should calculate what will be tETH share for ETH amount
    function sharesForAmount(uint256 _amount) external view returns (uint256);

    // should calculate tETH amount with given share, should be  (_share * getTotalPooledEther()) / totalShares
    function amountForShare(uint256 _share) external view returns (uint256);

    // should deposit msg.value to msg.sender, should calculate the tETH share and mint it
    function deposit() external payable returns (uint256);

    // should calculate user's total claim right now, should be getTotalPooledEther() * eETH.shares(_user)) / totalShares
    function getTotalEtherClaimOf(address _user) external view returns (uint256);

    // will calculate total ETH in in pool and outside pool(in beaconchain, rewarding and etc, this var should change oracle)
    function getTotalPooledEther() public view returns (uint256);
}