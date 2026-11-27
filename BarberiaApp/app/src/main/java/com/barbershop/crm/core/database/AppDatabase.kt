package com.barbershop.crm.core.database

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import com.barbershop.crm.core.database.dao.*
import com.barbershop.crm.core.database.entities.*

@Database(
    entities = [
        ServiceRecordEntity::class,
        CustomerEntity::class,
        ServiceEntity::class,
        ProductEntity::class,
        BarberEntity::class,
        ExpenseEntity::class,
        BookingEntity::class
    ],
    version = 5,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {

    abstract fun serviceRecordDao(): ServiceRecordDao
    abstract fun customerDao(): CustomerDao
    abstract fun serviceDao(): ServiceDao
    abstract fun productDao(): ProductDao
    abstract fun barberDao(): BarberDao
    abstract fun expenseDao(): ExpenseDao
    abstract fun bookingDao(): BookingDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getInstance(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "barbershop_offline.db"
                ).fallbackToDestructiveMigration().build()
                INSTANCE = instance
                instance
            }
        }
    }
}
