import { blockchain } from './blockchain';
import { i18n } from './i18n';

document.addEventListener('DOMContentLoaded', async () => {
    const btnConnect = document.getElementById('btn-connect');
    const txtTotalTreasury = document.getElementById('total-treasury');
    const txtAPY = document.getElementById('total-apy');
    const txtUserBalance = document.getElementById('user-balance');
    const txtWalletBalance = document.getElementById('wallet-balance');
    
    const btnLangEn = document.getElementById('lang-en');
    const btnLangEs = document.getElementById('lang-es');

    const btnAddMetaMask = document.getElementById('btn-add-metamask');

    // Inicializar i18n
    i18n.apply();
    updateLangUI();

    // Función para actualizar la UI con datos reales o mock
    async function updateUI() {
        try {
            const stats = await blockchain.getDashboardStats();
            const walletBal = await blockchain.getWalletBalance();

            if (stats) {
                if (txtTotalTreasury) txtTotalTreasury.innerText = `$${Number(stats.totalTreasury).toLocaleString()}`;
                if (txtAPY) txtAPY.innerText = `${stats.apy}% APY`;
                if (txtUserBalance) txtUserBalance.innerText = `$${Number(stats.userBalance).toLocaleString()}`;
            }

            if (txtWalletBalance) {
                txtWalletBalance.innerText = `$${Number(walletBal).toLocaleString()}`;
            }
        } catch (error) {
            console.warn("Using mock data because contracts are not deployed yet.");
            if (txtTotalTreasury) txtTotalTreasury.innerText = "$1,240,450.00";
            if (txtAPY) txtAPY.innerText = "5.42% APY";
            if (txtUserBalance) txtUserBalance.innerText = "$340,000.00";
            if (txtWalletBalance) txtWalletBalance.innerText = "$1,000.00";
        }

        updateWalletButton();
    }

    function updateWalletButton() {
        if (blockchain.address && btnConnect) {
            btnConnect.innerHTML = `
                <span class="material-symbols-outlined text-xl">account_balance_wallet</span>
                ${blockchain.address.slice(0, 6)}...${blockchain.address.slice(-4)}
            `;
            btnConnect.classList.remove('btn-primary');
            btnConnect.classList.add('bg-secondary/20', 'text-secondary', 'border', 'border-secondary/30');
        } else if (btnConnect) {
            btnConnect.innerHTML = `
                <span class="material-symbols-outlined text-xl">wallet</span>
                <span data-i18n="connect_wallet">${i18n.t('connect_wallet')}</span>
            `;
        }
    }

    function updateLangUI() {
        const lang = i18n.currentLang;
        if (lang === 'en') {
            btnLangEn.classList.add('bg-primary', 'text-background');
            btnLangEn.classList.remove('text-on-surface-variant', 'hover:text-white');
            btnLangEs.classList.remove('bg-primary', 'text-background');
            btnLangEs.classList.add('text-on-surface-variant', 'hover:text-white');
        } else {
            btnLangEs.classList.add('bg-primary', 'text-background');
            btnLangEs.classList.remove('text-on-surface-variant', 'hover:text-white');
            btnLangEn.classList.remove('bg-primary', 'text-background');
            btnLangEn.classList.add('text-on-surface-variant', 'hover:text-white');
        }
    }

    // Eventos de idioma
    btnLangEn.addEventListener('click', () => {
        i18n.setLanguage('en');
        updateLangUI();
        updateWalletButton();
    });

    btnLangEs.addEventListener('click', () => {
        i18n.setLanguage('es');
        updateLangUI();
        updateWalletButton();
    });

    // --- Botón MetaMask ---
    if (btnAddMetaMask) {
        btnAddMetaMask.addEventListener('click', () => blockchain.watchAsset());
    }

    // --- Modal de Inversión Rápida (FAB) ---
    const fab = document.getElementById('fab-quick-invest');
    const modal = document.getElementById('modal-quick-invest');
    const closeBase = document.getElementById('modal-close-base');
    const btnConfirmDeposit = document.getElementById('btn-confirm-deposit');

    if (fab && modal) {
        fab.addEventListener('click', () => {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        });
    }

    if (closeBase) {
        closeBase.addEventListener('click', () => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        });
    }

    if (btnConfirmDeposit) {
        btnConfirmDeposit.addEventListener('click', async () => {
            const inputAmount = modal.querySelector('input');
            const amount = inputAmount.value;

            if (!amount || amount <= 0) {
                alert("Please enter a valid amount");
                return;
            }

            try {
                btnConfirmDeposit.innerText = i18n.t('confirming');
                btnConfirmDeposit.disabled = true;

                await blockchain.deposit(amount);
                
                btnConfirmDeposit.innerText = i18n.t('deposit_success');
                setTimeout(() => {
                    modal.classList.add('hidden');
                    btnConfirmDeposit.innerText = i18n.t('confirm_deposit');
                    btnConfirmDeposit.disabled = false;
                }, 2000);

                await updateUI();
            } catch (error) {
                console.error(error);
                alert("Deposit failed: " + error.message);
                btnConfirmDeposit.innerText = i18n.t('confirm_deposit');
                btnConfirmDeposit.disabled = false;
            }
        });
    }

    // Evento conectar wallet
    if (btnConnect) {
        btnConnect.addEventListener('click', async () => {
            if (blockchain.address) return; 
            
            try {
                btnConnect.innerText = i18n.currentLang === 'en' ? 'Connecting...' : 'Conectando...';
                await blockchain.connect();
                await updateUI();
            } catch (error) {
                console.error(error);
                updateWalletButton();
                alert("Connection failed: " + error.message);
            }
        });
    }

    // --- Auto-conexión Proactiva ---
    async function autoConnect() {
        if (window.ethereum) {
            // Verificamos si ya tenemos permisos previos
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts.length > 0) {
                try {
                    await blockchain.connect();
                    await updateUI();
                } catch (e) {
                    console.error("Auto-connect failed", e);
                }
            }
        }
    }

    autoConnect();

    // --- Efectos Visuales ---
    const observerOptions = { threshold: 0.1 };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    document.querySelectorAll('.activity-item, .glass-card').forEach(item => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(10px)';
        item.style.transition = 'all 0.4s ease-out';
        observer.observe(item);
    });
});



