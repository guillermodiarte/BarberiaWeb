package com.barbershop.crm.data.models

import com.google.gson.annotations.SerializedName

data class LoginRequest(
    val email: String,
    val password: String
)

data class AccountDeletionRequestDto(
    val email: String,
    val password: String? = null,
    val reason: String? = null
)

data class GenericMessageResponse(
    val success: Boolean? = true,
    val message: String
)

data class TokenResponse(
    @SerializedName("access_token") val accessToken: String,
    @SerializedName("token_type") val tokenType: String,
    val user: UserDto
)

data class UserDto(
    val id: Int,
    val email: String,
    @SerializedName("full_name") val fullName: String,
    val phone: String?,
    val role: String, // superadmin, admin, barber
    @SerializedName("is_active") val isActive: Boolean,
    @SerializedName("payment_scheme") val paymentScheme: String?,
    @SerializedName("commission_percentage") val commissionPercentage: Double?,
    @SerializedName("fixed_rent_amount") val fixedRentAmount: Double?,
    @SerializedName("fixed_rent_period") val fixedRentPeriod: String?,
    @SerializedName("payout_frequency") val payoutFrequency: String?
)

data class ServiceDto(
    val id: Int,
    val name: String,
    val description: String?,
    @SerializedName("duration_minutes") val durationMinutes: Int,
    val price: Double,
    @SerializedName("is_combo") val isCombo: Boolean = false,
    @SerializedName("is_active") val isActive: Boolean = true
)

data class ServiceCreateDto(
    val name: String,
    val description: String? = null,
    @SerializedName("duration_minutes") val durationMinutes: Int = 30,
    val price: Double,
    @SerializedName("is_combo") val isCombo: Boolean = false
)

data class ServiceRecordDto(
    val id: Int,
    @SerializedName("service_id") val serviceId: Int,
    @SerializedName("barber_id") val barberId: Int,
    @SerializedName("customer_id") val customerId: Int?,
    val price: Double,
    @SerializedName("duration_minutes") val durationMinutes: Int,
    @SerializedName("collected_by") val collectedBy: String,
    @SerializedName("payment_method") val paymentMethod: String,
    @SerializedName("barber_payout_scheme") val barberPayoutScheme: String,
    @SerializedName("barber_rate") val barberRate: Double,
    @SerializedName("barber_earnings") val barberEarnings: Double,
    @SerializedName("shop_earnings") val shopEarnings: Double,
    @SerializedName("loyalty_points_awarded") val loyaltyPointsAwarded: Int,
    val notes: String?,
    @SerializedName("receipt_url") val receiptUrl: String? = null,
    @SerializedName("is_settled") val isSettled: Boolean,
    @SerializedName("created_at") val createdAt: String,
    @SerializedName("service_name") val serviceName: String?,
    @SerializedName("barber_name") val barberName: String?,
    @SerializedName("customer_name") val customerName: String?
)

data class ServiceRecordCreateDto(
    @SerializedName("service_id") val serviceId: Int,
    @SerializedName("barber_id") val barberId: Int?,
    @SerializedName("customer_id") val customerId: Int?,
    @SerializedName("customer_name") val customerName: String?,
    @SerializedName("customer_phone") val customerPhone: String?,
    @SerializedName("collected_by") val collectedBy: String,
    @SerializedName("payment_method") val paymentMethod: String,
    val notes: String?,
    @SerializedName("receipt_url") val receiptUrl: String? = null
)

data class UploadReceiptResponse(
    val success: Boolean,
    val url: String
)

data class CustomerDto(
    val id: Int,
    @SerializedName("full_name") val fullName: String,
    val phone: String,
    val dni: String?,
    val email: String?,
    val notes: String?,
    @SerializedName("loyalty_points") val loyaltyPoints: Int,
    @SerializedName("cuts_count") val cutsCount: Int? = 0
)

data class CustomerCreateDto(
    @SerializedName("full_name") val fullName: String,
    val phone: String,
    val dni: String? = null,
    val email: String? = null,
    val notes: String? = null
)

data class ProductDto(
    val id: Int,
    val name: String,
    val description: String?,
    val category: String,
    @SerializedName("sale_price") val salePrice: Double,
    @SerializedName("cost_price") val costPrice: Double,
    @SerializedName("stock_quantity") val stockQuantity: Int,
    @SerializedName("min_stock_alert") val minStockAlert: Int,
    @SerializedName("is_active") val isActive: Boolean
)

