package com.printhub3.backend.mapper;

import com.printhub3.backend.dto.response.PaymentDto;
import com.printhub3.backend.dto.response.PaymentTransactionDto;
import com.printhub3.backend.entity.Payment;
import com.printhub3.backend.entity.PaymentTransaction;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

/**
 * PaymentDtoMapper — Gom logic map DTO thanh toán về một nơi để tránh lặp code.
 */
@Component
@RequiredArgsConstructor
public class PaymentDtoMapper {
    
    /** Chuyển entity Payment sang PaymentDto (kèm danh sách giao dịch con). */
    public PaymentDto mapPaymentToDto(Payment payment) {
        if (payment == null) {
            return null;
        }
        
        List<PaymentTransactionDto> transactions = payment.getTransactions() != null
                ? payment.getTransactions().stream()
                    .map(this::mapTransactionToDto)
                    .collect(Collectors.toList())
                : List.of();
        
        return PaymentDto.builder()
                .paymentId(payment.getPaymentId())
                .orderId(payment.getOrder() != null ? payment.getOrder().getOrderId() : null)
                .amount(payment.getAmount())
                .paymentStatus(payment.getPaymentStatus() != null ? payment.getPaymentStatus().toString() : null)
                .paymentMethod(payment.getPaymentMethod())
                .paymentGateway(payment.getPaymentGateway())
                .gatewayTransactionId(payment.getGatewayTransactionId())
                .gatewayResponseCode(payment.getGatewayResponseCode())
                .gatewayResponseMessage(payment.getGatewayResponseMessage())
                .paidAt(payment.getPaidAt())
                .createdAt(payment.getCreatedAt())
                .updatedAt(payment.getUpdatedAt())
                .transactions(transactions)
                .build();
    }
    
    /** Chuyển entity PaymentTransaction sang PaymentTransactionDto. */
    public PaymentTransactionDto mapTransactionToDto(PaymentTransaction transaction) {
        if (transaction == null) {
            return null;
        }
        
        return PaymentTransactionDto.builder()
                .transactionId(transaction.getTransactionId())
                .transactionType(transaction.getTransactionType())
                .amount(transaction.getAmount())
                .responseCode(transaction.getResponseCode())
                .responseMessage(transaction.getResponseMessage())
                .createdAt(transaction.getCreatedAt())
                .build();
    }
}
