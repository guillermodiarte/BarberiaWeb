package com.barbershop.crm.ui.screens.cortes

import android.Manifest
import android.content.pm.PackageManager
import android.net.Uri
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.ContentCut
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.PhotoLibrary
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import coil.compose.AsyncImage
import com.barbershop.crm.core.database.entities.CustomerEntity
import com.barbershop.crm.core.database.entities.ServiceEntity
import com.barbershop.crm.core.session.SessionManager
import com.barbershop.crm.core.utils.ReceiptImageUtils
import com.barbershop.crm.core.utils.formatPrice
import com.barbershop.crm.data.repository.BarberRepository
import com.barbershop.crm.ui.theme.*
import kotlinx.coroutines.launch
import java.io.File

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NuevoCorteScreen(
    repository: BarberRepository,
    sessionManager: SessionManager,
    onNavigateBack: () -> Unit
) {
    val coroutineScope = rememberCoroutineScope()
    val scrollState = rememberScrollState()

    val services by repository.getLocalServices().collectAsState(initial = emptyList())

    var selectedService by remember { mutableStateOf<ServiceEntity?>(null) }
    var serviceDropdownExpanded by remember { mutableStateOf(false) }
    var customerQuery by remember { mutableStateOf("") }
    var selectedCustomer by remember { mutableStateOf<CustomerEntity?>(null) }
    var suggestedCustomers by remember { mutableStateOf<List<CustomerEntity>>(emptyList()) }

    var customerPhone by remember { mutableStateOf("") }
    var paymentMethod by remember { mutableStateOf("cash") } // cash, transfer_barber, transfer_shop
    var notes by remember { mutableStateOf("") }
    var submitting by remember { mutableStateOf(false) }

    val context = LocalContext.current
    var selectedReceiptFile by remember { mutableStateOf<File?>(null) }
    var pendingCameraFile by remember { mutableStateOf<File?>(null) }

    val cameraLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.TakePicture()
    ) { success ->
        val file = pendingCameraFile
        if (success && file != null && file.exists() && file.length() > 0) {
            selectedReceiptFile = file
        }
        pendingCameraFile = null
    }

    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { granted ->
        if (granted) {
            val (file, uri) = ReceiptImageUtils.createCameraOutputFileAndUri(context)
            pendingCameraFile = file
            cameraLauncher.launch(uri)
        } else {
            Toast.makeText(context, "Se requiere permiso de cámara para sacar la foto", Toast.LENGTH_SHORT).show()
        }
    }

    val galleryLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.PickVisualMedia()
    ) { uri: Uri? ->
        if (uri != null) {
            val copied = ReceiptImageUtils.copyUriToInternalFile(context, uri)
            if (copied != null) {
                selectedReceiptFile = copied
            } else {
                Toast.makeText(context, "No se pudo leer la imagen seleccionada", Toast.LENGTH_SHORT).show()
            }
        }
    }

    LaunchedEffect(services) {
        if (selectedService == null && services.isNotEmpty()) {
            selectedService = services.first()
        }
    }

    // Búsqueda en vivo en la base de datos local de clientes (Room)
    LaunchedEffect(customerQuery) {
        if (customerQuery.length >= 2 && selectedCustomer == null) {
            suggestedCustomers = repository.searchCustomersLocal(customerQuery)
        } else {
            suggestedCustomers = emptyList()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Registrar Corte", color = Slate50, fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Volver", tint = Slate50)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Slate900)
            )
        },
        containerColor = Slate950
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(Slate950)
                .padding(paddingValues)
                .padding(16.dp)
                .verticalScroll(scrollState),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // SELECTOR DE SERVICIO REALIZADO
            Text(text = "Servicio Realizado *", color = Slate200, style = MaterialTheme.typography.titleMedium)

            Box(modifier = Modifier.fillMaxWidth()) {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { serviceDropdownExpanded = true },
                    colors = CardDefaults.cardColors(containerColor = Slate900),
                    shape = RoundedCornerShape(14.dp)
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
                            Icon(
                                imageVector = Icons.Default.ContentCut,
                                contentDescription = null,
                                tint = if (selectedService?.isCombo == true) Cyan500 else Amber500,
                                modifier = Modifier.size(24.dp)
                            )
                            Spacer(modifier = Modifier.width(12.dp))
                            Column {
                                Text(
                                    text = selectedService?.name ?: "Seleccionar Servicio",
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = Slate50
                                )
                                Spacer(modifier = Modifier.height(2.dp))
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text(
                                        text = if (selectedService?.isCombo == true) "COMBO" else "INDIVIDUAL",
                                        color = if (selectedService?.isCombo == true) Cyan500 else Amber400,
                                        style = MaterialTheme.typography.labelSmall,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Text(
                                        text = " • ${selectedService?.durationMinutes ?: 30} min",
                                        color = Slate400,
                                        style = MaterialTheme.typography.bodySmall
                                    )
                                }
                            }
                        }

                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = formatPrice(selectedService?.price ?: 0.0),
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.Bold,
                                color = Amber400,
                                maxLines = 1,
                                softWrap = false
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Icon(
                                imageVector = Icons.Default.ArrowDropDown,
                                contentDescription = "Desplegar",
                                tint = Amber500
                            )
                        }
                    }
                }

                DropdownMenu(
                    expanded = serviceDropdownExpanded,
                    onDismissRequest = { serviceDropdownExpanded = false },
                    modifier = Modifier
                        .fillMaxWidth(0.92f)
                        .background(Slate900)
                ) {
                    services.forEach { srv ->
                        DropdownMenuItem(
                            text = {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(
                                            text = srv.name,
                                            fontWeight = if (srv.id == selectedService?.id) FontWeight.Bold else FontWeight.Normal,
                                            color = if (srv.id == selectedService?.id) Amber400 else Slate50
                                        )
                                        Text(
                                            text = "${srv.durationMinutes} min • ${if (srv.isCombo) "Combo" else "Individual"}",
                                            color = Slate400,
                                            style = MaterialTheme.typography.bodySmall
                                        )
                                    }
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(
                                        text = formatPrice(srv.price),
                                        fontWeight = FontWeight.Bold,
                                        color = Amber400,
                                        maxLines = 1,
                                        softWrap = false
                                    )
                                }
                            },
                            onClick = {
                                selectedService = srv
                                serviceDropdownExpanded = false
                            }
                        )
                    }
                }
            }

            // BUSCADOR PREDICTIVO DE CLIENTES EN BASE LOCAL (OFFLINE)
            Text(text = "Cliente & Puntos de Fidelización", color = Slate200, style = MaterialTheme.typography.titleMedium)

            OutlinedTextField(
                value = customerQuery,
                onValueChange = {
                    customerQuery = it
                    if (selectedCustomer != null && it != selectedCustomer!!.name) {
                        selectedCustomer = null
                    }
                },
                label = { Text("Buscar cliente (nombre o teléfono)", color = Slate400) },
                leadingIcon = { Icon(Icons.Default.Person, contentDescription = null, tint = Amber500) },
                singleLine = true,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedTextColor = Slate50,
                    unfocusedTextColor = Slate200,
                    focusedBorderColor = Amber500,
                    unfocusedBorderColor = Slate700
                ),
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp)
            )

            // LISTA DE SUGERENCIAS DE CLIENTES LOCALES
            if (suggestedCustomers.isNotEmpty()) {
                Card(
                    colors = CardDefaults.cardColors(containerColor = Slate900),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(8.dp)) {
                        Text(
                            text = "Clientes encontrados en el salón:",
                            style = MaterialTheme.typography.labelSmall,
                            color = Slate400,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                        )
                        suggestedCustomers.forEach { c ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable {
                                        selectedCustomer = c
                                        customerQuery = c.name
                                        customerPhone = c.phone ?: ""
                                        suggestedCustomers = emptyList()
                                    }
                                    .padding(horizontal = 12.dp, vertical = 8.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column {
                                    Text(text = c.name, color = Slate50, fontWeight = FontWeight.Bold)
                                    Text(text = c.phone ?: "Sin teléfono", color = Slate400, style = MaterialTheme.typography.bodySmall)
                                }
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(Icons.Default.Star, contentDescription = null, tint = Amber500, modifier = Modifier.size(14.dp))
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text(text = "${c.loyaltyPoints} pts", color = Amber400, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }
                }
            }

            if (selectedCustomer != null) {
                Card(
                    colors = CardDefaults.cardColors(containerColor = Emerald500.copy(alpha = 0.15f)),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(text = "Cliente seleccionado: ${selectedCustomer!!.name}", color = Emerald500, fontWeight = FontWeight.Bold)
                        Text(text = "Acumula puntos", color = Emerald500, style = MaterialTheme.typography.bodySmall)
                    }
                }
            } else {
                OutlinedTextField(
                    value = customerPhone,
                    onValueChange = { customerPhone = it },
                    label = { Text("Teléfono / WhatsApp (opcional)", color = Slate400) },
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Slate50,
                        unfocusedTextColor = Slate200,
                        focusedBorderColor = Amber500,
                        unfocusedBorderColor = Slate700
                    ),
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                )
            }

            // MÉTODO DE PAGO
            Text(text = "Método de Pago", color = Slate200, style = MaterialTheme.typography.titleMedium)
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                PaymentOptionChip(
                    title = "Efectivo",
                    isSelected = paymentMethod == "cash",
                    onClick = { paymentMethod = "cash" },
                    modifier = Modifier.weight(1f)
                )
                PaymentOptionChip(
                    title = "Transferencia",
                    isSelected = paymentMethod == "transfer_shop",
                    onClick = { paymentMethod = "transfer_shop" },
                    modifier = Modifier.weight(1f)
                )
            }

            // NOTAS
            OutlinedTextField(
                value = notes,
                onValueChange = { notes = it },
                label = { Text("Notas internas (opcional)", color = Slate400) },
                colors = OutlinedTextFieldDefaults.colors(
                    focusedTextColor = Slate50,
                    unfocusedTextColor = Slate200,
                    focusedBorderColor = Amber500,
                    unfocusedBorderColor = Slate700
                ),
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp)
            )

            // COMPROBANTE / FOTO OPCIONAL
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
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "Comprobante / Foto (Opcional)",
                                style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.Bold,
                                color = Slate50
                            )
                            Text(
                                text = if (paymentMethod != "cash") "Recomendado para transferencias" else "Puedes adjuntarla ahora o luego",
                                style = MaterialTheme.typography.bodySmall,
                                color = if (paymentMethod != "cash") Amber400 else Slate400
                            )
                        }
                        if (selectedReceiptFile != null) {
                            IconButton(onClick = { selectedReceiptFile = null }) {
                                Icon(Icons.Default.Close, contentDescription = "Quitar foto", tint = Rose500)
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    if (selectedReceiptFile != null) {
                        AsyncImage(
                            model = selectedReceiptFile,
                            contentDescription = "Vista previa del comprobante",
                            contentScale = ContentScale.Crop,
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(160.dp)
                                .clip(RoundedCornerShape(10.dp))
                        )
                    } else {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            OutlinedButton(
                                onClick = {
                                    val hasCam = ContextCompat.checkSelfPermission(
                                        context,
                                        Manifest.permission.CAMERA
                                    ) == PackageManager.PERMISSION_GRANTED
                                    if (hasCam) {
                                        val (file, uri) = ReceiptImageUtils.createCameraOutputFileAndUri(context)
                                        pendingCameraFile = file
                                        cameraLauncher.launch(uri)
                                    } else {
                                        permissionLauncher.launch(Manifest.permission.CAMERA)
                                    }
                                },
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(10.dp),
                                colors = ButtonDefaults.outlinedButtonColors(contentColor = Amber400)
                            ) {
                                Icon(Icons.Default.CameraAlt, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Sacar Foto", fontWeight = FontWeight.Bold)
                            }
                            OutlinedButton(
                                onClick = {
                                    galleryLauncher.launch(
                                        PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)
                                    )
                                },
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(10.dp),
                                colors = ButtonDefaults.outlinedButtonColors(contentColor = Cyan400)
                            ) {
                                Icon(Icons.Default.PhotoLibrary, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Galería", fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // BOTÓN GUARDAR (OFFLINE-FIRST)
            Button(
                onClick = {
                    submitting = true
                    coroutineScope.launch {
                        val barberId = sessionManager.getUserId()
                        val barberName = sessionManager.getFullName()

                        val serviceToSave = selectedService ?: ServiceEntity(
                            id = 1,
                            name = "Corte Clásico",
                            description = null,
                            durationMinutes = 35,
                            price = 8000.0,
                            isActive = true
                        )

                        repository.createServiceRecord(
                            service = serviceToSave,
                            barberId = if (barberId > 0) barberId else 1,
                            barberName = if (barberName.isNotEmpty()) barberName else "Barbero",
                            customerId = selectedCustomer?.id,
                            customerName = selectedCustomer?.name ?: customerQuery.ifBlank { null },
                            customerPhone = customerPhone.ifBlank { null },
                            collectedBy = "barber",
                            paymentMethod = paymentMethod,
                            notes = notes.ifBlank { null },
                            localReceiptPath = selectedReceiptFile?.absolutePath
                        )

                        submitting = false
                        onNavigateBack()
                    }
                },
                enabled = !submitting,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Amber500),
                shape = RoundedCornerShape(12.dp)
            ) {
                if (submitting) {
                    CircularProgressIndicator(color = Slate950, modifier = Modifier.size(24.dp))
                } else {
                    Icon(Icons.Default.Check, contentDescription = null, tint = Slate950)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Confirmar y Guardar (Offline)", color = Slate950, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
fun PaymentOptionChip(
    title: String,
    isSelected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Surface(
        onClick = onClick,
        modifier = modifier.height(48.dp),
        shape = RoundedCornerShape(12.dp),
        color = if (isSelected) Amber500.copy(alpha = 0.2f) else Slate900,
        border = BorderStroke(
            width = 1.dp,
            color = if (isSelected) Amber500 else Slate700
        )
    ) {
        Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = title,
                color = if (isSelected) Amber400 else Slate200,
                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                style = MaterialTheme.typography.bodyMedium
            )
        }
    }
}
