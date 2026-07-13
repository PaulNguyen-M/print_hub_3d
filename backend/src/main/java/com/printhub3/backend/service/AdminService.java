package com.printhub3.backend.service;

import com.printhub3.backend.exception.ResourceNotFoundException;

import com.printhub3.backend.dto.response.AdminDashboardDto;
import com.printhub3.backend.dto.response.AdminOrderDto;
import com.printhub3.backend.dto.response.AdminProductDto;
import com.printhub3.backend.dto.response.AdminPrintingRequestDto;
import com.printhub3.backend.dto.response.AdminUserDto;
import com.printhub3.backend.dto.response.RevenuePointDto;
import com.printhub3.backend.dto.response.RevenueStatsDto;
import com.printhub3.backend.entity.Order;
import com.printhub3.backend.entity.Payment;
import com.printhub3.backend.entity.PrintingRequest;
import com.printhub3.backend.entity.Product;
import com.printhub3.backend.entity.User;
import com.printhub3.backend.repository.OrderRepository;
import com.printhub3.backend.repository.PaymentRepository;
import com.printhub3.backend.repository.PrintingRequestRepository;
import com.printhub3.backend.repository.ProductRepository;
import com.printhub3.backend.repository.RoleRepository;
import com.printhub3.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AdminService {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final PrintingRequestRepository printingRequestRepository;
    private final RoleRepository roleRepository;

    @Transactional(readOnly = true)
    public AdminDashboardDto getDashboardOverview() {
        long totalUsers = userRepository.count();
        long activeUsers = userRepository.findAllActiveUsers(Pageable.unpaged()).getTotalElements();
        long totalProducts = productRepository.count();
        long totalOrders = orderRepository.count();
        double totalRevenue = paymentRepository.findPaymentsByDateRange(
                        LocalDateTime.of(2020, 1, 1, 0, 0), LocalDateTime.now())
                .stream()
                .filter(payment -> payment.getPaymentStatus() != null)
                .mapToDouble(payment -> Optional.ofNullable(payment.getAmount()).map(BigDecimal::doubleValue).orElse(0.0))
                .sum();
        long pendingOrders = orderRepository.countPendingOrders();
        long pendingPrintingRequests = printingRequestRepository.findRequestsByStatus(PrintingRequest.ModelStatus.REVIEWING, Pageable.unpaged()).getTotalElements();
        List<RevenuePointDto> monthlyRevenue = getRevenuePoints();

        return AdminDashboardDto.builder()
                .totalUsers(totalUsers)
                .activeUsers(activeUsers)
                .totalProducts(totalProducts)
                .totalOrders(totalOrders)
                .totalRevenue(totalRevenue)
                .pendingOrders(pendingOrders)
                .pendingPrintingRequests(pendingPrintingRequests)
                .monthlyRevenue(monthlyRevenue)
                .build();
    }

    @Transactional(readOnly = true)
    public Page<AdminProductDto> getProducts(int page, int size, String sortBy, Sort.Direction direction, String status) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
        if (status != null && !status.isBlank()) {
            Product.ProductStatus ps = Product.ProductStatus.valueOf(status.toUpperCase());
            return productRepository.findByStatus(ps, pageable).map(this::mapToAdminProductDto);
        }
        return productRepository.findAll(pageable).map(this::mapToAdminProductDto);
    }

    @Transactional(readOnly = true)
    public Page<AdminOrderDto> getOrders(int page, int size, String sortBy, Sort.Direction direction) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
        return orderRepository.findAll(pageable)
                .map(this::mapToAdminOrderDto);
    }

    @Transactional(readOnly = true)
    public Page<AdminUserDto> getUsers(int page, int size, String sortBy, Sort.Direction direction, String search) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
        Page<User> users = (search != null && !search.isBlank())
                ? userRepository.searchUsers(search.trim(), pageable)
                : userRepository.findAll(pageable);
        return users.map(this::mapToAdminUserDto);
    }

    @Transactional(readOnly = true)
    public Page<AdminPrintingRequestDto> getPrintingRequests(int page, int size, String sortBy, Sort.Direction direction) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
        return printingRequestRepository.findAll(pageable)
                .map(this::mapToAdminPrintingRequestDto);
    }

    @Transactional
    public void setProductActive(Long productId, boolean active) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        product.setIsActive(active);
        productRepository.save(product);
    }

    @Transactional
    public AdminProductDto approveProduct(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        product.setStatus(Product.ProductStatus.ACTIVE);
        product.setIsActive(true);
        product.setRejectionReason(null);
        return mapToAdminProductDto(productRepository.save(product));
    }

    @Transactional
    public AdminProductDto rejectProduct(Long productId, String reason) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        product.setStatus(Product.ProductStatus.REJECTED);
        product.setIsActive(false);
        product.setRejectionReason(reason);
        return mapToAdminProductDto(productRepository.save(product));
    }

    @Transactional
    public void setUserActive(Long userId, boolean active) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        user.setIsActive(active);
        userRepository.save(user);
    }

    @Transactional
    public void updateUserRole(Long userId, String roleName) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        com.printhub3.backend.entity.Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new RuntimeException("Role not found: " + roleName));
        user.setRole(role);
        userRepository.save(user);
    }

    @Transactional
    public void updatePrintingRequestStatus(Long requestId, String status) {
        PrintingRequest request = printingRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Printing request not found"));
        request.setModelStatus(PrintingRequest.ModelStatus.valueOf(status));
        printingRequestRepository.save(request);
    }

    @Transactional
    public void updateOrderStatus(Long orderId, String status) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        Order.OrderStatus newStatus = Order.OrderStatus.valueOf(status);
        order.setOrderStatus(newStatus);
        // Ghi mốc thời gian giao hàng khi chuyển sang DELIVERED (nếu chưa có),
        // để timeline có timestamp hợp lệ thay vì null.
        if (newStatus == Order.OrderStatus.DELIVERED && order.getDeliveredAt() == null) {
            order.setDeliveredAt(java.time.LocalDateTime.now());
        }
        orderRepository.save(order);
    }

    @Transactional(readOnly = true)
    public RevenueStatsDto getRevenueStats() {
        LocalDateTime today = LocalDateTime.now();
        LocalDateTime yearStart = today.withDayOfYear(1).toLocalDate().atStartOfDay();
        List<Payment> payments = paymentRepository.findPaymentsByDateRange(yearStart, today);
        double totalRevenue = payments.stream()
                .mapToDouble(payment -> Optional.ofNullable(payment.getAmount()).map(BigDecimal::doubleValue).orElse(0.0))
                .sum();
        long orderCount = payments.size();
        double averageOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0.0;
        List<RevenuePointDto> monthlyRevenue = getRevenuePoints();

        return RevenueStatsDto.builder()
                .totalRevenue(totalRevenue)
                .averageOrderValue(averageOrderValue)
                .orderCount(orderCount)
                .monthlyRevenue(monthlyRevenue)
                .build();
    }

    private List<RevenuePointDto> getRevenuePoints() {
        LocalDate startMonth = LocalDate.now().minusMonths(5).withDayOfMonth(1);
        LocalDateTime windowStart = startMonth.atStartOfDay();
        LocalDateTime windowEnd = LocalDateTime.now();
        List<Payment> payments = paymentRepository.findPaymentsByDateRange(windowStart, windowEnd);

        List<RevenuePointDto> points = new ArrayList<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM yyyy");

        for (int index = 0; index < 6; index++) {
            LocalDate month = startMonth.plusMonths(index);
            LocalDateTime monthStart = month.atStartOfDay();
            LocalDateTime monthEnd = month.plusMonths(1).atStartOfDay();
            double revenue = payments.stream()
                    .filter(payment -> !payment.getCreatedAt().isBefore(monthStart) && payment.getCreatedAt().isBefore(monthEnd))
                    .map(payment -> Optional.ofNullable(payment.getAmount()).map(BigDecimal::doubleValue).orElse(0.0))
                    .mapToDouble(Double::doubleValue)
                    .sum();
            points.add(RevenuePointDto.builder()
                    .period(month.format(formatter))
                    .revenue(revenue)
                    .build());
        }

        return points;
    }

    private AdminProductDto mapToAdminProductDto(Product product) {
        String thumbnail = (product.getImages() != null && !product.getImages().isEmpty())
                ? product.getImages().iterator().next().getImageUrl() : null;
        return AdminProductDto.builder()
                .productId(product.getProductId())
                .name(product.getName())
                .sellerName(Optional.ofNullable(product.getSeller()).map(User::getFullName).orElse("Unknown"))
                .sellerEmail(Optional.ofNullable(product.getSeller()).map(User::getEmail).orElse(null))
                .shopName(Optional.ofNullable(product.getShop()).map(com.printhub3.backend.entity.Shop::getName).orElse(null))
                .thumbnailUrl(thumbnail)
                .price(product.getPrice())
                .stockQuantity(product.getStockQuantity())
                .active(product.getIsActive())
                .status(product.getStatus() != null ? product.getStatus().name() : "PENDING")
                .rejectionReason(product.getRejectionReason())
                .createdAt(product.getCreatedAt())
                .build();
    }

    private AdminOrderDto mapToAdminOrderDto(Order order) {
        return AdminOrderDto.builder()
                .orderId(order.getOrderId())
                .orderNumber(order.getOrderNumber())
                .customerName(Optional.ofNullable(order.getUser()).map(User::getFullName).orElse("Unknown"))
                .totalAmount(order.getTotalAmount())
                .orderStatus(order.getOrderStatus().toString())
                .paymentMethod(order.getPaymentMethod())
                .trackingNumber(order.getTrackingNumber())
                .createdAt(order.getCreatedAt())
                .build();
    }

    private AdminUserDto mapToAdminUserDto(User user) {
        return AdminUserDto.builder()
                .userId(user.getUserId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(Optional.ofNullable(user.getRole()).map(role -> role.getName()).orElse("UNKNOWN"))
                .active(user.getIsActive())
                .verified(user.getIsVerified())
                .createdAt(user.getCreatedAt())
                .build();
    }

    private AdminPrintingRequestDto mapToAdminPrintingRequestDto(PrintingRequest request) {
        return AdminPrintingRequestDto.builder()
                .requestId(request.getRequestId())
                .userName(Optional.ofNullable(request.getUser()).map(User::getFullName).orElse("Unknown"))
                .fileName(request.getFileName())
                .modelStatus(request.getModelStatus().name())
                .quoteAmount(request.getQuoteAmount())
                .createdAt(request.getCreatedAt())
                .build();
    }
}
