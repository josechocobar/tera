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

  // ── Step 1: Deploy or use existing USDC ────────────────
  let usdcAddress;

  if (hre.network.name === "fuji" || hre.network.name === "avalanche") {
    // Use real USDC addresses on Avalanche networks
    usdcAddress =
      hre.network.name === "avalanche"
        ? "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E" // USDC on C-Chain mainnet
        : "0x5425890298aed601595a70AB815c96711a31Bc65"; // USDC on Fuji testnet
    console.log("Using existing USDC at:", usdcAddress);
  } else {
    // Deploy Mock USDC for local testing
    console.log("Deploying MockUSDC...");
    const MockUSDC = await hre.ethers.getContractFactory("MockUSDC");
    const usdc = await MockUSDC.deploy();
    await usdc.waitForDeployment();
    usdcAddress = await usdc.getAddress();
    console.log("✅ MockUSDC deployed at:", usdcAddress);
  }

  // ── Step 2: Deploy Vault ───────────────────────────────
  const lockPeriod = 30 * 24 * 60 * 60; // 30 days
  const withdrawalFee = 10; // 0.1%

  console.log("\nDeploying TeraVault...");
  console.log("  Asset:", usdcAddress);
  console.log("  Lock period:", lockPeriod, "seconds (30 days)");
  console.log("  Withdrawal fee:", withdrawalFee, "bps (0.1%)");

  const TeraVault = await hre.ethers.getContractFactory("TeraVault");
  const vault = await TeraVault.deploy(usdcAddress, lockPeriod, withdrawalFee);
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log("✅ TeraVault deployed at:", vaultAddress);

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
