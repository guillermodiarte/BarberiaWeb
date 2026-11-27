package com.barbershop.crm.ui.screens.cortes

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.CloudDone
import androidx.compose.material.icons.filled.CloudUpload
import androidx.compose.material.icons.filled.History
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.barbershop.crm.core.database.entities.SyncStatus
import com.barbershop.crm.core.session.SessionManager
import com.barbershop.crm.core.utils.formatPrice
import com.barbershop.crm.data.repository.BarberRepository
import com.barbershop.crm.ui.theme.*
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CortesScreen(
    repository: BarberRepository,
    isAdmin: Boolean = false,
    tenantUrl: String = SessionManager.DEFAULT_TENANT_URL,
    onNavigateToNuevo: () -> Unit,
    onNavigateToHistorial: () -> Unit = {}
) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    // Solo muestra los cortes del turno activo (no liquidados)
    val records by repository.getActiveShiftRecords().collectAsState(initial = emptyList())
    var isRefreshing by remember { mutableStateOf(false) }
    var uploadingRecordId by remember { mutableStateOf<Long?>(null) }

    LaunchedEffect(Unit) {
        isRefreshing = true
        repository.refreshRecords()
        isRefreshing = false
    }

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(
                onClick = onNavigateToNuevo,
                containerColor = Amber500,
                contentColor = Slate950
            ) {
                Icon(Icons.Default.Add, contentDescription = "Nuevo Corte")
            }
        },
        containerColor = Slate950
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 16.dp)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 16.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Turno Activo",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold,
                        color = Slate50
                    )
                    Text(
                        text = "${records.size} corte${if (records.size != 1) "s" else ""} en este turno",
                        style = MaterialTheme.typography.bodySmall,
                        color = Slate400
                    )
                }
                TextButton(
                    onClick = onNavigateToHistorial,
                    colors = ButtonDefaults.textButtonColors(contentColor = Cyan500)
                ) {
                    Icon(
                        Icons.Default.History,
                        contentDescription = null,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Historial", style = MaterialTheme.typography.labelMedium)
                }
            }

            if (isRefreshing && records.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = Amber500)
                }
            } else if (records.isEmpty()) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = "Sin cortes en el turno activo",
                            color = Slate400,
                            style = MaterialTheme.typography.bodyMedium,
                            fontWeight = FontWeight.SemiBold
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "Los cortes aparecerán aquí hasta el cierre de caja",
                            color = Slate400.copy(alpha = 0.7f),
                            style = MaterialTheme.typography.bodySmall
                        )
                    }
                }
            } else {
                // Resumen del turno
                val totalTurno = records.sumOf { it.price }
                Card(
                    colors = CardDefaults.cardColors(containerColor = Slate800.copy(alpha = 0.6f)),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 12.dp)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(14.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Total del turno",
                            style = MaterialTheme.typography.bodyMedium,
                            color = Slate400
                        )
                        Text(
                            text = formatPrice(totalTurno),
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = Amber400
                        )
                    }
                }

                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    items(records) { record ->
                        Card(
                            colors = CardDefaults.cardColors(containerColor = Slate900),
                            shape = RoundedCornerShape(14.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(14.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = record.serviceName,
                                        style = MaterialTheme.typography.titleMedium,
                                        fontWeight = FontWeight.Bold,
                                        color = Slate50,
                                        modifier = Modifier.weight(1f)
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(
                                        text = formatPrice(record.price),
                                        style = MaterialTheme.typography.titleMedium,
                                        fontWeight = FontWeight.Bold,
                                        color = Amber400,
                                        maxLines = 1,
                                        softWrap = false
                                    )
                                }

                                Spacer(modifier = Modifier.height(4.dp))

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = "Barbero: ${record.barberName}",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = Slate400
                                    )
                                    Text(
                                        text = record.customerName ?: "Cliente ocasional",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = Cyan500
                                    )
                                }

                                if (record.paymentMethod != null) {
                                    Spacer(modifier = Modifier.height(2.dp))
                                    Text(
                                        text = record.paymentMethod,
                                        style = MaterialTheme.typography.labelSmall,
                                        color = Slate400.copy(alpha = 0.7f)
                                    )
                                }

                                Spacer(modifier = Modifier.height(8.dp))

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = record.createdAt,
                                        style = MaterialTheme.typography.labelSmall,
                                        color = Slate400
                                    )

                                    if (record.syncStatus == SyncStatus.SYNCED) {
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Icon(
                                                Icons.Default.CloudDone,
                                                contentDescription = null,
                                                tint = Emerald500,
                                                modifier = Modifier.size(14.dp)
                                            )
                                            Spacer(modifier = Modifier.width(4.dp))
                                            Text(
                                                text = "Sincronizado",
                                                color = Emerald500,
                                                style = MaterialTheme.typography.labelSmall
                                            )
                                        }
                                    } else {
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Icon(
                                                Icons.Default.CloudUpload,
                                                contentDescription = null,
                                                tint = Amber500,
                                                modifier = Modifier.size(14.dp)
                                            )
                                            Spacer(modifier = Modifier.width(4.dp))
                                            Text(
                                                text = "Pendiente de Sync",
                                                color = Amber500,
                                                style = MaterialTheme.typography.labelSmall
                                            )
                                        }
                                    }
                                }

                                ReceiptActionRow(
                                    record = record,
                                    isAdmin = isAdmin,
                                    tenantUrl = tenantUrl,
                                    isUploading = uploadingRecordId == record.localId,
                                    onAttachFile = { file ->
                                        uploadingRecordId = record.localId
                                        coroutineScope.launch {
                                            val res = repository.attachReceiptToRecord(record, file)
                                            uploadingRecordId = null
                                            res.onFailure { err ->
                                                Toast.makeText(context, err.message ?: "Error al subir foto", Toast.LENGTH_LONG).show()
                                            }
                                        }
                                    }
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
