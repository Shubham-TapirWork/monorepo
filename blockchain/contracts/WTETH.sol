// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "./interfaces/ILiquidityPool.sol";
import "./interfaces/IWtETH.sol";
import "./interfaces/ItETH.sol";

contract WtETH is ERC20, IWtETH, Ownable {
    ItETH public tETH;
    ILiquidityPool public liquidityPool;

    constructor(
        address _liquidityPool,
        address _tETH
    )
    ERC20("Wrapped asset", "wTETH")
    Ownable(msg.sender)
    {
        require(_liquidityPool != address(0), "WtETH: No zero addresses");
        require(_tETH != address(0), "WtETH: No zero addresses");

        tETH = ItETH(_tETH);
        liquidityPool = ILiquidityPool(_liquidityPool);
    }

    function name() public view virtual override returns (string memory) {
        return "Wrapped wTETH";
    }

    function wrap(uint256 _tETHAmount) external returns (uint256) {
        require(_tETHAmount > 0, "asset: can't wrap zero tETH");
        uint256 wtEthAmount = liquidityPool.sharesForAmount(_tETHAmount);
        _mint(msg.sender, wtEthAmount);
        tETH.transferFrom(msg.sender, address(this), _tETHAmount);
        return wtEthAmount;
    }

    function unwrap(uint256 _asset) external returns (uint256) {
        require(_asset > 0, "asset: can't unwrap zero asset");
        uint256 tETHAmount = liquidityPool.amountForShare(_asset);
        _burn(msg.sender, _asset);
        tETH.transfer(msg.sender, tETHAmount);
        return tETHAmount;
    }

    function getTETHByWtETH(uint256 _asset) external view returns (uint256) {
        return liquidityPool.amountForShare(_asset);
    }

}
