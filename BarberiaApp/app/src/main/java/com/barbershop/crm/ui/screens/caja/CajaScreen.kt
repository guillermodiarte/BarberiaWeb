package com.barbershop.crm.ui.screens.caja

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.barbershop.crm.core.utils.formatPrice
import com.barbershop.crm.data.repository.BarberRepository
import com.barbershop.crm.ui.screens.dashboard.MetricCard
import com.barbershop.crm.ui.theme.*

@Composable
fun CajaScreen(
    repository: BarberRepository
) {
    val coroutineScope = rememberCoroutineScope()
    val records by repository.getLocalRecords().collectAsState(initial = emptyList())

    LaunchedEffect(Unit) {
        repository.refreshRecords()
    }

    val totalCash = records.filter { it.paymentMethod == "cash" }.sumOf { it.price }
    val totalDigital = records.filter { it.paymentMethod != "cash" }.sumOf { it.price }
    val totalRevenue = totalCash + totalDigital

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(Slate950)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Text(
                text = "Control de Caja & Turno",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = Slate50
            )
            Text(
                text = "Arqueo de ingresos del turno en curso (local y sincronizado).",
                style = MaterialTheme.typography.bodySmall,
                color = Slate400
            )
        }

        item {
            MetricCard(
                title = "Total Ingresos Brutos",
                value = formatPrice(totalRevenue),
                color = Amber500,
                modifier = Modifier.fillMaxWidth()
            )
        }

        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                MetricCard(
                    title = "Efectivo en Caja",
                    value = formatPrice(totalCash),
                    color = Emerald500,
                    modifier = Modifier.weight(1f)
                )
                MetricCard(
                    title = "Transferencias",
                    value = formatPrice(totalDigital),
                    color = Cyan500,
                    modifier = Modifier.weight(1f)
                )
            }
        }

        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = Slate900),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "Detalle del Turno",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = Slate50
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = "• Total de servicios cobrados: ${records.size}",
                        color = Slate200,
                        style = MaterialTheme.typography.bodyMedium
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = "• Liquidación individual se consolida con el administrador al cierre.",
                        color = Slate400,
                        style = MaterialTheme.typography.bodySmall
                    )
                }
            }
        }
    }
}
