// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "./interfaces/IYBwtETH.sol";
import "./interfaces/IDepegPool.sol";

contract YBwtETH is ERC20, IYBwtETH {

    IDepegPool public depegPool;

    constructor(
        string memory _name,
        string memory _symbol,
        address _depegPool
    )
    ERC20(_name, _symbol)
    {
        require(_depegPool != address(0), "YBwtETH: No zero addresses");
        depegPool = IDepegPool(_depegPool);
    }

    function mint(address _account, uint256 _value) external onlyDepegPool {
        _mint(_account, _value);
    }

    function burn(address _account, uint256 _value) external onlyDepegPool {
        _burn(_account, _value);
    }


    /*
        ====== MODIFIERS HERE ======
    */

    /// @notice Modifier to restrict access to only the Liquidity Pool contract.
    /// @dev Only the depeg pool contract can call functions with this modifier.
    modifier onlyDepegPool() {
        require(msg.sender == address(depegPool), "YBwtETH: Only depeg pool contract function");
        _;
    }

}
