// SPDX-License-Id|entifier: BUSL-1.1
pragma solidity 0.8.27;

import "@openzeppelin/contracts/access/Ownable.sol";

import "./interfaces/ItETH.sol";
import "./interfaces/ILiquidityPool.sol";
import "./interfaces/IWtETH.sol";

import "hardhat/console.sol";
import {IDepegPool} from "./interfaces/IDepegPool.sol";
import {IStableSwap} from "./interfaces/IStableSwap.sol";

/// @title TLiquidityPool Contract
/// @notice This contract manages a liquidity pool where users can deposit Ether and receive tETH shares.
/// @dev The contract interacts with the tETH token contract to mint shares based on Ether deposits.
contract TLiquidityPool is Ownable, ILiquidityPool {
    /// @notice Reference to the ItETH contract that manages tETH shares
    ItETH public tETH;

    /// @notice Reference to the IWtETH contract that manages tETH shares
    IWtETH public wtETH;

    /// @notice the address which will call rebase function and update the contract balance by adding rewards
    address public managerAddress;

    /// @notice Tracks the total value (in Ether) that has been claimed or withdrawn from the liquidity pool
    uint256 public totalValueOutOfLp;

    /// @notice Tracks the total value (in Ether) that is currently deposited in the liquidity pool
    uint256 public totalValueInLp;

    /// @dev Custom error to handle invalid deposit amounts or incorrect share calculations
    error InvalidAmount();
    /// @dev Custom error to handle when tETH is already setted
    error TETHAlreadySet();
    /// @dev when rebase function is called by non Manager Address
    error IncorrectCaller();
    /// @dev error when insufficient balance
    error InsufficientLiquidity();

    /**
        EVENTS
    **/
    /// @dev rebase event
    event Rebase(uint256 totalEthLocked, uint256 totalEEthShares);
    /// @dev deposit event
    event Deposit(address indexed sender, uint256 amount);
    /// @dev withdraw event
    event Withdraw(address indexed sender, address receipent, uint256 amount);

    /// @notice Constructor to initialize the contract
    constructor(address _managerAddress) Ownable(msg.sender) {
        managerAddress = _managerAddress;
    }

    /// @notice Allows owner to set tETH address
    /// @dev sets tETH contract address to LP, only owner can call this contract, also tETH should be zero address
    /// @param _contractTETH tETH address
    function setContract(address _contractTETH, address _contractWtETH) external onlyOwner {
        if (address(tETH) != address(0)) revert TETHAlreadySet();
        tETH = ItETH(_contractTETH);
        wtETH = IWtETH(_contractWtETH);
    }

    /// @notice Allows users to deposit Ether into the liquidity pool and mint tETH shares in return
    /// @dev The deposit amount must be valid (non-zero and fitting within uint128). Shares are calculated based on the pool's total value.
    /// @return The number of tETH shares minted for the deposit
    function deposit() external payable returns (uint256) {
        uint256 _amount = msg.value; // The amount of Ether deposited by the user
        totalValueInLp += uint128(_amount); // Update the total value in the pool

        // Calculate the number of tETH shares for the deposit amount
        uint256 share = _sharesForDepositAmount(_amount);

        // Revert if the amount is invalid (zero, exceeds uint128, or no shares can be issued)
        if (_amount > type(uint128).max || _amount == 0 || share == 0)
            revert InvalidAmount();

        // Mint tETH shares to the user
        tETH.mintShares(msg.sender, share);

        emit Deposit(msg.sender, _amount);
        return share; // Return the number of shares minted
    }

    function depositDepegProtection(
        address _depegPoolAddress,
        address _stableSwap,
        address _ybAddress,
        address _dpAddress
    ) external payable {
        uint256 _amount = msg.value; // The amount of Ether deposited by the user
        totalValueInLp += uint128(_amount); // Update the total value in the pool

        // Calculate the number of tETH shares for the deposit amount
        uint256 share = _sharesForDepositAmount(_amount);

        // Revert if the amount is invalid (zero, exceeds uint128, or no shares can be issued)
        if (_amount > type(uint128).max || _amount == 0 || share == 0)
            revert InvalidAmount();

        // Mint tETH shares to the liquidity contract, and wrap it
        tETH.mintShares(address(this), share);
        tETH.approve(address(wtETH), amountForShare(share));
        wtETH.wrap(amountForShare(share));

        // split wrap ETH which should be equal to _shares
        IDepegPool depegPool = IDepegPool(_depegPoolAddress);
        wtETH.approve(_depegPoolAddress, share);
        depegPool.splitToken(share);

        // swap all YB into DP
        IERC20(_ybAddress).approve(_stableSwap, share / 2);
        IStableSwap amm = IStableSwap(_stableSwap);
        amm.swap(0, 1, share / 2, 0);

        // finally send all dp to user
        IERC20 dp = IERC20(_dpAddress);
        dp.transfer(msg.sender, dp.balanceOf(address(this)));

    }

    function depositYieldBoosting(
        address _depegPoolAddress,
        address _stableSwap,
        address _ybAddress,
        address _dpAddress
    ) external payable {
        uint256 _amount = msg.value; // The amount of Ether deposited by the user
        totalValueInLp += uint128(_amount); // Update the total value in the pool

        // Calculate the number of tETH shares for the deposit amount
        uint256 share = _sharesForDepositAmount(_amount);

        // Revert if the amount is invalid (zero, exceeds uint128, or no shares can be issued)
        if (_amount > type(uint128).max || _amount == 0 || share == 0)
            revert InvalidAmount();

        // Mint tETH shares to the liquidity contract, and wrap it
        tETH.mintShares(address(this), share);
        tETH.approve(address(wtETH), amountForShare(share));
        wtETH.wrap(amountForShare(share));

        // split wrap ETH which should be equal to _shares
        IDepegPool depegPool = IDepegPool(_depegPoolAddress);
        wtETH.approve(_depegPoolAddress, share);
        depegPool.splitToken(share);

        // swap all dp into yb
        IERC20(_dpAddress).approve(_stableSwap, share / 2);
        IStableSwap amm = IStableSwap(_stableSwap);
        amm.swap(1, 0, share / 2, 0);

        // finally send all yb to user
        IERC20 yb = IERC20(_ybAddress);
        yb.transfer(msg.sender, yb.balanceOf(address(this)));

    }

    /// @notice withdraw from pool
    /// @dev Burns user share from msg.senders account & Sends equivalent amount of ETH back to the recipient
    /// @param _recipient the recipient who will receives the ETH
    /// @param _amount the amount to withdraw from contract
    /// it returns the amount of shares burned
    function withdraw(
        address _recipient,
        uint256 _amount
    ) external returns (uint256) {
        uint256 share = sharesForWithdrawalAmount(_amount);
        if (totalValueInLp < _amount || tETH.balanceOf(msg.sender) < _amount)
            revert InsufficientLiquidity();
        if (_amount > type(uint128).max || _amount == 0 || share == 0)
            revert InvalidAmount();

        totalValueInLp -= uint128(_amount);
        tETH.burnShares(msg.sender, share);

        _sendFund(_recipient, _amount);

        emit Withdraw(msg.sender, _recipient, _amount);
        return share;
    }

    /// @notice Internal function to calculate how many tETH shares should be minted for a given deposit amount
    /// @param _depositAmount The amount of Ether being deposited
    /// @return The number of tETH shares to be minted
    function _sharesForDepositAmount(
        uint256 _depositAmount
    ) internal view returns (uint256) {
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
    function sharesForAmount(uint256 _amount) public view returns (uint256) {
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
    function getTotalEtherClaimOf(
        address _user
    ) external view returns (uint256) {
        uint256 staked; // The amount of Ether the user has staked
        uint256 totalShares = tETH.totalShares(); // Total tETH shares in circulation

        // If there are shares, calculate the user's claimable Ether based on their shares
        if (totalShares > 0) {
            staked = (getTotalPooledEther() * tETH.shares(_user)) / totalShares;
        }

        return staked; // Return the claimable Ether
    }

    /**
     * @notice Calculates the amount of shares required to withdraw a specified amount of ether.
     * @param _amount The amount of ether to be withdrawn.
     * @return The number of shares corresponding to the given ether amount.
     */
    function sharesForWithdrawalAmount(
        uint256 _amount
    ) public view returns (uint256) {
        uint256 totalPooledEther = getTotalPooledEther(); // Get the total ether in the pool
        if (totalPooledEther == 0) {
            return 0; // If no ether is pooled, return 0 shares
        }
        uint256 numerator = _amount * tETH.totalShares(); // Calculate numerator (ether amount * total shares)

        return (numerator + totalPooledEther - 1) / totalPooledEther;
    }

    /// @notice Converts a given number of tETH shares back into an Ether amount
    /// @param _share The number of tETH shares to convert
    /// @return The corresponding Ether amount (in Wei)
    function amountForShare(uint256 _share) public view returns (uint256) {
        uint256 totalShares = tETH.totalShares(); // Total tETH shares in circulation

        // If there are no shares, return 0
        if (totalShares == 0) {
            return 0;
        }

        // Calculate the Ether amount based on the proportion of shares to total pooled Ether
        return (_share * getTotalPooledEther()) / totalShares;
    }

    /// @notice adding rewards to our contract to calculate price correctly
    /// @param _accruedRewards The validators rewards
    function rebase(int256 _accruedRewards) public {
        if (msg.sender != address(managerAddress)) revert IncorrectCaller();
        totalValueOutOfLp = uint256(
            int256(totalValueOutOfLp) + _accruedRewards
        );

        emit Rebase(getTotalPooledEther(), tETH.totalShares());
    }

    /// @notice sending ETH to user
    /// @param _recipient address of receiver
    /// @param _amount amount of ETH, which should be send
    function _sendFund(address _recipient, uint256 _amount) internal {
        uint256 balance = address(this).balance;
        (bool sent, ) = _recipient.call{value: _amount}("");
        require(sent && address(this).balance == balance - _amount, "SendFail");
    }
}
