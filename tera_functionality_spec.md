# 📜 Tera: Especificación Funcional (Institutional Yield)

Este documento define el comportamiento de cada sección del dashboard de Tera, conectando la experiencia visual con la lógica de los smart contracts en Avalanche.

---

## 1. Dashboard (Vista General)
**Objetivo:** Dar una foto instantánea del estado de la tesorería y el rendimiento del usuario.

### Funcionalidades:
*   **KPIs Principales:**
    *   `Total Treasury Balance`: Suma de todos los depósitos en el contrato `TeraVault`. (Lectura global).
    *   `Current APY`: Promedio ponderado del rendimiento generado por las estrategias activas.
    *   `Your Balance`: Balance específico del usuario conectado.
*   **Gráfico de Rendimiento:** Visualización de la curva de crecimiento del capital en los últimos 30 días.
*   **Recent Activity:** Feed de eventos `Deposited` y `Withdrawn` filtrados por el usuario.

---

## 2. Vaults / Products (Catálogo de Inversión)
**Objetivo:** Mostrar las opciones de inversión disponibles y sus condiciones.

### Funcionalidades:
*   **Cards de Producto:** Cada card representa un vault (ej: USDC Treasury Vault).
*   **Datos Clave:**
    *   `Asset`: Qué token se deposita (ej: USDC).
    *   `Lock Period`: Tiempo que el capital debe estar inmovilizado (ej: 30 días).
    *   `Capacity`: Cuánto capital máximo acepta el vault.
*   **Acción:** Botón "Invest" que abre la vista de detalle.

---

## 3. Vault Detail (Módulo de Operaciones)
**Objetivo:** Es el corazón operativo. Aquí es donde el dinero se mueve a la blockchain.

### Funcionalidades:
*   **Flujo de Depósito:**
    1.  Usuario ingresa monto.
    2.  `Approve`: Se firma una transacción para permitir que Tera use el USDC.
    3.  `Deposit`: Se firma la transacción final que bloquea los fondos.
*   **Flujo de Retiro:**
    *   Verificación de `LockExpiry`: Si el tiempo no pasó, el botón de retiro está deshabilitado o advierte sobre la penalidad.
    *   Cálculo de `Withdrawal Fee`: Muestra cuánto se descuenta por costos de salida.
*   **Claim Yield:** Botón para retirar solo los intereses generados sin tocar el capital principal.

---

## 4. Analytics (Transparencia Total)
**Objetivo:** Demostrar a nivel institucional que los fondos están seguros y rindiendo.

### Funcionalidades:
*   **Allocation Breakdown:** Gráfico de torta mostrando en qué protocolos (ej: Aave, TraderJoe, Benqi) está distribuido el capital del vault.
*   **Historical Yield:** Tabla de rendimientos mes a mes.
*   **Contract Info:** Links directos al Snowtrace (Explorador de Avalanche) para verificar el contrato.

---

## 5. Sidebar & Navigation (Control de Acceso)
**Objetivo:** Gestionar la identidad del usuario y la navegación fluida.

### Funcionalidades:
*   **Wallet Connector:** 
    *   Estado `Disconnected`: Botón "Connect Wallet" resaltado.
    *   Estado `Connected`: Muestra dirección acortada y balance de red (AVAX).
*   **System Status:** Indicador dinámico que verifica si la RPC de Avalanche está respondiendo.

---

## 🛠️ Matriz de Estados (UX)

| Acción | Estado Visual | Lógica Backend/Web3 |
| :--- | :--- | :--- |
| **Depósito** | Botón con spinner | Llamada a `vault.deposit(amount)` |
| **Retiro Bloqueado** | Card con candado y fecha | Consulta a `getPosition(user).lockExpiry` |
| **Carga de Datos** | Skeleton screens | `ethers.js` haciendo `multicall` |
| **Error de Red** | Toast de advertencia | Evento `networkChanged` no compatible |
