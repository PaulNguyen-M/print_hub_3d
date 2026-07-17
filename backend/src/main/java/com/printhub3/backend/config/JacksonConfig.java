package com.printhub3.backend.config;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import java.text.SimpleDateFormat;

/**
 * JacksonConfig — Cấu hình Jackson cho việc chuyển đổi JSON.
 * Tùy chỉnh bean ObjectMapper để xử lý JSON nhất quán toàn hệ thống.
 */
@Configuration
public class JacksonConfig {

    /**
     * Bean ObjectMapper dùng chung:
     * - Hỗ trợ kiểu ngày/giờ Java 8; ghi ngày dạng ISO thay vì timestamp.
     * - Bỏ qua field null khi serialize.
     * - Không lỗi khi gặp field lạ lúc deserialize; dùng BigDecimal cho số thực.
     */
    @Bean
    @Primary
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();

        // Register Java 8 Time Module
        mapper.registerModule(new JavaTimeModule());

        // Serialization features
        mapper.setSerializationInclusion(JsonInclude.Include.NON_NULL);
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        mapper.setDateFormat(new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'"));

        // Deserialization features
        mapper.disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES);
        mapper.enable(DeserializationFeature.USE_BIG_DECIMAL_FOR_FLOATS);

        return mapper;
    }
}
