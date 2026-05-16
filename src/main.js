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
                // Mostramos 6 decimales para ver el movimiento del yield
                if (txtTotalTreasury) txtTotalTreasury.innerText = `$${Number(stats.totalTreasury).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 6})}`;
                if (txtAPY) txtAPY.innerText = `${stats.apy}% APY`;
                if (txtUserBalance) txtUserBalance.innerText = `$${Number(stats.userBalance).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 6})}`;
            }

            if (txtWalletBalance) {
                txtWalletBalance.innerText = `$${Number(walletBal).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 6})}`;
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

    // ... (rest of helper functions)

    const btnBonus = document.getElementById('btn-bonus');
    if (btnBonus) {
        btnBonus.addEventListener('click', async () => {
            try {
                btnBonus.innerText = i18n.t('confirming');
                await blockchain.claimBonus();
                alert("Bonus $100 claimed!");
                await updateUI();
            } catch (error) {
                if (error.message !== "USER_CANCELLED") alert("Bonus failed: " + error.message);
            } finally {
                btnBonus.innerText = i18n.t('claim_bonus');
            }
        });
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
    
    const btnWithdraw = document.getElementById('btn-withdraw');
    const btnClaim = document.getElementById('btn-claim');

    if (btnWithdraw) {
        btnWithdraw.addEventListener('click', async () => {
            try {
                btnWithdraw.innerText = i18n.t('confirming');
                await blockchain.withdraw();
                alert("Withdraw successful!");
                await updateUI();
            } catch (error) {
                if (error.message !== "USER_CANCELLED") alert("Withdraw failed: " + error.message);
            } finally {
                btnWithdraw.innerText = 'Withdraw';
            }
        });
    }

    if (btnClaim) {
        btnClaim.addEventListener('click', async () => {
            try {
                btnClaim.innerText = i18n.t('confirming');
                await blockchain.claimYield();
                alert("Yield claimed!");
                await updateUI();
            } catch (error) {
                if (error.message !== "USER_CANCELLED") alert("Claim failed: " + error.message);
            } finally {
                btnClaim.innerText = 'Claim';
            }
        });
    }

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
        let selectedDuration = 2592000; // Default 30 days

        const durationBtns = modal.querySelectorAll('.duration-btn');
        const txtModalAPY = document.getElementById('modal-apy');

        const apyMap = {
            "60": "2.00%",
            "900": "2.00%",
            "3600": "3.00%",
            "86400": "4.00%",
            "1296000": "6.00%",
            "2592000": "8.00%"
        };

        durationBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                durationBtns.forEach(b => {
                    b.classList.remove('border-primary', 'bg-primary/10', 'text-white');
                    b.classList.add('border-outline-variant');
                });
                btn.classList.add('border-primary', 'bg-primary/10', 'text-white');
                btn.classList.remove('border-outline-variant');
                
                selectedDuration = btn.getAttribute('data-value');
                if (txtModalAPY) txtModalAPY.innerText = apyMap[selectedDuration] || "5.42%";
            });
        });

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

                await blockchain.deposit(amount, selectedDuration);
                
                btnConfirmDeposit.innerText = i18n.t('deposit_success');
                setTimeout(() => {
                    modal.classList.add('hidden');
                    btnConfirmDeposit.innerText = i18n.t('confirm_deposit');
                    btnConfirmDeposit.disabled = false;
                }, 2000);

                await updateUI();
            } catch (error) {
                console.error(error);
                if (error.message === "USER_CANCELLED") {
                    alert(i18n.t('cancelled_by_user'));
                } else {
                    alert("Deposit failed: " + error.message);
                }
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



