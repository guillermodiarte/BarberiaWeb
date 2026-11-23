package com.barbershop.crm.core.utils

import java.text.DecimalFormat
import java.text.DecimalFormatSymbols
import java.util.Locale

object CurrencyFormatter {
    private val symbols = DecimalFormatSymbols(Locale("es", "AR")).apply {
        groupingSeparator = '.'
        decimalSeparator = ','
    }

    private val integerFormat = DecimalFormat("#,##0", symbols)
    private val decimalFormat = DecimalFormat("#,##0.00", symbols)

    fun format(amount: Double): String {
        return if (amount % 1.0 == 0.0) {
            "$${integerFormat.format(amount)}"
        } else {
            "$${decimalFormat.format(amount)}"
        }
    }
}

fun formatPrice(amount: Double): String = CurrencyFormatter.format(amount)
