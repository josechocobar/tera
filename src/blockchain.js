import { ethers } from 'ethers';
import { TERA_VAULT_ABI, IERC20_ABI, CONTRACT_ADDRESSES } from './constants';

export class BlockchainService {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.vaultContract = null;
        this.usdcContract = null;
        this.address = null;
        this.network = 'fuji'; // Default a Fuji para el MVP
    }

    async init() {
        if (!window.ethereum) {
            throw new Error("No crypto wallet found. Please install MetaMask or Core.");
        }
        this.provider = new ethers.BrowserProvider(window.ethereum);
    }

    async connect() {
        await this.init();
        this.signer = await this.provider.getSigner();
        this.address = await this.signer.getAddress();
        
        const addresses = CONTRACT_ADDRESSES[this.network];
        
        this.vaultContract = new ethers.Contract(addresses.vault, TERA_VAULT_ABI, this.signer);
        this.usdcContract = new ethers.Contract(addresses.usdc, IERC20_ABI, this.signer);

        return this.address;
    }

    async getDashboardStats() {
        if (!this.vaultContract) await this.connect();

        try {
            const totalDeposited = await this.vaultContract.totalDeposited();
            const apy = await this.vaultContract.currentAPY();
            
            let userBalance = 0;
            let yieldEarned = 0;
            
            if (this.address) {
                const position = await this.vaultContract.getPosition(this.address);
                userBalance = position.deposited;
                yieldEarned = position.yieldEarned;
            }

            return {
                totalTreasury: ethers.formatUnits(totalDeposited, 6),
                apy: (Number(apy) / 100).toFixed(2),
                userBalance: ethers.formatUnits(userBalance, 6),
                userYield: ethers.formatUnits(yieldEarned, 6)
            };
        } catch (error) {
            console.error("Error fetching stats:", error);
            return null;
        }
    }

    async deposit(amount) {
        if (!this.vaultContract) await this.connect();
        
        const amountWei = ethers.parseUnits(amount.toString(), 6);
        const vaultAddress = await this.vaultContract.getAddress();

        // 1. Check Allowance
        const allowance = await this.usdcContract.allowance(this.address, vaultAddress);
        
        if (allowance < amountWei) {
            console.log("Approving USDC...");
            const approveTx = await this.usdcContract.approve(vaultAddress, ethers.MaxUint256);
            await approveTx.wait();
            console.log("Approved!");
        }

        // 2. Deposit
        console.log("Depositing...");
        const depositTx = await this.vaultContract.deposit(amountWei);
        const receipt = await depositTx.wait();
        console.log("Deposit successful!", receipt);
        
        return receipt;
    }

    async getWalletBalance() {
        if (!this.usdcContract) await this.connect();
        try {
            const balance = await this.usdcContract.balanceOf(this.address);
            return ethers.formatUnits(balance, 6);
        } catch (error) {
            console.error("Error fetching wallet balance:", error);
            return "0.00";
        }
    }

    async watchAsset() {
        if (!window.ethereum) return;
        
        const addresses = CONTRACT_ADDRESSES[this.network];
        
        try {
            await window.ethereum.request({
                method: 'wallet_watchAsset',
                params: {
                    type: 'ERC20',
                    options: {
                        address: addresses.usdc,
                        symbol: 'USDC',
                        decimals: 6,
                        image: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png',
                    },
                },
            });
        } catch (error) {
            console.error("Error watching asset:", error);
        }
    }
}


export const blockchain = new BlockchainService();
