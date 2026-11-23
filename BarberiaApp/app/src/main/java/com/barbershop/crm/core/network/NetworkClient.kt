package com.barbershop.crm.core.network

import android.content.Context
import com.barbershop.crm.core.database.AppDatabase
import com.barbershop.crm.core.session.SessionManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.Response
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

class NetworkClient(private val context: Context) {

    private val sessionManager = SessionManager(context)
    private val db = AppDatabase.getInstance(context)

    private val authInterceptor = Interceptor { chain ->
        val originalRequest = chain.request()
        val token = runBlocking { sessionManager.getToken() }

        val requestBuilder = originalRequest.newBuilder()
        if (!token.isNullOrEmpty()) {
            requestBuilder.header("Authorization", "Bearer $token")
        }

        val response = chain.proceed(requestBuilder.build())

        // DETECCIÓN DE TOKEN EXPIRADO / CUENTA SUSPENDIDA
        // Solo revocar si es 401 en una petición que llevaba token (token revocado/expirado)
        // o si /api/auth/me devuelve 403 (cuenta suspendida a nivel usuario).
        // NUNCA revocar por un 403 genérico, ya que un barbero recibe 403 al no tener permisos de administrador en ciertos módulos.
        val path = originalRequest.url.encodedPath
        if (!token.isNullOrEmpty()) {
            if (response.code == 401 || (response.code == 403 && path.contains("/api/auth/me"))) {
                handleAccountRevoked()
            }
        }

        response
    }

    private fun handleAccountRevoked() {
        CoroutineScope(Dispatchers.IO).launch {
            // 1. Marcar como suspendido y limpiar sesión
            sessionManager.setSuspended(true)
            sessionManager.clearSession()

            // 2. PURGAR todos los registros locales pendientes para evitar que se sincronicen
            db.serviceRecordDao().purgePendingRecords()
        }
    }

    private val okHttpClient = OkHttpClient.Builder()
        .addInterceptor(authInterceptor)
        .addInterceptor(HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        })
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(15, TimeUnit.SECONDS)
        .writeTimeout(15, TimeUnit.SECONDS)
        .build()

    fun getApiService(): ApiService {
        val baseUrl = runBlocking { sessionManager.getTenantUrl() }.let {
            if (it.endsWith("/")) it else "$it/"
        }

        return Retrofit.Builder()
            .baseUrl(baseUrl)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(ApiService::class.java)
    }
}
