package com.barbershop.crm.ui.screens.cortes

import android.widget.Toast
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.CloudDone
import androidx.compose.material.icons.filled.CloudUpload
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
fun HistorialScreen(
    repository: BarberRepository,
    isAdmin: Boolean = false,
    tenantUrl: String = SessionManager.DEFAULT_TENANT_URL,
    onNavigateBack: () -> Unit
) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    val records by repository.getLocalRecords().collectAsState(initial = emptyList())
    var isRefreshing by remember { mutableStateOf(false) }
    var uploadingRecordId by remember { mutableStateOf<Long?>(null) }

    LaunchedEffect(Unit) {
        isRefreshing = true
        repository.refreshRecords()
        isRefreshing = false
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "Historial Completo",
                        fontWeight = FontWeight.Bold,
                        color = Slate50
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(
                            Icons.Default.ArrowBack,
                            contentDescription = "Volver",
                            tint = Slate50
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Slate900)
            )
        },
        containerColor = Slate950
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 16.dp)
        ) {
            if (isRefreshing && records.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = Amber500)
                }
            } else if (records.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text(
                        text = "No hay registros en el historial.",
                        color = Slate400,
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
            } else {
                Text(
                    text = "${records.size} registros en total",
                    style = MaterialTheme.typography.bodySmall,
                    color = Slate400,
                    modifier = Modifier.padding(vertical = 12.dp)
                )
                LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    items(records) { record ->
                        Card(
                            colors = CardDefaults.cardColors(
                                containerColor = if (record.isSettled) Slate900.copy(alpha = 0.6f) else Slate900
                            ),
                            shape = RoundedCornerShape(14.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(14.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(
                                            text = record.serviceName,
                                            style = MaterialTheme.typography.titleMedium,
                                            fontWeight = FontWeight.Bold,
                                            color = if (record.isSettled) Slate400 else Slate50
                                        )
                                        if (record.isSettled) {
                                            Text(
                                                text = "LIQUIDADO",
                                                style = MaterialTheme.typography.labelSmall,
                                                color = Emerald500,
                                                fontWeight = FontWeight.Bold
                                            )
                                        }
                                    }
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
                                    horizontalArrangement = Arrangement.SpaceBetween
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
                                Spacer(modifier = Modifier.height(4.dp))
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
                                            Icon(Icons.Default.CloudDone, contentDescription = null, tint = Emerald500, modifier = Modifier.size(14.dp))
                                            Spacer(modifier = Modifier.width(4.dp))
                                            Text("Sincronizado", color = Emerald500, style = MaterialTheme.typography.labelSmall)
                                        }
                                    } else {
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Icon(Icons.Default.CloudUpload, contentDescription = null, tint = Amber500, modifier = Modifier.size(14.dp))
                                            Spacer(modifier = Modifier.width(4.dp))
                                            Text("Pendiente", color = Amber500, style = MaterialTheme.typography.labelSmall)
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
