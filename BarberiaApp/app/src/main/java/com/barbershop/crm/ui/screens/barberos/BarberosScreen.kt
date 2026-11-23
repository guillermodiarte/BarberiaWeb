package com.barbershop.crm.ui.screens.barberos

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.barbershop.crm.core.network.NetworkClient
import com.barbershop.crm.data.models.UserDto
import com.barbershop.crm.ui.theme.*
import kotlinx.coroutines.launch

@Composable
fun BarberosScreen(
    networkClient: NetworkClient,
    currentUserRole: String
) {
    val coroutineScope = rememberCoroutineScope()
    var barbers by remember { mutableStateOf<List<UserDto>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    var actionError by remember { mutableStateOf<String?>(null) }

    fun loadBarbers() {
        loading = true
        coroutineScope.launch {
            try {
                val resp = networkClient.getApiService().getBarbers(includeInactive = true, includeAdmins = true)
                if (resp.isSuccessful && resp.body() != null) {
                    barbers = resp.body()!!
                }
            } catch (e: Exception) {
                actionError = "Error al conectar: ${e.message}"
            } finally {
                loading = false
            }
        }
    }

    LaunchedEffect(Unit) {
        loadBarbers()
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Slate950)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text = "Barberos & Esquemas",
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold,
            color = Slate50
        )

        if (actionError != null) {
            Text(
                text = actionError!!,
                color = Rose500,
                style = MaterialTheme.typography.bodySmall
            )
        }

        if (loading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = Amber500)
            }
        } else {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                items(barbers) { b ->
                    Card(
                        colors = CardDefaults.cardColors(containerColor = Slate900),
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text(
                                        text = b.fullName,
                                        style = MaterialTheme.typography.titleMedium,
                                        fontWeight = FontWeight.Bold,
                                        color = Slate50
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(
                                        text = b.role.uppercase(),
                                        style = MaterialTheme.typography.labelSmall,
                                        color = if (b.role == "superadmin") Purple500 else Amber400
                                    )
                                }

                                Text(
                                    text = if (b.isActive) "Activo" else "Suspendido",
                                    color = if (b.isActive) Emerald500 else Rose500,
                                    style = MaterialTheme.typography.labelSmall,
                                    fontWeight = FontWeight.Bold
                                )
                            }

                            Spacer(modifier = Modifier.height(4.dp))
                            Text(text = b.email, style = MaterialTheme.typography.bodySmall, color = Slate400)

                            Spacer(modifier = Modifier.height(12.dp))

                            // ACCIONES
                            if (b.role == "superadmin") {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(Icons.Default.Shield, contentDescription = null, tint = Purple500, modifier = Modifier.size(14.dp))
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text(text = "Cuenta Protegida", color = Slate400, style = MaterialTheme.typography.labelSmall)
                                }
                            } else {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.End,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    OutlinedButton(
                                        onClick = {
                                            coroutineScope.launch {
                                                try {
                                                    networkClient.getApiService().toggleBarber(b.id)
                                                    loadBarbers()
                                                } catch (e: Exception) {
                                                    actionError = e.message
                                                }
                                            }
                                        },
                                        shape = RoundedCornerShape(8.dp)
                                    ) {
                                        Text(text = if (b.isActive) "Suspender" else "Activar", color = if (b.isActive) Rose500 else Emerald500)
                                    }

                                    // BOTÓN ELIMINAR CUENTA (SÓLO SI ESTÁ SUSPENDIDA)
                                    if (!b.isActive) {
                                        Spacer(modifier = Modifier.width(8.dp))
                                        Button(
                                            onClick = {
                                                coroutineScope.launch {
                                                    try {
                                                        val resp = networkClient.getApiService().deleteBarber(b.id)
                                                        if (resp.isSuccessful) {
                                                            loadBarbers()
                                                        } else {
                                                            actionError = "No se puede eliminar: tiene registros o restricciones activas."
                                                        }
                                                    } catch (e: Exception) {
                                                        actionError = e.message
                                                    }
                                                }
                                            },
                                            colors = ButtonDefaults.buttonColors(containerColor = Rose500.copy(alpha = 0.2f)),
                                            shape = RoundedCornerShape(8.dp)
                                        ) {
                                            Icon(Icons.Default.Delete, contentDescription = null, tint = Rose500, modifier = Modifier.size(16.dp))
                                            Spacer(modifier = Modifier.width(4.dp))
                                            Text(text = "Eliminar", color = Rose500, fontWeight = FontWeight.Bold)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
