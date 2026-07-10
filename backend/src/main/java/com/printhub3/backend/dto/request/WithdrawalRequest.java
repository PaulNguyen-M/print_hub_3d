package com.printhub3.backend.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.math.BigDecimal;

/**
 * Request body for a seller asking to withdraw money from their shop wallet.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WithdrawalRequest {

    @NotNull(message = "Vui lòng nhập số tiền cần rút")
    @DecimalMin(value = "50000", message = "Số tiền rút tối thiểu là 50.000đ")
    private BigDecimal amount;

    @Size(max = 120, message = "Tên ngân hàng tối đa 120 ký tự")
    private String bankName;

    @Size(max = 60, message = "Số tài khoản tối đa 60 ký tự")
    private String bankAccountNumber;

    @Size(max = 150, message = "Tên chủ tài khoản tối đa 150 ký tự")
    private String bankAccountName;

    @Size(max = 500, message = "Ghi chú tối đa 500 ký tự")
    private String note;
}
