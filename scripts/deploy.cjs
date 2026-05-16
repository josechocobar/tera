const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("╔══════════════════════════════════════════╗");
  console.log("║      TERA PROTOCOL — Deploy Script       ║");
  console.log("╚══════════════════════════════════════════╝");
  console.log("");
  console.log("Deployer:", deployer.address);
  console.log("Network:", hre.network.name);
  console.log("");

  // ── Step 1: Deploy Private Mock USDC ────────────────
  console.log("Deploying Private MockUSDC for testing...");
  const MockUSDC = await hre.ethers.getContractFactory("contracts/MockUSDC.sol:MockUSDC");
  const usdc = await MockUSDC.deploy();
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  console.log("✅ Private MockUSDC deployed at:", usdcAddress);


  // ── Step 2: Deploy Vault ───────────────────────────────
  const lockPeriod = 60; // 1 minute (default)
  const withdrawalFee = 0; // 0%

  console.log("\nDeploying TeraVault...");
  console.log("  Asset:", usdcAddress);
  console.log("  Lock period:", lockPeriod, "seconds (Default)");
  console.log("  Withdrawal fee:", withdrawalFee, "bps (0%)");

  const TeraVault = await hre.ethers.getContractFactory("TeraVault");
  const vault = await TeraVault.deploy(usdcAddress, lockPeriod, withdrawalFee);
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log(`✅ TeraVault deployed at: ${vaultAddress}`);

  // NUEVO: Donamos 1,000 USDC al Vault como "Reserva de Rendimiento"
  console.log("\nFunding Vault with yield reserve...");
  const reserveAmount = hre.ethers.parseUnits("1000", 6);
  await usdc.mint(vaultAddress, reserveAmount);
  console.log("✅ Vault funded with 1,000 USDC reserve!");

  // ── Step 3: Deploy Strategy ────────────────────────────
  console.log("\nDeploying SimpleYieldStrategy...");
  const Strategy = await hre.ethers.getContractFactory("SimpleYieldStrategy");
  const strategy = await Strategy.deploy(usdcAddress, vaultAddress);
  await strategy.waitForDeployment();
  const strategyAddress = await strategy.getAddress();
  console.log("✅ SimpleYieldStrategy deployed at:", strategyAddress);

  // ── Step 4: Link strategy to vault ─────────────────────
  console.log("\nLinking strategy to vault...");
  const tx = await vault.setStrategy(strategyAddress);
  await tx.wait();
  console.log("✅ Strategy linked!");

  // ── Summary ────────────────────────────────────────────
  console.log("\n╔══════════════════════════════════════════╗");
  console.log("║          DEPLOYMENT COMPLETE              ║");
  console.log("╠══════════════════════════════════════════╣");
  console.log(`║  USDC:     ${usdcAddress}`);
  console.log(`║  Vault:    ${vaultAddress}`);
  console.log(`║  Strategy: ${strategyAddress}`);
  console.log("╚══════════════════════════════════════════╝");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
