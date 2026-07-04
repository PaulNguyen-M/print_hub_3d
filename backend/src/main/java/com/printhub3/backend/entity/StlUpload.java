package com.printhub3.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Metadata for uploaded STL files
 */
@Entity
@Table(name = "stl_uploads", indexes = {
    @Index(name = "idx_stl_uploads_s3_key", columnList = "s3_key"),
    @Index(name = "idx_stl_uploads_file_name", columnList = "file_name")
})
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
public class StlUpload {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "upload_id")
    private Long uploadId;

    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    @Column(name = "file_url", nullable = false, columnDefinition = "TEXT")
    private String s3Url;

    @Column(name = "s3_key", nullable = false, length = 512)
    private String s3Key;

    @Column(name = "content_type", length = 128)
    private String contentType;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "sha256_checksum", length = 128)
    private String sha256Checksum;

    @Column(name = "title", length = 255)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "material", length = 100)
    private String material;

    @Column(name = "color", length = 50)
    private String color;

    @Column(name = "uploaded_by", length = 255)
    private String uploadedBy;

    @CreationTimestamp
    @Column(name = "uploaded_at", nullable = false, updatable = false)
    private LocalDateTime uploadedAt;
}
