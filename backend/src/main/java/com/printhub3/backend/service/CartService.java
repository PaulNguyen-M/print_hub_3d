package com.printhub3.backend.service;

import com.printhub3.backend.exception.ResourceNotFoundException;

import com.printhub3.backend.dto.request.AddToCartRequest;
import com.printhub3.backend.dto.response.CartDto;
import com.printhub3.backend.entity.*;
import com.printhub3.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * CartService — Nghiệp vụ giỏ hàng: lấy/tạo giỏ, thêm/xóa/đổi số lượng món,
 * dọn giỏ và tính lại tổng số món + tổng tiền.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    /** Lấy giỏ của người dùng; chưa có thì tạo mới giỏ rỗng. */
    public Cart getOrCreateCart(Long userId) {
        return cartRepository.findByUser_UserId(userId)
                .orElseGet(() -> {
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
                    Cart cart = Cart.builder()
                            .user(user)
                            .totalItems(0)
                            .totalPrice(BigDecimal.ZERO)
                            .build();
                    return cartRepository.save(cart);
                });
    }

    /** Thêm sản phẩm vào giỏ; nếu đã có thì cộng dồn số lượng. */
    public Cart addToCart(Long userId, AddToCartRequest request) {
        Cart cart = getOrCreateCart(userId);
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        // Kiểm tra món đã có trong giỏ chưa
        Optional<CartItem> existingItem = cartItemRepository
                .findByCartAndProduct(cart.getCartId(), product.getProductId());

        CartItem cartItem;
        if (existingItem.isPresent()) {
            // Đã có → cộng dồn số lượng
            cartItem = existingItem.get();
            cartItem.setQuantity(cartItem.getQuantity() + request.getQuantity());
        } else {
            // Chưa có → tạo món mới
            cartItem = CartItem.builder()
                    .cart(cart)
                    .product(product)
                    .quantity(request.getQuantity())
                    .unitPrice(product.getPrice())
                    .build();
        }

        cartItemRepository.save(cartItem);
        updateCartTotals(cart);
        return cartRepository.save(cart);
    }

    /** Xóa một sản phẩm khỏi giỏ. */
    public Cart removeFromCart(Long userId, Long productId) {
        Cart cart = getOrCreateCart(userId);
                cartItemRepository.findByCartAndProduct(cart.getCartId(), productId)
                                .ifPresent(cartItemRepository::delete);
        updateCartTotals(cart);
        return cartRepository.save(cart);
    }

    /** Đổi số lượng một món; nếu số lượng ≤ 0 thì xóa món khỏi giỏ. */
    public Cart updateCartItemQuantity(Long userId, Long productId, Integer quantity) {
        if (quantity <= 0) {
            return removeFromCart(userId, productId);
        }

        Cart cart = getOrCreateCart(userId);
        CartItem cartItem = cartItemRepository
                .findByCartAndProduct(cart.getCartId(), productId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found"));

        cartItem.setQuantity(quantity);
        cartItemRepository.save(cartItem);
        updateCartTotals(cart);
        return cartRepository.save(cart);
    }

    /** Dọn sạch toàn bộ giỏ hàng. */
    public void clearCart(Long userId) {
        Cart cart = getOrCreateCart(userId);
                cartItemRepository.deleteByCart_CartId(cart.getCartId());
        cart.setTotalItems(0);
        cart.setTotalPrice(BigDecimal.ZERO);
        cartRepository.save(cart);
    }

    /** Dựng DTO giỏ hàng để trả về frontend (kèm ảnh chính và thành tiền từng món). */
    public CartDto getCartDto(Long userId) {
        Cart cart = getOrCreateCart(userId);
        return CartDto.builder()
                .cartId(cart.getCartId())
                .totalItems(cart.getTotalItems())
                .totalPrice(cart.getTotalPrice())
                .items(cart.getItems().stream()
                        .filter(item -> item.getDeletedAt() == null)
                        .map(item -> com.printhub3.backend.dto.response.CartItemDto.builder()
                                .cartItemId(item.getCartItemId())
                                .productId(item.getProduct().getProductId())
                                .productName(item.getProduct().getName())
                                .productImage(item.getProduct().getImages().stream()
                                        .filter(img -> img.getIsPrimary() && img.getDeletedAt() == null)
                                        .map(ProductImage::getImageUrl)
                                        .findFirst()
                                        .orElse(null))
                                .quantity(item.getQuantity())
                                .unitPrice(item.getUnitPrice())
                                .subtotal(item.getUnitPrice()
                                        .multiply(BigDecimal.valueOf(item.getQuantity())))
                                .build())
                        .collect(Collectors.toList()))
                .build();
    }

    /** Tính lại tổng số món và tổng tiền của giỏ (chỉ tính món chưa xóa). */
    private void updateCartTotals(Cart cart) {
        var items = cartItemRepository.findItemsByCartId(cart.getCartId());
        var activeItems = items.stream()
                .filter(item -> item.getDeletedAt() == null)
                .toList();

        int totalItems = activeItems.stream().mapToInt(CartItem::getQuantity).sum();
        BigDecimal totalPrice = activeItems.stream()
                .map(item -> item.getUnitPrice()
                        .multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        cart.setTotalItems(totalItems);
        cart.setTotalPrice(totalPrice);
    }
}
