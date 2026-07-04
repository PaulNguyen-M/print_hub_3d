package com.printhub3.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;

/**
 * WebSocket Configuration for real-time messaging
 * Handles chat messages and real-time notifications
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final StompAuthChannelInterceptor stompAuthChannelInterceptor;

    public WebSocketConfig(StompAuthChannelInterceptor stompAuthChannelInterceptor) {
        this.stompAuthChannelInterceptor = stompAuthChannelInterceptor;
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(stompAuthChannelInterceptor);
    }

    /**
     * Configure the message broker
     * - Enables simple message broker with /topic for broadcasting
     * - Allows /app for incoming messages
     */
    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config
                .enableSimpleBroker("/topic", "/queue")
                .setHeartbeatValue(new long[]{25000, 25000})
                .setTaskScheduler(taskScheduler());
        
        config.setApplicationDestinationPrefixes("/app");
    }

    /**
     * Register WebSocket STOMP endpoint
     * - Endpoint: /ws for WebSocket connections
     * - Allowed origins for cross-origin connections
     */
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry
                .addEndpoint("/ws")
                .setAllowedOrigins(
                        "http://localhost:3000",
                        "http://localhost:5173"
                )
                .withSockJS();
    }

    @Bean
    public TaskScheduler taskScheduler() {

        ThreadPoolTaskScheduler scheduler =
                new ThreadPoolTaskScheduler();

        scheduler.setPoolSize(1);

        scheduler.setThreadNamePrefix(
                "websocket-heartbeat-thread-"
        );

        scheduler.initialize();

        return scheduler;
    }
}
