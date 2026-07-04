package com.printhub3.backend.config;

import com.printhub3.backend.security.jwt.JwtTokenProvider;
import com.printhub3.backend.security.service.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * Authenticates STOMP connections from the JWT sent in the CONNECT frame's
 * Authorization header. Sets the session principal so that
 * {@code convertAndSendToUser(userId, ...)} routes correctly — the principal's
 * name is the user's id (string), while its principal object is the
 * {@link UserDetailsImpl} so message handlers can read the user id.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class StompAuthChannelInterceptor implements ChannelInterceptor {

    private final JwtTokenProvider tokenProvider;
    private final UserDetailsService userDetailsService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor =
                MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            String bearer = accessor.getFirstNativeHeader("Authorization");
            String jwt = tokenProvider.extractTokenFromBearer(bearer);

            if (StringUtils.hasText(jwt) && tokenProvider.validateToken(jwt)) {
                String username = tokenProvider.getUserNameFromJwt(jwt);
                UserDetailsImpl userDetails =
                        (UserDetailsImpl) userDetailsService.loadUserByUsername(username);
                final String principalName = String.valueOf(userDetails.getUserId());

                UsernamePasswordAuthenticationToken auth =
                        new UsernamePasswordAuthenticationToken(
                                userDetails, null, userDetails.getAuthorities()) {
                            @Override
                            public String getName() {
                                return principalName; // route /user/{userId}/queue/...
                            }
                        };
                accessor.setUser(auth);
                log.debug("STOMP authenticated user {}", principalName);
            } else {
                log.warn("STOMP CONNECT without a valid JWT");
            }
        }
        return message;
    }
}
