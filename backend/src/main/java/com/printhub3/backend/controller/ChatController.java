package com.printhub3.backend.controller;

import com.printhub3.backend.dto.request.ChatMessageRequest;
import com.printhub3.backend.dto.response.ChatMessageDto;
import com.printhub3.backend.entity.ChatMessage;
import com.printhub3.backend.security.service.UserDetailsImpl;
import com.printhub3.backend.service.ChatService;
import com.printhub3.backend.service.PresenceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.Map;

/**
 * ChatController — Xử lý chat realtime qua WebSocket/STOMP.
 * Gồm: gửi tin nhắn (/chat.send), báo đang gõ (/chat.typing), báo đã đọc (/chat.read).
 * Việc đọc lịch sử/danh sách hội thoại do ChatRestController (REST) đảm nhận.
 */
@Controller
@RequiredArgsConstructor
@Slf4j
public class ChatController {

    private final SimpMessagingTemplate messagingTemplate;
    private final ChatService chatService;
    private final PresenceService presenceService;

    /** Nhận & lưu tin nhắn, đẩy tới hàng đợi của người nhận + người gửi + cập nhật presence. */
    @MessageMapping("/chat.send")
    public void sendMessage(@Payload ChatMessageRequest request, Principal principal, SimpMessageHeaderAccessor headerAccessor) {
        Long senderId;
        if (principal instanceof Authentication authentication && authentication.getPrincipal() instanceof UserDetailsImpl userDetails) {
            senderId = userDetails.getUserId();
        } else {
            throw new IllegalStateException("Unauthenticated user cannot send messages");
        }

        ChatMessage message = ChatMessage.builder()
                .senderId(senderId)
                .recipientId(request.getRecipientId())
                .content(request.getContent())
                .messageStatus("SENT")
                .build();

        ChatMessageDto saved = chatService.saveMessage(message);

        // send to recipient personal queue
        messagingTemplate.convertAndSendToUser(
                String.valueOf(request.getRecipientId()),
                "/queue/messages",
                saved
        );

        // send to sender confirmation queue
        messagingTemplate.convertAndSendToUser(
                String.valueOf(senderId),
                "/queue/messages",
                saved
        );

        // notify presence channel
        messagingTemplate.convertAndSend(
                "/topic/presence",
                Map.of("userId", senderId, "online", presenceService.isOnline(senderId))
        );

        log.debug("Message sent from {} to {}", senderId, request.getRecipientId());
    }

    /** Báo trạng thái "đang gõ" tới người nhận. */
    @MessageMapping("/chat.typing")
    public void typing(@Payload Map<String, Object> payload, Principal principal) {
        Long senderId = extractUserId(principal);
        Long recipientId = Long.valueOf(String.valueOf(payload.get("recipientId")));
        Boolean typing = Boolean.valueOf(String.valueOf(payload.get("typing")));

        messagingTemplate.convertAndSendToUser(String.valueOf(recipientId), "/queue/typing", Map.of("senderId", senderId, "typing", typing));
    }

    /** Đánh dấu một tin nhắn đã đọc và báo lại cho người gửi. */
    @MessageMapping("/chat.read")
    public void readReceipt(@Payload Map<String, Object> payload, Principal principal) {
        Long userId = extractUserId(principal);
        Long messageId = Long.valueOf(String.valueOf(payload.get("messageId")));

        ChatMessageDto updated = chatService.markMessageRead(messageId);

        // notify original sender
        messagingTemplate.convertAndSendToUser(String.valueOf(updated.getSenderId()), "/queue/read", Map.of("messageId", updated.getMessageId(), "readerId", userId));
    }

    /** Lấy id người dùng từ Principal của phiên WebSocket. */
    private Long extractUserId(Principal principal) {
        if (principal instanceof Authentication authentication && authentication.getPrincipal() instanceof UserDetailsImpl userDetails) {
            return userDetails.getUserId();
        }
        throw new IllegalStateException("Unable to resolve current user ID");
    }
}
