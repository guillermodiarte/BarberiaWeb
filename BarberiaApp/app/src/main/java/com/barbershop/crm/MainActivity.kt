package com.barbershop.crm

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import androidx.lifecycle.lifecycleScope
import com.barbershop.crm.core.network.NetworkClient
import com.barbershop.crm.core.session.SessionManager
import com.barbershop.crm.data.repository.BarberRepository
import com.barbershop.crm.ui.navigation.AppNavHost
import com.barbershop.crm.ui.theme.BarberiaTheme
import com.barbershop.crm.ui.theme.Slate950
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {

    private lateinit var repository: BarberRepository
    private lateinit var sessionManager: SessionManager
    private lateinit var networkClient: NetworkClient

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        repository = BarberRepository(this)
        sessionManager = SessionManager(this)
        networkClient = NetworkClient(this)

        // Refresco automático de toda la base de datos al abrir la app si hay sesión
        lifecycleScope.launch(Dispatchers.IO) {
            val token = sessionManager.getToken()
            if (!token.isNullOrEmpty()) {
                repository.refreshAll()
            }
        }

        setContent {
            BarberiaTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = Slate950
                ) {
                    AppNavHost(
                        repository = repository,
                        sessionManager = sessionManager,
                        networkClient = networkClient
                    )
                }
            }
        }
    }

    override fun onResume() {
        super.onResume()
        // Cada vez que el usuario vuelve a entrar a la aplicación (segundo plano a primer plano)
        lifecycleScope.launch(Dispatchers.IO) {
            val token = sessionManager.getToken()
            if (!token.isNullOrEmpty()) {
                repository.refreshAll()
            }
        }
    }
}
