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
 * Upload file 3D (STL/OBJ/FBX/GLTF/GLB) — lưu local, trả về URL công khai để tải về.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/files")
public class FileUploadController {

    private static final Set<String> ALLOWED = Set.of(".stl", ".obj", ".fbx", ".gltf", ".glb", ".zip");
    private static final long MAX_BYTES = 100 * 1024 * 1024L; // 100MB

    /** Tải lên file 3D (STL/OBJ/FBX/GLTF/GLB/ZIP), lưu local và trả URL công khai. POST /api/v1/files/upload */
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadFile(
            @RequestPart("file") MultipartFile file,
            HttpServletRequest request
    ) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException("Không có file");
        }
        String original = file.getOriginalFilename();
        boolean ok = original != null && ALLOWED.stream()
                .anyMatch(ext -> original.toLowerCase(Locale.ROOT).endsWith(ext));
        if (!ok) {
            throw new BusinessException("Chỉ hỗ trợ file STL, OBJ, FBX, GLTF, GLB, ZIP");
        }
        if (file.getSize() > MAX_BYTES) {
            throw new BusinessException("File vượt quá kích thước tối đa 100MB");
        }

        try {
            String safeName = original.replaceAll("[^A-Za-z0-9_.-]", "_");
            String key = "models/" + UUID.randomUUID() + "/" + safeName;
            Path target = Paths.get("uploads", key).toAbsolutePath();
            Files.createDirectories(target.getParent());
            Files.write(target, file.getBytes());

            String base = request.getScheme() + "://" + request.getServerName()
                    + (request.getServerPort() == 80 || request.getServerPort() == 443
                        ? "" : ":" + request.getServerPort());
            String url = base + "/uploads/" + key;

            log.info("3D file uploaded: {}", url);
            return ResponseEntity.ok(ApiResponse.success(
                    Map.of("url", url, "fileName", safeName), "File uploaded"));
        } catch (IOException ex) {
            throw new BusinessException("Không thể lưu file: " + ex.getMessage(), ex);
        }
    }
}
