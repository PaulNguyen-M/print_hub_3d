package com.printhub3.backend.service;

import com.printhub3.backend.dto.response.StlUploadResponse;
import com.printhub3.backend.entity.StlUpload;
import com.printhub3.backend.exception.BusinessException;
import com.printhub3.backend.repository.StlUploadRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.ObjectCannedACL;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

/**
 * Service for storing STL uploads in AWS S3 and metadata persistence.
 */
@Service
public class StlUploadService {

    private final S3Client s3Client;
    private final StlUploadRepository repository;
    private final String bucketName;
    private final String s3Folder;
    private final String region;
    private final String endpoint;

    public StlUploadService(
            S3Client s3Client,
            StlUploadRepository repository,
            @Value("${aws.s3.bucket-name}") String bucketName,
            @Value("${aws.s3.folder.uploads:uploads/}") String s3Folder,
            @Value("${aws.s3.region:us-east-1}") String region,
            @Value("${aws.s3.endpoint:}") String endpoint
    ) {
        this.s3Client = s3Client;
        this.repository = repository;
        this.bucketName = bucketName;
        this.s3Folder = s3Folder.endsWith("/") ? s3Folder : s3Folder + "/";
        this.region = region;
        this.endpoint = endpoint;
    }

    @Transactional
    public StlUploadResponse uploadStlFile(
            MultipartFile file,
            String title,
            String description,
            String material,
            String color,
            String uploadedBy
    ) {
        validateUpload(file);

        String filename = sanitizeFilename(file.getOriginalFilename());
        String objectKey = buildObjectKey(filename);
        String contentType = getContentType(file);
        long fileSize = file.getSize();

        try {
            // Đọc toàn bộ bytes MỘT LẦN để dùng cho cả S3 lẫn local (tránh consume stream 2 lần)
            byte[] bytes = file.getBytes();

            String s3Url;
            try {
                // Thử upload lên S3
                PutObjectRequest request = PutObjectRequest.builder()
                        .bucket(bucketName)
                        .key(objectKey)
                        .contentType(contentType)
                        .contentLength(fileSize)
                        .acl(ObjectCannedACL.PUBLIC_READ)
                        .build();
                s3Client.putObject(request, RequestBody.fromBytes(bytes));
                s3Url = buildS3Url(objectKey);
            } catch (Exception s3Ex) {
                // S3 chưa cấu hình / lỗi → fallback lưu file local cho môi trường dev
                s3Url = storeLocally(bytes, objectKey);
            }

            String sha256 = calculateSha256(bytes);

            StlUpload metadata = StlUpload.builder()
                    .fileName(filename)
                    .s3Url(s3Url)
                    .s3Key(objectKey)
                    .contentType(contentType)
                    .fileSize(fileSize)
                    .sha256Checksum(sha256)
                    .title(normalizeString(title))
                    .description(normalizeString(description))
                    .material(normalizeString(material))
                    .color(normalizeString(color))
                    .uploadedBy(normalizeString(uploadedBy))
                    .build();

            StlUpload saved = repository.save(metadata);

            return StlUploadResponse.builder()
                    .uploadId(saved.getUploadId())
                    .fileName(saved.getFileName())
                    .s3Url(saved.getS3Url())
                    .s3Key(saved.getS3Key())
                    .contentType(saved.getContentType())
                    .fileSize(saved.getFileSize())
                    .sha256Checksum(saved.getSha256Checksum())
                    .title(saved.getTitle())
                    .description(saved.getDescription())
                    .material(saved.getMaterial())
                    .color(saved.getColor())
                    .uploadedBy(saved.getUploadedBy())
                    .uploadedAt(saved.getUploadedAt().format(DateTimeFormatter.ISO_DATE_TIME))
                    .build();
        } catch (IOException | NoSuchAlgorithmException | S3Exception ex) {
            throw new BusinessException("Failed to upload STL file: " + ex.getMessage(), ex);
        }
    }

    private static final Set<String> ALLOWED_EXT = Set.of(".stl", ".obj", ".fbx", ".gltf", ".glb");

    private void validateUpload(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException("No file provided for upload");
        }

        String filename = file.getOriginalFilename();
        boolean ok = filename != null && ALLOWED_EXT.stream()
                .anyMatch(ext -> filename.toLowerCase(Locale.ROOT).endsWith(ext));
        if (!ok) {
            throw new BusinessException("Chỉ hỗ trợ file STL, OBJ, FBX, GLTF, GLB");
        }

        long maxBytes = 100 * 1024 * 1024L; // 100 MB
        if (file.getSize() > maxBytes) {
            throw new BusinessException("File vượt quá kích thước tối đa 100MB");
        }
    }

    /** Lưu file vào thư mục local khi S3 không khả dụng (môi trường dev). */
    private String storeLocally(byte[] bytes, String objectKey) {
        try {
            Path target = Paths.get("uploads", objectKey).toAbsolutePath();
            Files.createDirectories(target.getParent());
            Files.write(target, bytes);
            return "/local-uploads/" + objectKey;
        } catch (IOException ex) {
            throw new BusinessException("Không thể lưu file: " + ex.getMessage(), ex);
        }
    }

    private String sanitizeFilename(String originalName) {
        if (originalName == null) {
            return "model.stl";
        }
        return originalName.replaceAll("[^A-Za-z0-9_.-]", "_");
    }

    private String buildObjectKey(String filename) {
        return s3Folder + UUID.randomUUID() + "/" + filename;
    }

    private String buildS3Url(String objectKey) {
        if (endpoint != null && !endpoint.isBlank()) {
            String trimmedEndpoint = endpoint.endsWith("/") ? endpoint.substring(0, endpoint.length() - 1) : endpoint;
            return String.format("%s/%s/%s", trimmedEndpoint, bucketName, objectKey);
        }
        return String.format("https://%s.s3.%s.amazonaws.com/%s", bucketName, region, objectKey);
    }

    private String getContentType(MultipartFile file) {
        String contentType = file.getContentType();
        return contentType != null && !contentType.isBlank() ? contentType : "application/octet-stream";
    }

    private String normalizeString(String value) {
        return value != null && !value.isBlank() ? value.trim() : null;
    }

    private String calculateSha256(byte[] bytes) throws NoSuchAlgorithmException {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hash = digest.digest(bytes);
        StringBuilder builder = new StringBuilder();
        for (byte b : hash) {
            builder.append(String.format("%02x", b));
        }
        return builder.toString();
    }
}
