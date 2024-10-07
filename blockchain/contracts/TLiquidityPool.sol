// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import "@openzeppelin/contracts/access/Ownable.sol";

import "./interfaces/ItETH.sol";
import "./interfaces/ILiquidityPool.sol";

/// @title TLiquidityPool Contract
/// @notice This contract manages a liquidity pool where users can deposit Ether and receive tETH shares.
/// @dev The contract interacts with the tETH token contract to mint shares based on Ether deposits.
contract TLiquidityPool is Ownable, ILiquidityPool {
    /// @notice Reference to the ItETH contract that manages tETH shares
    ItETH immutable public tETH;

    /// @notice Tracks the total value (in Ether) that has been claimed or withdrawn from the liquidity pool
    uint128 public totalValueOutOfLp;

    /// @notice Tracks the total value (in Ether) that is currently deposited in the liquidity pool
    uint128 public totalValueInLp;

    /// @dev Custom error to handle invalid deposit amounts or incorrect share calculations
    error InvalidAmount();

    /// @notice Constructor to initialize the contract
    /// @param _tEthAddress The address of the ItETH contract (tokenized Ether contract)
    constructor(address _tEthAddress)
    Ownable(msg.sender) {
        tETH = ItETH(_tEthAddress);
    }

    /// @notice Allows users to deposit Ether into the liquidity pool and mint tETH shares in return
    /// @dev The deposit amount must be valid (non-zero and fitting within uint128). Shares are calculated based on the pool's total value.
    /// @return The number of tETH shares minted for the deposit
    function deposit() external payable returns (uint256) {
        uint256 _amount = msg.value;  // The amount of Ether deposited by the user
        totalValueInLp += uint128(_amount);  // Update the total value in the pool

        // Calculate the number of tETH shares for the deposit amount
        uint256 share = _sharesForDepositAmount(_amount);

        // Revert if the amount is invalid (zero, exceeds uint128, or no shares can be issued)
        if (_amount > type(uint128).max || _amount == 0 || share == 0) revert InvalidAmount();

        // Mint tETH shares to the user
        tETH.mintShares(msg.sender, share);

        return share;  // Return the number of shares minted
    }

    /// @notice Internal function to calculate how many tETH shares should be minted for a given deposit amount
    /// @param _depositAmount The amount of Ether being deposited
    /// @return The number of tETH shares to be minted
    function _sharesForDepositAmount(uint256 _depositAmount) internal view returns (uint256) {
        // Calculate the total pooled Ether, excluding the current deposit
        uint256 totalPooledEther = getTotalPooledEther() - _depositAmount;

        // If no Ether is in the pool yet, the deposit amount equals the number of shares
        if (totalPooledEther == 0) {
            return _depositAmount;
        }

        // Calculate shares based on the proportion of the deposit to total pooled Ether
        return (_depositAmount * tETH.totalShares()) / totalPooledEther;
    }

    /// @notice Returns the total amount of Ether pooled in the liquidity pool
    /// @dev Includes both deposited and claimed amounts
    /// @return The total pooled Ether (in Wei)
    function getTotalPooledEther() public view returns (uint256) {
        return totalValueOutOfLp + totalValueInLp;
    }

    /// @notice Calculates how many tETH shares are equivalent to a given amount of Ether
    /// @param _amount The amount of Ether for which to calculate shares
    /// @return The corresponding number of tETH shares
    function sharesForAmount(uint256 _amount) public view returns(uint256) {
        uint256 totalPooledEther = getTotalPooledEther();

        // If no Ether is in the pool, no shares can be calculated
        if (totalPooledEther == 0) {
            return 0;
        }

        // Calculate shares based on the proportion of the amount to total pooled Ether
        return (_amount * tETH.totalShares()) / totalPooledEther;
    }

    /// @notice Returns the total amount of Ether that a user can claim based on their tETH shares
    /// @param _user The address of the user
    /// @return The total claimable Ether (in Wei)
    function getTotalEtherClaimOf(address _user) external view returns (uint256) {
        uint256 staked;  // The amount of Ether the user has staked
        uint256 totalShares = tETH.totalShares();  // Total tETH shares in circulation

        // If there are shares, calculate the user's claimable Ether based on their shares
        if (totalShares > 0) {
            staked = (getTotalPooledEther() * tETH.shares(_user)) / totalShares;
        }

        return staked;  // Return the claimable Ether
    }

    /// @notice Converts a given number of tETH shares back into an Ether amount
    /// @param _share The number of tETH shares to convert
    /// @return The corresponding Ether amount (in Wei)
    function amountForShare(uint256 _share) public view returns (uint256) {
        uint256 totalShares = tETH.totalShares();  // Total tETH shares in circulation

        // If there are no shares, return 0
        if (totalShares == 0) {
            return 0;
        }

        // Calculate the Ether amount based on the proportion of shares to total pooled Ether
        return (_share * getTotalPooledEther()) / totalShares;
    }
}
