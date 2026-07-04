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
 * Jackson Configuration for JSON serialization/deserialization
 * Customizes ObjectMapper bean for consistent JSON handling
 */
@Configuration
public class JacksonConfig {

    /**
     * Configure ObjectMapper bean
     * - Handles Java 8 date/time types
     * - Excludes null values from serialization
     * - Fails on unknown properties during deserialization
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
