package com.printhub3.backend.controller;

import com.printhub3.backend.dto.request.AddToCartRequest;
import com.printhub3.backend.dto.response.ApiResponse;
import com.printhub3.backend.dto.response.CartDto;
import com.printhub3.backend.service.CartService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import com.printhub3.backend.security.service.UserDetailsImpl;

@RestController
@RequestMapping("/api/v1/cart")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class CartController {

    private final CartService cartService;

    /**
     * Get user's cart
     */
    @GetMapping
    public ResponseEntity<ApiResponse<CartDto>> getCart() {
        Long userId = getCurrentUserId();
        CartDto cart = cartService.getCartDto(userId);
        return ResponseEntity.ok(ApiResponse.success(cart, "Cart retrieved successfully"));
    }

    /**
     * Add product to cart
     */
    @PostMapping("/add")
    public ResponseEntity<ApiResponse<CartDto>> addToCart(@RequestBody AddToCartRequest request) {
        Long userId = getCurrentUserId();
        cartService.addToCart(userId, request);
        CartDto cart = cartService.getCartDto(userId);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success(cart, "Item added to cart"));
    }

    /**
     * Remove item from cart
     */
    @DeleteMapping("/item/{productId}")
    public ResponseEntity<ApiResponse<CartDto>> removeFromCart(@PathVariable Long productId) {
        Long userId = getCurrentUserId();
        cartService.removeFromCart(userId, productId);
        CartDto cart = cartService.getCartDto(userId);
        return ResponseEntity.ok(ApiResponse.success(cart, "Item removed from cart"));
    }

    /**
     * Update cart item quantity
     */
    @PutMapping("/item/{productId}/quantity")
    public ResponseEntity<ApiResponse<CartDto>> updateQuantity(
            @PathVariable Long productId,
            @RequestParam Integer quantity) {
        Long userId = getCurrentUserId();
        cartService.updateCartItemQuantity(userId, productId, quantity);
        CartDto cart = cartService.getCartDto(userId);
        return ResponseEntity.ok(ApiResponse.success(cart, "Item quantity updated"));
    }

    /**
     * Clear cart
     */
    @DeleteMapping("/clear")
    public ResponseEntity<ApiResponse<?>> clearCart() {
        Long userId = getCurrentUserId();
        cartService.clearCart(userId);
        return ResponseEntity.ok(ApiResponse.success(null, "Cart cleared successfully"));
    }

    /**
     * Get current user ID from security context
     */
    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalStateException("User is not authenticated");
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof UserDetailsImpl userDetails) {
            return userDetails.getUserId();
        }

        throw new IllegalStateException("Unable to resolve current user ID");
    }
}
