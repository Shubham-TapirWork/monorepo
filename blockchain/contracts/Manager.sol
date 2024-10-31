// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import "@openzeppelin/contracts/access/Ownable.sol";
import {YBwtETH} from "./YBwtETH.sol";
import {DPwtETH} from "./DPwtETH.sol";
import {DepegPool} from "./DepegPool.sol";
import {StableSwap} from "./StableSwap.sol";


contract Manager is Ownable {

    struct Depeg {
        address yb_wtETH;
        address dp_wtETH;
        address depegPool;
        address swap;
    }

    Depeg[] public depegModule;

    constructor(
    )
    Ownable(msg.sender)
    {}

    function deployDepeg(
        address _tPool,
        address _wtETH,
        string memory _yb_name,
        string memory _yb_symbol,
        string memory _dp_name,
        string memory _dp_symbol,
        string memory _pool_name,
        uint256 _poolActiveDuration
    ) external onlyOwner {
        YBwtETH yb = new YBwtETH(_yb_name, _yb_symbol);
        DPwtETH dp = new DPwtETH(_dp_name, _dp_symbol);
        DepegPool depegPool = new DepegPool(
            _tPool,
            _wtETH,
            address(dp),
            address(yb),
            _poolActiveDuration,
            _pool_name
        );

        yb.setContractDepegPool(address(depegPool));
        dp.setContractDepegPool(address(depegPool));

        StableSwap swap = new StableSwap([address(yb), address(dp)]);

        depegModule.push(
                Depeg(address(yb),
                address(dp),
                address(depegPool),
                address(swap)
            )
        );
    }

}
