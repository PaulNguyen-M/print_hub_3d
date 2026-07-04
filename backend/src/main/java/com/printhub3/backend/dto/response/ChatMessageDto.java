package com.printhub3.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessageDto {
    private Long messageId;
    private Long senderId;
    private Long recipientId;
    private String content;
    private String messageStatus;
    private LocalDateTime createdAt;
}
