import { blockchain } from './blockchain';

document.addEventListener('DOMContentLoaded', async () => {
    const btnConnect = document.getElementById('btn-connect');
    const txtTotalTreasury = document.getElementById('total-treasury');
    const txtAPY = document.getElementById('total-apy');
    const txtUserBalance = document.getElementById('user-balance');

    // Función para actualizar la UI con datos reales
    async function updateUI() {
        const stats = await blockchain.getDashboardStats();
        if (stats) {
            if (txtTotalTreasury) txtTotalTreasury.innerText = `$${Number(stats.totalTreasury).toLocaleString()}`;
            if (txtAPY) txtAPY.innerText = `${stats.apy}% APY`;
            if (txtUserBalance) txtUserBalance.innerText = `$${Number(stats.userBalance).toLocaleString()}`;
            
            if (btnConnect) {
                btnConnect.innerText = `${blockchain.address.slice(0, 6)}...${blockchain.address.slice(-4)}`;
                btnConnect.classList.replace('btn-primary', 'btn-secondary');
            }
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
