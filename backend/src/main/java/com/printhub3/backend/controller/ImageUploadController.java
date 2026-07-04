package com.printhub3.backend.controller;

import com.printhub3.backend.dto.response.ApiResponse;
import com.printhub3.backend.exception.BusinessException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Upload ảnh (avatar, ảnh sản phẩm) — lưu local và trả về URL công khai.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/images")
public class ImageUploadController {

    private static final Set<String> ALLOWED = Set.of(".jpg", ".jpeg", ".png", ".webp", ".gif");
    private static final long MAX_BYTES = 10 * 1024 * 1024L; // 10MB

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadImage(
            @RequestPart("file") MultipartFile file,
            HttpServletRequest request
    ) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException("Không có file ảnh");
        }
        String original = file.getOriginalFilename();
        boolean ok = original != null && ALLOWED.stream()
                .anyMatch(ext -> original.toLowerCase(Locale.ROOT).endsWith(ext));
        if (!ok) {
            throw new BusinessException("Chỉ hỗ trợ ảnh JPG, PNG, WEBP, GIF");
        }
        if (file.getSize() > MAX_BYTES) {
            throw new BusinessException("Ảnh vượt quá kích thước tối đa 10MB");
        }

        try {
            String safeName = original.replaceAll("[^A-Za-z0-9_.-]", "_");
            String key = "images/" + UUID.randomUUID() + "/" + safeName;
            Path target = Paths.get("uploads", key).toAbsolutePath();
            Files.createDirectories(target.getParent());
            Files.write(target, file.getBytes());

            // Xây URL công khai: http(s)://host[:port]/uploads/<key>
            String base = request.getScheme() + "://" + request.getServerName()
                    + (request.getServerPort() == 80 || request.getServerPort() == 443
                        ? "" : ":" + request.getServerPort());
            String url = base + "/uploads/" + key;

            log.info("Image uploaded: {}", url);
            return ResponseEntity.ok(ApiResponse.success(Map.of("url", url), "Image uploaded"));
        } catch (IOException ex) {
            throw new BusinessException("Không thể lưu ảnh: " + ex.getMessage(), ex);
        }
    }
}
