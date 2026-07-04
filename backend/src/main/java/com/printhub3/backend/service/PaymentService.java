package com.printhub3.backend.service;

import com.printhub3.backend.dto.request.RefundPaymentRequest;
import com.printhub3.backend.dto.request.CreatePaymentSessionRequest;
import com.printhub3.backend.dto.response.PaymentDto;
import com.printhub3.backend.dto.response.PaymentSessionResponse;
import com.printhub3.backend.dto.response.PaymentTransactionDto;
import com.printhub3.backend.entity.Order;
import com.printhub3.backend.entity.Payment;
import com.printhub3.backend.entity.PaymentTransaction;
import com.printhub3.backend.entity.User;
import com.printhub3.backend.exception.InvalidPaymentStateException;
import com.printhub3.backend.exception.OrderNotFoundException;
import com.printhub3.backend.exception.PaymentAccessDeniedException;
import com.printhub3.backend.exception.PaymentGatewayException;
import com.printhub3.backend.mapper.PaymentDtoMapper;
import com.printhub3.backend.repository.OrderRepository;
import com.printhub3.backend.repository.PaymentRepository;
import com.printhub3.backend.repository.PaymentTransactionRepository;
import com.printhub3.backend.repository.UserRepository;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import com.stripe.model.Charge;
import com.stripe.model.Event;
import com.stripe.model.PaymentIntent;
import com.stripe.model.Refund;
import com.stripe.net.Webhook;
import com.stripe.param.RefundCreateParams;
import com.stripe.param.checkout.SessionCreateParams;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final PaymentDtoMapper paymentDtoMapper;

    @Value("${stripe.secret-key:}")
    private String stripeSecretKey;

    @Value("${stripe.currency:usd}")
    private String stripeCurrency;

    @Value("${stripe.success-url:http://localhost:5173/checkout/success}")
    private String defaultSuccessUrl;

    @Value("${stripe.cancel-url:http://localhost:5173/checkout/cancel}")
    private String defaultCancelUrl;

    @Value("${stripe.webhook-secret:}")
    private String webhookSecret;

    public PaymentSessionResponse createPaymentSession(CreatePaymentSessionRequest request, Long userId) throws StripeException {
        // Validate request
        if (request == null || request.getOrderId() == null) {
            throw new IllegalArgumentException("CreatePaymentSessionRequest and orderId cannot be null");
        }
        
        // Fetch and validate order
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new OrderNotFoundException(request.getOrderId()));
        
        // Verify user authorization
        if (!order.getUser().getUserId().equals(userId)) {
            throw new PaymentAccessDeniedException(userId, order.getOrderId());
        }
        
        // Validate order status
        if (order.getOrderStatus() == Order.OrderStatus.CANCELLED) {
            throw new InvalidPaymentStateException("Cannot create payment session for cancelled order");
        }
        
        if (order.getOrderStatus() == Order.OrderStatus.DELIVERED) {
            throw new InvalidPaymentStateException("Cannot create payment session for delivered order");
        }
        
        // Use the order's total amount directly (not multiplied)
        BigDecimal amount = order.getTotalAmount();
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new InvalidPaymentStateException("Order amount must be greater than zero");
        }
        
        // Create or update payment record
        Payment payment = paymentRepository.findByOrderId(order.getOrderId())
                .orElse(createNewPayment(order, amount, request.getPaymentMethod()));
        
        // Update existing payment
        payment.setAmount(amount);
        payment.setPaymentMethod(getOrDefault(request.getPaymentMethod(), "CARD"));
        payment.setPaymentGateway("STRIPE");
        payment.setPaymentStatus(Payment.PaymentStatus.PENDING);
        payment.setGatewayResponseMessage("Stripe checkout session created");
        payment = paymentRepository.save(payment);

        // Demo/dev fallback: when Stripe is not configured, simulate a successful
        // checkout so the order flow can be completed without a real gateway.
        if (!isStripeConfigured()) {
            return createMockSession(order, payment, request);
        }

        // Create Stripe session
        Session session = createStripeSession(order, payment, request, stripeCurrency);
        
        // Update payment with gateway details
        payment.setGatewayTransactionId(session.getId());
        payment.setGatewayResponseCode("checkout.session.created");
        payment.setGatewayResponseMessage("Stripe checkout session created successfully");
        paymentRepository.save(payment);
        
        log.info("Created Stripe checkout session {} for order {} by user {}", session.getId(), order.getOrderNumber(), userId);
        
        return PaymentSessionResponse.builder()
                .paymentId(payment.getPaymentId())
                .orderId(order.getOrderId())
                .checkoutUrl(session.getUrl())
                .sessionId(session.getId())
                .build();
    }
    
    /**
     * Whether a real Stripe secret key is configured.
     */
    private boolean isStripeConfigured() {
        return stripeSecretKey != null && !stripeSecretKey.isBlank();
    }

    /**
     * Demo/dev fallback used when Stripe is not configured. Marks the payment as
     * paid, advances the order, and returns the frontend success URL as the
     * checkout URL so the purchase flow completes end-to-end.
     */
    private PaymentSessionResponse createMockSession(Order order, Payment payment, CreatePaymentSessionRequest request) {
        String mockTransactionId = "MOCK-" + java.util.UUID.randomUUID();

        payment.setPaymentStatus(Payment.PaymentStatus.PAID);
        payment.setPaymentGateway("MOCK");
        payment.setGatewayTransactionId(mockTransactionId);
        payment.setGatewayResponseCode("mock_succeeded");
        payment.setGatewayResponseMessage("Mock payment completed (Stripe not configured)");
        payment.setPaidAt(LocalDateTime.now());
        Payment savedPayment = paymentRepository.save(payment);

        createPaymentTransaction(savedPayment, "PAYMENT_COMPLETED", savedPayment.getAmount(),
                "mock_succeeded", "Mock payment - no gateway configured");

        if (order.getOrderStatus() == Order.OrderStatus.PENDING) {
            order.setOrderStatus(Order.OrderStatus.PROCESSING);
            orderRepository.save(order);
        }

        String checkoutUrl = getOrDefault(request.getSuccessUrl(),
                defaultSuccessUrl + "?orderId=" + order.getOrderId());

        log.warn("Stripe not configured - returning MOCK checkout session for order {} (payment marked PAID)",
                order.getOrderNumber());

        return PaymentSessionResponse.builder()
                .paymentId(savedPayment.getPaymentId())
                .orderId(order.getOrderId())
                .checkoutUrl(checkoutUrl)
                .sessionId(mockTransactionId)
                .build();
    }

    /**
     * Create a new payment record
     */
    private Payment createNewPayment(Order order, BigDecimal amount, String paymentMethod) {
        return Payment.builder()
                .order(order)
                .amount(amount)
                .paymentMethod(getOrDefault(paymentMethod, "CARD"))
                .paymentGateway("STRIPE")
                .paymentStatus(Payment.PaymentStatus.PENDING)
                .build();
    }
    
    /**
     * Create Stripe checkout session
     */
    private Session createStripeSession(Order order, Payment payment, CreatePaymentSessionRequest request, String currency) throws StripeException {
        try {
            SessionCreateParams.LineItem.PriceData.ProductData productData = 
                    SessionCreateParams.LineItem.PriceData.ProductData.builder()
                    .setName("Order " + order.getOrderNumber())
                    .setDescription("3D printing order from PrintHub 3D")
                    .build();
            
            SessionCreateParams.LineItem.PriceData priceData = 
                    SessionCreateParams.LineItem.PriceData.builder()
                    .setCurrency(currency)
                    .setProductData(productData)
                    .setUnitAmount(payment.getAmount().multiply(new BigDecimal("100")).longValue())
                    .build();
            
            SessionCreateParams.LineItem lineItem = SessionCreateParams.LineItem.builder()
                    .setPriceData(priceData)
                    .setQuantity(1L)
                    .build();
            
            SessionCreateParams.Builder sessionBuilder = SessionCreateParams.builder()
                    .setMode(SessionCreateParams.Mode.PAYMENT)
                    .setSuccessUrl(getOrDefault(request.getSuccessUrl(), defaultSuccessUrl) + "?orderId=" + order.getOrderId() + "&session_id={CHECKOUT_SESSION_ID}")
                    .setCancelUrl(getOrDefault(request.getCancelUrl(), defaultCancelUrl))
                    .addPaymentMethodType(SessionCreateParams.PaymentMethodType.CARD)
                    .addLineItem(lineItem)
                    .putMetadata("orderId", order.getOrderId().toString())
                    .putMetadata("paymentId", payment.getPaymentId().toString());
            
            return Session.create(sessionBuilder.build());
        } catch (StripeException ex) {
            log.error("Failed to create Stripe checkout session for order {}: {}", order.getOrderNumber(), ex.getMessage(), ex);
            throw new PaymentGatewayException("Stripe", "create checkout session", ex.getMessage(), ex);
        }
    }
    
    /**
     * Helper method to get value or default
     */
    private String getOrDefault(String value, String defaultValue) {
        return value != null && !value.isBlank() ? value : defaultValue;
    }

    @Transactional(readOnly = true)
    public PaymentDto getPaymentByOrderId(Long orderId, Long userId) {
        if (orderId == null || userId == null) {
            throw new IllegalArgumentException("orderId and userId cannot be null");
        }
        
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new OrderNotFoundException(orderId));
        
        if (!order.getUser().getUserId().equals(userId)) {
            throw new PaymentAccessDeniedException(userId, orderId);
        }
        
        return paymentRepository.findByOrderId(orderId)
                .map(this::mapPaymentToDto)
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public Page<PaymentDto> getUserPayments(Long userId, Pageable pageable) {
        if (userId == null) {
            throw new IllegalArgumentException("userId cannot be null");
        }
        
        userRepository.findById(userId)
                .orElseThrow(() -> new PaymentAccessDeniedException("User not found with ID: " + userId));
        
        return paymentRepository.findPaymentsByUserId(userId, pageable)
                .map(this::mapPaymentToDto);
    }

    @Transactional(readOnly = true)
    public PaymentDto getPaymentById(Long paymentId, Long userId) {
        if (paymentId == null || userId == null) {
            throw new IllegalArgumentException("paymentId and userId cannot be null");
        }
        
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new PaymentAccessDeniedException("Payment not found with ID: " + paymentId));
        
        if (!payment.getOrder().getUser().getUserId().equals(userId)) {
            throw new PaymentAccessDeniedException(userId, paymentId);
        }
        
        return mapPaymentToDto(payment);
    }

    public PaymentDto refundPayment(Long paymentId, RefundPaymentRequest request, Long userId) throws StripeException {
        if (paymentId == null || userId == null) {
            throw new IllegalArgumentException("paymentId and userId cannot be null");
        }
        
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new PaymentAccessDeniedException("Payment not found with ID: " + paymentId));
        
        // Verify user authorization
        if (!payment.getOrder().getUser().getUserId().equals(userId)) {
            throw new PaymentAccessDeniedException(userId, paymentId);
        }
        
        // Validate payment status
        if (payment.getPaymentStatus() != Payment.PaymentStatus.PAID) {
            throw new InvalidPaymentStateException(payment.getPaymentStatus().toString(), "refund");
        }
        
        // Validate gateway transaction ID
        if (payment.getGatewayTransactionId() == null || payment.getGatewayTransactionId().isBlank()) {
            throw new InvalidPaymentStateException("Stripe transaction ID is missing for payment: " + paymentId);
        }
        
        // Calculate refund amount
        BigDecimal refundAmount = request != null && request.getAmount() != null 
                ? request.getAmount() 
                : payment.getAmount();
        
        if (refundAmount == null || refundAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new InvalidPaymentStateException("Refund amount must be greater than zero");
        }
        
        // Validate refund amount doesn't exceed payment amount
        if (refundAmount.compareTo(payment.getAmount()) > 0) {
            throw new InvalidPaymentStateException("Refund amount cannot exceed payment amount");
        }
        
        // Process refund through Stripe
        Refund refund = processStripeRefund(payment, refundAmount);
        
        // Update payment status (atomic transaction)
        payment.setPaymentStatus(Payment.PaymentStatus.REFUNDED);
        payment.setGatewayResponseCode(refund.getStatus());
        payment.setGatewayResponseMessage("Refund processed: " + refund.getId());
        Payment savedPayment = paymentRepository.save(payment);
        
        // Create transaction record
        String reason = refund.getReason() != null ? refund.getReason() : "Refund created";
        createPaymentTransaction(savedPayment, "REFUND", refundAmount, refund.getStatus(), reason);
        
        // Update order status to cancelled
        Order order = savedPayment.getOrder();
        order.setOrderStatus(Order.OrderStatus.CANCELLED);
        orderRepository.save(order);
        
        log.info("Refund processed for payment {} by user {}", paymentId, userId);
        return mapPaymentToDto(savedPayment);
    }
    
    /**
     * Process refund through Stripe
     */
    private Refund processStripeRefund(Payment payment, BigDecimal refundAmount) throws StripeException {
        try {
            long refundAmountCents = refundAmount.multiply(new BigDecimal("100")).longValue();
            
            RefundCreateParams params = RefundCreateParams.builder()
                    .setPaymentIntent(payment.getGatewayTransactionId())
                    .setAmount(refundAmountCents)
                    .build();
            
            return Refund.create(params);
        } catch (StripeException ex) {
            log.error("Stripe refund failed for payment {}: {}", payment.getPaymentId(), ex.getMessage(), ex);
            throw new PaymentGatewayException("Stripe", "create refund", ex.getMessage(), ex);
        }
    }

    public String handleWebhook(String payload, String signatureHeader) {
        if (webhookSecret == null || webhookSecret.isBlank()) {
            throw new InvalidPaymentStateException("Stripe webhook secret is not configured");
        }
        
        if (payload == null || payload.isBlank()) {
            throw new IllegalArgumentException("Webhook payload cannot be null or empty");
        }
        
        Event event;
        try {
            event = Webhook.constructEvent(payload, signatureHeader, webhookSecret);
        } catch (SignatureVerificationException ex) {
            log.error("Stripe webhook signature verification failed", ex);
            throw new PaymentGatewayException(
                "Stripe",
                "create checkout session",
                "CHECKOUT_FAILED",
                ex
            );
        }
        
        if (event == null || event.getType() == null) {
            log.warn("Received null or invalid webhook event");
            return "ok";
        }
        
        try {
            switch (event.getType()) {
                case "checkout.session.completed" -> handleCheckoutSessionCompleted(event);
                case "payment_intent.succeeded" -> handlePaymentIntentSucceeded(event);
                case "charge.refunded" -> handleChargeRefunded(event);
                case "charge.dispute.created" -> handleChargeDispute(event);
                default -> log.debug("Stripe event {} received but not explicitly handled", event.getType());
            }
        } catch (Exception ex) {
            log.error("Error processing webhook event {}: {}", event.getType(), ex.getMessage(), ex);
            // Don't throw - return ok anyway to prevent Stripe from retrying
        }
        
        return "ok";
    }

    private void handleCheckoutSessionCompleted(Event event) {
        try {
            Session session = (Session) event.getDataObjectDeserializer()
                    .getObject()
                    .orElseThrow(() -> new IllegalStateException("Unable to deserialize Stripe session event"));
            
            if (session.getMetadata() == null) {
                log.warn("Stripe checkout session completed event has no metadata");
                return;
            }
            
            String paymentIdValue = session.getMetadata().get("paymentId");
            if (paymentIdValue == null || paymentIdValue.isBlank()) {
                log.warn("Stripe checkout session completed event missing paymentId metadata");
                return;
            }
            
            Long paymentId = Long.parseLong(paymentIdValue);
            Payment payment = paymentRepository.findById(paymentId)
                    .orElseThrow(() -> new IllegalStateException("Payment not found for Stripe session: " + session.getId()));
            
            processCompletedCheckoutSession(payment, session);
        } catch (Exception ex) {
            log.error("Error handling checkout session completed event: {}", ex.getMessage(), ex);
        }
    }
    
    /**
     * Process completed checkout session
     */
    private void processCompletedCheckoutSession(Payment payment, Session session) {
        try {
            if (session.getPaymentIntent() == null) {
                log.warn("Checkout session {} has no payment intent", session.getId());
                return;
            }
            
            PaymentIntent paymentIntent = PaymentIntent.retrieve(session.getPaymentIntent());
            
            if (paymentIntent == null) {
                log.error("Failed to retrieve payment intent for session {}", session.getId());
                return;
            }
            
            payment.setPaymentStatus(Payment.PaymentStatus.PAID);
            payment.setGatewayTransactionId(paymentIntent.getId());
            payment.setGatewayResponseCode(paymentIntent.getStatus());
            payment.setGatewayResponseMessage("Stripe checkout session completed");
            payment.setPaidAt(LocalDateTime.now());
            Payment savedPayment = paymentRepository.save(payment);
            
            createPaymentTransaction(savedPayment, "PAYMENT_COMPLETED", payment.getAmount(), 
                    paymentIntent.getStatus(), "Stripe payment completed");
            
            // Update order status
            Order order = savedPayment.getOrder();
            if (order != null && order.getOrderStatus() == Order.OrderStatus.PENDING) {
                order.setOrderStatus(Order.OrderStatus.PROCESSING);
                orderRepository.save(order);
            }
            
            log.info("Stripe checkout completed for payment {}", payment.getPaymentId());
        } catch (StripeException ex) {
            log.error("Failed to retrieve Stripe payment intent: {}", ex.getMessage(), ex);
        }
    }

    private void handlePaymentIntentSucceeded(Event event) {
        try {
            PaymentIntent paymentIntent = (PaymentIntent) event.getDataObjectDeserializer()
                    .getObject()
                    .orElseThrow(() -> new IllegalStateException("Unable to deserialize Stripe payment intent event"));
            
            if (paymentIntent.getId() == null) {
                log.warn("Payment intent has no ID");
                return;
            }
            
            paymentRepository.findByGatewayTransactionId(paymentIntent.getId())
                    .ifPresent(payment -> processSucceededPaymentIntent(payment, paymentIntent));
        } catch (Exception ex) {
            log.error("Error handling payment intent succeeded event: {}", ex.getMessage(), ex);
        }
    }
    
    /**
     * Process succeeded payment intent
     */
    private void processSucceededPaymentIntent(Payment payment, PaymentIntent paymentIntent) {
        payment.setPaymentStatus(Payment.PaymentStatus.PAID);
        payment.setGatewayResponseCode(paymentIntent.getStatus());
        payment.setGatewayResponseMessage("Stripe payment intent succeeded");
        payment.setPaidAt(LocalDateTime.now());
        Payment savedPayment = paymentRepository.save(payment);
        
        createPaymentTransaction(savedPayment, "PAYMENT_CONFIRMED", payment.getAmount(), 
                paymentIntent.getStatus(), "Stripe payment intent succeeded");
        
        Order order = savedPayment.getOrder();
        if (order != null && order.getOrderStatus() == Order.OrderStatus.PENDING) {
            order.setOrderStatus(Order.OrderStatus.PROCESSING);
            orderRepository.save(order);
        }
        
        log.info("Payment intent succeeded for payment {}", payment.getPaymentId());
    }

    private void handleChargeRefunded(Event event) {
        try {
            Charge charge = (Charge) event.getDataObjectDeserializer()
                    .getObject()
                    .orElseThrow(() -> new IllegalStateException("Unable to deserialize Stripe charge event"));
            
            if (charge.getPaymentIntent() == null || charge.getPaymentIntent().isBlank()) {
                log.warn("Received refunded charge event with no payment intent");
                return;
            }
            
            paymentRepository.findByGatewayTransactionId(charge.getPaymentIntent())
                    .ifPresent(payment -> processRefundedCharge(payment, charge));
        } catch (Exception ex) {
            log.error("Error handling charge refunded event: {}", ex.getMessage(), ex);
        }
    }
    
    /**
     * Process refunded charge
     */
    private void processRefundedCharge(Payment payment, Charge charge) {
        payment.setPaymentStatus(Payment.PaymentStatus.REFUNDED);
        payment.setGatewayResponseCode(charge.getStatus());
        
        String refundId = "unknown";
        if (charge.getRefunds() != null && charge.getRefunds().getData() != null && !charge.getRefunds().getData().isEmpty()) {
            refundId = charge.getRefunds().getData().get(0).getId();
        }
        payment.setGatewayResponseMessage("Charge refunded: " + refundId);
        
        Payment savedPayment = paymentRepository.save(payment);
        createPaymentTransaction(savedPayment, "REFUND", payment.getAmount(), charge.getStatus(), "Stripe refunded charge");
        
        Order order = savedPayment.getOrder();
        if (order != null) {
            order.setOrderStatus(Order.OrderStatus.CANCELLED);
            orderRepository.save(order);
        }
        
        log.info("Charge refunded for payment {}", payment.getPaymentId());
    }
    
    /**
     * Handle charge disputes (chargebacks)
     */
    private void handleChargeDispute(Event event) {
        try {
            log.warn("Received charge dispute event: {}", event.getId());
            // TODO: Implement dispute handling logic (notify merchant, update payment status, etc.)
        } catch (Exception ex) {
            log.error("Error handling charge dispute event: {}", ex.getMessage(), ex);
        }
    }

    private void createPaymentTransaction(Payment payment, String type, BigDecimal amount, String responseCode, String responseMessage) {
        PaymentTransaction transaction = PaymentTransaction.builder()
                .payment(payment)
                .transactionType(type)
                .amount(amount)
                .responseCode(responseCode)
                .responseMessage(responseMessage)
                .build();
        paymentTransactionRepository.save(transaction);
    }

    private PaymentDto mapPaymentToDto(Payment payment) {
        return paymentDtoMapper.mapPaymentToDto(payment);
    }

    private PaymentTransactionDto mapTransactionToDto(PaymentTransaction transaction) {
        return paymentDtoMapper.mapTransactionToDto(transaction);
    }
}
