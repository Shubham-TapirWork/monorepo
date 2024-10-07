// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "./interfaces/ILiquidityPool.sol";
import "./interfaces/ItETH.sol";

/// @title TETH Contract
/// @notice This contract represents the tETH token, which is an ERC20 token backed by Ether in a liquidity pool.
/// @dev The contract interacts with the liquidity pool to mint and burn shares based on deposits and withdrawals of Ether.
contract TETH is IERC20, ItETH, Ownable {

    /// @notice Address of the liquidity pool contract managing Ether.
    ILiquidityPool public liquidityPool;

    /// @notice Total number of tETH shares in circulation.
    uint256 public totalShares;

    /// @notice Mapping of addresses to their corresponding number of tETH shares.
    mapping (address => uint256) public shares;

    /// @notice Mapping of allowances for token transfers as per the ERC20 standard.
    mapping (address => mapping (address => uint256)) public allowances;

    /// @notice Constructor to initialize the tETH contract with a liquidity pool.
    /// @param _liquidityPool The address of the liquidity pool contract.
    constructor(address _liquidityPool) Ownable(msg.sender) {
        require(_liquidityPool != address(0), "TETH: No zero addresses");
        liquidityPool = ILiquidityPool(_liquidityPool);
    }

    /// @notice Mints new tETH shares when Ether is deposited into the liquidity pool.
    /// @dev Can only be called by the liquidity pool contract.
    /// @param _user The address of the user receiving new tETH shares.
    /// @param _share The number of shares to be minted for the user.
    function mintShares(address _user, uint256 _share) external onlyPoolContract {
        shares[_user] += _share;
        totalShares += _share;

        emit Transfer(address(0), _user, liquidityPool.amountForShare(_share));
        emit TransferShares(address(0), _user, _share);
    }

    /// @notice Burns tETH shares when a user withdraws Ether from the liquidity pool.
    /// @dev Can only be called by the liquidity pool contract or the user themselves.
    /// @param _user The address of the user whose shares are to be burned.
    /// @param _share The number of shares to burn.
    function burnShares(address _user, uint256 _share) external onlyPoolContract {
        require(msg.sender == address(liquidityPool) || msg.sender == _user, "Incorrect Caller");
        require(shares[_user] >= _share, "BURN_AMOUNT_EXCEEDS_BALANCE");

        shares[_user] -= _share;
        totalShares -= _share;

        emit Transfer(_user, address(0), liquidityPool.amountForShare(_share));
        emit TransferShares(_user, address(0), _share);
    }

    /// @notice Returns the name of the token.
    /// @return The name of the token as "tapir tETH".
    function name() public pure returns (string memory) {
        return "tapir tETH";
    }

    /// @notice Returns the symbol of the token.
    /// @return The symbol of the token as "tETH".
    function symbol() public pure returns (string memory) {
        return "tETH";
    }

    /// @notice Returns the number of decimals for the token.
    /// @return 18, as tETH follows the standard 18 decimals for ERC20 tokens.
    function decimals() public pure returns (uint8) {
        return 18;
    }

    /// @notice Returns the total supply of tETH, which corresponds to the total Ether pooled in the liquidity pool.
    /// @return The total amount of Ether in the liquidity pool.
    function totalSupply() public view returns (uint256) {
        return liquidityPool.getTotalPooledEther();
    }

    /// @notice Returns the balance of Ether a user can claim from the liquidity pool based on their shares.
    /// @param _user The address of the user.
    /// @return The total Ether claimable by the user based on their tETH shares.
    function balanceOf(address _user) public view override(ItETH, IERC20) returns (uint256) {
        return liquidityPool.getTotalEtherClaimOf(_user);
    }

    /// @notice Transfers tETH from the sender to a recipient.
    /// @param _recipient The address of the recipient.
    /// @param _amount The amount of tETH (in Ether) to transfer.
    /// @return True if the transfer was successful.
    function transfer(address _recipient, uint256 _amount) external override(ItETH, IERC20) returns (bool) {
        _transfer(msg.sender, _recipient, _amount);
        return true;
    }

    /// @notice Returns the allowance of a spender on behalf of the owner.
    /// @param _owner The address of the token owner.
    /// @param _spender The address of the spender.
    /// @return The current allowance the spender has on behalf of the owner.
    function allowance(address _owner, address _spender) public view returns (uint256) {
        return allowances[_owner][_spender];
    }

    /// @notice Approves a spender to spend a specified amount of tETH on behalf of the caller.
    /// @param _spender The address of the spender.
    /// @param _amount The amount of tETH to approve for spending.
    /// @return True if the approval was successful.
    function approve(address _spender, uint256 _amount) external override(ItETH, IERC20) returns (bool) {
        _approve(msg.sender, _spender, _amount);
        return true;
    }

    /// @notice Increases the allowance of a spender.
    /// @param _spender The address of the spender.
    /// @param _increaseAmount The additional amount to add to the current allowance.
    /// @return True if the allowance increase was successful.
    function increaseAllowance(address _spender, uint256 _increaseAmount) external returns (bool) {
        address owner = msg.sender;
        uint256 currentAllowance = allowance(owner, _spender);
        _approve(owner, _spender, currentAllowance + _increaseAmount);
        return true;
    }

    /// @notice Decreases the allowance of a spender.
    /// @param _spender The address of the spender.
    /// @param _decreaseAmount The amount to decrease the current allowance by.
    /// @return True if the allowance decrease was successful.
    function decreaseAllowance(address _spender, uint256 _decreaseAmount) external returns (bool) {
        address owner = msg.sender;
        uint256 currentAllowance = allowance(owner, _spender);
        require(currentAllowance >= _decreaseAmount, "ERC20: decreased allowance below zero");
        unchecked {
            _approve(owner, _spender, currentAllowance - _decreaseAmount);
        }
        return true;
    }

    /// @notice Transfers tETH from a sender to a recipient on behalf of another user.
    /// @param _sender The address of the sender.
    /// @param _recipient The address of the recipient.
    /// @param _amount The amount of tETH to transfer.
    /// @return True if the transfer was successful.
    function transferFrom(address _sender, address _recipient, uint256 _amount) external override(ItETH, IERC20) returns (bool) {
        uint256 currentAllowance = allowances[_sender][msg.sender];
        require(currentAllowance >= _amount, "TETH: TRANSFER_AMOUNT_EXCEEDS_ALLOWANCE");
        unchecked {
            _approve(_sender, msg.sender, currentAllowance - _amount);
        }
        _transfer(_sender, _recipient, _amount);
        return true;
    }

    /// @notice Internal function to handle transferring tETH shares between users.
    /// @param _sender The address of the sender.
    /// @param _recipient The address of the recipient.
    /// @param _amount The amount of tETH to transfer (converted into shares).
    function _transfer(address _sender, address _recipient, uint256 _amount) internal {
        uint256 _sharesToTransfer = liquidityPool.sharesForAmount(_amount);
        _transferShares(_sender, _recipient, _sharesToTransfer);
        emit Transfer(_sender, _recipient, _amount);
    }

    /// @notice Internal function to approve a spender for a specified amount.
    /// @param _owner The address of the owner.
    /// @param _spender The address of the spender.
    /// @param _amount The amount of tETH to approve.
    function _approve(address _owner, address _spender, uint256 _amount) internal {
        require(_owner != address(0), "TETH: APPROVE_FROM_ZERO_ADDRESS");
        require(_spender != address(0), "TETH: APPROVE_TO_ZERO_ADDRESS");

        allowances[_owner][_spender] = _amount;
        emit Approval(_owner, _spender, _amount);
    }

    /// @notice Internal function to handle the transfer of tETH shares.
    /// @dev Transfers tETH shares between sender and recipient by updating their share balances.
    /// @param _sender The address of the sender.
    /// @param _recipient The address of the recipient.
    /// @param _sharesAmount The number of tETH shares to transfer.
    function _transferShares(address _sender, address _recipient, uint256 _sharesAmount) internal {
        require(_sender != address(0), "TETH: TRANSFER_FROM_THE_ZERO_ADDRESS");
        require(_recipient != address(0), "TETH: TRANSFER_TO_THE_ZERO_ADDRESS");
        require(_sharesAmount <= shares[_sender], "TETH: TRANSFER_AMOUNT_EXCEEDS_BALANCE");

        shares[_sender] -= _sharesAmount;  // Decrease sender's shares.
        shares[_recipient] += _sharesAmount;  // Increase recipient's shares.

        emit TransferShares(_sender, _recipient, _sharesAmount);  // Emit custom TransferShares event.
    }

    /*
        ====== MODIFIERS HERE ======
    */

    /// @notice Modifier to restrict access to only the Liquidity Pool contract.
    /// @dev Only the liquidity pool contract can call functions with this modifier.
    modifier onlyPoolContract() {
        require(msg.sender == address(liquidityPool), "TETH: Only pool contract function");
        _;
    }
}
