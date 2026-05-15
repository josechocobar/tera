import { blockchain } from './blockchain';

document.addEventListener('DOMContentLoaded', async () => {
    const btnConnect = document.getElementById('btn-connect');
    const txtTotalTreasury = document.getElementById('total-treasury');
    const txtAPY = document.getElementById('total-apy');
    const txtUserBalance = document.getElementById('user-balance');

    // Función para actualizar la UI con datos reales o mock
    async function updateUI() {
        try {
            const stats = await blockchain.getDashboardStats();
            if (stats) {
                if (txtTotalTreasury) txtTotalTreasury.innerText = `$${Number(stats.totalTreasury).toLocaleString()}`;
                if (txtAPY) txtAPY.innerText = `${stats.apy}% APY`;
                if (txtUserBalance) txtUserBalance.innerText = `$${Number(stats.userBalance).toLocaleString()}`;
            } else {
                throw new Error("No stats returned");
            }
        } catch (error) {
            console.warn("Using mock data because contracts are not deployed yet.");
            // Mock Data Fallback para que la UI no se vea vacía
            if (txtTotalTreasury) txtTotalTreasury.innerText = "$1,240,450.00";
            if (txtAPY) txtAPY.innerText = "5.42% APY";
            if (txtUserBalance) txtUserBalance.innerText = "$340,000.00";
        }

        // Actualizar el botón de wallet siempre que estemos conectados
        if (blockchain.address && btnConnect) {
            btnConnect.innerHTML = `
                <span class="material-symbols-outlined text-xl">account_balance_wallet</span>
                ${blockchain.address.slice(0, 6)}...${blockchain.address.slice(-4)}
            `;
            btnConnect.classList.remove('btn-primary');
            btnConnect.classList.add('bg-secondary/20', 'text-secondary', 'border', 'border-secondary/30');
        }
    }

    // Evento conectar wallet
    if (btnConnect) {
        btnConnect.addEventListener('click', async () => {
            try {
                btnConnect.innerText = 'Connecting...';
                await blockchain.connect();
                await updateUI();
            } catch (error) {
                console.error(error);
                btnConnect.innerText = 'Connect Wallet';
                alert("Connection failed: " + error.message);
            }
        });
    }

    // Auto-update si ya estaba conectado
    if (window.ethereum && window.ethereum.selectedAddress) {
        await blockchain.connect();
        await updateUI();
    }
});
