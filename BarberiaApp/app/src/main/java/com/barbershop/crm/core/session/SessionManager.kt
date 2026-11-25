package com.barbershop.crm.core.session

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.*
import androidx.datastore.preferences.preferencesDataStore
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "barber_session")

data class SalonAccount(
    val salonName: String,
    val salonUrl: String,
    val salonCode: String = "",
    val token: String,
    val userId: Int,
    val fullName: String,
    val email: String,
    val role: String
)

class SessionManager(private val context: Context) {

    companion object {
        const val DEFAULT_TENANT_URL = "https://barberia-crm-barbershop-kewiwy-702700-76-13-71-212.sslip.io"
        const val DEFAULT_SALON_NAME = "BarberShop Elite"

        private val KEY_TOKEN = stringPreferencesKey("jwt_token")
        private val KEY_TENANT_URL = stringPreferencesKey("tenant_url")
        private val KEY_SALON_NAME = stringPreferencesKey("salon_name")
        private val KEY_USER_ID = intPreferencesKey("user_id")
        private val KEY_FULL_NAME = stringPreferencesKey("user_full_name")
        private val KEY_EMAIL = stringPreferencesKey("user_email")
        private val KEY_ROLE = stringPreferencesKey("user_role") // superadmin, admin, barber
        private val KEY_IS_SUSPENDED = booleanPreferencesKey("is_suspended")
        private val KEY_ACCOUNTS_JSON = stringPreferencesKey("saved_accounts_json")
        private val KEY_BOOKING_ENABLED = booleanPreferencesKey("online_booking_enabled")
    }

    private val gson = Gson()

    val tokenFlow: Flow<String?> = context.dataStore.data.map { it[KEY_TOKEN] }
    val tenantUrlFlow: Flow<String> = context.dataStore.data.map { it[KEY_TENANT_URL] ?: DEFAULT_TENANT_URL }
    val salonNameFlow: Flow<String> = context.dataStore.data.map { it[KEY_SALON_NAME] ?: DEFAULT_SALON_NAME }
    val roleFlow: Flow<String> = context.dataStore.data.map { it[KEY_ROLE] ?: "barber" }
    val fullNameFlow: Flow<String> = context.dataStore.data.map { it[KEY_FULL_NAME] ?: "" }
    val emailFlow: Flow<String> = context.dataStore.data.map { it[KEY_EMAIL] ?: "" }
    val isSuspendedFlow: Flow<Boolean> = context.dataStore.data.map { it[KEY_IS_SUSPENDED] ?: false }
    val isBookingEnabledFlow: Flow<Boolean> = context.dataStore.data.map { it[KEY_BOOKING_ENABLED] ?: true }

    val accountsFlow: Flow<List<SalonAccount>> = context.dataStore.data.map { prefs ->
        val json = prefs[KEY_ACCOUNTS_JSON]
        if (!json.isNullOrEmpty()) {
            try {
                val type = object : TypeToken<List<SalonAccount>>() {}.type
                gson.fromJson<List<SalonAccount>>(json, type) ?: emptyList()
            } catch (e: Exception) {
                emptyList()
            }
        } else {
            emptyList()
        }
    }

    suspend fun saveSession(
        token: String,
        userId: Int,
        fullName: String,
        email: String,
        role: String,
        salonName: String? = null
    ) {
        val currentUrl = getTenantUrl()
        val resolvedName = salonName?.ifBlank { null } ?: getSalonName()

        context.dataStore.edit { prefs ->
            prefs[KEY_TOKEN] = token
            prefs[KEY_USER_ID] = userId
            prefs[KEY_FULL_NAME] = fullName
            prefs[KEY_EMAIL] = email
            prefs[KEY_ROLE] = role
            prefs[KEY_SALON_NAME] = resolvedName
            prefs[KEY_IS_SUSPENDED] = false

            // Actualizar o agregar en la lista de cuentas guardadas
            val existingJson = prefs[KEY_ACCOUNTS_JSON]
            val accounts = try {
                if (!existingJson.isNullOrEmpty()) {
                    val type = object : TypeToken<List<SalonAccount>>() {}.type
                    gson.fromJson<List<SalonAccount>>(existingJson, type)?.toMutableList() ?: mutableListOf()
                } else mutableListOf()
            } catch (e: Exception) {
                mutableListOf()
            }

            // Quitar si ya existía esta barbería
            accounts.removeAll { it.salonUrl.equals(currentUrl, ignoreCase = true) }

            // Agregar la nueva cuenta activa
            accounts.add(
                SalonAccount(
                    salonName = resolvedName,
                    salonUrl = currentUrl,
                    salonCode = "",
                    token = token,
                    userId = userId,
                    fullName = fullName,
                    email = email,
                    role = role
                )
            )

            prefs[KEY_ACCOUNTS_JSON] = gson.toJson(accounts)
        }
    }

