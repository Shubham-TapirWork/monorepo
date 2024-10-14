// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";


contract DEX {

	IERC20 token;

	event EthToTokenSwap(
		address swapper,
		uint256 tokenOutput,
		uint256 ethInput
	);

	event TokenToEthSwap(
		address swapper,
		uint256 tokensInput,
		uint256 ethOutput
	);

	event LiquidityProvided(
		address liquidityProvider,
		uint256 liquidityMinted,
		uint256 ethInput,
		uint256 tokensInput
	);

	event LiquidityRemoved(
		address liquidityRemover,
		uint256 liquidityWithdrawn,
		uint256 tokensOutput,
		uint256 ethOutput
	);

  	constructor (address tokenAddr) {
		token = IERC20(tokenAddr); 
	}
 
 	function init(uint256 tokens) public payable returns (uint256) {}

	function price(
		uint256 xInput,
		uint256 xReserves,
		uint256 yReserves
	) public pure returns (uint256 yOutput) {}

	function getLiquidity(address lp) public view returns (uint256) {}

	function ethToToken() public payable returns (uint256 tokenOutput) {}

	function tokenToEth(
		uint256 tokenInput
	) public returns (uint256 ethOutput) {}

	function deposit() public payable returns (uint256 tokensDeposited) {}

	function withdraw(
		uint256 amount
	) public returns (uint256 ethAmount, uint256 tokenAmount) {}
}
