package com.printhub3.backend.service;

import com.printhub3.backend.dto.response.NotificationDto;
import com.printhub3.backend.entity.Notification;
import com.printhub3.backend.entity.Notification.NotificationType;
import com.printhub3.backend.entity.User;
import com.printhub3.backend.exception.ResourceNotFoundException;
import com.printhub3.backend.repository.NotificationRepository;
import com.printhub3.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * NotificationService — Tạo và quản lý thông báo trong ứng dụng.
 * Vừa xử lý CRUD (tạo/đọc/đánh dấu đã đọc/xóa), vừa cung cấp các hàm tiện ích để
 * các service khác bắn thông báo (xác nhận đơn, cập nhật đơn, báo giá in 3D...).
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    /** Tạo và lưu một thông báo cho người dùng cho trước. */
    public NotificationDto createNotification(Long userId, String title, String message,
                                              NotificationType type,
                                              String relatedEntityType, Long relatedEntityId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        Notification notification = Notification.builder()
                .user(user)
                .title(title)
                .message(message)
                .notificationType(type)
                .relatedEntityType(relatedEntityType)
                .relatedEntityId(relatedEntityId)
                .isRead(false)
                .build();

        return toDto(notificationRepository.save(notification));
    }

    /** Danh sách thông báo của người dùng (phân trang). */
    @Transactional(readOnly = true)
    public Page<NotificationDto> getNotifications(Long userId, Pageable pageable) {
        return notificationRepository
                .findNotificationsByUserId(userId, pageable)
                .map(this::toDto);
    }

    /** Đếm số thông báo chưa đọc của người dùng. */
    @Transactional(readOnly = true)
    public long countUnread(Long userId) {
        return notificationRepository.countUnreadNotifications(userId);
    }

    /** Thông báo của người dùng theo loại (phân trang). */
    @Transactional(readOnly = true)
    public Page<NotificationDto> getByType(Long userId, NotificationType type, Pageable pageable) {
        return notificationRepository
                .findNotificationsByType(userId, type, pageable)
                .map(this::toDto);
    }

    /** Đánh dấu một thông báo là đã đọc (kiểm tra đúng chủ sở hữu). */
    public NotificationDto markAsRead(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", "id", notificationId));

        if (!notification.getUser().getUserId().equals(userId)) {
            throw new SecurityException("Access denied");
        }
        if (Boolean.FALSE.equals(notification.getIsRead())) {
            notification.setIsRead(true);
            notification.setReadAt(LocalDateTime.now());
            notification = notificationRepository.save(notification);
        }
        return toDto(notification);
    }

    /** Đánh dấu tất cả thông báo chưa đọc của người dùng là đã đọc. */
    public void markAllAsRead(Long userId) {
        notificationRepository.findNotificationsByUserId(userId, Pageable.unpaged())
                .stream()
                .filter(n -> Boolean.FALSE.equals(n.getIsRead()))
                .forEach(n -> {
                    n.setIsRead(true);
                    n.setReadAt(LocalDateTime.now());
                });
    }

    /** Xóa mềm một thông báo (kiểm tra đúng chủ sở hữu). */
    public void deleteNotification(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", "id", notificationId));

        if (!notification.getUser().getUserId().equals(userId)) {
            throw new SecurityException("Access denied");
        }
        notification.setDeletedAt(LocalDateTime.now());
        notificationRepository.save(notification);
    }

    // ── Các hàm tiện ích để service khác bắn thông báo ──────────────────────

    /** Thông báo "đặt hàng thành công". */
    public void notifyOrderConfirmation(Long userId, Long orderId, String orderNumber) {
        createNotification(userId,
                "Đặt hàng thành công",
                "Đơn hàng #" + orderNumber + " đã được xác nhận.",
                NotificationType.ORDER_CONFIRMATION, "Order", orderId);
    }

    /** Thông báo đơn hàng đổi trạng thái. */
    public void notifyOrderUpdate(Long userId, Long orderId, String orderNumber, String newStatus) {
        createNotification(userId,
                "Cập nhật đơn hàng",
                "Đơn hàng #" + orderNumber + " chuyển sang trạng thái: " + newStatus,
                NotificationType.ORDER_UPDATE, "Order", orderId);
    }

    /** Thông báo "thanh toán thành công". */
    public void notifyPaymentConfirmation(Long userId, Long orderId, String orderNumber) {
        createNotification(userId,
                "Thanh toán thành công",
                "Thanh toán cho đơn hàng #" + orderNumber + " đã được xác nhận.",
                NotificationType.PAYMENT_CONFIRMATION, "Order", orderId);
    }

    /** Thông báo đã có báo giá cho yêu cầu in 3D. */
    public void notifyModelQuote(Long userId, Long requestId, String fileName, String quoteAmount) {
        createNotification(userId,
                "Báo giá in 3D",
                "File \"" + fileName + "\" đã được báo giá: " + quoteAmount,
                NotificationType.MODEL_QUOTE, "PrintingRequest", requestId);
    }

    /** Thông báo yêu cầu in 3D đổi trạng thái. */
    public void notifyModelStatusUpdate(Long userId, Long requestId, String fileName, String status) {
        createNotification(userId,
                "Cập nhật trạng thái in 3D",
                "File \"" + fileName + "\" chuyển sang: " + status,
                NotificationType.MODEL_STATUS_UPDATE, "PrintingRequest", requestId);
    }

    // ── Mapping ──────────────────────────────────────────────────────────────

    /** Chuyển entity Notification sang DTO trả về frontend. */
    private NotificationDto toDto(Notification n) {
        return NotificationDto.builder()
                .notificationId(n.getNotificationId())
                .title(n.getTitle())
                .message(n.getMessage())
                .notificationType(n.getNotificationType().name())
                .relatedEntityType(n.getRelatedEntityType())
                .relatedEntityId(n.getRelatedEntityId())
                .isRead(n.getIsRead())
                .readAt(n.getReadAt())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
