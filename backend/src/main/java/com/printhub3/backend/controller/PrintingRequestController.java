package com.printhub3.backend.controller;

import com.printhub3.backend.dto.response.ApiResponse;
import com.printhub3.backend.service.PrintingRequestService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.printhub3.backend.dto.response.PrintingRequestDto;
import org.springframework.data.domain.Page;

import java.util.Map;

/**
 * PrintingRequestController — Dịch vụ in 3D theo yêu cầu.
 * Nhận file mô hình + cấu hình in (vật liệu, màu, infill, layer, số lượng) từ người dùng,
 * lưu file và tạo yêu cầu in ở trạng thái chờ báo giá. Yêu cầu đăng nhập.
 */
@RestController
@RequestMapping("/api/v1/printing-requests")
@RequiredArgsConstructor
public class PrintingRequestController {

    private final PrintingRequestService printingRequestService;

    /** Tạo yêu cầu in 3D từ file + cấu hình (multipart). POST /api/v1/printing-requests */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<String, Object>>> create(
            @RequestPart("file") MultipartFile file,
            @RequestParam(required = false) String material,
            @RequestParam(required = false) String color,
            @RequestParam(required = false) Integer infillDensity,
            @RequestParam(required = false) Double layerHeight,
            @RequestParam(required = false, defaultValue = "1") Integer quantity,
            @RequestParam(required = false) String notes,
            Authentication authentication,
            HttpServletRequest request
    ) {
        String base = request.getScheme() + "://" + request.getServerName()
                + (request.getServerPort() == 80 || request.getServerPort() == 443
                    ? "" : ":" + request.getServerPort());
        Long id = printingRequestService.create(file, material, color, infillDensity,
                layerHeight, quantity, notes, authentication.getName(), base);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(Map.of("requestId", id, "status", "REVIEWING"),
                        "Đã gửi yêu cầu in, đang chờ báo giá"));
    }
/** Danh sách yêu cầu in của người dùng hiện tại (phân trang). GET /api/v1/printing-requests/my */
    @GetMapping("/my")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Page<PrintingRequestDto>>> myRequests(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication
    ) {
        Page<PrintingRequestDto> result = printingRequestService.getMyRequests(authentication.getName(), page, size);
        return ResponseEntity.ok(ApiResponse.success(result, "Lấy danh sách yêu cầu in thành công"));
    }

}
