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
 * WebSocketConfig — Cấu hình WebSocket/STOMP cho realtime (chat & thông báo).
 * Khai báo message broker, endpoint /ws và gắn interceptor xác thực JWT.
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final StompAuthChannelInterceptor stompAuthChannelInterceptor;

    public WebSocketConfig(StompAuthChannelInterceptor stompAuthChannelInterceptor) {
        this.stompAuthChannelInterceptor = stompAuthChannelInterceptor;
    }

    /** Gắn interceptor xác thực JWT vào kênh tin nhắn đến từ client. */
    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(stompAuthChannelInterceptor);
    }

    /**
     * Cấu hình message broker:
     * - Bật broker đơn giản với /topic và /queue để phát tin.
     * - Prefix /app cho tin nhắn gửi lên từ client.
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
     * Đăng ký endpoint STOMP /ws (kèm SockJS) và các origin được phép kết nối.
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

    /** Bộ lập lịch cho heartbeat của WebSocket. */
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
