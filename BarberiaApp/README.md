# BarberShop CRM - App Móvil Android (Kotlin + Jetpack Compose)

Aplicación nativa para Android diseñada para la gestión de barberías y peluquerías en tiempo real con paridad total de funcionalidades con el panel web `/gestion-elite`, funcionamiento **offline-first**, descarga local de clientes y seguridad contra cuentas suspendidas.

---

## 📱 Módulos y Funcionalidades Incluidas

| Módulo | Icono | Descripción |
|---|---|---|
| **Resumen General** | 📊 | Métricas de ingresos brutos, cantidad de cortes del día/mes y balance. |
| **Registrar Cortes (CRM)** | ✂️ | Historial de servicios, registro offline-first con indicador `🟡 Pendiente` o `🟢 Sincronizado`. |
| **Buscador Local de Clientes** | 🔍 | **Autocompletado predictivo** buscando en la base de datos descargada en el teléfono por nombre o teléfono, acumulando puntos automáticamente. |
| **Control de Caja & Cierres** | 💵 | Arqueo en tiempo real de efectivo y transferencias, liquidaciones individuales y cierre definitivo. |
| **Servicios & Combos** | 💈 | Catálogo de cortes, precios, duraciones y creación de nuevos servicios. |
| **Ventas de Productos** | 🛍️ | Venta directa de productos de reventa y cosmética masculina registrando comisión al barbero. |
| **Inventario & Stock** | 📦 | Control de stock físico y alertas de reposición mínima. |
| **Gastos del Salón** | 💸 | Registro y control de gastos fijos (alquiler, luz) y variables (insumos). |
| **Clientes & Fidelización** | 👤 | Directorio completo de clientes, teléfono, historial de visitas y puntos acumulados. |
| **Reservas & Turnos** | 📅 | Turnos solicitados desde la web pública con opción de **Confirmar** o **Cancelar**. |
| **Barberos & Esquemas** | 👥 | *(Admin / SuperAdmin)* Gestión del equipo, asignación de comisión/alquiler, activación, suspensión y eliminación. |
| **Configuración del Negocio** | ⚙️ | *(Admin / SuperAdmin)* Puntos por corte, meta de canje, activación/pausa de turnos web y monto de señas. |
| **Cerrar Sesión** | 🚪 | Botón discreto en el encabezado y en el menú lateral para alternar cuentas con confirmación. |

*(Se excluyeron intencionalmente las funciones meramente estéticas de la web como modificar favicon o slider).*

---

## 🚀 Cómo abrir y ejecutar en Android Studio

1. Abre **Android Studio**.
2. Selecciona **File > Open...** (Abrir).
3. Selecciona la carpeta:
   `/Users/guillote/Desktop/Paginas Webs/Barberia/BarberiaApp`
4. Espera a que Gradle sincronice las dependencias automáticamente.
5. Conecta tu teléfono por USB o ejecuta un emulador Android (API 34 recomendada).
6. Presiona el botón verde de **Run (▶)**.

---

## 🛡️ Comportamiento Offline & Revocación

- **Descarga completa de clientes:** Al iniciar sesión o sincronizar, la app descarga toda la base de clientes y catálogo a SQLite local (Room).
- **Al cortar sin internet:** Puedes buscar clientes ya cargados y registrar el corte sin depender de señal.
- **Revocación por suspensión:** Si la cuenta del barbero es suspendida o eliminada desde la web, apenas el teléfono se conecte a internet y reciba un 401 o 403, la app **aborta el sync, purga y elimina los registros locales pendientes y cierra la sesión de inmediato**.