data class ProductCreateDto(
    val name: String,
    val description: String? = null,
    val category: String = "resale",
    @SerializedName("sale_price") val salePrice: Double,
    @SerializedName("cost_price") val costPrice: Double = 0.0,
    @SerializedName("stock_quantity") val stockQuantity: Int,
    @SerializedName("min_stock_alert") val minStockAlert: Int = 5
)

data class ProductSaleCreateDto(
    @SerializedName("product_id") val productId: Int,
    @SerializedName("barber_id") val barberId: Int?,
    @SerializedName("customer_id") val customerId: Int?,
    val quantity: Int,
    @SerializedName("collected_by") val collectedBy: String,
    @SerializedName("payment_method") val paymentMethod: String
)

data class ProductSaleDto(
    val id: Int,
    @SerializedName("product_name") val productName: String?,
    @SerializedName("barber_name") val barberName: String?,
    val quantity: Int,
    @SerializedName("unit_price") val unitPrice: Double,
    @SerializedName("total_amount") val totalAmount: Double,
    @SerializedName("collected_by") val collectedBy: String,
    @SerializedName("payment_method") val paymentMethod: String,
    @SerializedName("created_at") val createdAt: String
)

data class ExpenseDto(
    val id: Int,
    val title: String,
    val category: String, // fixed, variable
    val amount: Double,
    val description: String?,
    @SerializedName("expense_date") val expenseDate: String,
    @SerializedName("created_at") val createdAt: String
)

data class ExpenseCreateDto(
    val title: String,
    val category: String = "variable",
    val amount: Double,
    val description: String? = null,
    @SerializedName("expense_date") val expenseDate: String
)

data class BookingDto(
    val id: Int,
    @SerializedName("customer_name") val customerName: String,
    @SerializedName("customer_phone") val customerPhone: String,
    @SerializedName("customer_email") val customerEmail: String?,
    @SerializedName("service_name") val serviceName: String?,
    @SerializedName("barber_name") val barberName: String?,
    @SerializedName("booking_date") val bookingDate: String,
    @SerializedName("start_time") val startTime: String,
    val status: String, // pending, confirmed, completed, cancelled
    @SerializedName("deposit_amount") val depositAmount: Double,
    @SerializedName("payment_status") val paymentStatus: String,
    val notes: String?
)

data class DashboardStatsDto(
    @SerializedName("today_revenue") val todayRevenue: Double,
    @SerializedName("today_services_count") val todayServicesCount: Int,
    @SerializedName("today_barber_earnings") val todayBarberEarnings: Double,
    @SerializedName("today_shop_earnings") val todayShopEarnings: Double,
    @SerializedName("month_revenue") val monthRevenue: Double,
    @SerializedName("month_services_count") val monthServicesCount: Int
)

data class CashClosingPreviewDto(
    @SerializedName("total_income") val totalIncome: Double = 0.0,
    @SerializedName("total_cash_drawer") val totalCashDrawer: Double = 0.0,
    @SerializedName("total_digital_shop") val totalDigitalShop: Double = 0.0,
    @SerializedName("total_gross_revenue") val totalGrossRevenue: Double = 0.0,
    @SerializedName("total_barber_payouts") val totalBarberPayouts: Double = 0.0,
    @SerializedName("net_admin_profit") val netAdminProfit: Double = 0.0
)

data class BarberStatusDto(
    @SerializedName("barber_id") val barberId: Int,
    @SerializedName("barber_name") val barberName: String,
    @SerializedName("scheme") val scheme: String,
    @SerializedName("services_count") val servicesCount: Int,
    @SerializedName("total_billed") val totalBilled: Int,
    @SerializedName("earnings") val earnings: Double,
    @SerializedName("collected_cash") val collectedCash: Double,
    @SerializedName("net_balance") val netBalance: Double
)

data class CashClosingHistoryDto(
    val id: Int,
    @SerializedName("period_type") val periodType: String,
    @SerializedName("closing_date") val closingDate: String,
    @SerializedName("total_gross_revenue") val totalGrossRevenue: Double,
    @SerializedName("net_admin_profit") val netAdminProfit: Double,
    @SerializedName("closed_by_name") val closedByName: String?
)

data class SettingDto(
    val key: String,
    val value: String?,
    val description: String?
)
