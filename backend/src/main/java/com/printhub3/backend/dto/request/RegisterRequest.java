package com.printhub3.backend.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegisterRequest {

    @NotBlank(message = "Email là bắt buộc")
    @Email(message = "Email không hợp lệ")
    private String email;

    @NotBlank(message = "Mật khẩu là bắt buộc")
    @Size(min = 6, max = 72, message = "Mật khẩu từ 6-72 ký tự")
    @Pattern(
        regexp = "^(?=.*[A-Za-z])(?=.*\\d).+$",
        message = "Mật khẩu cần có ít nhất 1 chữ cái và 1 chữ số"
    )
    private String password;

    @NotBlank(message = "Họ tên là bắt buộc")
    @Size(min = 2, max = 50, message = "Họ tên từ 2-50 ký tự")
    private String fullName;

    private String phone;

    // Optional — defaults to BUYER in AuthenticationService
    private String role;
}
