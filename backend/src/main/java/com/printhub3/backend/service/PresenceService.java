package com.printhub3.backend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
@Slf4j
public class PresenceService {

    // Map userId -> sessionId(s)
    private final Map<Long, Set<String>> onlineUsers = new ConcurrentHashMap<>();
    private final Map<String, Long> sessionToUser = new ConcurrentHashMap<>();

    public void userConnected(Long userId, String sessionId) {
        onlineUsers.compute(userId, (k, v) -> {
            if (v == null) v = Collections.newSetFromMap(new ConcurrentHashMap<>());
            v.add(sessionId);
            return v;
        });
        sessionToUser.put(sessionId, userId);
        log.debug("User {} connected with session {}", userId, sessionId);
    }

    public void userDisconnected(String sessionId) {
        Long userId = sessionToUser.remove(sessionId);
        if (userId != null) {
            Set<String> sessions = onlineUsers.get(userId);
            if (sessions != null) {
                sessions.remove(sessionId);
                if (sessions.isEmpty()) {
                    onlineUsers.remove(userId);
                }
            }
            log.debug("User {} disconnected session {}", userId, sessionId);
        }
    }

    public boolean isOnline(Long userId) {
        return onlineUsers.containsKey(userId);
    }

    public Set<Long> getOnlineUsers() {
        return onlineUsers.keySet().stream().collect(Collectors.toSet());
    }
}
