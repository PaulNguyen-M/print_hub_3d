package com.printhub3.backend.dto.request;

import lombok.*;

/**
 * One uploaded STL/3D file (url + original file name) attached to a product.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StlFileRequest {
    private String url;
    private String fileName;
}
