const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("TeraVault", function () {
  let vault, usdc, strategy;
  let owner, user1, user2;

  const LOCK_PERIOD = 30 * 24 * 60 * 60; // 30 days in seconds
  const WITHDRAWAL_FEE = 10; // 0.1% = 10 bps
  const DEPOSIT_AMOUNT = ethers.parseUnits("10000", 6); // 10,000 USDC

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy Mock USDC
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    usdc = await MockUSDC.deploy();

    // Deploy Vault
    const TeraVault = await ethers.getContractFactory("TeraVault");
    vault = await TeraVault.deploy(
      await usdc.getAddress(),
      LOCK_PERIOD,
      WITHDRAWAL_FEE
    );

    // Give user1 some USDC
    await usdc.mint(user1.address, DEPOSIT_AMOUNT * 10n);
    // Approve vault to spend user1's USDC
    await usdc.connect(user1).approve(await vault.getAddress(), ethers.MaxUint256);
  });

  // ──────────────────────────────────────────────
  //  Deployment
  // ──────────────────────────────────────────────

  describe("Deployment", function () {
    it("Should set the correct asset", async function () {
      expect(await vault.asset()).to.equal(await usdc.getAddress());
    });

    it("Should set the correct lock period", async function () {
      expect(await vault.lockPeriod()).to.equal(LOCK_PERIOD);
    });

    it("Should set the correct withdrawal fee", async function () {
      expect(await vault.withdrawalFeeBps()).to.equal(WITHDRAWAL_FEE);
    });

    it("Should set owner correctly", async function () {
      expect(await vault.owner()).to.equal(owner.address);
    });
  });

  // ──────────────────────────────────────────────
  //  Deposits
  // ──────────────────────────────────────────────

  describe("Deposits", function () {
    it("Should accept deposits", async function () {
      await vault.connect(user1).deposit(DEPOSIT_AMOUNT);

      const position = await vault.getPosition(user1.address);
      expect(position.deposited).to.equal(DEPOSIT_AMOUNT);
    });

    it("Should update total deposited", async function () {
      await vault.connect(user1).deposit(DEPOSIT_AMOUNT);
      expect(await vault.totalDeposited()).to.equal(DEPOSIT_AMOUNT);
    });

    it("Should set lock expiry correctly", async function () {
      await vault.connect(user1).deposit(DEPOSIT_AMOUNT);

      const position = await vault.getPosition(user1.address);
      expect(position.isLocked).to.be.true;
    });

    it("Should transfer tokens from user to vault", async function () {
      const vaultAddr = await vault.getAddress();
      const balBefore = await usdc.balanceOf(vaultAddr);

      await vault.connect(user1).deposit(DEPOSIT_AMOUNT);

      const balAfter = await usdc.balanceOf(vaultAddr);
      expect(balAfter - balBefore).to.equal(DEPOSIT_AMOUNT);
    });

    it("Should revert on zero amount", async function () {
      await expect(
        vault.connect(user1).deposit(0)
      ).to.be.revertedWith("Vault: zero amount");
    });

    it("Should emit Deposited event", async function () {
      await expect(vault.connect(user1).deposit(DEPOSIT_AMOUNT))
        .to.emit(vault, "Deposited");
    });
  });

  // ──────────────────────────────────────────────
  //  Withdrawals
  // ──────────────────────────────────────────────

  describe("Withdrawals", function () {
    beforeEach(async function () {
      await vault.connect(user1).deposit(DEPOSIT_AMOUNT);
    });

    it("Should revert if lock not expired", async function () {
      await expect(
        vault.connect(user1).withdraw()
      ).to.be.revertedWith("Vault: still locked");
    });

    it("Should allow withdrawal after lock expires", async function () {
      // Fast-forward time past lock period
      await time.increase(LOCK_PERIOD + 1);

      await vault.connect(user1).withdraw();

      const position = await vault.getPosition(user1.address);
      expect(position.deposited).to.equal(0);
    });

    it("Should deduct withdrawal fee", async function () {
      await time.increase(LOCK_PERIOD + 1);

      const balBefore = await usdc.balanceOf(user1.address);
      await vault.connect(user1).withdraw();
      const balAfter = await usdc.balanceOf(user1.address);

      // Fee = 10000 USDC * 10 / 10000 = 1 USDC
      const expectedFee = (DEPOSIT_AMOUNT * BigInt(WITHDRAWAL_FEE)) / 10000n;
      const expectedPayout = DEPOSIT_AMOUNT - expectedFee;

      expect(balAfter - balBefore).to.equal(expectedPayout);
    });

    it("Should emit Withdrawn event", async function () {
      await time.increase(LOCK_PERIOD + 1);

      await expect(vault.connect(user1).withdraw())
        .to.emit(vault, "Withdrawn");
    });

    it("Should revert if nothing deposited", async function () {
      await expect(
        vault.connect(user2).withdraw()
      ).to.be.revertedWith("Vault: nothing deposited");
    });
  });

  // ──────────────────────────────────────────────
  //  Admin
  // ──────────────────────────────────────────────

  describe("Admin", function () {
    it("Should allow owner to pause", async function () {
      await vault.pause();
      await expect(
        vault.connect(user1).deposit(DEPOSIT_AMOUNT)
      ).to.be.reverted; // EnforcedPause
    });

    it("Should allow owner to unpause", async function () {
      await vault.pause();
      await vault.unpause();
      await vault.connect(user1).deposit(DEPOSIT_AMOUNT);
      expect(await vault.totalDeposited()).to.equal(DEPOSIT_AMOUNT);
    });

    it("Should allow owner to change lock period", async function () {
      const newPeriod = 60 * 24 * 60 * 60; // 60 days
      await vault.setLockPeriod(newPeriod);
      expect(await vault.lockPeriod()).to.equal(newPeriod);
    });

    it("Should reject fee higher than MAX_FEE_BPS", async function () {
      await expect(
        vault.setWithdrawalFee(600) // 6% > 5% max
      ).to.be.revertedWith("Vault: fee too high");
    });

    it("Should reject non-owner admin calls", async function () {
      await expect(
        vault.connect(user1).pause()
      ).to.be.reverted; // OwnableUnauthorizedAccount
    });
  });
});
