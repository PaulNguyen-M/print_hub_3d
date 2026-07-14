package com.printhub3.backend.service;

import com.printhub3.backend.dto.response.ProductDto;
import com.printhub3.backend.entity.Product;
import com.printhub3.backend.entity.User;
import com.printhub3.backend.entity.Wishlist;
import com.printhub3.backend.exception.ResourceNotFoundException;
import com.printhub3.backend.repository.ProductRepository;
import com.printhub3.backend.repository.UserRepository;
import com.printhub3.backend.repository.WishlistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WishlistService {

    private final WishlistRepository wishlistRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final ProductService productService;

    /** Bật/tắt yêu thích; trả trạng thái mới (true = đã thích). */
    @Transactional
    public boolean toggle(String email, Long productId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
        if (wishlistRepository.existsByUser_UserIdAndProduct_ProductId(user.getUserId(), productId)) {
            wishlistRepository.deleteByUser_UserIdAndProduct_ProductId(user.getUserId(), productId);
            return false;
        }
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));
        wishlistRepository.save(Wishlist.builder().user(user).product(product).build());
        return true;
    }

    /** Id các sản phẩm user đã thích (để tô tym). */
    public List<Long> getFavoriteIds(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
        return wishlistRepository.findProductIdsByUser(user.getUserId());
    }

    /** Danh sách sản phẩm đã thích. */
    public List<ProductDto> getFavorites(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
        return wishlistRepository.findProductsByUser(user.getUserId())
                .stream().map(productService::toProductDto).toList();
    }
}
