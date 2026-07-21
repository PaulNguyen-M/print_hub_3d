package com.printhub3.backend.service;

import com.printhub3.backend.entity.PrintingRequest;
import com.printhub3.backend.entity.User;
import com.printhub3.backend.exception.BusinessException;
import com.printhub3.backend.exception.ResourceNotFoundException;
import com.printhub3.backend.repository.PrintingRequestRepository;
import com.printhub3.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import com.printhub3.backend.dto.response.PrintingRequestDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

/**
 * Tạo yêu cầu in 3D từ file người dùng tải lên.
 */
@Service
@RequiredArgsConstructor
public class PrintingRequestService {
    
    private static final Set<String> ALLOWED = Set.of(".stl", ".obj", ".fbx", ".gltf", ".glb");
    private static final long MAX_BYTES = 100 * 1024 * 1024L; //100MB

    private final PrintingRequestRepository printingRequestRepository;
    private final UserRepository userRepository;

    @Transactional
    public Long create(MultipartFile file, String material, String color,
                        Integer infillDensity, Double layerHeight, Integer quantity,
                        String notes, String username, String baseUrl) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException("Không có file");
        }
        String original = file.getOriginalFilename();
        boolean ok = original != null && ALLOWED.stream()
                .anyMatch(ext -> original.toLowerCase(Locale.ROOT).endsWith(ext));
        if (!ok) {
            throw new BusinessException("Chỉ hỗ trợ file STL, OBJ, FBX, GLTF, GLB");
        }
        if (file.getSize() > MAX_BYTES) {
            throw new BusinessException("File vượt quá kích thước tối đa 100MB");
        }
        User user = userRepository.findByEmail(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", username));

        // Lưu file vào uploads/models/<uuid>/<tên-an-toàn>
        String safeName = original.replaceAll("[^A-Za-z0-9_.-]", "_");
        String key = "models/" + UUID.randomUUID() + "/" + safeName;
        try {
            Path target = Paths.get("uploads", key).toAbsolutePath();
            Files.createDirectories(target.getParent());
            Files.write(target, file.getBytes());
        } catch (IOException ex) {
            throw new BusinessException("Không thể lưu file: " + ex.getMessage(), ex);
        }

        String fileUrl = baseUrl + "/uploads/" + key;
        String format = original.contains(".")
                ? original.substring(original.lastIndexOf('.') + 1).toUpperCase()
                : null;
        int qty = quantity != null ? quantity : 1;
        String requirements = String.format(
                "Vật liệu: %s | Màu: %s | Infill: %s%% | Layer: %smm | Số lượng: %d",
                material, color, infillDensity, layerHeight, qty);

        PrintingRequest req = PrintingRequest.builder()
                .user(user)
                .fileName(safeName)
                .fileUrl(fileUrl)
                .fileSize(file.getSize())
                .fileFormat(format)
                .modelStatus(PrintingRequest.ModelStatus.REVIEWING)
                .description(notes)
                .requirements(requirements)
                .build();

        return printingRequestRepository.save(req).getRequestId();
    }
        /** Danh sách yêu cầu in của chính người dùng, mới nhất trước (phân trang). */
    @Transactional(readOnly = true)
    public Page<PrintingRequestDto> getMyRequests(String username, int page, int size) {
        User user = userRepository.findByEmail(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", username));
        return printingRequestRepository
                .findRequestsByUserId(user.getUserId(), PageRequest.of(page, size))
                .map(this::toDto);
    }

    /** Chuyển entity sang DTO cho khách xem. */
    private PrintingRequestDto toDto(PrintingRequest r) {
        return PrintingRequestDto.builder()
                .requestId(r.getRequestId())
                .fileName(r.getFileName())
                .fileUrl(r.getFileUrl())
                .fileFormat(r.getFileFormat())
                .fileSize(r.getFileSize())
                .modelStatus(r.getModelStatus().name())
                .quoteAmount(r.getQuoteAmount())
                .quoteNotes(r.getQuoteNotes())
                .requirements(r.getRequirements())
                .createdAt(r.getCreatedAt())
                .build();
    }

}
