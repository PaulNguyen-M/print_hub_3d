package com.printhub3.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for STL upload response metadata
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StlUploadResponse {

    private Long uploadId;
    private String fileName;
    private String s3Url;
    private String s3Key;
    private String contentType;
    private Long fileSize;
    private String sha256Checksum;
    private String title;
    private String description;
    private String material;
    private String color;
    private String uploadedBy;
    private String uploadedAt;
}
