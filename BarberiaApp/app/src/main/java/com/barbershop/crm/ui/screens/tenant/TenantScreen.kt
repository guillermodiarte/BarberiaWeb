package com.barbershop.crm.ui.screens.tenant

import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.ContentCut
import androidx.compose.material.icons.filled.QrCodeScanner
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.barbershop.crm.core.session.SessionManager
import com.barbershop.crm.ui.theme.*
import com.google.gson.Gson
import com.journeyapps.barcodescanner.ScanContract
import com.journeyapps.barcodescanner.ScanOptions
import kotlinx.coroutines.launch

data class BarbershopQrPayload(
    val app: String? = null,
    val name: String? = null,
    val url: String? = null,
    val code: String? = null
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TenantScreen(
    sessionManager: SessionManager,
    onConnected: () -> Unit,
    onNavigateBack: (() -> Unit)? = null
) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    var inputCodeOrUrl by remember { mutableStateOf("") }
    var detectedSalonName by remember { mutableStateOf<String?>(null) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var isConnecting by remember { mutableStateOf(false) }

    fun processTenantData(rawString: String) {
        val trimmed = rawString.trim()
        if (trimmed.isEmpty()) return

        var targetUrl = ""
        var targetName: String? = null

        // 1. Intentar parsear como JSON de QR del sistema
        if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
            try {
                val payload = Gson().fromJson(trimmed, BarbershopQrPayload::class.java)
                if (!payload.url.isNullOrBlank()) {
                    targetUrl = payload.url
                    targetName = payload.name
                }
            } catch (e: Exception) {
                // Fallback a texto plano
            }
        }

        // 2. Si no es JSON, verificar si es URL completa
        if (targetUrl.isEmpty()) {
            if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
                targetUrl = trimmed
            } else {
                // 3. Es un código corto (Slug, ej: "elite")
                val cleanCode = trimmed.lowercase().replace(" ", "")
                targetUrl = when (cleanCode) {
                    "elite", "barbershop", "default" -> SessionManager.DEFAULT_TENANT_URL
                    else -> "https://$cleanCode.tubarberia.com"
                }
                targetName = trimmed.replaceFirstChar { it.uppercase() }
            }
        }

        isConnecting = true
        coroutineScope.launch {
            sessionManager.saveTenantUrl(targetUrl, targetName)
            Toast.makeText(context, "Conectado a ${targetName ?: "la Barbería"}", Toast.LENGTH_SHORT).show()
            isConnecting = false
            onConnected()
        }
    }

    // Launcher de cámara ZXing para escanear QR en 1 segundo
    val qrScanLauncher = rememberLauncherForActivityResult(ScanContract()) { result ->
        if (result.contents != null) {
            processTenantData(result.contents)
        }
    }

    Scaffold(
        topBar = {
            if (onNavigateBack != null) {
                TopAppBar(
                    title = { Text("Vincular Salón", color = Slate50, fontWeight = FontWeight.Bold) },
                    navigationIcon = {
                        IconButton(onClick = onNavigateBack) {
                            Icon(Icons.Default.ArrowBack, contentDescription = "Volver", tint = Slate50)
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(containerColor = Slate950)
                )
            }
        },
        containerColor = Slate950
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(24.dp),
            contentAlignment = Alignment.Center
        ) {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .verticalScroll(rememberScrollState()),
                colors = CardDefaults.cardColors(containerColor = Slate900),
                shape = RoundedCornerShape(24.dp)
            ) {
                Column(
                    modifier = Modifier.padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Icon(
                        imageVector = Icons.Default.ContentCut,
                        contentDescription = null,
                        tint = Amber500,
                        modifier = Modifier.size(52.dp)
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    Text(
                        text = "Vincular Barbería",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold,
                        color = Slate50
                    )

                    Text(
                        text = "Escanea el código QR desde el panel web de tu salón o ingresa el código asignado por el dueño.",
                        style = MaterialTheme.typography.bodySmall,
                        color = Slate400,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.padding(top = 6.dp, bottom = 24.dp)
                    )

                    // BOTÓN PRINCIPAL: ESCANEAR QR
                    Button(
                        onClick = {
                            val options = ScanOptions().apply {
                                setPrompt("Apunta al código QR del salón")
                                setBeepEnabled(true)
                                setOrientationLocked(true)
                                setBarcodeImageEnabled(false)
                            }
                            qrScanLauncher.launch(options)
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(54.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Amber500),
                        shape = RoundedCornerShape(14.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.QrCodeScanner,
                            contentDescription = null,
                            tint = Slate950,
                            modifier = Modifier.size(24.dp)
                        )
                        Spacer(modifier = Modifier.width(10.dp))
                        Text(
                            text = "Escanear Código QR",
                            color = Slate950,
                            fontWeight = FontWeight.Bold,
                            style = MaterialTheme.typography.titleMedium
                        )
                    }

                    Spacer(modifier = Modifier.height(20.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        HorizontalDivider(modifier = Modifier.weight(1f), color = Slate800)
                        Text(
                            text = "  O INGRESO MANUAL  ",
                            color = Slate500,
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Bold
                        )
                        HorizontalDivider(modifier = Modifier.weight(1f), color = Slate800)
                    }

                    Spacer(modifier = Modifier.height(20.dp))

                    OutlinedTextField(
                        value = inputCodeOrUrl,
                        onValueChange = {
                            inputCodeOrUrl = it
                            errorMessage = null
                        },
                        label = { Text("Código de Salón o URL", color = Slate400) },
                        placeholder = { Text("Ej: elite o tu enlace web", color = Slate600) },
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

                    if (errorMessage != null) {
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(text = errorMessage!!, color = Rose500, style = MaterialTheme.typography.bodySmall)
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    OutlinedButton(
                        onClick = {
                            if (inputCodeOrUrl.isBlank()) {
                                // Si está en blanco, usa el predeterminado
                                processTenantData("elite")
                            } else {
                                processTenantData(inputCodeOrUrl)
                            }
                        },
                        enabled = !isConnecting,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(48.dp),
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = Slate200)
                    ) {
                        if (isConnecting) {
                            CircularProgressIndicator(color = Amber500, modifier = Modifier.size(20.dp))
                        } else {
                            Text("Conectar Manualmente", fontWeight = FontWeight.SemiBold)
                        }
                    }
                }
            }
        }
    }
}
