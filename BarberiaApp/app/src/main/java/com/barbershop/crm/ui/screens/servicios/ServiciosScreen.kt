package com.barbershop.crm.ui.screens.servicios

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ContentCut
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.barbershop.crm.core.utils.formatPrice
import com.barbershop.crm.data.repository.BarberRepository
import com.barbershop.crm.ui.theme.*
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ServiciosScreen(
    repository: BarberRepository,
    isAdmin: Boolean
) {
    val coroutineScope = rememberCoroutineScope()
    val services by repository.getLocalServices().collectAsState(initial = emptyList())

    var isRefreshing by remember { mutableStateOf(false) }
    var showCreateDialog by remember { mutableStateOf(false) }
    var newName by remember { mutableStateOf("") }
    var newPrice by remember { mutableStateOf("") }
    var newDuration by remember { mutableStateOf("30") }
    var isCombo by remember { mutableStateOf(false) }

    // FETCH INMEDIATO AL ENTRAR A LA PANTALLA PARA SINCRONIZAR CON LA WEB
    LaunchedEffect(Unit) {
        isRefreshing = true
        repository.refreshServices()
        isRefreshing = false
    }

    Scaffold(
        floatingActionButton = {
            if (isAdmin) {
                FloatingActionButton(
                    onClick = { showCreateDialog = true },
                    containerColor = Amber500,
                    contentColor = Slate950
                ) {
                    Icon(Icons.Default.Add, contentDescription = "Nuevo Servicio")
                }
            }
        },
        containerColor = Slate950
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(
                text = "Servicios & Combos",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = Slate50
            )

            if (isRefreshing && services.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = Amber500)
                }
            } else if (services.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(text = "No hay servicios disponibles.", color = Slate400)
                        Spacer(modifier = Modifier.height(8.dp))
                        OutlinedButton(
                            onClick = {
                                coroutineScope.launch {
                                    isRefreshing = true
                                    repository.refreshServices()
                                    isRefreshing = false
                                }
                            }
                        ) {
                            Text("Reintentar conexión", color = Amber500)
                        }
                    }
                }
            } else {
                LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    items(services) { s ->
                        Card(
                            colors = CardDefaults.cardColors(containerColor = Slate900),
                            shape = RoundedCornerShape(14.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(16.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Icon(Icons.Default.ContentCut, contentDescription = null, tint = if (s.isCombo) Cyan500 else Amber500, modifier = Modifier.size(24.dp))
                                    Spacer(modifier = Modifier.width(12.dp))
                                    Column {
                                        Text(text = s.name, color = Slate50, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium)
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Text(
                                                text = if (s.isCombo) "COMBO" else "INDIVIDUAL",
                                                color = if (s.isCombo) Cyan500 else Amber400,
                                                style = MaterialTheme.typography.labelSmall,
                                                fontWeight = FontWeight.Bold
                                            )
                                            Text(text = " • ${s.durationMinutes} min", color = Slate400, style = MaterialTheme.typography.bodySmall)
                                        }
                                    }
                                }
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = formatPrice(s.price),
                                    color = Amber400,
                                    fontWeight = FontWeight.Bold,
                                    style = MaterialTheme.typography.titleMedium,
                                    maxLines = 1,
                                    softWrap = false
                                )
                            }
                        }
                    }
                }
            }
        }
    }

    if (showCreateDialog) {
        AlertDialog(
            onDismissRequest = { showCreateDialog = false },
            title = { Text("Registrar Nuevo Servicio", color = Slate50, fontWeight = FontWeight.Bold) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    OutlinedTextField(
                        value = newName,
                        onValueChange = { newName = it },
                        label = { Text("Nombre del servicio") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = newPrice,
                        onValueChange = { newPrice = it },
                        label = { Text("Precio (ARS)") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = newDuration,
                        onValueChange = { newDuration = it },
                        label = { Text("Duración (minutos)") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(text = "¿Es Combo Promocional?", color = Slate200, style = MaterialTheme.typography.bodyMedium)
                        Switch(checked = isCombo, onCheckedChange = { isCombo = it })
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val priceNum = newPrice.toDoubleOrNull() ?: 0.0
                        val durNum = newDuration.toIntOrNull() ?: 30
                        if (newName.isNotBlank() && priceNum > 0) {
                            coroutineScope.launch {
                                repository.createService(newName, null, priceNum, durNum, isCombo)
                                showCreateDialog = false
                                newName = ""
                                newPrice = ""
                            }
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Amber500)
                ) {
                    Text("Crear", color = Slate950, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showCreateDialog = false }) {
                    Text("Cancelar", color = Slate400)
                }
            },
            containerColor = Slate900,
            shape = RoundedCornerShape(16.dp)
        )
    }
}
