package com.barbershop.crm.ui.screens.login

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ContentCut
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import com.barbershop.crm.core.session.SessionManager
import com.barbershop.crm.data.repository.BarberRepository
import com.barbershop.crm.ui.theme.*
import kotlinx.coroutines.launch

@Composable
fun LoginScreen(
    repository: BarberRepository,
    sessionManager: SessionManager,
    onLoginSuccess: (role: String) -> Unit,
    onChangeServer: () -> Unit
) {
    val coroutineScope = rememberCoroutineScope()
    var email by remember { mutableStateOf("marcos@barbershop.com") }
    var password by remember { mutableStateOf("barbero123") }
    var loading by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    val salonName by sessionManager.salonNameFlow.collectAsState(initial = "BarberShop Elite")
    val isSuspended by sessionManager.isSuspendedFlow.collectAsState(initial = false)

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Slate950)
            .padding(24.dp),
        contentAlignment = Alignment.Center
    ) {
        Card(
            modifier = Modifier.fillMaxWidth(),
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
                    text = salonName,
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    color = Slate50
                )
                Text(
                    text = "Acceso a Gestión del Salón",
                    style = MaterialTheme.typography.bodySmall,
                    color = Slate400
                )

                Spacer(modifier = Modifier.height(20.dp))

                // ALERTA DE SUSPENSIÓN O REVOCACIÓN DE CUENTA
                if (isSuspended) {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = Rose500.copy(alpha = 0.15f)),
                        modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(Icons.Default.Warning, contentDescription = null, tint = Rose500)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "Tu cuenta ha sido suspendida o dada de baja. Se cerró la sesión y se descartaron los datos no sincronizados.",
                                color = Rose500,
                                style = MaterialTheme.typography.bodySmall
                            )
                        }
                    }
                }

                if (errorMessage != null) {
                    Text(
                        text = errorMessage!!,
                        color = Rose500,
                        style = MaterialTheme.typography.bodySmall,
                        modifier = Modifier.padding(bottom = 12.dp)
                    )
                }

                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = { Text("Correo Electrónico", color = Slate400) },
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

                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = password,
                    onValueChange = { password = it },
                    label = { Text("Contraseña", color = Slate400) },
                    singleLine = true,
                    visualTransformation = PasswordVisualTransformation(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Slate50,
                        unfocusedTextColor = Slate200,
                        focusedBorderColor = Amber500,
                        unfocusedBorderColor = Slate700
                    ),
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                )

                Spacer(modifier = Modifier.height(24.dp))

                Button(
                    onClick = {
                        loading = true
                        errorMessage = null
                        coroutineScope.launch {
                            val result = repository.login(email, password)
                            loading = false
                            result.onSuccess { user ->
                                onLoginSuccess(user.role)
                            }.onFailure { err ->
                                errorMessage = err.message
                            }
                        }
                    },
                    enabled = !loading,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(50.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Amber500),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    if (loading) {
                        CircularProgressIndicator(color = Slate950, modifier = Modifier.size(24.dp))
                    } else {
                        Text(
                            text = "Iniciar Sesión",
                            color = Slate950,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                TextButton(onClick = onChangeServer) {
                    Text(
                        text = "Cambiar Servidor / Peluquería",
                        color = Cyan500,
                        style = MaterialTheme.typography.bodySmall
                    )
                }
            }
        }
    }
}
