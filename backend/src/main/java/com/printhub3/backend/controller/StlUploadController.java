package com.printhub3.backend.controller;

import com.printhub3.backend.dto.response.ApiResponse;
import com.printhub3.backend.dto.response.StlUploadResponse;
import com.printhub3.backend.service.StlUploadService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Size;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;

/**
 * StlUploadController — Tải file STL lên S3 và lưu metadata mô hình.
 * (Phục vụ tính năng xem/lưu mô hình; khác với FileUploadController lưu local.)
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/stl")
@Tag(name = "STL Upload", description = "Upload STL files to S3 and store metadata")
@Validated
public class StlUploadController {

    private final StlUploadService stlUploadService;

    @Autowired
    public StlUploadController(StlUploadService stlUploadService) {
        this.stlUploadService = stlUploadService;
    }

    /** Tải một file STL lên S3 kèm metadata (tiêu đề, mô tả, vật liệu, màu). POST /api/v1/stl/upload */
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload an STL file", description = "Upload an STL file to S3 and save model metadata")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "STL file uploaded successfully",
                    content = @Content(schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid upload request"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "Upload failed")
    })
    public ResponseEntity<ApiResponse<StlUploadResponse>> uploadStl(
            @RequestPart("file") MultipartFile file,
            @RequestParam(value = "title", required = false) @Size(max = 255) String title,
            @RequestParam(value = "description", required = false) @Size(max = 1024) String description,
            @RequestParam(value = "material", required = false) @Size(max = 100) String material,
            @RequestParam(value = "color", required = false) @Size(max = 50) String color,
            Principal principal
    ) {
        log.info("Received STL upload request: {}", file.getOriginalFilename());

        StlUploadResponse response = stlUploadService.uploadStlFile(
                file,
                title,
                description,
                material,
                color,
                principal != null ? principal.getName() : null
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.created(response, "STL file uploaded successfully"));
    }
}
