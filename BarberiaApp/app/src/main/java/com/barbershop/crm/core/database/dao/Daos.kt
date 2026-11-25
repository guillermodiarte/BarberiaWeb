package com.barbershop.crm.core.database.dao

import androidx.room.*
import com.barbershop.crm.core.database.entities.*
import kotlinx.coroutines.flow.Flow

@Dao
interface ServiceRecordDao {
    @Query("SELECT * FROM service_records ORDER BY localId DESC")
    fun getAllRecords(): Flow<List<ServiceRecordEntity>>

    @Query("SELECT * FROM service_records WHERE isSettled = 0 OR syncStatus != 'SYNCED' ORDER BY localId DESC")
    fun getUnsettledRecords(): Flow<List<ServiceRecordEntity>>

    @Query("SELECT * FROM service_records WHERE syncStatus = 'PENDING_CREATION'")
    suspend fun getPendingCreationRecords(): List<ServiceRecordEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertRecord(record: ServiceRecordEntity): Long

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(records: List<ServiceRecordEntity>)

    @Update
    suspend fun updateRecord(record: ServiceRecordEntity)

    @Delete
    suspend fun deleteRecord(record: ServiceRecordEntity)

    @Query("DELETE FROM service_records WHERE syncStatus = 'PENDING_CREATION' OR syncStatus = 'PENDING_DELETE'")
    suspend fun purgePendingRecords()

    @Query("DELETE FROM service_records WHERE syncStatus = 'SYNCED'")
    suspend fun clearSyncedRecords()
}

@Dao
interface CustomerDao {
    @Query("SELECT * FROM customers ORDER BY fullName ASC")
    fun getAllCustomers(): Flow<List<CustomerEntity>>

    @Query("SELECT * FROM customers WHERE fullName LIKE '%' || :query || '%' OR phone LIKE '%' || :query || '%' ORDER BY fullName ASC LIMIT 10")
    suspend fun searchCustomers(query: String): List<CustomerEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertCustomer(customer: CustomerEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(customers: List<CustomerEntity>)

    @Query("DELETE FROM customers")
    suspend fun clearAll()
}

@Dao
interface ServiceDao {
    @Query("SELECT * FROM services WHERE isActive = 1 ORDER BY price ASC")
    fun getActiveServices(): Flow<List<ServiceEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(services: List<ServiceEntity>)

    @Query("DELETE FROM services")
    suspend fun clearAll()
}

@Dao
interface ProductDao {
    @Query("SELECT * FROM products WHERE isActive = 1 ORDER BY name ASC")
    fun getActiveProducts(): Flow<List<ProductEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(products: List<ProductEntity>)

    @Query("DELETE FROM products")
    suspend fun clearAll()
}

@Dao
interface BarberDao {
    @Query("SELECT * FROM barbers ORDER BY fullName ASC")
    fun getAllBarbers(): Flow<List<BarberEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(barbers: List<BarberEntity>)

    @Query("DELETE FROM barbers")
    suspend fun clearAll()
}

@Dao
interface ExpenseDao {
    @Query("SELECT * FROM expenses ORDER BY expenseDate DESC")
    fun getAllExpenses(): Flow<List<ExpenseEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(expenses: List<ExpenseEntity>)

    @Query("DELETE FROM expenses")
    suspend fun clearAll()
}

@Dao
interface BookingDao {
    @Query("SELECT * FROM bookings ORDER BY bookingDate ASC, startTime ASC")
    fun getAllBookings(): Flow<List<BookingEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(bookings: List<BookingEntity>)

    @Query("DELETE FROM bookings")
    suspend fun clearAll()
}
