package com.printhub3.backend.service;

import com.printhub3.backend.dto.request.CreateReviewRequest;
import com.printhub3.backend.dto.request.UpdateShopRequest;
import com.printhub3.backend.dto.response.ProductDto;
import com.printhub3.backend.dto.response.ShopDto;
import com.printhub3.backend.dto.response.ShopReviewDto;
import com.printhub3.backend.entity.Shop;
import com.printhub3.backend.entity.ShopFollow;
import com.printhub3.backend.entity.ShopReview;
import com.printhub3.backend.entity.User;
import com.printhub3.backend.exception.BusinessException;
import com.printhub3.backend.exception.ResourceNotFoundException;
import com.printhub3.backend.repository.ProductRepository;
import com.printhub3.backend.repository.ShopFollowRepository;
import com.printhub3.backend.repository.ShopRepository;
import com.printhub3.backend.repository.ShopReviewRepository;
import com.printhub3.backend.repository.ShopReviewRepository.ShopRatingAggregate;
import com.printhub3.backend.repository.OrderRepository;
import com.printhub3.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Collections;
import java.util.List;

import java.util.Map;
import java.util.HashMap;

/**
 * ShopService - Public shop ("sạp") profiles, plus follow and shop-level reviews.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ShopService {

    private final ShopRepository shopRepository;
    private final ProductRepository productRepository;
    private final ShopFollowRepository followRepository;
    private final ShopReviewRepository shopReviewRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;

    public ShopDto getShopBySlug(String slug, Long viewerId) {
        Shop shop = shopRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Shop", "slug", slug));
        return toDto(shop, viewerId);
    }

    /** The shop owned by the given user, or null if they don't have one. Includes balance. */
    public ShopDto getShopByOwner(Long userId) {
        return shopRepository.findByOwner_UserId(userId).map(shop -> {
            ShopDto dto = toDto(shop, null);
            dto.setBalance(shop.getBalance());
            return dto;
        }).orElse(null);
    }

    public Shop requireShopBySlug(String slug) {
        return shopRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Shop", "slug", slug));
    }

    /** Update the shop owned by the given user. Null fields are left unchanged. */
    @Transactional
    public ShopDto updateMyShop(Long userId, UpdateShopRequest request) {
        Shop shop = shopRepository.findByOwner_UserId(userId)
                .orElseThrow(() -> new BusinessException("Bạn chưa có sạp"));

        if (request.getName() != null && !request.getName().isBlank()) {
            shop.setName(request.getName().trim());
        }
        if (request.getDescription() != null) {
            shop.setDescription(request.getDescription());
        }
        if (request.getLogoUrl() != null) {
            shop.setLogoUrl(request.getLogoUrl().isBlank() ? null : request.getLogoUrl().trim());
        }
        if (request.getBannerUrl() != null) {
            shop.setBannerUrl(request.getBannerUrl().isBlank() ? null : request.getBannerUrl().trim());
        }
        if (request.getFeaturedProductIds() != null) {
            List<Long> ids = request.getFeaturedProductIds().stream().distinct().limit(6).toList();
            shop.setFeaturedProductIds(ids);
        }
        shopRepository.save(shop);
        return toDto(shop, userId);
    }

    // ── Follow ──────────────────────────────────────────────────────────

    /** Follow or unfollow a shop; returns the new following state. */
    @Transactional
    public boolean toggleFollow(String slug, Long userId) {
        Shop shop = requireShopBySlug(slug);
        if (shop.getOwner() != null && shop.getOwner().getUserId().equals(userId)) {
            throw new BusinessException("Bạn không thể theo dõi sạp của chính mình");
        }
        boolean nowFollowing;
        if (followRepository.existsByShop_ShopIdAndUser_UserId(shop.getShopId(), userId)) {
            followRepository.deleteByShop_ShopIdAndUser_UserId(shop.getShopId(), userId);
            nowFollowing = false;
        } else {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
            followRepository.save(ShopFollow.builder().shop(shop).user(user).build());
            nowFollowing = true;
        }
        shop.setTotalFollowers((int) followRepository.countByShop_ShopId(shop.getShopId()));
        shopRepository.save(shop);
        return nowFollowing;
    }

    // ── Shop reviews ────────────────────────────────────────────────────

    @Transactional
    public ShopReviewDto addOrUpdateReview(String slug, Long userId, CreateReviewRequest request) {
        Shop shop = requireShopBySlug(slug);
        if (shop.getOwner() != null && shop.getOwner().getUserId().equals(userId)) {
            throw new BusinessException("Bạn không thể đánh giá sạp của chính mình");
        }

        if (!orderRepository.existsPurchaseFromShop(userId, shop.getShopId())) {
            throw new BusinessException("Bạn chỉ có thể đánh giá sạp mà bạn đã mua hàng");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        ShopReview review = shopReviewRepository.findUserReviewForShop(shop.getShopId(), userId)
                .orElseGet(() -> ShopReview.builder().shop(shop).user(user).build());
        review.setRating(request.getRating());
        review.setComment(request.getComment());
        review = shopReviewRepository.save(review);

        recalcShopRating(shop);
        return toReviewDto(review);
    }

    public Page<ShopReviewDto> getShopReviews(String slug, int page, int size) {
        Shop shop = requireShopBySlug(slug);
        return shopReviewRepository.findReviewsByShop(shop.getShopId(), PageRequest.of(page, size))
                .map(this::toReviewDto);
    }

    private void recalcShopRating(Shop shop) {
        ShopRatingAggregate agg = shopReviewRepository.aggregateForShop(shop.getShopId());
        BigDecimal avg = (agg != null && agg.getAvg() != null)
                ? BigDecimal.valueOf(agg.getAvg()).setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
        shop.setRating(avg);
        shop.setTotalReviews(agg != null && agg.getCnt() != null ? agg.getCnt().intValue() : 0);
        shopRepository.save(shop);
    }

    // ── Mapping ─────────────────────────────────────────────────────────

    private ShopReviewDto toReviewDto(ShopReview r) {
        User u = r.getUser();
        boolean verified = u != null
                && orderRepository.existsPurchaseFromShop(u.getUserId(), r.getShop().getShopId());
        return ShopReviewDto.builder()
                .shopReviewId(r.getShopReviewId())
                .userId(u != null ? u.getUserId() : null)
                .userName(u != null ? u.getFullName() : null)
                .userAvatarUrl(u != null ? u.getProfileImageUrl() : null)
                .rating(r.getRating())
                .comment(r.getComment())
                .createdAt(r.getCreatedAt())
                .verifiedPurchase(verified)
                .build();
    }

    private ShopDto toDto(Shop shop, Long viewerId) {
        User owner = shop.getOwner();
        int liveProductCount = (int) productRepository.countActiveByShop(shop.getShopId());
        Boolean isFollowing = (viewerId == null) ? null
                : followRepository.existsByShop_ShopIdAndUser_UserId(shop.getShopId(), viewerId);
        Boolean canReview = (viewerId == null) ? Boolean.FALSE
                : orderRepository.existsPurchaseFromShop(viewerId, shop.getShopId());
        Map<Integer, Integer> ratingDistribution = new HashMap<>();
        for (int star = 1; star <= 5; star++){
            ratingDistribution.put(star, 0);
        }
        for (ShopReviewRepository.RatingCount rc : shopReviewRepository.countByRating(shop.getShopId())){
            if (rc.getRating() != null){
                ratingDistribution.put(rc.getRating(), rc.getCnt() != null ? rc.getCnt().intValue() : 0);
            }
        }
        return ShopDto.builder()
                .shopId(shop.getShopId())
                .name(shop.getName())
                .slug(shop.getSlug())
                .description(shop.getDescription())
                .logoUrl(shop.getLogoUrl())
                .bannerUrl(shop.getBannerUrl())
                .status(shop.getStatus() != null ? shop.getStatus().name() : null)
                .rating(shop.getRating())
                .totalReviews(shop.getTotalReviews())
                .totalProducts(liveProductCount)
                .totalSales(shop.getTotalSales())
                .totalFollowers(shop.getTotalFollowers())
                .ownerId(owner != null ? owner.getUserId() : null)
                .ownerName(owner != null ? owner.getFullName() : null)
                .ownerAvatarUrl(owner != null ? owner.getProfileImageUrl() : null)
                .isFollowing(isFollowing)
                .canReview(canReview)
                .ratingDistribution(ratingDistribution)
                .createdAt(shop.getCreatedAt())
                .featuredProductIds(shop.getFeaturedProductIds())
                .build();
    }

    /** Returns the featured products for a shop in pinned order. */
    public List<ProductDto> getFeaturedProducts(String slug) {
        Shop shop = requireShopBySlug(slug);
        List<Long> ids = shop.getFeaturedProductIds();
        if (ids == null || ids.isEmpty()) return Collections.emptyList();
        return productRepository.findAllById(ids).stream()
                .filter(p -> p.getShop() != null && p.getShop().getShopId().equals(shop.getShopId()))
                .<ProductDto>map(p -> {
                    String imageUrl = (p.getImages() != null && !p.getImages().isEmpty())
                            ? p.getImages().iterator().next().getImageUrl()
                            : null;
                    String categoryName = (p.getCategory() != null) ? p.getCategory().getName() : null;
                    return ProductDto.builder()
                            .id(p.getProductId())
                            .title(p.getName())
                            .price(p.getPrice() != null ? p.getPrice().doubleValue() : 0.0)
                            .thumbnailUrl(imageUrl)
                            .imageUrl(imageUrl)
                            .category(categoryName)
                            .rating(p.getRating() != null ? p.getRating().doubleValue() : 0.0)
                            .build();
                })
                .toList();
    }
}
