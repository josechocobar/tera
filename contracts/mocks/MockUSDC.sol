// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockUSDC
 * @notice A simple ERC-20 mock for testing. Mints 1 billion tokens to deployer.
 *         Used in tests and local devnet only — NOT for production.
 */
contract MockUSDC is ERC20 {
    uint8 private _decimals;

    constructor() ERC20("USD Coin (Mock)", "USDC") {
        _decimals = 6; // Real USDC uses 6 decimals
        _mint(msg.sender, 1_000_000_000 * 10 ** _decimals);
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    /**
     * @notice Anyone can mint tokens in the mock (for testing).
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
