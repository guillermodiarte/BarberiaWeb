package com.barbershop.crm.core.sync

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.barbershop.crm.core.database.AppDatabase
import com.barbershop.crm.core.database.entities.*
import com.barbershop.crm.core.network.NetworkClient
import com.barbershop.crm.core.session.SessionManager
import com.barbershop.crm.data.models.ServiceRecordCreateDto

class SyncWorker(
    appContext: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(appContext, workerParams) {

    private val db = AppDatabase.getInstance(appContext)
    private val networkClient = NetworkClient(appContext)
    private val sessionManager = SessionManager(appContext)

    override suspend fun doWork(): Result {
        val token = sessionManager.getToken()
        if (token.isNullOrEmpty()) {
            return Result.success()
        }

        val api = networkClient.getApiService()

        try {
            // 1. VALIDAR ESTADO DE LA CUENTA
            val meResponse = api.getMe()
            if (!meResponse.isSuccessful || meResponse.code() == 401 || meResponse.code() == 403) {
                sessionManager.setSuspended(true)
                sessionManager.clearSession()
                db.serviceRecordDao().purgePendingRecords()
                return Result.failure()
            }

            val user = meResponse.body()
            if (user?.isActive == false) {
                sessionManager.setSuspended(true)
                sessionManager.clearSession()
                db.serviceRecordDao().purgePendingRecords()
                return Result.failure()
            }

            // 2. SUBIR CORTES PENDIENTES
            val pendingRecords = db.serviceRecordDao().getPendingCreationRecords()
            for (record in pendingRecords) {
                val createDto = ServiceRecordCreateDto(
                    serviceId = record.serviceId,
                    barberId = record.barberId,
                    customerId = record.customerId,
                    customerName = record.customerName,
                    customerPhone = record.customerPhone,
                    collectedBy = record.collectedBy,
                    paymentMethod = record.paymentMethod,
                    notes = record.notes
                )

                val response = api.createServiceRecord(createDto)
                if (response.isSuccessful && response.body() != null) {
                    val remote = response.body()!!
                    val updated = record.copy(
                        remoteId = remote.id,
                        syncStatus = SyncStatus.SYNCED
                    )
                    db.serviceRecordDao().updateRecord(updated)
                } else if (response.code() == 401 || response.code() == 403) {
                    sessionManager.setSuspended(true)
                    sessionManager.clearSession()
                    db.serviceRecordDao().purgePendingRecords()
                    return Result.failure()
                }
            }

            // 3. DESCARGAR Y GUARDAR TODA LA BASE DE CLIENTES
            val customersResp = api.getCustomers()
            if (customersResp.isSuccessful && customersResp.body() != null) {
                val customerEntities = customersResp.body()!!.map {
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
            }

            // 4. DESCARGAR SERVICIOS & COMBOS
            val servicesResp = api.getServices(includeInactive = false)
            if (servicesResp.isSuccessful && servicesResp.body() != null) {
                val entities = servicesResp.body()!!.map {
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
            }

            // 5. DESCARGAR PRODUCTOS & STOCK
            val productsResp = api.getProducts(includeInactive = false)
            if (productsResp.isSuccessful && productsResp.body() != null) {
                val pEntities = productsResp.body()!!.map {
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
            }

            // 6. DESCARGAR TURNOS & RESERVAS
            val bookingsResp = api.getBookings()
            if (bookingsResp.isSuccessful && bookingsResp.body() != null) {
                val bEntities = bookingsResp.body()!!.map {
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
            }

            // 7. DESCARGAR GASTOS (SÓLO ADMINISTRADORES)
            val role = sessionManager.getRole()
            if (role == "admin" || role == "superadmin") {
                val expensesResp = api.getExpenses()
                if (expensesResp.isSuccessful && expensesResp.body() != null) {
                    val eEntities = expensesResp.body()!!.map {
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
                }
            }

            // 8. DESCARGAR CORTES REALIZADOS
            val recordsResp = api.getServiceRecords(limit = 100)
            if (recordsResp.isSuccessful && recordsResp.body() != null) {
                val entities = recordsResp.body()!!.map {
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
                        isSettled = it.isSettled,
                        barberEarnings = it.barberEarnings,
                        shopEarnings = it.shopEarnings,
                        syncStatus = SyncStatus.SYNCED
                    )
                }
                db.serviceRecordDao().clearSyncedRecords()
                db.serviceRecordDao().insertAll(entities)
            }

            return Result.success()

        } catch (e: Exception) {
            return Result.retry()
        }
    }
}
