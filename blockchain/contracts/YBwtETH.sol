// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";  // Standard ERC20 implementation from OpenZeppelin.

import "./interfaces/IYBwtETH.sol";  // Interface for the YB_wtETH token.
import "./interfaces/IDepegPool.sol";  // Interface for interacting with the DepegPool contract.

/**
 * @title YBwtETH
 * @dev ERC20-based token representing the yield-bearing version of wtETH (YB_wtETH).
 *      This contract allows only the DepegPool to mint and burn tokens.
 */
contract YBwtETH is ERC20, IYBwtETH {

    /// @notice Address of the DepegPool contract managing mint and burn operations.
    IDepegPool public depegPool;

    /**
     * @dev Constructor initializes the token with a name, symbol, and the associated DepegPool contract.
     * @param _name The name of the token.
     * @param _symbol The symbol of the token.
     * @param _depegPool Address of the DepegPool contract responsible for managing this token.
     */
    constructor(
        string memory _name,
        string memory _symbol,
        address _depegPool
    )
        ERC20(_name, _symbol)  // Initialize the ERC20 token with the provided name and symbol.
    {
        require(_depegPool != address(0), "YBwtETH: No zero addresses");  // Ensure a valid DepegPool address.
        depegPool = IDepegPool(_depegPool);  // Assign the DepegPool contract to the state variable.
    }

    /**
     * @notice Mint YB_wtETH tokens to a specific account.
     * @dev This function can only be called by the DepegPool contract.
     * @param _account The address that will receive the minted tokens.
     * @param _value The amount of tokens to mint.
     */
    function mint(address _account, uint256 _value) external onlyDepegPool {
        _mint(_account, _value);  // Call the internal ERC20 _mint function to create new tokens.
    }

    /**
     * @notice Burn YB_wtETH tokens from a specific account.
     * @dev This function can only be called by the DepegPool contract.
     * @param _account The address from which tokens will be burned.
     * @param _value The amount of tokens to burn.
     */
    function burn(address _account, uint256 _value) external onlyDepegPool {
        _burn(_account, _value);  // Call the internal ERC20 _burn function to destroy tokens.
    }

    /*
        ====== MODIFIERS HERE ======
    */

    /**
     * @notice Modifier to restrict access to functions that only the DepegPool contract can call.
     * @dev Ensures that only the DepegPool contract can mint or burn tokens.
     */
    modifier onlyDepegPool() {
        require(msg.sender == address(depegPool), "YBwtETH: Only depeg pool contract function");
        _;
    }
}
