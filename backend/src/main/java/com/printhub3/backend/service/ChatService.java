package com.printhub3.backend.service;

import com.printhub3.backend.exception.ResourceNotFoundException;

import com.printhub3.backend.dto.response.ChatMessageDto;
import com.printhub3.backend.dto.response.ConversationDto;
import com.printhub3.backend.entity.ChatMessage;
import com.printhub3.backend.entity.User;
import com.printhub3.backend.repository.ChatMessageRepository;
import com.printhub3.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * ChatService — Nghiệp vụ chat: dựng hộp thư, lấy hội thoại, lưu và đánh dấu đã đọc tin nhắn.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;

    /** Dựng hộp thư của người dùng: mỗi người đối thoại một dòng, kèm tin nhắn mới nhất + số chưa đọc. */
    @Transactional(readOnly = true)
    public List<ConversationDto> getConversations(Long userId) {
        List<ChatMessage> all = chatMessageRepository.findAllForUser(userId); // mới nhất trước
        Map<Long, ChatMessage> latestByPeer = new LinkedHashMap<>();
        Map<Long, Long> unreadByPeer = new java.util.HashMap<>();
        for (ChatMessage m : all) {
            Long peer = m.getSenderId().equals(userId) ? m.getRecipientId() : m.getSenderId();
            latestByPeer.putIfAbsent(peer, m);
            boolean incomingUnread = m.getRecipientId().equals(userId)
                    && !"READ".equalsIgnoreCase(m.getMessageStatus());
            if (incomingUnread) {
                unreadByPeer.merge(peer, 1L, Long::sum);
            }
        }

        List<ConversationDto> result = new ArrayList<>();
        for (Map.Entry<Long, ChatMessage> e : latestByPeer.entrySet()) {
            Long peerId = e.getKey();
            ChatMessage last = e.getValue();
            User peer = userRepository.findById(peerId).orElse(null);
            result.add(ConversationDto.builder()
                    .peerId(peerId)
                    .peerName(peer != null ? peer.getFullName() : "User " + peerId)
                    .peerAvatarUrl(peer != null ? peer.getProfileImageUrl() : null)
                    .lastMessage(last.getContent())
                    .lastSenderId(last.getSenderId())
                    .lastMessageAt(last.getCreatedAt())
                    .unreadCount(unreadByPeer.getOrDefault(peerId, 0L))
                    .build());
        }
        return result;
    }

    /** Lưu một tin nhắn mới và trả về DTO. */
    public ChatMessageDto saveMessage(ChatMessage message) {
        ChatMessage saved = chatMessageRepository.save(message);
        return mapToDto(saved);
    }

    /** Lấy toàn bộ tin nhắn giữa hai người dùng. */
    public List<ChatMessageDto> getConversation(Long userA, Long userB) {
        return chatMessageRepository.findConversation(userA, userB)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    /** Đánh dấu một tin nhắn là đã đọc. */
    public ChatMessageDto markMessageRead(Long messageId) {
        ChatMessage message = chatMessageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));
        message.setMessageStatus("READ");
        ChatMessage saved = chatMessageRepository.save(message);
        return mapToDto(saved);
    }

    /** Chuyển entity ChatMessage sang DTO trả về frontend. */
    private ChatMessageDto mapToDto(ChatMessage message) {
        return ChatMessageDto.builder()
                .messageId(message.getMessageId())
                .senderId(message.getSenderId())
                .recipientId(message.getRecipientId())
                .content(message.getContent())
                .messageStatus(message.getMessageStatus())
                .createdAt(message.getCreatedAt())
                .build();
    }
}
