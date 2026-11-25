package com.barbershop.crm.ui.screens.estadisticas

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.barbershop.crm.core.utils.formatPrice
import com.barbershop.crm.data.repository.BarberRepository
import com.barbershop.crm.ui.theme.*
import java.time.LocalDate
import java.time.format.DateTimeFormatter

// Período de filtro
enum class Periodo { SEMANA, MES, ANIO }

data class BarData(val label: String, val total: Double, val comision: Double)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EstadisticasScreen(repository: BarberRepository) {
    val allRecords by repository.getLocalRecords().collectAsState(initial = emptyList())
    var periodo by remember { mutableStateOf(Periodo.SEMANA) }
    var isRefreshing by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        isRefreshing = true
        repository.refreshRecords()
        isRefreshing = false
    }

    // Filtrar registros por período
    val today = LocalDate.now()
    val filteredRecords = remember(allRecords, periodo) {
        allRecords.filter { record ->
            try {
                val date = LocalDate.parse(record.createdAt.take(10))
                when (periodo) {
                    Periodo.SEMANA -> !date.isBefore(today.minusDays(6))
                    Periodo.MES -> !date.isBefore(today.minusDays(29))
                    Periodo.ANIO -> !date.isBefore(today.minusDays(364))
                }
            } catch (e: Exception) { false }
        }
    }

    // Agrupar por día para el gráfico
    val barData: List<BarData> = remember(filteredRecords, periodo) {
        val grouped = filteredRecords.groupBy { it.createdAt.take(10) }
        when (periodo) {
            Periodo.SEMANA -> {
                (6 downTo 0).map { daysAgo ->
                    val date = today.minusDays(daysAgo.toLong())
                    val key = date.toString()
                    val recs = grouped[key] ?: emptyList()
                    BarData(
                        label = date.format(DateTimeFormatter.ofPattern("dd/MM")),
                        total = recs.sumOf { it.price },
                        comision = recs.sumOf { it.barberEarnings }
                    )
                }
            }
            Periodo.MES -> {
                // Agrupar por semana (últimas 4 semanas)
                (3 downTo 0).map { weeksAgo ->
                    val start = today.minusDays((weeksAgo * 7 + 6).toLong())
                    val end = today.minusDays((weeksAgo * 7).toLong())
                    val recs = filteredRecords.filter { r ->
                        try {
                            val d = LocalDate.parse(r.createdAt.take(10))
                            !d.isBefore(start) && !d.isAfter(end)
                        } catch (e: Exception) { false }
                    }
                    BarData(
                        label = "S${4 - weeksAgo}",
                        total = recs.sumOf { it.price },
                        comision = recs.sumOf { it.barberEarnings }
                    )
                }
            }
            Periodo.ANIO -> {
                // Agrupar por mes (últimos 12 meses)
                (11 downTo 0).map { monthsAgo ->
                    val date = today.minusMonths(monthsAgo.toLong())
                    val recs = filteredRecords.filter { r ->
                        try {
                            val d = LocalDate.parse(r.createdAt.take(10))
                            d.year == date.year && d.monthValue == date.monthValue
                        } catch (e: Exception) { false }
                    }
                    BarData(
                        label = date.format(DateTimeFormatter.ofPattern("MMM")).take(3),
                        total = recs.sumOf { it.price },
                        comision = recs.sumOf { it.barberEarnings }
                    )
                }
            }
        }
    }

    // Métricas resumen
    val totalRecaudado = filteredRecords.sumOf { it.price }
    val totalComision = filteredRecords.sumOf { it.barberEarnings }
    val totalCortes = filteredRecords.size
    val efectivo = filteredRecords.filter { it.paymentMethod?.lowercase()?.contains("efectivo") == true }.sumOf { it.price }
    val transferencia = filteredRecords.filter { it.paymentMethod?.lowercase()?.contains("transfer") == true }.sumOf { it.price }

    Scaffold(containerColor = Slate950) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 16.dp)
                .verticalScroll(rememberScrollState())
        ) {
            Text(
                text = "Estadísticas & Finanzas",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = Slate50,
                modifier = Modifier.padding(vertical = 16.dp)
            )

            // Selector de período
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 16.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Periodo.values().forEach { p ->
                    val label = when (p) {
                        Periodo.SEMANA -> "Semana"
                        Periodo.MES -> "Mes"
                        Periodo.ANIO -> "Año"
                    }
                    FilterChip(
                        selected = periodo == p,
                        onClick = { periodo = p },
                        label = { Text(label, fontSize = 13.sp) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = Amber500,
                            selectedLabelColor = Slate950,
                            containerColor = Slate800,
                            labelColor = Slate400
                        ),
                        modifier = Modifier.weight(1f)
                    )
                }
            }

            // Cards de resumen
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                StatCard(
                    title = "Recaudado",
                    value = formatPrice(totalRecaudado),
                    color = Amber400,
                    modifier = Modifier.weight(1f)
                )
                StatCard(
                    title = "Comisión",
                    value = formatPrice(totalComision),
                    color = Cyan500,
                    modifier = Modifier.weight(1f)
                )
                StatCard(
                    title = "Cortes",
                    value = totalCortes.toString(),
                    color = Emerald500,
                    modifier = Modifier.weight(1f)
                )
            }

            Spacer(modifier = Modifier.height(20.dp))

            // Gráfico de barras
            Card(
                colors = CardDefaults.cardColors(containerColor = Slate900),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "Recaudación",
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold,
                        color = Slate50,
                        modifier = Modifier.padding(bottom = 12.dp)
                    )
                    if (barData.all { it.total == 0.0 }) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(160.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "Sin datos para este período",
                                color = Slate400,
                                style = MaterialTheme.typography.bodySmall
                            )
                        }
                    } else {
                        BarChart(
                            bars = barData,
                            barColor = Amber500,
                            comisionColor = Cyan500,
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(180.dp)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Desglose por método de pago
            Card(
                colors = CardDefaults.cardColors(containerColor = Slate900),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "Métodos de Pago",
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold,
                        color = Slate50,
                        modifier = Modifier.padding(bottom = 12.dp)
                    )
                    PaymentRow(label = "Efectivo", amount = efectivo, color = Emerald500)
                    Spacer(modifier = Modifier.height(8.dp))
                    PaymentRow(label = "Transferencia", amount = transferencia, color = Cyan500)
                    if (totalRecaudado - efectivo - transferencia > 0) {
                        Spacer(modifier = Modifier.height(8.dp))
                        PaymentRow(label = "Otros", amount = totalRecaudado - efectivo - transferencia, color = Slate400)
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))
        }
    }
}

