package com.printhub3.backend.controller;

import com.printhub3.backend.dto.response.ChatMessageDto;
import com.printhub3.backend.dto.response.ConversationDto;
import com.printhub3.backend.security.service.UserDetailsImpl;
import com.printhub3.backend.service.ChatService;
import com.printhub3.backend.service.PresenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;

/**
 * ChatRestController — API REST cho chat (đọc dữ liệu lịch sử + trạng thái online).
 * Việc gửi/nhận tin nhắn realtime do ChatController (WebSocket) đảm nhận.
 */
@RestController
@RequestMapping("/api/v1/chat")
@RequiredArgsConstructor
public class ChatRestController {

    private final ChatService chatService;
    private final PresenceService presenceService;

    /** Danh sách cuộc hội thoại của người dùng hiện tại. */
    @GetMapping("/conversations")
    public ResponseEntity<List<ConversationDto>> getConversations() {
        return ResponseEntity.ok(chatService.getConversations(getCurrentUserId()));
    }

    /** Toàn bộ tin nhắn giữa người dùng hiện tại và một người khác. */
    @GetMapping("/conversation/{otherUserId}")
    public ResponseEntity<List<ChatMessageDto>> getConversation(@PathVariable Long otherUserId) {
        Long currentUserId = getCurrentUserId();
        return ResponseEntity.ok(chatService.getConversation(currentUserId, otherUserId));
    }

    /** Tập id người dùng đang online (để hiện chấm xanh). */
    @GetMapping("/presence")
    public ResponseEntity<Set<Long>> getOnlineUsers() {
        return ResponseEntity.ok(presenceService.getOnlineUsers());
    }

    /** Lấy id người dùng hiện tại từ SecurityContext. */
    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalStateException("User not authenticated");
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof UserDetailsImpl userDetails) {
            return userDetails.getUserId();
        }
        throw new IllegalStateException("Unable to resolve current user ID");
    }
}
