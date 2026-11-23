package com.barbershop.crm.ui.screens.ventas

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.ShoppingBag
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.barbershop.crm.core.database.entities.ProductEntity
import com.barbershop.crm.core.session.SessionManager
import com.barbershop.crm.core.utils.formatPrice
import com.barbershop.crm.data.repository.BarberRepository
import com.barbershop.crm.ui.screens.cortes.PaymentOptionChip
import com.barbershop.crm.ui.theme.*
import kotlinx.coroutines.launch

@Composable
fun VentasScreen(
    repository: BarberRepository,
    sessionManager: SessionManager
) {
    val coroutineScope = rememberCoroutineScope()
    val products by repository.getLocalProducts().collectAsState(initial = emptyList())

    var selectedProduct by remember { mutableStateOf<ProductEntity?>(null) }
    var quantity by remember { mutableStateOf(1) }
    var paymentMethod by remember { mutableStateOf("cash") }
    var successMessage by remember { mutableStateOf<String?>(null) }
    var submitting by remember { mutableStateOf(false) }

    LaunchedEffect(products) {
        if (selectedProduct == null && products.isNotEmpty()) {
            selectedProduct = products.first()
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Slate950)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text = "Ventas de Productos",
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold,
            color = Slate50
        )

        if (successMessage != null) {
            Card(
                colors = CardDefaults.cardColors(containerColor = Emerald500.copy(alpha = 0.15f)),
                shape = RoundedCornerShape(10.dp)
            ) {
                Text(
                    text = successMessage!!,
                    color = Emerald500,
                    modifier = Modifier.padding(12.dp),
                    fontWeight = FontWeight.Bold
                )
            }
        }

        Text(text = "Seleccionar Producto:", color = Slate200, style = MaterialTheme.typography.titleMedium)

        if (products.isEmpty()) {
            Text(text = "No hay productos en inventario.", color = Slate400)
        } else {
            LazyColumn(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(products.size) { index ->
                    val p = products[index]
                    val isSelected = selectedProduct?.id == p.id

                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { selectedProduct = p },
                        colors = CardDefaults.cardColors(
                            containerColor = if (isSelected) Amber500.copy(alpha = 0.15f) else Slate900
                        ),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(14.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(
                                    text = p.name,
                                    color = if (isSelected) Amber400 else Slate50,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = "Stock disponible: ${p.stockQuantity}",
                                    color = if (p.stockQuantity > 0) Emerald500 else Rose500,
                                    style = MaterialTheme.typography.bodySmall
                                )
                            }
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = formatPrice(p.salePrice),
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

        // CANTIDAD Y PAGO
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(text = "Cantidad:", color = Slate200, fontWeight = FontWeight.Bold)
            Row(verticalAlignment = Alignment.CenterVertically) {
                OutlinedButton(
                    onClick = { if (quantity > 1) quantity-- },
                    shape = RoundedCornerShape(8.dp)
                ) { Text("-", color = Slate50, fontWeight = FontWeight.Bold) }
                Text(text = "  $quantity  ", color = Slate50, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleLarge)
                OutlinedButton(
                    onClick = { quantity++ },
                    shape = RoundedCornerShape(8.dp)
                ) { Text("+", color = Slate50, fontWeight = FontWeight.Bold) }
            }
        }

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

        val totalSale = (selectedProduct?.salePrice ?: 0.0) * quantity

        Button(
            onClick = {
                if (selectedProduct != null) {
                    submitting = true
                    coroutineScope.launch {
                        val barberId = sessionManager.getUserId()
                        val res = repository.sellProduct(
                            productId = selectedProduct!!.id,
                            barberId = if (barberId > 0) barberId else null,
                            customerId = null,
                            quantity = quantity,
                            collectedBy = "barber",
                            paymentMethod = paymentMethod
                        )
                        submitting = false
                        res.onSuccess {
                            successMessage = "¡Venta de ${selectedProduct!!.name} x$quantity registrada con éxito!"
                            quantity = 1
                        }
                    }
                }
            },
            enabled = !submitting && selectedProduct != null,
            modifier = Modifier
                .fillMaxWidth()
                .height(52.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Amber500),
            shape = RoundedCornerShape(12.dp)
        ) {
            Icon(Icons.Default.ShoppingBag, contentDescription = null, tint = Slate950)
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = "Cobrar Venta (${formatPrice(totalSale)})",
                color = Slate950,
                fontWeight = FontWeight.Bold,
                maxLines = 1,
                softWrap = false
            )
        }
    }
}
