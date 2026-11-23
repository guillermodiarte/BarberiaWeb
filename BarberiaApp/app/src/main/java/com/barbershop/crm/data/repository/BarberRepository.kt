package com.barbershop.crm.data.repository

import android.content.Context
import androidx.work.*
import com.barbershop.crm.core.database.AppDatabase
import com.barbershop.crm.core.database.entities.*
import com.barbershop.crm.core.network.NetworkClient
import com.barbershop.crm.core.session.SessionManager
import com.barbershop.crm.core.sync.SyncWorker
import com.barbershop.crm.data.models.*
import kotlinx.coroutines.flow.Flow
import java.text.SimpleDateFormat
import java.util.*

class BarberRepository(private val context: Context) {

    private val db = AppDatabase.getInstance(context)
    private val networkClient = NetworkClient(context)
    private val sessionManager = SessionManager(context)

    fun getLocalRecords(): Flow<List<ServiceRecordEntity>> = db.serviceRecordDao().getAllRecords()
    fun getLocalServices(): Flow<List<ServiceEntity>> = db.serviceDao().getActiveServices()
    fun getLocalCustomers(): Flow<List<CustomerEntity>> = db.customerDao().getAllCustomers()
    fun getLocalProducts(): Flow<List<ProductEntity>> = db.productDao().getActiveProducts()
    fun getLocalBarbers(): Flow<List<BarberEntity>> = db.barberDao().getAllBarbers()
    fun getLocalExpenses(): Flow<List<ExpenseEntity>> = db.expenseDao().getAllExpenses()
    fun getLocalBookings(): Flow<List<BookingEntity>> = db.bookingDao().getAllBookings()

    // Búsqueda rápida local de clientes
    suspend fun searchCustomersLocal(query: String): List<CustomerEntity> {
        return db.customerDao().searchCustomers(query.trim())
    }

    // -------------------------------------------------------------------------
    // REFRESH EN TIEMPO REAL (SINCRONIZACIÓN DIRECTA API -> ROOM)
    // -------------------------------------------------------------------------

