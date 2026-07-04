package com.printhub3.backend.dto.request;

import lombok.*;

/**
 * Request body for an admin rejecting a seller application.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewApplicationRequest {

    /** Reason shown to the applicant when the application is rejected. */
    private String rejectionReason;
}
