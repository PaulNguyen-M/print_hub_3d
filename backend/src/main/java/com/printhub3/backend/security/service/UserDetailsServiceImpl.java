package com.printhub3.backend.security.service;

import com.printhub3.backend.entity.User;
import com.printhub3.backend.exception.ResourceNotFoundException;
import com.printhub3.backend.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * UserDetailsService Implementation
 * Loads user details from database for Spring Security authentication
 */
@Slf4j
@Service
@Transactional
public class UserDetailsServiceImpl implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    /**
     * Load user by username (email in this case)
     * Used by Spring Security for authentication
     */
    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        log.debug("Loading user by username: {}", username);

        User user = userRepository.findByEmail(username)
                .orElseThrow(() -> {
                    log.error("User not found with email: {}", username);
                    return new UsernameNotFoundException("User not found with email: " + username);
                });

        // Check if user is active
        if (user.getIsActive() == null || !user.getIsActive()) {
            log.warn("User account is inactive: {}", username);
            throw new UsernameNotFoundException("User account is inactive");
        }

        log.debug("Successfully loaded user: {}", username);
        return UserDetailsImpl.build(user);
    }

    /**
     * Load user by user ID
     */
    @Transactional(readOnly = true)
    public UserDetails loadUserById(Long userId) {
        log.debug("Loading user by ID: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        return UserDetailsImpl.build(user);
    }
}
