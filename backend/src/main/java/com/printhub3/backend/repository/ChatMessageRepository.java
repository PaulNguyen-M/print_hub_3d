package com.printhub3.backend.repository;

import com.printhub3.backend.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    @Query("SELECT m FROM ChatMessage m WHERE (m.senderId = ?1 AND m.recipientId = ?2) OR (m.senderId = ?2 AND m.recipientId = ?1) ORDER BY m.createdAt ASC")
    List<ChatMessage> findConversation(Long userA, Long userB);

    /** All messages involving the user, newest first — used to build the inbox. */
    @Query("SELECT m FROM ChatMessage m WHERE m.senderId = ?1 OR m.recipientId = ?1 ORDER BY m.createdAt DESC")
    List<ChatMessage> findAllForUser(Long userId);

}
