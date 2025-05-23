// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.27;

import "@openzeppelin/contracts/access/Ownable.sol";
import {YBasset} from "./YBasset.sol";
import {DPasset} from "./DPasset.sol";
import {DepegPool} from "./DepegPool.sol";
import {StableSwap} from "./StableSwap.sol";

contract Manager is Ownable {
    struct Depeg {
        address yb_asset;
        address dp_asset;
        address depegPool;
        address swap;
    }

    Depeg[] public depegModule;


    event DeployDepeg(
        address tPool,
        address asset,
        string yb_name,
        string yb_symbol,
        string dp_name,
        string dp_symbol,
        string pool_name,
        uint256 poolActiveDuration,
        string flag
    );

    constructor() Ownable(msg.sender) {}

    function deployDepeg(
        address _tPool,
        address _asset,
        string memory _yb_name,
        string memory _yb_symbol,
        string memory _dp_name,
        string memory _dp_symbol,
        string memory _pool_name,
        uint256 _poolActiveDuration,
        string memory flag
    ) external onlyOwner {
        YBasset yb = new YBasset(_yb_name, _yb_symbol);
        DPasset dp = new DPasset(_dp_name, _dp_symbol);
        DepegPool depegPool = new DepegPool(
            _tPool,
            _asset,
            address(dp),
            address(yb),
            _poolActiveDuration,
            _pool_name,
            flag
        );

        yb.setContractDepegPool(address(depegPool));
        dp.setContractDepegPool(address(depegPool));

        StableSwap swap = new StableSwap([address(yb), address(dp)]);

        depegModule.push(
            Depeg(address(yb), address(dp), address(depegPool), address(swap))
        );

        emit DeployDepeg(
            _tPool,
             _asset,
             _yb_name,
             _yb_symbol,
             _dp_name,
             _dp_symbol,
             _pool_name,
             _poolActiveDuration,
            flag
        );
    }
}
