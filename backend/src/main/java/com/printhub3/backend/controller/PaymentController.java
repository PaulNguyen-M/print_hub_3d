package com.printhub3.backend.controller;

import com.printhub3.backend.dto.request.CreatePaymentSessionRequest;
import com.printhub3.backend.dto.request.RefundPaymentRequest;
import com.printhub3.backend.dto.response.ApiResponse;
import com.printhub3.backend.dto.response.PaymentDto;
import com.printhub3.backend.dto.response.PaymentSessionResponse;
import com.printhub3.backend.exception.PaymentException;
import com.printhub3.backend.exception.PaymentGatewayException;
import com.printhub3.backend.service.PaymentService;
import com.printhub3.backend.security.service.UserDetailsImpl;
import com.stripe.exception.StripeException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

/**
 * PaymentController — Thanh toán qua cổng Stripe.
 * Gồm: tạo phiên thanh toán, tra cứu thanh toán theo đơn, hoàn tiền, và nhận webhook Stripe.
 */
@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
@Slf4j
public class PaymentController {

    private final PaymentService paymentService;

    /** Tạo phiên thanh toán Stripe cho đơn hàng. POST /api/v1/payments/create-session */
    @PostMapping("/create-session")
    public ResponseEntity<ApiResponse<PaymentSessionResponse>> createPaymentSession(
            @RequestBody CreatePaymentSessionRequest request) {
        try {
            Long userId = getCurrentUserId();
            PaymentSessionResponse response = paymentService.createPaymentSession(request, userId);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(response, "Checkout session created successfully"));
        } catch (PaymentException ex) {
            log.error("Payment error: {}", ex.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error( ex.getErrorCode(),ex.getMessage()));
        } catch (StripeException ex) {
            log.error("Stripe error: {}", ex.getMessage(), ex);
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(ApiResponse.error("Payment gateway error: " + ex.getMessage(), "GATEWAY_ERROR"));
        } catch (PaymentGatewayException ex) {
            log.error("Payment gateway error: {}", ex.getMessage(), ex);
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(ApiResponse.error("Payment gateway error: " + ex.getMessage(), ex.getErrorCode()));
        } catch (Exception ex) {
            log.error("Unexpected error creating payment session", ex);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Failed to create checkout session", "INTERNAL_ERROR"));
        }
    }

    /** Lấy thông tin thanh toán theo id đơn hàng. */
    @GetMapping("/order/{orderId}")
    public ResponseEntity<ApiResponse<PaymentDto>> getPaymentByOrderId(@PathVariable Long orderId) {
        try {
            Long userId = getCurrentUserId();
            PaymentDto payment = paymentService.getPaymentByOrderId(orderId, userId);
            if (payment == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("No payment found for this order", "PAYMENT_NOT_FOUND"));
            }
            return ResponseEntity.ok(ApiResponse.success(payment, "Payment retrieved successfully"));
        } catch (PaymentException ex) {
            log.error("Payment error: {}", ex.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error(ex.getMessage(), ex.getErrorCode()));
        } catch (Exception ex) {
            log.error("Unexpected error retrieving payment", ex);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Failed to retrieve payment", "INTERNAL_ERROR"));
        }
    }

    /** Yêu cầu hoàn tiền cho một khoản thanh toán. */
    @PostMapping("/{paymentId}/refund")
    public ResponseEntity<ApiResponse<PaymentDto>> refundPayment(
            @PathVariable Long paymentId,
            @RequestBody(required = false) RefundPaymentRequest request) {
        try {
            Long userId = getCurrentUserId();
            PaymentDto payment = paymentService.refundPayment(paymentId, request, userId);
            return ResponseEntity.ok(ApiResponse.success(payment, "Refund request submitted successfully"));
        } catch (PaymentException ex) {
            log.error("Payment error: {}", ex.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(ex.getMessage(), ex.getErrorCode()));
        } catch (StripeException ex) {
            log.error("Stripe refund error: {}", ex.getMessage(), ex);
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(ApiResponse.error("Refund gateway error: " + ex.getMessage(), "GATEWAY_ERROR"));
        } catch (PaymentGatewayException ex) {
            log.error("Refund gateway error: {}", ex.getMessage(), ex);
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(ApiResponse.error("Refund gateway error: " + ex.getMessage(), ex.getErrorCode()));
        } catch (Exception ex) {
            log.error("Unexpected error processing refund", ex);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Failed to process refund", "INTERNAL_ERROR"));
        }
    }

    /** Nhận webhook từ Stripe: xác thực chữ ký rồi cập nhật trạng thái thanh toán. */
    @PostMapping(value = "/webhook", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> handleWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String signatureHeader) {
        try {
            String response = paymentService.handleWebhook(payload, signatureHeader);
            return ResponseEntity.ok(response);
        } catch (PaymentException ex) {
            log.error("Webhook processing error: {}", ex.getMessage());
            return ResponseEntity.badRequest().body("Webhook error: " + ex.getMessage());
        } catch (Exception ex) {
            log.error("Unexpected error processing webhook", ex);
            // Still return ok for Stripe to not retry
            return ResponseEntity.ok("processed");
        }
    }

    /** Lấy id người dùng hiện tại từ SecurityContext. */
    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalStateException("User is not authenticated");
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof UserDetailsImpl userDetails) {
            return userDetails.getUserId();
        }

        throw new IllegalStateException("Unable to resolve current user ID");
    }
}
