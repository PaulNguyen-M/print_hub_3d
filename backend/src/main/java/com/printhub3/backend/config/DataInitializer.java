package com.printhub3.backend.config;

import com.printhub3.backend.entity.Role;
import com.printhub3.backend.entity.Shop;
import com.printhub3.backend.entity.User;
import com.printhub3.backend.repository.ProductRepository;
import com.printhub3.backend.repository.RoleRepository;
import com.printhub3.backend.repository.ShopRepository;
import com.printhub3.backend.repository.UserRepository;
import com.printhub3.backend.util.SlugUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ShopRepository shopRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        seedRoles();
        fixPlainTextPasswords();
        seedDefaultUsers();
        seedShopsForExistingSellers();
        linkExistingProductsToShops();
    }

    // ── 1. Seed roles ──────────────────────────────────────────────────────────

    private void seedRoles() {
        List<Object[]> rolesData = List.of(
            new Object[]{"ADMIN",           "System administrator with full access"},
            new Object[]{"SELLER",          "Creator/seller who can upload and sell 3D models"},
            new Object[]{"BUYER",           "Customer who can browse and purchase products"},
            new Object[]{"PRINTER_PARTNER", "Printing partner who handles physical print requests"}
        );

        for (Object[] data : rolesData) {
            String name = (String) data[0];
            String description = (String) data[1];
            if (!roleRepository.existsByName(name)) {
                roleRepository.save(Role.builder().name(name).description(description).build());
                log.info("Created role: {}", name);
            }
        }
        log.info("Roles ready. Total: {}", roleRepository.count());
    }

    // ── 2. Fix existing users that have plain-text passwords ───────────────────

    private void fixPlainTextPasswords() {
        userRepository.findAll().forEach(user -> {
            String hash = user.getPasswordHash();
            // BCrypt hashes always start with $2a$ or $2b$ — plain text doesn't
            if (hash != null && !hash.startsWith("$2")) {
                user.setPasswordHash(passwordEncoder.encode(hash));
                userRepository.save(user);
                log.info("Re-hashed password for user: {}", user.getEmail());
            }
        });
    }

    // ── 3. Seed default test users if they don't exist ─────────────────────────

    private void seedDefaultUsers() {
        List<Object[]> usersData = List.of(
            new Object[]{"admin@printhub3d.com",   "admin123",  "Admin User",       "+841234567890", "ADMIN"},
            new Object[]{"seller@printhub3d.com",  "seller123", "Seller Partner",   "+849876543210", "SELLER"},
            new Object[]{"buyer@printhub3d.com",   "buyer123",  "Buyer Customer",   "+84900112233",  "BUYER"},
            new Object[]{"printer@printhub3d.com", "print123",  "Printer Partner",  "+84911223344",  "PRINTER_PARTNER"}
        );

        for (Object[] data : usersData) {
            String email    = (String) data[0];
            String password = (String) data[1];
            String fullName = (String) data[2];
            String phone    = (String) data[3];
            String roleName = (String) data[4];

            if (!userRepository.existsByEmail(email)) {
                Role role = roleRepository.findByName(roleName)
                        .orElseThrow(() -> new RuntimeException("Role not found: " + roleName));

                User user = User.builder()
                        .email(email)
                        .passwordHash(passwordEncoder.encode(password))
                        .fullName(fullName)
                        .phone(phone)
                        .role(role)
                        .isVerified(true)
                        .isActive(true)
                        .build();

                userRepository.save(user);
                log.info("Created default user: {} ({})", email, roleName);
            }
        }
    }

    // ── 4. Auto-create a shop for any existing SELLER without one ───────────────

    private void seedShopsForExistingSellers() {
        userRepository.findAll().stream()
                .filter(u -> u.getRole() != null && "SELLER".equals(u.getRole().getName()))
                .filter(u -> !shopRepository.existsByOwner_UserId(u.getUserId()))
                .forEach(seller -> {
                    String baseName = seller.getFullName() != null && !seller.getFullName().isBlank()
                            ? seller.getFullName() + "'s Shop"
                            : "Shop " + seller.getUserId();
                    String slug = uniqueSlug(SlugUtil.toSlug(baseName));

                    Shop shop = Shop.builder()
                            .owner(seller)
                            .name(baseName)
                            .slug(slug)
                            .description("Welcome to " + baseName)
                            .status(Shop.ShopStatus.ACTIVE)
                            .build();
                    shopRepository.save(shop);
                    log.info("Created shop '{}' for existing seller {}", baseName, seller.getEmail());
                });
    }

    private String uniqueSlug(String base) {
        String slug = base;
        int suffix = 1;
        while (shopRepository.existsBySlug(slug)) {
            slug = base + "-" + suffix++;
        }
        return slug;
    }

    // ── 5. Backfill: attach existing products to their seller's shop ───────────

    private void linkExistingProductsToShops() {
        shopRepository.findAll().forEach(shop -> {
            var orphans = productRepository.findBySeller_UserIdAndShopIsNull(shop.getOwner().getUserId());
            if (!orphans.isEmpty()) {
                orphans.forEach(p -> p.setShop(shop));
                productRepository.saveAll(orphans);
                log.info("Linked {} product(s) to shop '{}'", orphans.size(), shop.getName());
            }
        });
    }
}
