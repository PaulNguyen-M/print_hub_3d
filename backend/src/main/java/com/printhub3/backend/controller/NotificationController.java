package com.printhub3.backend.controller;

import com.printhub3.backend.dto.response.ApiResponse;
import com.printhub3.backend.dto.response.NotificationDto;
import com.printhub3.backend.entity.Notification.NotificationType;
import com.printhub3.backend.security.service.UserDetailsImpl;
import com.printhub3.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class NotificationController {

    private final NotificationService notificationService;

    /** GET /api/v1/notifications — danh sách thông báo (phân trang). */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<NotificationDto>>> getNotifications(
            Authentication auth,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Page<NotificationDto> result = notificationService.getNotifications(
                currentUserId(auth),
                PageRequest.of(page, size, Sort.by("createdAt").descending()));
        return ResponseEntity.ok(ApiResponse.success(result, "Notifications fetched"));
    }

    /** GET /api/v1/notifications/unread-count — số thông báo chưa đọc. */
    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Map<String, Long>>> countUnread(Authentication auth) {
        long count = notificationService.countUnread(currentUserId(auth));
        return ResponseEntity.ok(ApiResponse.success(Map.of("unreadCount", count), "OK"));
    }

    /** GET /api/v1/notifications/by-type?type=ORDER_CONFIRMATION */
    @GetMapping("/by-type")
    public ResponseEntity<ApiResponse<Page<NotificationDto>>> getByType(
            Authentication auth,
            @RequestParam NotificationType type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Page<NotificationDto> result = notificationService.getByType(
                currentUserId(auth), type,
                PageRequest.of(page, size, Sort.by("createdAt").descending()));
        return ResponseEntity.ok(ApiResponse.success(result, "Notifications fetched"));
    }

    /** PUT /api/v1/notifications/{id}/read — đánh dấu đã đọc. */
    @PutMapping("/{id}/read")
    public ResponseEntity<ApiResponse<NotificationDto>> markAsRead(
            @PathVariable Long id, Authentication auth) {
        NotificationDto dto = notificationService.markAsRead(id, currentUserId(auth));
        return ResponseEntity.ok(ApiResponse.success(dto, "Marked as read"));
    }

    /** PUT /api/v1/notifications/read-all — đánh dấu tất cả đã đọc. */
    @PutMapping("/read-all")
    public ResponseEntity<ApiResponse<String>> markAllAsRead(Authentication auth) {
        notificationService.markAllAsRead(currentUserId(auth));
        return ResponseEntity.ok(ApiResponse.success("OK", "All notifications marked as read"));
    }

    /** DELETE /api/v1/notifications/{id} — xóa mềm thông báo. */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> delete(
            @PathVariable Long id, Authentication auth) {
        notificationService.deleteNotification(id, currentUserId(auth));
        return ResponseEntity.ok(ApiResponse.success("OK", "Notification deleted"));
    }

    private Long currentUserId(Authentication auth) {
        return ((UserDetailsImpl) auth.getPrincipal()).getUserId();
    }
}
