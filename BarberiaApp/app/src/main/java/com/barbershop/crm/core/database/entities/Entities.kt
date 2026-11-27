package com.barbershop.crm.core.database.entities

import androidx.room.Entity
import androidx.room.PrimaryKey

enum class SyncStatus {
    SYNCED,
    PENDING_CREATION,
    PENDING_UPDATE,
    PENDING_DELETE
}

@Entity(tableName = "service_records")
data class ServiceRecordEntity(
    @PrimaryKey(autoGenerate = true) val localId: Long = 0,
    val remoteId: Int? = null,
    val serviceId: Int,
    val serviceName: String,
    val barberId: Int,
    val barberName: String,
    val customerId: Int? = null,
    val customerName: String? = null,
    val customerPhone: String? = null,
    val price: Double,
    val collectedBy: String, // barber, admin
    val paymentMethod: String, // cash, transfer_barber, transfer_shop
    val notes: String? = null,
    val receiptUrl: String? = null,
    val localReceiptPath: String? = null,
    val createdAt: String,
    val isSettled: Boolean = false,
    val barberEarnings: Double = 0.0,
    val shopEarnings: Double = 0.0,
    val syncStatus: SyncStatus = SyncStatus.SYNCED
)

@Entity(tableName = "customers")
data class CustomerEntity(
    @PrimaryKey val id: Int,
    val fullName: String,
    val phone: String,
    val dni: String?,
    val email: String?,
    val notes: String?,
    val loyaltyPoints: Int,
    val cutsCount: Int = 0
) {
    // Alias para compatibilidad
    val name: String get() = fullName
}

@Entity(tableName = "services")
data class ServiceEntity(
    @PrimaryKey val id: Int,
    val name: String,
    val description: String?,
    val durationMinutes: Int,
    val price: Double,
    val isCombo: Boolean = false,
    val isActive: Boolean = true
) {
    val category: String get() = if (isCombo) "combo" else "corte"
}

@Entity(tableName = "products")
data class ProductEntity(
    @PrimaryKey val id: Int,
    val name: String,
    val description: String?,
    val category: String,
    val salePrice: Double,
    val costPrice: Double,
    val stockQuantity: Int,
    val minStockAlert: Int,
    val isActive: Boolean
)

@Entity(tableName = "barbers")
data class BarberEntity(
    @PrimaryKey val id: Int,
    val fullName: String,
    val email: String,
    val phone: String?,
    val role: String,
    val isActive: Boolean,
    val commissionPercentage: Double?,
    val fixedRentAmount: Double?
)

@Entity(tableName = "expenses")
data class ExpenseEntity(
    @PrimaryKey val id: Int,
    val title: String,
    val category: String,
    val amount: Double,
    val description: String?,
    val expenseDate: String,
    val createdAt: String
)

@Entity(tableName = "bookings")
data class BookingEntity(
    @PrimaryKey val id: Int,
    val customerName: String,
    val customerPhone: String,
    val serviceName: String?,
    val barberName: String?,
    val bookingDate: String,
    val startTime: String,
    val status: String,
    val depositAmount: Double,
    val notes: String?
)
