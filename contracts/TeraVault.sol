// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title TeraVault
 * @author Tera Protocol
 * @notice Institutional-grade vault for yield generation with time-lock mechanics.
 *         Users deposit an ERC-20 asset (e.g. USDC) which is locked for a
 *         configurable period while accruing yield from a pluggable Strategy.
 *
 * Key design decisions:
 *  - Non-custodial: funds sit in this contract or in the connected Strategy.
 *  - Pausable: owner can pause deposits in an emergency.
 *  - Per-user lock: each deposit starts its own lock timer.
 *  - Withdrawal fee: configurable fee retained by the protocol on early/normal withdrawals.
 */
contract TeraVault is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;

    // ──────────────────────────────────────────────
    //  State
    // ──────────────────────────────────────────────

    IERC20 public immutable asset;          // Deposit token (e.g. USDC)
    address public strategy;                // Active yield strategy
    uint256 public lockPeriod;              // Lock duration in seconds
    uint256 public withdrawalFeeBps;        // Fee in basis points (100 = 1%)
    uint256 public totalDeposited;          // Sum of all user deposits

    struct UserInfo {
        uint256 deposited;      // Principal deposited
        uint256 yieldEarned;    // Accumulated yield (updated on interactions)
        uint256 lockExpiry;     // Timestamp when lock expires
        uint256 lastUpdate;     // Last time yield was calculated
    }

    mapping(address => UserInfo) public users;

    // ──────────────────────────────────────────────
    //  Constants
    // ──────────────────────────────────────────────

    uint256 public constant MAX_FEE_BPS = 500;      // Max 5%
    uint256 public constant BPS_DENOMINATOR = 10_000;

    // ──────────────────────────────────────────────
    //  Events
    // ──────────────────────────────────────────────

    event Deposited(address indexed user, uint256 amount, uint256 lockExpiry);
    event Withdrawn(address indexed user, uint256 amount, uint256 fee);
    event YieldClaimed(address indexed user, uint256 amount);
    event StrategyUpdated(address indexed oldStrategy, address indexed newStrategy);
    event LockPeriodUpdated(uint256 oldPeriod, uint256 newPeriod);
    event WithdrawalFeeUpdated(uint256 oldFee, uint256 newFee);

    // ──────────────────────────────────────────────
    //  Constructor
    // ──────────────────────────────────────────────

    /**
     * @param _asset          Address of the deposit token (USDC, WAVAX, etc.)
     * @param _lockPeriod     Initial lock period in seconds (e.g. 30 days = 2592000)
     * @param _withdrawalFee  Initial withdrawal fee in basis points
     */
    constructor(
        address _asset,
        uint256 _lockPeriod,
        uint256 _withdrawalFee
    ) Ownable(msg.sender) {
        require(_asset != address(0), "Vault: zero address");
        require(_withdrawalFee <= MAX_FEE_BPS, "Vault: fee too high");

        asset = IERC20(_asset);
        lockPeriod = _lockPeriod;
        withdrawalFeeBps = _withdrawalFee;
    }

    // ──────────────────────────────────────────────
    //  User Actions
    // ──────────────────────────────────────────────

    /**
     * @notice Deposit `amount` of the asset token into the vault.
     *         Starts or extends the user's lock period.
     */
    function deposit(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Vault: zero amount");

        // Update yield before changing balances
        _updateYield(msg.sender);

        // Transfer tokens in
        asset.safeTransferFrom(msg.sender, address(this), amount);

        UserInfo storage user = users[msg.sender];
        user.deposited += amount;
        user.lockExpiry = block.timestamp + lockPeriod;
        totalDeposited += amount;

        emit Deposited(msg.sender, amount, user.lockExpiry);
    }

    /**
     * @notice Withdraw the full deposited principal after the lock period expires.
     *         A withdrawal fee is deducted and kept in the vault.
     */
    function withdraw() external nonReentrant {
        UserInfo storage user = users[msg.sender];
        require(user.deposited > 0, "Vault: nothing deposited");
        require(block.timestamp >= user.lockExpiry, "Vault: still locked");

        _updateYield(msg.sender);

        uint256 principal = user.deposited;
        uint256 fee = (principal * withdrawalFeeBps) / BPS_DENOMINATOR;
        uint256 payout = principal - fee;

        user.deposited = 0;
        user.lockExpiry = 0;
        totalDeposited -= principal;

        asset.safeTransfer(msg.sender, payout);

        emit Withdrawn(msg.sender, payout, fee);
    }

    /**
     * @notice Claim accumulated yield without touching the principal.
     */
    function claimYield() external nonReentrant {
        _updateYield(msg.sender);

        UserInfo storage user = users[msg.sender];
        uint256 yield_ = user.yieldEarned;
        require(yield_ > 0, "Vault: no yield");

        user.yieldEarned = 0;
        asset.safeTransfer(msg.sender, yield_);

        emit YieldClaimed(msg.sender, yield_);
    }

    // ──────────────────────────────────────────────
    //  View Functions
    // ──────────────────────────────────────────────

    /**
     * @notice Returns the full position info for a user.
     */
    function getPosition(address account)
        external
        view
        returns (
            uint256 deposited,
            uint256 yieldEarned,
            uint256 lockExpiry,
            bool isLocked
        )
    {
        UserInfo memory user = users[account];
        deposited = user.deposited;
        yieldEarned = user.yieldEarned + _pendingYield(account);
        lockExpiry = user.lockExpiry;
        isLocked = block.timestamp < user.lockExpiry;
    }

    /**
     * @notice Returns the current vault APY in basis points (e.g. 542 = 5.42%).
     *         For MVP this is a simple estimation; in production it would
     *         query the Strategy for real-time rates.
     */
    function currentAPY() external view returns (uint256) {
        if (strategy == address(0)) {
            return 542; // 5.42% default for MVP simulation
        }
        // TODO: Query strategy for real APY
        return 542;
    }

    // ──────────────────────────────────────────────
    //  Internal
    // ──────────────────────────────────────────────

    /**
     * @dev Updates the accumulated yield for `account` based on elapsed time.
     *      MVP uses a simple linear yield model; production should query Strategy.
     */
    function _updateYield(address account) internal {
        uint256 pending = _pendingYield(account);
        if (pending > 0) {
            users[account].yieldEarned += pending;
        }
        users[account].lastUpdate = block.timestamp;
    }

    /**
     * @dev Calculates pending yield since last update.
     *      Simple model: 5.42% annualized, linear accrual.
     */
    function _pendingYield(address account) internal view returns (uint256) {
        UserInfo memory user = users[account];
        if (user.deposited == 0 || user.lastUpdate == 0) return 0;

        uint256 elapsed = block.timestamp - user.lastUpdate;
        // APY 5.42% = 542 bps. Per-second rate: deposited * 542 / 10000 / 365.25 days
        uint256 annualYield = (user.deposited * 542) / BPS_DENOMINATOR;
        uint256 yield_ = (annualYield * elapsed) / 365.25 days;
        return yield_;
    }

    // ──────────────────────────────────────────────
    //  Admin
    // ──────────────────────────────────────────────

    function setStrategy(address _strategy) external onlyOwner {
        address old = strategy;
        strategy = _strategy;
        emit StrategyUpdated(old, _strategy);
    }

    function setLockPeriod(uint256 _lockPeriod) external onlyOwner {
        uint256 old = lockPeriod;
        lockPeriod = _lockPeriod;
        emit LockPeriodUpdated(old, _lockPeriod);
    }

    function setWithdrawalFee(uint256 _fee) external onlyOwner {
        require(_fee <= MAX_FEE_BPS, "Vault: fee too high");
        uint256 old = withdrawalFeeBps;
        withdrawalFeeBps = _fee;
        emit WithdrawalFeeUpdated(old, _fee);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
