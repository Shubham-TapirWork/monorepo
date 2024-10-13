// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IWtETH is IERC20 {

    function wrap(uint256 _tETHAmount) external returns (uint256);
    function unwrap(uint256 _wtETH) external returns (uint256);
    function getTETHByWtETH(uint256 _wtETH) external view returns (uint256);

}
