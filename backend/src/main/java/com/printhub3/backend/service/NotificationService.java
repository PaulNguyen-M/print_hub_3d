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

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    /** Create and persist a notification for a given user. */
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

    @Transactional(readOnly = true)
    public Page<NotificationDto> getNotifications(Long userId, Pageable pageable) {
        return notificationRepository
                .findNotificationsByUserId(userId, pageable)
                .map(this::toDto);
    }

    @Transactional(readOnly = true)
    public long countUnread(Long userId) {
        return notificationRepository.countUnreadNotifications(userId);
    }

    @Transactional(readOnly = true)
    public Page<NotificationDto> getByType(Long userId, NotificationType type, Pageable pageable) {
        return notificationRepository
                .findNotificationsByType(userId, type, pageable)
                .map(this::toDto);
    }

    /** Mark a single notification as read. */
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

    /** Mark all unread notifications of a user as read. */
    public void markAllAsRead(Long userId) {
        notificationRepository.findNotificationsByUserId(userId, Pageable.unpaged())
                .stream()
                .filter(n -> Boolean.FALSE.equals(n.getIsRead()))
                .forEach(n -> {
                    n.setIsRead(true);
                    n.setReadAt(LocalDateTime.now());
                });
    }

    /** Soft-delete a notification. */
    public void deleteNotification(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", "id", notificationId));

        if (!notification.getUser().getUserId().equals(userId)) {
            throw new SecurityException("Access denied");
        }
        notification.setDeletedAt(LocalDateTime.now());
        notificationRepository.save(notification);
    }

    // ── Convenience factory methods used by other services ──────────────────

    public void notifyOrderConfirmation(Long userId, Long orderId, String orderNumber) {
        createNotification(userId,
                "Đặt hàng thành công",
                "Đơn hàng #" + orderNumber + " đã được xác nhận.",
                NotificationType.ORDER_CONFIRMATION, "Order", orderId);
    }

    public void notifyOrderUpdate(Long userId, Long orderId, String orderNumber, String newStatus) {
        createNotification(userId,
                "Cập nhật đơn hàng",
                "Đơn hàng #" + orderNumber + " chuyển sang trạng thái: " + newStatus,
                NotificationType.ORDER_UPDATE, "Order", orderId);
    }

    public void notifyPaymentConfirmation(Long userId, Long orderId, String orderNumber) {
        createNotification(userId,
                "Thanh toán thành công",
                "Thanh toán cho đơn hàng #" + orderNumber + " đã được xác nhận.",
                NotificationType.PAYMENT_CONFIRMATION, "Order", orderId);
    }

    public void notifyModelQuote(Long userId, Long requestId, String fileName, String quoteAmount) {
        createNotification(userId,
                "Báo giá in 3D",
                "File \"" + fileName + "\" đã được báo giá: " + quoteAmount,
                NotificationType.MODEL_QUOTE, "PrintingRequest", requestId);
    }

    public void notifyModelStatusUpdate(Long userId, Long requestId, String fileName, String status) {
        createNotification(userId,
                "Cập nhật trạng thái in 3D",
                "File \"" + fileName + "\" chuyển sang: " + status,
                NotificationType.MODEL_STATUS_UPDATE, "PrintingRequest", requestId);
    }

    // ── Mapping ──────────────────────────────────────────────────────────────

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
