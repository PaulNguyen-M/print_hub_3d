package com.printhub3.backend.config;

import org.mapstruct.MapperConfig;
import org.mapstruct.MappingConstants;
import org.mapstruct.ReportingPolicy;
import org.springframework.context.annotation.Configuration;

/**
 * MapStructConfig — Cấu hình MapStruct: quy tắc mapping chung cho mọi mapper
 * (component kiểu Spring, cảnh báo nếu có field chưa được ánh xạ).
 */
@Configuration
@MapperConfig(
        componentModel = MappingConstants.ComponentModel.SPRING,
        unmappedTargetPolicy = ReportingPolicy.WARN,
        unmappedSourcePolicy = ReportingPolicy.WARN
)
public class MapStructConfig {
}
