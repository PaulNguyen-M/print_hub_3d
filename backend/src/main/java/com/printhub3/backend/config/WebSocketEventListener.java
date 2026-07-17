package com.printhub3.backend.config;

import com.printhub3.backend.security.service.UserDetailsImpl;
import com.printhub3.backend.service.PresenceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.security.Principal;

/**
 * WebSocketEventListener — Lắng nghe sự kiện kết nối/ngắt kết nối WebSocket để
 * cập nhật trạng thái online (PresenceService) và phát broadcast tới /topic/presence.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketEventListener {

    private final PresenceService presenceService;
    private final SimpMessagingTemplate messagingTemplate;

    /** Khi một phiên WebSocket kết nối: đánh dấu user online và báo cho mọi người. */
    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        Principal principal = accessor.getUser();
        String sessionId = accessor.getSessionId();
        if (principal != null) {
            try {
                long userId = Long.parseLong(principal.getName());
                presenceService.userConnected(userId, sessionId);
                messagingTemplate.convertAndSend("/topic/presence", java.util.Map.of("userId", userId, "online", true));
                log.debug("User {} connected (session={})", userId, sessionId);
            } catch (NumberFormatException ex) {
                log.debug("WebSocket principal name is not numeric: {}", principal.getName());
            }
        }
    }

    /** Khi một phiên ngắt kết nối: gỡ phiên và phát lại danh sách người đang online. */
    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = accessor.getSessionId();
        presenceService.userDisconnected(sessionId);
        // Broadcast current online set
        messagingTemplate.convertAndSend("/topic/presence", java.util.Map.of("onlineUsers", presenceService.getOnlineUsers()));
        log.debug("Session disconnected: {}", sessionId);
    }
}
