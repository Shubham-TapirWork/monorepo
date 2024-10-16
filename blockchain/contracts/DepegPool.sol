// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "./interfaces/ILiquidityPool.sol";
import "./interfaces/IWtETH.sol";
import "./interfaces/ItETH.sol";
import "./interfaces/IDPwtETH.sol";
import "./interfaces/IYBwtETH.sol";

contract DepegPool {

    string public name;
    IWtETH public immutable wtETH;
    IDPwtETH public immutable DP_wtETH;
    IYBwtETH public immutable YB_wtETH;
    uint256 public poolActiveDuration;
    uint256 public startSharePrice;

    // start time in secs
    uint256 public startTime;

    constructor(
        address _wtETH,
        address _DP_wtETH,
        address _YB_wtETH,
        uint256 _poolActiveDuration, // active duration in secs
        string memory _name
    )
    {
        wtETH = IWtETH(_wtETH);
        DP_wtETH = IDPwtETH(_DP_wtETH);
        YB_wtETH = IYBwtETH(_YB_wtETH);
        name = _name;
        poolActiveDuration = _poolActiveDuration;
        startTime = block.timestamp;
        startSharePrice = currentSharePrice();
    }

    function splitToken(uint256 _amount) external {
        require(checkPoolIsActive(), "DepegPool: pool isn't active");

        DP_wtETH.mint(msg.sender, _amount / 2);
        YB_wtETH.mint(msg.sender, _amount / 2);
        wtETH.transferFrom(msg.sender, address(this), _amount);
    }

    function unSplitToken(uint256 _amount) external {
        require(checkPoolIsActive(), "DepegPool: pool isn't active");

        DP_wtETH.burn(msg.sender, _amount / 2);
        YB_wtETH.burn(msg.sender, _amount / 2);
        wtETH.transferFrom(address(this), msg.sender, _amount);
    }

    function checkPoolIsActive() public view returns(bool) {
        return block.timestamp < startTime + poolActiveDuration;
    }

    function currentSharePrice() public view returns(uint256) {
        return 123;
    }
}
