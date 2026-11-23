package com.barbershop.crm.ui.screens.config

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.barbershop.crm.core.network.NetworkClient
import com.barbershop.crm.ui.theme.*
import kotlinx.coroutines.launch

@Composable
fun ConfigScreen(
    networkClient: NetworkClient
) {
    val coroutineScope = rememberCoroutineScope()
    val scrollState = rememberScrollState()

    var pointsPerCut by remember { mutableStateOf("10") }
    var pointsThreshold by remember { mutableStateOf("50") }
    var depositAmount by remember { mutableStateOf("2000") }
    var bookingsPaused by remember { mutableStateOf(false) }
    var depositRequired by remember { mutableStateOf(true) }

    var savedMessage by remember { mutableStateOf<String?>(null) }
    var loading by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        try {
            val resp = networkClient.getApiService().getSettings()
            if (resp.isSuccessful && resp.body() != null) {
                resp.body()!!.forEach { s ->
                    when (s.key) {
                        "loyalty_points_per_service" -> pointsPerCut = s.value ?: "10"
                        "loyalty_free_cut_points_threshold" -> pointsThreshold = s.value ?: "50"
                        "booking_deposit_amount" -> depositAmount = s.value ?: "2000"
                        "booking_system_paused" -> bookingsPaused = s.value == "true"
                        "booking_require_deposit" -> depositRequired = s.value != "false"
                    }
                }
            }
        } catch (e: Exception) {
            // Modo offline
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Slate950)
            .padding(16.dp)
            .verticalScroll(scrollState),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text = "Configuración del Sistema",
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold,
            color = Slate50
        )

        if (savedMessage != null) {
            Card(
                colors = CardDefaults.cardColors(containerColor = Emerald500.copy(alpha = 0.15f)),
                shape = RoundedCornerShape(10.dp)
            ) {
                Text(
                    text = savedMessage!!,
                    color = Emerald500,
                    modifier = Modifier.padding(12.dp),
                    fontWeight = FontWeight.Bold
                )
            }
        }

        // SECCIÓN FIDELIZACIÓN
        Card(
            colors = CardDefaults.cardColors(containerColor = Slate900),
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text(
                    text = "Programa de Fidelización y Puntos",
                    color = Amber400,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )

                OutlinedTextField(
                    value = pointsPerCut,
                    onValueChange = { pointsPerCut = it },
                    label = { Text("Puntos otorgados por corte") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = pointsThreshold,
                    onValueChange = { pointsThreshold = it },
                    label = { Text("Puntos requeridos para corte 100% gratis") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        }

        // SECCIÓN RESERVAS Y SEÑAS
        Card(
            colors = CardDefaults.cardColors(containerColor = Slate900),
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text(
                    text = "Políticas de Reservas y Señas",
                    color = Cyan500,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(text = "Pausar reservas en la web", color = Slate50, fontWeight = FontWeight.SemiBold)
                        Text(text = "Oculta el formulario público de turnos", color = Slate400, style = MaterialTheme.typography.bodySmall)
                    }
                    Switch(
                        checked = bookingsPaused,
                        onCheckedChange = { bookingsPaused = it },
                        colors = SwitchDefaults.colors(checkedThumbColor = Amber500, checkedTrackColor = Amber500.copy(alpha = 0.5f))
                    )
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(text = "Exigir seña previa obligatoria", color = Slate50, fontWeight = FontWeight.SemiBold)
                        Text(text = "Obliga al cliente a transferir para asegurar el turno", color = Slate400, style = MaterialTheme.typography.bodySmall)
                    }
                    Switch(
                        checked = depositRequired,
                        onCheckedChange = { depositRequired = it },
                        colors = SwitchDefaults.colors(checkedThumbColor = Emerald500, checkedTrackColor = Emerald500.copy(alpha = 0.5f))
                    )
                }

                OutlinedTextField(
                    value = depositAmount,
                    onValueChange = { depositAmount = it },
                    label = { Text("Monto de la seña (ARS)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        }

        // GUARDAR CAMBIOS
        Button(
            onClick = {
                loading = true
                coroutineScope.launch {
                    try {
                        val api = networkClient.getApiService()
                        api.updateSetting("loyalty_points_per_service", mapOf("value" to pointsPerCut))
                        api.updateSetting("loyalty_free_cut_points_threshold", mapOf("value" to pointsThreshold))
                        api.updateSetting("booking_system_paused", mapOf("value" to bookingsPaused.toString()))
                        api.updateSetting("booking_require_deposit", mapOf("value" to depositRequired.toString()))
                        api.updateSetting("booking_deposit_amount", mapOf("value" to depositAmount))
                        savedMessage = "¡Configuración actualizada con éxito!"
                    } catch (e: Exception) {
                        savedMessage = "Error al actualizar en servidor: ${e.message}"
                    } finally {
                        loading = false
                    }
                }
            },
            enabled = !loading,
            modifier = Modifier
                .fillMaxWidth()
                .height(52.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Amber500),
            shape = RoundedCornerShape(12.dp)
        ) {
            Icon(Icons.Default.Check, contentDescription = null, tint = Slate950)
            Spacer(modifier = Modifier.width(8.dp))
            Text("Guardar Configuración", color = Slate950, fontWeight = FontWeight.Bold)
        }
    }
}
