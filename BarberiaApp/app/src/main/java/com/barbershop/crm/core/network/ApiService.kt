package com.barbershop.crm.core.network

import com.barbershop.crm.data.models.*
import retrofit2.Response
import retrofit2.http.*

interface ApiService {

    // Auth
    @POST("api/auth/login")
    suspend fun login(@Body request: LoginRequest): Response<TokenResponse>

    @GET("api/auth/me")
    suspend fun getMe(): Response<UserDto>

    @DELETE("api/auth/me")
    suspend fun deleteOwnAccount(): Response<GenericMessageResponse>

    @POST("api/auth/request-deletion")
    suspend fun requestAccountDeletion(@Body request: AccountDeletionRequestDto): Response<GenericMessageResponse>

    // Servicios & Combos
    @GET("api/services")
    suspend fun getServices(@Query("include_inactive") includeInactive: Boolean = false): Response<List<ServiceDto>>

    @POST("api/services")
    suspend fun createService(@Body service: ServiceCreateDto): Response<ServiceDto>

    @PUT("api/services/{id}")
    suspend fun updateService(@Path("id") id: Int, @Body service: ServiceCreateDto): Response<ServiceDto>

    @DELETE("api/services/{id}")
    suspend fun deleteService(@Path("id") id: Int): Response<Unit>

    // Registros de cortes (CRM)
    @GET("api/service-records")
    suspend fun getServiceRecords(
        @Query("limit") limit: Int = 100,
        @Query("offset") offset: Int = 0,
        @Query("barber_id") barberId: Int? = null
    ): Response<List<ServiceRecordDto>>

    @POST("api/service-records")
    suspend fun createServiceRecord(@Body record: ServiceRecordCreateDto): Response<ServiceRecordDto>

    @PUT("api/service-records/{id}")
    suspend fun updateServiceRecord(@Path("id") id: Int, @Body record: ServiceRecordCreateDto): Response<ServiceRecordDto>

    @DELETE("api/service-records/{id}")
    suspend fun deleteServiceRecord(@Path("id") id: Int): Response<Unit>

    // Clientes & Fidelización
    @GET("api/customers")
    suspend fun getCustomers(@Query("search") search: String? = null): Response<List<CustomerDto>>

    @POST("api/customers")
    suspend fun createCustomer(@Body customer: CustomerCreateDto): Response<CustomerDto>

    @PUT("api/customers/{id}")
    suspend fun updateCustomer(@Path("id") id: Int, @Body customer: CustomerCreateDto): Response<CustomerDto>

    @DELETE("api/customers/{id}")
    suspend fun deleteCustomer(@Path("id") id: Int): Response<Unit>

    // Inventario & Stock
    @GET("api/inventory")
    suspend fun getProducts(@Query("include_inactive") includeInactive: Boolean = false): Response<List<ProductDto>>

    @POST("api/inventory")
    suspend fun createProduct(@Body product: ProductCreateDto): Response<ProductDto>

    @DELETE("api/inventory/{id}")
    suspend fun deleteProduct(@Path("id") id: Int): Response<Unit>

    // Ventas de Productos
    @GET("api/product-sales")
    suspend fun getProductSales(): Response<List<ProductSaleDto>>

    @POST("api/product-sales")
    suspend fun createProductSale(@Body sale: ProductSaleCreateDto): Response<Unit>

    // Gastos del Salón
    @GET("api/expenses")
    suspend fun getExpenses(): Response<List<ExpenseDto>>

    @POST("api/expenses")
    suspend fun createExpense(@Body expense: ExpenseCreateDto): Response<ExpenseDto>

    @DELETE("api/expenses/{id}")
    suspend fun deleteExpense(@Path("id") id: Int): Response<Unit>

    // Reservas & Turnos
    @GET("api/bookings")
    suspend fun getBookings(
        @Query("status") status: String? = null,
        @Query("barber_id") barberId: Int? = null
    ): Response<List<BookingDto>>

    @PUT("api/bookings/{id}/status")
    suspend fun updateBookingStatus(
        @Path("id") id: Int,
        @Query("new_status") newStatus: String
    ): Response<BookingDto>

    @DELETE("api/bookings/{id}")
    suspend fun deleteBooking(@Path("id") id: Int): Response<Unit>

    // Barberos & Esquemas
    @GET("api/barbers")
    suspend fun getBarbers(
        @Query("include_inactive") includeInactive: Boolean = true,
        @Query("include_admins") includeAdmins: Boolean = true
    ): Response<List<UserDto>>

    @DELETE("api/barbers/{id}")
    suspend fun toggleBarber(@Path("id") id: Int): Response<Unit>

    @DELETE("api/barbers/{id}/hard-delete")
    suspend fun deleteBarber(@Path("id") id: Int): Response<Unit>

    // Dashboard y Estadísticas
    @GET("api/stats/dashboard")
    suspend fun getDashboardStats(): Response<DashboardStatsDto>

    // Control y Cierre de Caja
    @GET("api/cash-closing/preview")
    suspend fun getCashClosingPreview(): Response<CashClosingPreviewDto>

    @GET("api/cash-closing/barbers-status")
    suspend fun getBarbersStatus(): Response<List<BarberStatusDto>>

    @POST("api/cash-closing/close")
    suspend fun executeCashClosing(
        @Query("period_type") periodType: String = "daily",
        @Query("notes") notes: String? = null
    ): Response<Unit>

    @GET("api/cash-closing/history")
    suspend fun getCashClosingHistory(): Response<List<CashClosingHistoryDto>>

    // Configuración del Sistema (no estética)
    @GET("api/settings")
    suspend fun getSettings(): Response<List<SettingDto>>

    @PUT("api/settings/{key}")
    suspend fun updateSetting(
        @Path("key") key: String,
        @Body body: Map<String, String>
    ): Response<SettingDto>
}
