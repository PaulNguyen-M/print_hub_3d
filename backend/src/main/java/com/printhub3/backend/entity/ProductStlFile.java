package com.printhub3.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * ProductStlFile Entity - One STL/3D file belonging to a product. A model with
 * multiple parts has multiple files; on download they are bundled into a ZIP.
 */
@Entity
@Table(name = "product_stl_files", indexes = {
    @Index(name = "idx_product_stl_files_product_id", columnList = "product_id")
})
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
public class ProductStlFile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "product_stl_file_id")
    private Long productStlFileId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "file_url", nullable = false, columnDefinition = "TEXT")
    private String fileUrl;

    @Column(name = "file_name", length = 255)
    private String fileName;

    @Column(name = "display_order")
    @Builder.Default
    private Integer displayOrder = 0;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
