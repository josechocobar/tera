export const translations = {
    en: {
        dashboard: "Dashboard",
        vaults: "Vaults",
        analytics: "Analytics",
        settings: "Settings",
        connect_wallet: "Connect Wallet",
        total_treasury: "Total Treasury Balance",
        today_change: "today",
        your_balance: "Your Balance",
        active_vaults: "Active Vaults",
        yield_performance: "Yield Performance (30D)",
        activity: "Activity",
        view_all: "View All",
        system_status: "System Status",
        operational: "Operational",
        export_pdf: "Export PDF",
        manage_assets: "Manage Assets",
        usdc_prime: "USDC-Prime",
        yield_dist: "Yield Dist.",
        ago: "ago",
        yesterday: "Yesterday",
        active_products: "Active Products",
        institutional_yield: "Institutional yield strategies available now.",
        search_vaults: "Search vaults...",
        invested: "Invested",
        details: "Details",
        deposit: "Deposit",
        upcoming: "Upcoming",
        low_risk: "Low Risk",
        medium_risk: "Medium Risk",
        quick_invest: "Quick Investment",
        confirm_deposit: "Confirm Deposit",
        in_wallet: "In Wallet",
        add_to_metamask: "Add to MetaMask",
        confirming: "Confirming...",
        deposit_success: "Deposit Successful!",
        cancelled_by_user: "Transaction cancelled in MetaMask.",
        min: "min",
        hour: "hour",
        day: "day",
        days: "days",
        claim_bonus: "Claim $100 Bonus",
        min_claim_info: "Minimum $0.10 required to claim.",
        claim_ready: "Yield ready to claim!"
    },
    es: {
        dashboard: "Panel",
        vaults: "Bóvedas",
        analytics: "Análisis",
        settings: "Ajustes",
        connect_wallet: "Conectar Billetera",
        total_treasury: "Balance Total de Tesorería",
        today_change: "hoy",
        your_balance: "Tu Balance",
        active_vaults: "Bóvedas Activas",
        yield_performance: "Rendimiento (30D)",
        activity: "Actividad",
        view_all: "Ver Todo",
        system_status: "Estado del Sistema",
        operational: "Operativo",
        export_pdf: "Exportar PDF",
        manage_assets: "Gestionar Activos",
        usdc_prime: "USDC-Prime",
        yield_dist: "Dist. de Rendimiento",
        ago: "hace",
        yesterday: "Ayer",
        active_products: "Productos Activos",
        institutional_yield: "Estrategias de rendimiento institucional disponibles.",
        search_vaults: "Buscar bóvedas...",
        invested: "Invertido",
        details: "Detalles",
        deposit: "Depositar",
        upcoming: "Próximamente",
        low_risk: "Riesgo Bajo",
        medium_risk: "Riesgo Medio",
        quick_invest: "Inversión Rápida",
        confirm_deposit: "Confirmar Depósito",
        in_wallet: "En Billetera",
        add_to_metamask: "Añadir a MetaMask",
        confirming: "Confirmando...",
        deposit_success: "¡Depósito Exitoso!",
        cancelled_by_user: "Transacción cancelada en MetaMask.",
        min: "min",
        hour: "hora",
        day: "día",
        days: "días",
        claim_bonus: "Reclamar Bono $100",
        min_claim_info: "Mínimo $0.10 para reclamar.",
        claim_ready: "¡Ganancias listas para retirar!"
    }





};

class I18nService {
    constructor() {
        this.currentLang = localStorage.getItem('tera-lang') || 'en';
    }

    setLanguage(lang) {
        this.currentLang = lang;
        localStorage.setItem('tera-lang', lang);
        this.apply();
        // Emitir evento para otros scripts
        window.dispatchEvent(new CustomEvent('langChanged', { detail: lang }));
    }

    t(key) {
        return translations[this.currentLang][key] || key;
    }

    apply() {
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            el.innerText = this.t(key);
        });
    }
}

export const i18n = new I18nService();
