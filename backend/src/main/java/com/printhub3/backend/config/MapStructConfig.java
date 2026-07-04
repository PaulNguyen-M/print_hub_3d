package com.printhub3.backend.config;

import org.mapstruct.MapperConfig;
import org.mapstruct.MappingConstants;
import org.mapstruct.ReportingPolicy;
import org.springframework.context.annotation.Configuration;

/**
 * MapStruct Configuration
 * Defines global mapping rules for all mappers
 */
@Configuration
@MapperConfig(
        componentModel = MappingConstants.ComponentModel.SPRING,
        unmappedTargetPolicy = ReportingPolicy.WARN,
        unmappedSourcePolicy = ReportingPolicy.WARN
)
public class MapStructConfig {
}
