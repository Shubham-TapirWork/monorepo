// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";  // Standard ERC20 contract from OpenZeppelin.
import "./interfaces/IYBwtETH.sol";  // Interface for the yield-bearing wtETH (YB_wtETH).
import "./interfaces/IDepegPool.sol";  // Interface for interacting with the DepegPool contract.

/**
 * @title DPwtETH
 * @dev ERC20-based token representing the depegged version of wtETH (DP_wtETH).
 *      This contract allows the DepegPool to mint and burn DP_wtETH tokens.
 */
contract DPwtETH is ERC20, IYBwtETH {

    /// @notice Address of the DepegPool contract that manages minting and burning.
    IDepegPool public depegPool;

    /**
     * @dev Constructor initializes the ERC20 token and assigns the depeg pool contract.
     * @param _name The name of the token.
     * @param _symbol The symbol of the token.
     * @param _depegPool Address of the DepegPool contract.
     */
    constructor(
        string memory _name,
        string memory _symbol,
        address _depegPool
    )
        ERC20(_name, _symbol)  // Initialize the ERC20 token with name and symbol.
    {
        require(_depegPool != address(0), "DPwtETH: No zero addresses");  // Ensure a valid pool address.
        depegPool = IDepegPool(_depegPool);  // Assign the pool contract.
    }

    /**
     * @notice Mint DP_wtETH tokens to a specific account.
     * @dev Can only be called by the DepegPool contract.
     * @param _account Address to receive the minted tokens.
     * @param _value Amount of tokens to mint.
     */
    function mint(address _account, uint256 _value) external onlyDepegPool {
        _mint(_account, _value);  // Call ERC20's internal _mint function.
    }

    /**
     * @notice Burn DP_wtETH tokens from a specific account.
     * @dev Can only be called by the DepegPool contract.
     * @param _account Address from which tokens will be burned.
     * @param _value Amount of tokens to burn.
     */
    function burn(address _account, uint256 _value) external onlyDepegPool {
        _burn(_account, _value);  // Call ERC20's internal _burn function.
    }

    /*
        ====== MODIFIERS HERE ======
    */

    /**
     * @notice Restricts access to functions that can only be called by the DepegPool contract.
     * @dev Ensures that only the DepegPool contract can mint or burn tokens.
     */
    modifier onlyDepegPool() {
        require(msg.sender == address(depegPool), "DPwtETH: Only depeg pool contract function");
        _;
    }

}
