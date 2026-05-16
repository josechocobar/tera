export const TERA_VAULT_ABI = [
  "function asset() view returns (address)",
  "function totalDeposited() view returns (uint256)",
  "function currentAPY() view returns (uint256)",
  "function getPosition(address account) view returns (uint256 deposited, uint256 yieldEarned, uint256 lockExpiry, bool isLocked)",
  "function deposit(uint256 amount)",
  "function withdraw()",
  "function claimYield()",
  "event Deposited(address indexed user, uint256 amount, uint256 lockExpiry)",
  "event Withdrawn(address indexed user, uint256 amount, uint256 fee)"
];

export const IERC20_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)"
];

// Direcciones de ejemplo (se actualizarán al hacer deploy en Fuji)
export const CONTRACT_ADDRESSES = {
  fuji: {
    vault: "0x8d6A23361EC6988e81E573be723C3993a0FA5Bf1",
    usdc: "0x5425890298aed601595a70AB815c96711a31Bc65" // Fuji USDC real
  },

  local: {
    vault: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", // Ejemplo Hardhat
    usdc: "0x5FbDB2315678afecb367f032d93F642f64180aa3"
  }
};
