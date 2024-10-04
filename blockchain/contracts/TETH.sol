// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "./interfaces/ILiquidityPool.sol";
import "./interfaces/ItETH.sol";


contract TETH is IERC20, ItETH, Ownable {

    ILiquidityPool public liquidityPool;

    uint256 public totalShares;
    mapping (address => uint256) public shares;
    mapping (address => mapping (address => uint256)) public allowances;

    constructor(
        address _liquidityPool
    )
    Ownable(msg.sender) {
        require(_liquidityPool != address(0), "TETH: No zero addresses");
        liquidityPool = ILiquidityPool(_liquidityPool);
    }


    function mintShares(address _user, uint256 _share) external onlyPoolContract {
        shares[_user] += _share;
        totalShares += _share;

        emit Transfer(address(0), _user, liquidityPool.amountForShare(_share));
        emit TransferShares(address(0), _user, _share);
    }


    /*
        ====== MODIFIERS HERE ======
    */



    modifier onlyPoolContract() {
        require(msg.sender == address(liquidityPool), "Only pool contract function");
        _;
    }

}






