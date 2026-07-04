package com.printhub3.backend.controller;

import com.printhub3.backend.dto.request.CreateProductRequest;
import com.printhub3.backend.dto.response.ApiResponse;
import com.printhub3.backend.dto.response.ProductDto;
import com.printhub3.backend.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ProductDto>> createProduct(
            @Valid @RequestBody CreateProductRequest request,
            Authentication authentication
    ) {
        ProductDto product = productService.createProduct(request, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(product, "Product created successfully"));
    }

    @GetMapping("/my")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Page<ProductDto>>> getMyProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication
    ) {
        Page<ProductDto> products = productService.getMyProducts(authentication.getName(), page, size);
        return ResponseEntity.ok(ApiResponse.success(products, "My products retrieved successfully"));
    }

    @PutMapping("/{productId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ProductDto>> updateProduct(
            @PathVariable Long productId,
            @RequestBody CreateProductRequest request,
            Authentication authentication
    ) {
        ProductDto product = productService.updateProduct(productId, request, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(product, "Product updated successfully"));
    }

    @DeleteMapping("/{productId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> deleteProduct(
            @PathVariable Long productId,
            Authentication authentication
    ) {
        productService.deleteProduct(productId, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(null, "Product deleted successfully"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ProductDto>>> getProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "newest") String sort,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) java.math.BigDecimal minPrice,
            @RequestParam(required = false) java.math.BigDecimal maxPrice
    ) {

        Page<ProductDto> products =
                productService.getProducts(page, size, sort, search, category, minPrice, maxPrice);

        return ResponseEntity.ok(
                ApiResponse.success(
                        products,
                        "Products retrieved successfully"
                )
        );
    }

    /** Download all of a product's STL/3D files bundled into a single ZIP. */
    @GetMapping("/{productId}/download")
    public ResponseEntity<byte[]> downloadStlZip(@PathVariable Long productId) {
        ProductService.StlZip zip = productService.buildStlZip(productId);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(zip.fileName()).build().toString())
                .body(zip.data());
    }

    @GetMapping("/{productId}")
    public ResponseEntity<ApiResponse<ProductDto>> getProduct(
            @PathVariable Long productId
    ) {

        ProductDto product =
                productService.getProductById(productId);

        return ResponseEntity.ok(
                ApiResponse.success(
                        product,
                        "Product retrieved successfully"
                )
        );
    }
}