    suspend fun refreshServices(): Result<Unit> {
        return try {
            val resp = networkClient.getApiService().getServices(includeInactive = false)
            if (resp.isSuccessful && resp.body() != null) {
                val entities = resp.body()!!.map {
                    ServiceEntity(
                        id = it.id,
                        name = it.name,
                        description = it.description,
                        durationMinutes = it.durationMinutes,
                        price = it.price,
                        isCombo = it.isCombo,
                        isActive = it.isActive
                    )
                }
                db.serviceDao().clearAll()
                db.serviceDao().insertAll(entities)
                Result.success(Unit)
            } else {
                Result.failure(Exception("Error al obtener servicios (${resp.code()})"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun refreshCustomers(): Result<Unit> {
        return try {
            val resp = networkClient.getApiService().getCustomers()
            if (resp.isSuccessful && resp.body() != null) {
                val customerEntities = resp.body()!!.map {
                    CustomerEntity(
                        id = it.id,
                        fullName = it.fullName,
                        phone = it.phone,
                        dni = it.dni,
                        email = it.email,
                        notes = it.notes,
                        loyaltyPoints = it.loyaltyPoints,
                        cutsCount = it.cutsCount ?: 0
                    )
                }
                db.customerDao().clearAll()
                db.customerDao().insertAll(customerEntities)
                Result.success(Unit)
            } else {
                Result.failure(Exception("Error al obtener clientes (${resp.code()})"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun refreshProducts(): Result<Unit> {
        return try {
            val resp = networkClient.getApiService().getProducts(includeInactive = false)
            if (resp.isSuccessful && resp.body() != null) {
                val pEntities = resp.body()!!.map {
                    ProductEntity(
                        id = it.id,
                        name = it.name,
                        description = it.description,
                        category = it.category,
                        salePrice = it.salePrice,
                        costPrice = it.costPrice,
                        stockQuantity = it.stockQuantity,
                        minStockAlert = it.minStockAlert,
                        isActive = it.isActive
                    )
                }
                db.productDao().clearAll()
                db.productDao().insertAll(pEntities)
                Result.success(Unit)
            } else {
                Result.failure(Exception("Error al obtener productos"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun refreshBookings(): Result<Unit> {
        return try {
            val resp = networkClient.getApiService().getBookings()
            if (resp.isSuccessful && resp.body() != null) {
                val bEntities = resp.body()!!.map {
                    BookingEntity(
                        id = it.id,
                        customerName = it.customerName,
                        customerPhone = it.customerPhone,
                        serviceName = it.serviceName,
                        barberName = it.barberName,
                        bookingDate = it.bookingDate,
                        startTime = it.startTime,
                        status = it.status,
                        depositAmount = it.depositAmount,
                        notes = it.notes
                    )
                }
                db.bookingDao().clearAll()
                db.bookingDao().insertAll(bEntities)
                Result.success(Unit)
            } else {
                Result.failure(Exception("Error al obtener reservas"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun refreshExpenses(): Result<Unit> {
        return try {
            val resp = networkClient.getApiService().getExpenses()
            if (resp.isSuccessful && resp.body() != null) {
                val eEntities = resp.body()!!.map {
                    ExpenseEntity(
                        id = it.id,
                        title = it.title,
                        category = it.category,
                        amount = it.amount,
                        description = it.description,
                        expenseDate = it.expenseDate,
                        createdAt = it.createdAt
                    )
                }
                db.expenseDao().clearAll()
                db.expenseDao().insertAll(eEntities)
                Result.success(Unit)
            } else {
                Result.failure(Exception("Error al obtener gastos"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun refreshRecords(): Result<Unit> {
        return try {
            val resp = networkClient.getApiService().getServiceRecords(limit = 100)
            if (resp.isSuccessful && resp.body() != null) {
                val entities = resp.body()!!.map {
                    ServiceRecordEntity(
                        remoteId = it.id,
                        serviceId = it.serviceId,
                        serviceName = it.serviceName ?: "Servicio",
                        barberId = it.barberId,
                        barberName = it.barberName ?: "Barbero",
                        customerId = it.customerId,
                        customerName = it.customerName,
                        customerPhone = null,
                        price = it.price,
                        collectedBy = it.collectedBy,
                        paymentMethod = it.paymentMethod,
                        notes = it.notes,
                        createdAt = it.createdAt,
                        syncStatus = SyncStatus.SYNCED
                    )
                }
                db.serviceRecordDao().clearSyncedRecords()
                db.serviceRecordDao().insertAll(entities)
                Result.success(Unit)
            } else {
                Result.failure(Exception("Error al obtener cortes"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun refreshAll(): Result<Unit> {
        val role = sessionManager.getRole()
        val isAdmin = role == "admin" || role == "superadmin"

        refreshServices()
        refreshCustomers()
        refreshProducts()
        refreshBookings()
        refreshRecords()
        if (isAdmin) {
            refreshExpenses()
        }
        return Result.success(Unit)
    }

    // -------------------------------------------------------------------------
    // AUTH & OPERACIONES
    // -------------------------------------------------------------------------

    suspend fun login(email: String, pass: String): Result<UserDto> {
        return try {
            val api = networkClient.getApiService()
            val resp = api.login(LoginRequest(email.trim().lowercase(), pass))
            if (resp.isSuccessful && resp.body() != null) {
                val tokenData = resp.body()!!
                val user = tokenData.user

                if (!user.isActive) {
                    return Result.failure(Exception("La cuenta se encuentra suspendida."))
                }

                sessionManager.saveSession(
                    token = tokenData.accessToken,
                    userId = user.id,
                    fullName = user.fullName,
                    email = user.email,
                    role = user.role
                )

                // Carga inicial inmediata de datos
                refreshAll()

                Result.success(user)
            } else {
                val errorMsg = if (resp.code() == 401) "Credenciales incorrectas" else "Error al iniciar sesión (${resp.code()})"
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Result.failure(Exception("No se pudo conectar al servidor: ${e.localizedMessage}"))
        }
    }

    suspend fun createServiceRecord(
        service: ServiceEntity,
        barberId: Int,
        barberName: String,
        customerId: Int?,
        customerName: String?,
        customerPhone: String?,
        collectedBy: String,
        paymentMethod: String,
        notes: String?
    ): Long {
        val nowFormatted = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault()).format(Date())

        val record = ServiceRecordEntity(
            serviceId = service.id,
            serviceName = service.name,
            barberId = barberId,
            barberName = barberName,
            customerId = customerId,
            customerName = customerName,
            customerPhone = customerPhone,
            price = service.price,
            collectedBy = collectedBy,
            paymentMethod = paymentMethod,
            notes = notes,
            createdAt = nowFormatted,
            syncStatus = SyncStatus.PENDING_CREATION
        )

        val localId = db.serviceRecordDao().insertRecord(record)
        triggerSync()
        return localId
    }

    // Clientes
    suspend fun createCustomer(name: String, phone: String, email: String?, notes: String?): Result<CustomerDto> {
        return try {
            val resp = networkClient.getApiService().createCustomer(CustomerCreateDto(name, phone, null, email, notes))
            if (resp.isSuccessful && resp.body() != null) {
                val c = resp.body()!!
                db.customerDao().insertCustomer(
                    CustomerEntity(c.id, c.fullName, c.phone, c.dni, c.email, c.notes, c.loyaltyPoints, c.cutsCount ?: 0)
                )
                Result.success(c)
            } else {
                Result.failure(Exception("Error al crear cliente"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    // Servicios & Combos
    suspend fun createService(name: String, description: String?, price: Double, durationMinutes: Int, isCombo: Boolean): Result<ServiceDto> {
        return try {
            val resp = networkClient.getApiService().createService(
                ServiceCreateDto(name, description, durationMinutes, price, isCombo)
            )
            if (resp.isSuccessful && resp.body() != null) {
                refreshServices()
                Result.success(resp.body()!!)
            } else {
                Result.failure(Exception("Error al crear servicio"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    // Ventas de Productos
    suspend fun sellProduct(productId: Int, barberId: Int?, customerId: Int?, quantity: Int, collectedBy: String, paymentMethod: String): Result<Unit> {
        return try {
            val resp = networkClient.getApiService().createProductSale(
                ProductSaleCreateDto(productId, barberId, customerId, quantity, collectedBy, paymentMethod)
            )
            if (resp.isSuccessful) {
                refreshProducts()
                Result.success(Unit)
            } else {
                Result.failure(Exception("Error al registrar venta"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    // Gastos
    suspend fun createExpense(title: String, category: String, amount: Double, description: String?): Result<ExpenseDto> {
        return try {
            val todayStr = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
            val resp = networkClient.getApiService().createExpense(
                ExpenseCreateDto(title, category, amount, description, todayStr)
            )
            if (resp.isSuccessful && resp.body() != null) {
                refreshExpenses()
                Result.success(resp.body()!!)
            } else {
                Result.failure(Exception("Error al registrar gasto"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    // Reservas
    suspend fun updateBookingStatus(id: Int, newStatus: String): Result<BookingDto> {
        return try {
            val resp = networkClient.getApiService().updateBookingStatus(id, newStatus)
            if (resp.isSuccessful && resp.body() != null) {
                refreshBookings()
                Result.success(resp.body()!!)
            } else {
                Result.failure(Exception("Error al actualizar turno"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    // Cierre de caja
    suspend fun closeCash(periodType: String = "daily", notes: String? = null): Result<Unit> {
        return try {
            val resp = networkClient.getApiService().executeCashClosing(periodType, notes)
            if (resp.isSuccessful) {
                refreshAll()
                Result.success(Unit)
            } else {
                Result.failure(Exception("Error al cerrar caja"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    fun triggerSync() {
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()

        val syncRequest = OneTimeWorkRequestBuilder<SyncWorker>()
            .setConstraints(constraints)
            .build()

        WorkManager.getInstance(context).enqueueUniqueWork(
            "OneTimeSync",
            ExistingWorkPolicy.REPLACE,
            syncRequest
        )
    }

    suspend fun logout() {
        sessionManager.clearSession()
    }
}
