package com.printhub3.backend.controller;

import com.printhub3.backend.dto.response.ApiResponse;
import com.printhub3.backend.entity.User;
import com.printhub3.backend.repository.ProductRepository;
import com.printhub3.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    @GetMapping("/creator/stats")
    public ResponseEntity<?> getCreatorStats(Authentication auth) {
        User user = userRepository.findByEmail(auth.getName()).orElse(null);
        long totalProducts = user == null ? 0
                : productRepository.findProductsBySeller(user.getUserId(), Pageable.unpaged()).getTotalElements();

        Map<String, Object> stats = Map.of(
                "totalRevenue", 0,
                "totalOrders", 0,
                "totalDownloads", 0,
                "totalProducts", totalProducts,
                "monthlyRevenue", List.of()
        );
        return ResponseEntity.ok(ApiResponse.success(stats, "Creator stats retrieved"));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getProfile(Authentication auth) {
        return userRepository.findByEmail(auth.getName())
                .map(user -> ResponseEntity.ok(ApiResponse.success(toDto(user), "Profile retrieved")))
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(
            @RequestBody Map<String, String> body, Authentication auth) {
        return userRepository.findByEmail(auth.getName()).map(user -> {
            if (body.containsKey("fullName")) user.setFullName(body.get("fullName"));
            if (body.containsKey("phone"))    user.setPhone(body.get("phone"));
            if (body.containsKey("profileImageUrl")) user.setProfileImageUrl(body.get("profileImageUrl"));
            userRepository.save(user);
            return ResponseEntity.ok(ApiResponse.success(toDto(user), "Profile updated"));
        }).orElse(ResponseEntity.notFound().build());
    }

    private Map<String, Object> toDto(User u) {
        Map<String, Object> dto = new java.util.HashMap<>();
        dto.put("id", u.getUserId());
        dto.put("email", u.getEmail());
        dto.put("fullName", u.getFullName());
        dto.put("phone", u.getPhone() != null ? u.getPhone() : "");
        dto.put("role", u.getRole().getName());
        dto.put("profileImageUrl", u.getProfileImageUrl() != null ? u.getProfileImageUrl() : "");
        dto.put("createdAt", u.getCreatedAt() != null ? u.getCreatedAt().toString() : "");
        return dto;
    }
}
