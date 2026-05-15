// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ITeraStrategy
 * @notice Interface that all Tera yield strategies must implement.
 */
interface ITeraStrategy {
    /// @notice Deploy idle funds from the vault into the yield source.
    function deploy(uint256 amount) external;

    /// @notice Withdraw funds from the yield source back to the vault.
    function recall(uint256 amount) external;

    /// @notice Harvest accrued yield and send it to the vault.
    function harvest() external returns (uint256 harvested);

    /// @notice Total assets currently managed by this strategy.
    function totalAssets() external view returns (uint256);

    /// @notice Estimated APY in basis points (e.g. 542 = 5.42%).
    function estimatedAPY() external view returns (uint256);
}

/**
 * @title SimpleYieldStrategy
 * @author Tera Protocol
 * @notice MVP yield strategy that simulates yield accrual.
 *
 *         In production, this would integrate with:
 *         - Aave V3 on Avalanche (lending)
 *         - Benqi (lending)
 *         - Trader Joe (LP + farming)
 *         - GMX (delta-neutral)
 *
 *         For the MVP, yield is simulated by the owner depositing
 *         rewards into the contract, which are then harvestable.
 */
contract SimpleYieldStrategy is ITeraStrategy, Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable asset;
    address public vault;
    uint256 public deployedAmount;
    uint256 public simulatedYield;

    event Deployed(uint256 amount);
    event Recalled(uint256 amount);
    event Harvested(uint256 amount);
    event YieldSimulated(uint256 amount);

    modifier onlyVault() {
        require(msg.sender == vault, "Strategy: only vault");
        _;
    }

    constructor(address _asset, address _vault) Ownable(msg.sender) {
        require(_asset != address(0), "Strategy: zero asset");
        require(_vault != address(0), "Strategy: zero vault");
        asset = IERC20(_asset);
        vault = _vault;
    }

    // ──────────────────────────────────────────────
    //  ITeraStrategy Implementation
    // ──────────────────────────────────────────────

    /**
     * @notice Receive funds from the vault to "deploy" into yield source.
     *         MVP: just holds the tokens.
     */
    function deploy(uint256 amount) external override onlyVault {
        asset.safeTransferFrom(vault, address(this), amount);
        deployedAmount += amount;
        emit Deployed(amount);
    }

    /**
     * @notice Return funds from the strategy to the vault.
     */
    function recall(uint256 amount) external override onlyVault {
        require(amount <= deployedAmount, "Strategy: insufficient");
        deployedAmount -= amount;
        asset.safeTransfer(vault, amount);
        emit Recalled(amount);
    }

    /**
     * @notice Harvest simulated yield and send to vault.
     */
    function harvest() external override onlyVault returns (uint256 harvested) {
        harvested = simulatedYield;
        if (harvested > 0) {
            simulatedYield = 0;
            asset.safeTransfer(vault, harvested);
            emit Harvested(harvested);
        }
    }

    function totalAssets() external view override returns (uint256) {
        return deployedAmount + simulatedYield;
    }

    function estimatedAPY() external pure override returns (uint256) {
        return 542; // 5.42% for MVP
    }

    // ──────────────────────────────────────────────
    //  Admin (MVP: simulate yield by depositing rewards)
    // ──────────────────────────────────────────────

    /**
     * @notice Owner deposits reward tokens to simulate yield generation.
     *         In production, this would be replaced by actual DeFi protocol interactions.
     */
    function simulateYield(uint256 amount) external onlyOwner {
        asset.safeTransferFrom(msg.sender, address(this), amount);
        simulatedYield += amount;
        emit YieldSimulated(amount);
    }

    function setVault(address _vault) external onlyOwner {
        require(_vault != address(0), "Strategy: zero vault");
        vault = _vault;
    }
}
