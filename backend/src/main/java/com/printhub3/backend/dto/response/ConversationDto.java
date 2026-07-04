package com.printhub3.backend.dto.response;

import lombok.*;

import java.time.LocalDateTime;

/**
 * One conversation in a user's inbox: the other participant + last message preview.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConversationDto {
    private Long peerId;
    private String peerName;
    private String peerAvatarUrl;
    private String lastMessage;
    private Long lastSenderId;
    private LocalDateTime lastMessageAt;
    private long unreadCount;
}
