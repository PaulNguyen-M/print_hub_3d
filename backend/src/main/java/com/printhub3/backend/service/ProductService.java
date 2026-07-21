package com.printhub3.backend.service;

import com.printhub3.backend.dto.request.CreateProductRequest;
import com.printhub3.backend.dto.response.ProductDto;
import com.printhub3.backend.entity.Category;
import com.printhub3.backend.entity.Product;
import com.printhub3.backend.entity.ProductImage;
import com.printhub3.backend.entity.User;
import com.printhub3.backend.repository.CategoryRepository;
import com.printhub3.backend.repository.ProductRepository;
import com.printhub3.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.printhub3.backend.entity.ProductStlFile;
import com.printhub3.backend.exception.ResourceNotFoundException;
import com.printhub3.backend.util.SlugUtil;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

/**
 * ProductService — Nghiệp vụ sản phẩm: tạo/sửa/xóa (của người bán), danh sách công khai
 * có lọc động, sản phẩm theo sạp, đóng gói file STL để tải, và map sang ProductDto.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final com.printhub3.backend.repository.ShopRepository shopRepository;
    private final com.printhub3.backend.repository.ProductStlFileRepository productStlFileRepository;

    /** Tạo sản phẩm mới cho người bán; gắn vào sạp của họ (nếu có); trạng thái chờ duyệt. */
    @Transactional
    public ProductDto createProduct(CreateProductRequest request, String sellerEmail) {
        User seller = userRepository.findByEmail(sellerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Category category = resolveCategory(request.getCategory());

        // Link the product to the seller's shop ("sạp") if they have one
        com.printhub3.backend.entity.Shop shop =
                shopRepository.findByOwner_UserId(seller.getUserId()).orElse(null);

        Product product = Product.builder()
                .name(request.getTitle())
                .description(request.getDescription())
                .price(request.getPrice())
                .category(category)
                .materialType(request.getMaterialType())
                .seller(seller)
                .shop(shop)
                .stockQuantity(request.getStockQuantity() != null ? request.getStockQuantity() : 99)
                .rating(BigDecimal.ZERO)
                .totalReviews(0)
                .totalSold(0)
                .isActive(false)
                .status(Product.ProductStatus.PENDING)
                .stlFileUrl(request.getStlFileUrl() != null && !request.getStlFileUrl().isBlank()
                        ? request.getStlFileUrl().trim() : null)
                .images(new java.util.HashSet<>())
                .build();

        // Gộp tất cả link ảnh: ưu tiên images[], thêm thumbnailUrl nếu chưa có
        java.util.List<String> urls = new java.util.ArrayList<>();
        if (request.getImages() != null) {
            request.getImages().stream()
                    .filter(u -> u != null && !u.isBlank())
                    .map(String::trim)
                    .forEach(urls::add);
        }
        if (request.getThumbnailUrl() != null && !request.getThumbnailUrl().isBlank()
                && !urls.contains(request.getThumbnailUrl().trim())) {
            urls.add(0, request.getThumbnailUrl().trim());
        }

        int order = 0;
        for (String url : urls) {
            ProductImage image = ProductImage.builder()
                    .product(product)
                    .imageUrl(url)
                    .isPrimary(order == 0)   // ảnh đầu tiên là ảnh chính
                    .displayOrder(order++)
                    .build();
            product.getImages().add(image);
        }

        Product saved = productRepository.save(product);

        // Persist STL/3D files (a multi-part model has several). Fall back to the
        // single stlFileUrl for backward compatibility.
        java.util.List<com.printhub3.backend.entity.ProductStlFile> stlEntities = new java.util.ArrayList<>();
        java.util.List<com.printhub3.backend.dto.request.StlFileRequest> stlReqs = request.getStlFiles();
        if (stlReqs != null && !stlReqs.isEmpty()) {
            int i = 0;
            for (var f : stlReqs) {
                if (f == null || f.getUrl() == null || f.getUrl().isBlank()) continue;
                stlEntities.add(com.printhub3.backend.entity.ProductStlFile.builder()
                        .product(saved)
                        .fileUrl(f.getUrl().trim())
                        .fileName(f.getFileName() != null && !f.getFileName().isBlank()
                                ? f.getFileName() : deriveFileName(f.getUrl()))
                        .displayOrder(i++)
                        .build());
            }
        } else if (saved.getStlFileUrl() != null && !saved.getStlFileUrl().isBlank()) {
            stlEntities.add(com.printhub3.backend.entity.ProductStlFile.builder()
                    .product(saved).fileUrl(saved.getStlFileUrl())
                    .fileName(deriveFileName(saved.getStlFileUrl())).displayOrder(0).build());
        }
        if (!stlEntities.isEmpty()) {
            productStlFileRepository.saveAll(stlEntities);
            if (saved.getStlFileUrl() == null || saved.getStlFileUrl().isBlank()) {
                saved.setStlFileUrl(stlEntities.get(0).getFileUrl());
                saved = productRepository.save(saved);
            }
        }
        return mapToProductDto(saved);
    }

    /** Suy ra tên file từ URL (mặc định model.stl). */
    private String deriveFileName(String url) {
        if (url == null || url.isBlank()) return "model.stl";
        String name = url.substring(url.lastIndexOf('/') + 1);
        return name.isBlank() ? "model.stl" : name;
    }

    /** A product's STL files bundled into a ZIP for download. */
    public record StlZip(byte[] data, String fileName) {}

    /** Gom tất cả file STL/3D của một sản phẩm thành một file ZIP để tải về. */
    @Transactional(readOnly = true)
    public StlZip buildStlZip(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));

        // Collect [url, name] from the multi-file table, fall back to single stlFileUrl
        List<String[]> entries = new ArrayList<>();
        List<ProductStlFile> files = productStlFileRepository.findByProduct_ProductIdOrderByDisplayOrderAsc(productId);
        if (!files.isEmpty()) {
            for (ProductStlFile f : files) entries.add(new String[]{ f.getFileUrl(), f.getFileName() });
        } else if (product.getStlFileUrl() != null && !product.getStlFileUrl().isBlank()) {
            entries.add(new String[]{ product.getStlFileUrl(), deriveFileName(product.getStlFileUrl()) });
        }
        if (entries.isEmpty()) {
            throw new ResourceNotFoundException("STL file", "product", productId);
        }

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (ZipOutputStream zos = new ZipOutputStream(baos)) {
            Set<String> used = new HashSet<>();
            for (String[] e : entries) {
                Path local = resolveLocalPath(e[0]);
                if (local == null || !Files.exists(local)) continue;
                String entryName = uniqueName(used, (e[1] != null && !e[1].isBlank())
                        ? e[1] : local.getFileName().toString());
                zos.putNextEntry(new ZipEntry(entryName));
                Files.copy(local, zos);
                zos.closeEntry();
            }
        } catch (IOException ex) {
            throw new RuntimeException("Không thể tạo file zip: " + ex.getMessage(), ex);
        }
        return new StlZip(baos.toByteArray(), SlugUtil.toSlug(product.getName()) + ".zip");
    }

    /** Đổi URL công khai /uploads/** sang đường dẫn file local (chặn path traversal). */
    private Path resolveLocalPath(String url) {
        if (url == null) return null;
        int idx = url.indexOf("/uploads/");
        if (idx < 0) return null;
        String rel = url.substring(idx + "/uploads/".length());
        Path base = Paths.get("uploads").toAbsolutePath().normalize();
        Path resolved = base.resolve(rel).normalize();
        return resolved.startsWith(base) ? resolved : null;
    }

    /** Tạo tên entry ZIP duy nhất (thêm hậu tố _1, _2... nếu trùng). */
    private String uniqueName(Set<String> used, String name) {
        String candidate = name;
        int n = 1;
        while (!used.add(candidate)) {
            int dot = name.lastIndexOf('.');
            candidate = (dot > 0 ? name.substring(0, dot) : name) + "_" + n++
                    + (dot > 0 ? name.substring(dot) : "");
        }
        return candidate;
    }

    /** Cập nhật sản phẩm; chỉ chủ sản phẩm hoặc admin; field null thì giữ nguyên. */
    @Transactional
    public ProductDto updateProduct(Long productId, CreateProductRequest request, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        boolean isAdmin = user.getRole() != null && "ADMIN".equals(user.getRole().getName());
        boolean isOwner = product.getSeller() != null
                && product.getSeller().getUserId().equals(user.getUserId());
        if (!isAdmin && !isOwner) {
            throw new RuntimeException("Bạn không có quyền sửa sản phẩm này");
        }

        if (request.getTitle() != null && !request.getTitle().isBlank())
            product.setName(request.getTitle().trim());
        if (request.getDescription() != null)
            product.setDescription(request.getDescription());
        if (request.getPrice() != null)
            product.setPrice(request.getPrice());
        if (request.getCategory() != null && !request.getCategory().isBlank())
            product.setCategory(resolveCategory(request.getCategory()));
        if (request.getMaterialType() != null)
            product.setMaterialType(request.getMaterialType().isBlank() ? null : request.getMaterialType());
        if (request.getStockQuantity() != null)
            product.setStockQuantity(request.getStockQuantity());

        return mapToProductDto(productRepository.save(product));
    }

    /** Xóa mềm sản phẩm (đặt inactive + deletedAt); chỉ chủ sản phẩm hoặc admin. */
    @Transactional
    public void deleteProduct(Long productId, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        boolean isAdmin = user.getRole() != null && "ADMIN".equals(user.getRole().getName());
        boolean isOwner = product.getSeller() != null
                && product.getSeller().getUserId().equals(user.getUserId());
        if (!isAdmin && !isOwner) {
            throw new RuntimeException("Bạn không có quyền xóa sản phẩm này");
        }

        // Soft delete
        product.setIsActive(false);
        product.setDeletedAt(java.time.LocalDateTime.now());
        productRepository.save(product);
    }

    /** Danh sách sản phẩm của chính người bán, mới nhất trước (phân trang). */
    public Page<ProductDto> getMyProducts(String sellerEmail, int page, int size) {
        User seller = userRepository.findByEmail(sellerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return productRepository.findProductsBySeller(seller.getUserId(), pageable).map(this::mapToProductDto);
    }

    /** Tìm category theo tên; nếu không có thì lấy category bất kỳ; nếu DB trống thì tạo mới. */
    private Category resolveCategory(String name) {
        if (name != null && !name.isBlank()) {
            Optional<Category> found = categoryRepository.findByName(name);
            if (found.isPresent()) return found.get();
            return categoryRepository.save(Category.builder()
                    .name(name).isActive(true).displayOrder(0).build());
        }
        return categoryRepository.findAllActiveCategories().stream().findFirst()
                .orElseGet(() -> categoryRepository.save(Category.builder()
                        .name("General").isActive(true).displayOrder(0).build()));
    }

    /**
     * Danh sách sản phẩm có lọc động: search, category, khoảng giá + sắp xếp.
     */
    public Page<ProductDto> getProducts(int page, int size, String sort,
                                        String search, String category,
                                        BigDecimal minPrice, BigDecimal maxPrice) {
        Sort sortObj = switch (sort == null ? "newest" : sort) {
            case "popular"    -> Sort.by(Sort.Direction.DESC, "totalSold");
            case "price_asc"  -> Sort.by(Sort.Direction.ASC, "price");
            case "price_desc" -> Sort.by(Sort.Direction.DESC, "price");
            case "rating"     -> Sort.by(Sort.Direction.DESC, "rating");
            default            -> Sort.by(Sort.Direction.DESC, "createdAt"); // newest
        };
        Pageable pageable = PageRequest.of(page, size, sortObj);

        Specification<Product> spec = (root, query, cb) -> {
            var predicates = new java.util.ArrayList<jakarta.persistence.criteria.Predicate>();
            // Chỉ sản phẩm đang hoạt động
            predicates.add(cb.isTrue(root.get("isActive")));
            predicates.add(cb.isNull(root.get("deletedAt")));

            if (search != null && !search.isBlank()) {
                String like = "%" + search.trim().toLowerCase() + "%";
                predicates.add(cb.like(cb.lower(root.get("name")), like));
            }
            if (category != null && !category.isBlank() && !"all".equalsIgnoreCase(category)) {
                predicates.add(cb.equal(
                        cb.lower(root.get("category").get("name")),
                        category.trim().toLowerCase()));
            }
            if (minPrice != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("price"), minPrice));
            }
            if (maxPrice != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("price"), maxPrice));
            }
            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };

        return productRepository.findAll(spec, pageable).map(this::mapToProductDto);
    }

    /** Chi tiết một sản phẩm (ném lỗi nếu không tồn tại hoặc đã ẩn/xóa). */
    public ProductDto getProductById(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        if (Boolean.FALSE.equals(product.getIsActive()) || product.getDeletedAt() != null) {
            throw new ResourceNotFoundException("Product not available");
        }

        return mapToProductDto(product);
    }

    /** Sản phẩm đang bán của một sạp, có tìm kiếm + sắp xếp tùy chọn. */
    public Page<ProductDto> getProductsByShop(Long shopId, int page, int size, String sort, String search) {
        Sort sortObj = switch (sort == null ? "newest" : sort) {
            case "popular"    -> Sort.by(Sort.Direction.DESC, "totalSold");
            case "price_asc"  -> Sort.by(Sort.Direction.ASC, "price");
            case "price_desc" -> Sort.by(Sort.Direction.DESC, "price");
            case "rating"     -> Sort.by(Sort.Direction.DESC, "rating");
            default            -> Sort.by(Sort.Direction.DESC, "createdAt");
        };
        Pageable pageable = PageRequest.of(page, size, sortObj);

        Specification<Product> spec = (root, query, cb) -> {
            var predicates = new java.util.ArrayList<jakarta.persistence.criteria.Predicate>();
            predicates.add(cb.equal(root.get("shop").get("shopId"), shopId));
            predicates.add(cb.isTrue(root.get("isActive")));
            predicates.add(cb.isNull(root.get("deletedAt")));
            if (search != null && !search.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("name")), "%" + search.trim().toLowerCase() + "%"));
            }
            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };
        return productRepository.findAll(spec, pageable).map(this::mapToProductDto);
    }

    /** Public wrapper để service khác (vd wishlist) tái dùng logic map ProductDto. */
    public ProductDto toProductDto(Product product) {
        return mapToProductDto(product);
    }


    /** Chuyển entity Product sang ProductDto đầy đủ (ảnh, sạp, đã bán, file STL...). */
    private ProductDto mapToProductDto(Product product) {
        String imageUrl = getPrimaryImageUrl(product).orElse(null);
        java.util.List<String> images = (product.getImages() == null) ? java.util.List.of()
                : product.getImages().stream()
                    .filter(img -> img.getDeletedAt() == null)
                    .sorted(java.util.Comparator.comparingInt(img ->
                            img.getDisplayOrder() != null ? img.getDisplayOrder() : 0))
                    .map(img -> img.getImageUrl())
                    .toList();
        String categoryName = Optional.ofNullable(product.getCategory()).map(Category::getName).orElse("");
        return ProductDto.builder()
                .id(product.getProductId())
                .title(product.getName())
                .description(product.getDescription())
                .price(product.getPrice() != null ? product.getPrice().doubleValue() : 0.0)
                .thumbnailUrl(imageUrl)
                .imageUrl(imageUrl)
                .material(product.getMaterialType())
                .category(categoryName)
                .sellerName(Optional.ofNullable(product.getSeller()).map(User::getFullName).orElse("Print Hub Creator"))
                .shopId(Optional.ofNullable(product.getShop()).map(com.printhub3.backend.entity.Shop::getShopId).orElse(null))
                .shopName(Optional.ofNullable(product.getShop()).map(com.printhub3.backend.entity.Shop::getName).orElse(null))
                .shopSlug(Optional.ofNullable(product.getShop()).map(com.printhub3.backend.entity.Shop::getSlug).orElse(null))
                .rating(product.getRating() != null ? product.getRating().doubleValue() : 0.0)
                .reviewCount(product.getTotalReviews() != null ? product.getTotalReviews() : 0)
                .stockQuantity(product.getStockQuantity())
                .totalSold(product.getTotalSold() != null ? product.getTotalSold() : 0)
                .createdAt(product.getCreatedAt() != null ? product.getCreatedAt().toString() : null)
                .images(images)
                .stlFileUrl(product.getStlFileUrl())
                .stlFiles(productStlFileRepository.findByProduct_ProductIdOrderByDisplayOrderAsc(product.getProductId())
                        .stream()
                        .map(f -> com.printhub3.backend.dto.response.ProductStlFileDto.builder()
                                .id(f.getProductStlFileId()).url(f.getFileUrl()).fileName(f.getFileName()).build())
                        .toList())
                .status(product.getStatus() != null ? product.getStatus().name() : "PENDING")
                .rejectionReason(product.getRejectionReason())
                .build();
    }

    /** Lấy URL ảnh chính của sản phẩm (ảnh primary, hoặc ảnh đầu tiên còn lại). */
    private Optional<String> getPrimaryImageUrl(Product product) {
        if (product.getImages() == null || product.getImages().isEmpty()) {
            return Optional.empty();
        }
        return product.getImages().stream()
                .filter(image -> Boolean.TRUE.equals(image.getIsPrimary()))
                .findFirst()
                .map(image -> image.getImageUrl())
                .or(() -> product.getImages().stream().findFirst().map(image -> image.getImageUrl()));
    }
}