@Composable
private fun StatCard(
    title: String,
    value: String,
    color: Color,
    modifier: Modifier = Modifier
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = Slate900),
        shape = RoundedCornerShape(14.dp),
        modifier = modifier
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = value,
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.Bold,
                color = color,
                textAlign = TextAlign.Center,
                maxLines = 1,
                softWrap = false,
                fontSize = 13.sp
            )
            Spacer(modifier = Modifier.height(2.dp))
            Text(
                text = title,
                style = MaterialTheme.typography.labelSmall,
                color = Slate400,
                textAlign = TextAlign.Center
            )
        }
    }
}

@Composable
private fun PaymentRow(label: String, amount: Double, color: Color) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(10.dp)
                    .background(color = color, shape = RoundedCornerShape(50))
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(text = label, style = MaterialTheme.typography.bodySmall, color = Slate400)
        }
        Text(
            text = formatPrice(amount),
            style = MaterialTheme.typography.bodySmall,
            fontWeight = FontWeight.SemiBold,
            color = Slate200
        )
    }
}

@Composable
private fun BarChart(
    bars: List<BarData>,
    barColor: Color,
    comisionColor: Color,
    modifier: Modifier = Modifier
) {
    val maxValue = bars.maxOfOrNull { it.total } ?: 1.0
    val safeMax = if (maxValue == 0.0) 1.0 else maxValue

    Column(modifier = modifier) {
        Canvas(
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f)
        ) {
            val n = bars.size
            val spacing = size.width / (n * 2 + 1)
            val barWidth = spacing * 1.5f
            val chartHeight = size.height - 24.dp.toPx()

            bars.forEachIndexed { i, bar ->
                val left = spacing + i * (barWidth + spacing)
                val barH = (bar.total / safeMax * chartHeight).toFloat().coerceAtLeast(2f)
                val comisionH = (bar.comision / safeMax * chartHeight).toFloat().coerceAtLeast(0f)

                // Barra total (fondo)
                drawRoundRect(
                    color = barColor.copy(alpha = 0.85f),
                    topLeft = Offset(left, chartHeight - barH),
                    size = Size(barWidth, barH),
                    cornerRadius = CornerRadius(4.dp.toPx())
                )
                // Barra comisión (encima)
                if (comisionH > 0) {
                    drawRoundRect(
                        color = comisionColor.copy(alpha = 0.9f),
                        topLeft = Offset(left, chartHeight - comisionH),
                        size = Size(barWidth, comisionH),
                        cornerRadius = CornerRadius(4.dp.toPx())
                    )
                }
            }
        }

        // Etiquetas del eje X
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceAround
        ) {
            bars.forEach { bar ->
                Text(
                    text = bar.label,
                    style = MaterialTheme.typography.labelSmall,
                    color = Slate400,
                    fontSize = 9.sp,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.weight(1f)
                )
            }
        }

        // Leyenda
        Spacer(modifier = Modifier.height(8.dp))
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(modifier = Modifier.size(10.dp).background(barColor, RoundedCornerShape(50)))
            Spacer(modifier = Modifier.width(4.dp))
            Text("Total", style = MaterialTheme.typography.labelSmall, color = Slate400, fontSize = 10.sp)
            Spacer(modifier = Modifier.width(16.dp))
            Box(modifier = Modifier.size(10.dp).background(comisionColor, RoundedCornerShape(50)))
            Spacer(modifier = Modifier.width(4.dp))
            Text("Comisión", style = MaterialTheme.typography.labelSmall, color = Slate400, fontSize = 10.sp)
        }
    }
}
