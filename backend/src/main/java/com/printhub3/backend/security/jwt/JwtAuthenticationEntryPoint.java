package com.printhub3.backend.security.jwt;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.printhub3.backend.dto.response.ApiResponse;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.LocalDateTime;

/**
 * JwtAuthenticationEntryPoint — Xử lý truy cập chưa xác thực (lỗi 401):
 * trả về JSON lỗi thay vì trang lỗi mặc định.
 */
@Slf4j
@Component
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper;

    public JwtAuthenticationEntryPoint(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    /** Ghi log và trả JSON 401 khi request chưa được xác thực. */
    @Override
    public void commence(HttpServletRequest httpServletRequest,
                         HttpServletResponse httpServletResponse,
                         AuthenticationException e) throws IOException, ServletException {

        log.error("Responding with unauthorized error. Message - {}", e.getLocalizedMessage());

        httpServletResponse.setContentType(MediaType.APPLICATION_JSON_VALUE);
        httpServletResponse.setStatus(HttpServletResponse.SC_UNAUTHORIZED);

        final ApiResponse<Object> body = ApiResponse.builder()
                .success(false)
                .message("Unauthorized - Authentication token is missing or invalid")
                .message(e.getLocalizedMessage())
                .timestamp(LocalDateTime.now())
                .build();

        httpServletResponse.getOutputStream().println(objectMapper.writeValueAsString(body));
    }
}