    suspend fun setBookingEnabled(enabled: Boolean) {
        context.dataStore.edit { prefs ->
            prefs[KEY_BOOKING_ENABLED] = enabled
        }
    }

    suspend fun isBookingEnabled(): Boolean {
        return context.dataStore.data.first()[KEY_BOOKING_ENABLED] ?: true
    }

    suspend fun setSalonName(name: String) {
        context.dataStore.edit { prefs ->
            prefs[KEY_SALON_NAME] = name.trim()
        }
    }

    suspend fun saveTenantUrl(url: String, name: String? = null) {
        val sanitized = url.trim().removeSuffix("/")
        context.dataStore.edit { prefs ->
            prefs[KEY_TENANT_URL] = sanitized
            if (!name.isNullOrBlank()) {
                prefs[KEY_SALON_NAME] = name.trim()
            }
        }
    }

    suspend fun switchAccount(targetUrl: String): Boolean {
        val accounts = accountsFlow.first()
        val account = accounts.find { it.salonUrl.equals(targetUrl, ignoreCase = true) } ?: return false

        context.dataStore.edit { prefs ->
            prefs[KEY_TOKEN] = account.token
            prefs[KEY_USER_ID] = account.userId
            prefs[KEY_FULL_NAME] = account.fullName
            prefs[KEY_EMAIL] = account.email
            prefs[KEY_ROLE] = account.role
            prefs[KEY_TENANT_URL] = account.salonUrl
            prefs[KEY_SALON_NAME] = account.salonName
            prefs[KEY_IS_SUSPENDED] = false
        }
        return true
    }

    suspend fun removeAccount(targetUrl: String) {
        context.dataStore.edit { prefs ->
            val existingJson = prefs[KEY_ACCOUNTS_JSON]
            if (!existingJson.isNullOrEmpty()) {
                val type = object : TypeToken<List<SalonAccount>>() {}.type
                val accounts = gson.fromJson<List<SalonAccount>>(existingJson, type)?.toMutableList() ?: mutableListOf()
                accounts.removeAll { it.salonUrl.equals(targetUrl, ignoreCase = true) }
                prefs[KEY_ACCOUNTS_JSON] = gson.toJson(accounts)
            }
        }
    }

    suspend fun setSuspended(suspended: Boolean) {
        context.dataStore.edit { prefs ->
            prefs[KEY_IS_SUSPENDED] = suspended
        }
    }

    suspend fun getToken(): String? {
        return context.dataStore.data.first()[KEY_TOKEN]
    }

    suspend fun getTenantUrl(): String {
        return context.dataStore.data.first()[KEY_TENANT_URL] ?: DEFAULT_TENANT_URL
    }

    suspend fun getSalonName(): String {
        return context.dataStore.data.first()[KEY_SALON_NAME] ?: DEFAULT_SALON_NAME
    }

    suspend fun getRole(): String {
        return context.dataStore.data.first()[KEY_ROLE] ?: "barber"
    }

    suspend fun getUserId(): Int {
        return context.dataStore.data.first()[KEY_USER_ID] ?: 0
    }

    suspend fun getFullName(): String {
        return context.dataStore.data.first()[KEY_FULL_NAME] ?: ""
    }

    suspend fun clearSession() {
        context.dataStore.edit { prefs ->
            val currentUrl = prefs[KEY_TENANT_URL]
            // Quitar cuenta activa de la lista de cuentas
            val existingJson = prefs[KEY_ACCOUNTS_JSON]
            if (!existingJson.isNullOrEmpty() && currentUrl != null) {
                val type = object : TypeToken<List<SalonAccount>>() {}.type
                val accounts = gson.fromJson<List<SalonAccount>>(existingJson, type)?.toMutableList() ?: mutableListOf()
                accounts.removeAll { it.salonUrl.equals(currentUrl, ignoreCase = true) }
                prefs[KEY_ACCOUNTS_JSON] = gson.toJson(accounts)
            }

            prefs.remove(KEY_TOKEN)
            prefs.remove(KEY_USER_ID)
            prefs.remove(KEY_FULL_NAME)
            prefs.remove(KEY_EMAIL)
            prefs.remove(KEY_ROLE)
            prefs[KEY_IS_SUSPENDED] = false
        }
    }
}
