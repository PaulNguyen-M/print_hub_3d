-- ============================================================================
-- PrintHub 3D Database Schema
-- Production-Ready PostgreSQL Script
-- Enterprise-Level 3D Printing Marketplace & Custom Service Platform
-- ============================================================================
-- Version: 3.0.0
-- Updated:  2026-07-01
-- Tables:   27 (matches all JPA entities)
-- Enums:    9
-- Indexes:  70+
-- NOTE: Table order matters — FK dependencies must be created first.
-- ============================================================================

-- ============================================================================
-- 1. ENABLE EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 2. CREATE ALL ENUM TYPES
-- ============================================================================

CREATE TYPE order_status_enum AS ENUM (
    'PENDING', 'PROCESSING', 'PRINTING', 'FINISHING',
    'SHIPPING', 'DELIVERED', 'CANCELLED'
);

CREATE TYPE payment_status_enum AS ENUM (
    'PENDING', 'PAID', 'FAILED', 'REFUNDED'
);

CREATE TYPE upload_model_status_enum AS ENUM (
    'REVIEWING', 'QUOTED', 'ACCEPTED', 'PRINTING', 'COMPLETED', 'REJECTED'
);

CREATE TYPE notification_type_enum AS ENUM (
    'ORDER_CONFIRMATION', 'ORDER_UPDATE', 'PAYMENT_CONFIRMATION',
    'MODEL_QUOTE', 'MODEL_STATUS_UPDATE', 'CHAT_MESSAGE',
    'PROMOTION', 'SYSTEM_ALERT'
);

CREATE TYPE chat_status_enum AS ENUM ('ACTIVE', 'ARCHIVED', 'BLOCKED');

CREATE TYPE shop_status_enum AS ENUM ('ACTIVE', 'SUSPENDED', 'CLOSED');

CREATE TYPE seller_application_status_enum AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TYPE shop_payout_status_enum AS ENUM ('PENDING', 'PAID');

-- ============================================================================
-- 3. AUTHENTICATION & USERS
-- ============================================================================

CREATE TABLE roles (
    role_id     BIGSERIAL PRIMARY KEY,
    name        VARCHAR(50)  NOT NULL UNIQUE,
    description TEXT,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    user_id           BIGSERIAL PRIMARY KEY,
    email             VARCHAR(255) NOT NULL UNIQUE,
    password_hash     VARCHAR(255) NOT NULL,
    full_name         VARCHAR(255) NOT NULL,
    phone             VARCHAR(20),
    profile_image_url TEXT,
    address           VARCHAR(255),
    city              VARCHAR(100),
    state_province    VARCHAR(100),
    postal_code       VARCHAR(20),
    country           VARCHAR(100),
    role_id           BIGINT NOT NULL REFERENCES roles(role_id) ON DELETE RESTRICT,
    is_verified       BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMP,
    phone_verified_at TIMESTAMP,
    last_login_at     TIMESTAMP,
    is_active         BOOLEAN DEFAULT TRUE,
    created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at        TIMESTAMP
);

CREATE TABLE refresh_tokens (
    token_id   BIGSERIAL PRIMARY KEY,
    user_id    BIGINT       NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP    NOT NULL,
    revoked_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_activities (
    activity_id   BIGSERIAL PRIMARY KEY,
    user_id       BIGINT      NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    description   TEXT,
    ip_address    VARCHAR(45),
    user_agent    TEXT,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 4. CATEGORIES
-- ============================================================================

CREATE TABLE categories (
    category_id        BIGSERIAL PRIMARY KEY,
    name               VARCHAR(100) NOT NULL UNIQUE,
    description        TEXT,
    icon_url           TEXT,
    parent_category_id BIGINT REFERENCES categories(category_id) ON DELETE SET NULL,
    display_order      INTEGER   DEFAULT 0,
    is_active          BOOLEAN   DEFAULT TRUE,
    created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at         TIMESTAMP
);

-- ============================================================================
-- 5. SHOPS  (must come BEFORE products because products.shop_id → shops)
-- ============================================================================

CREATE TABLE shops (
    shop_id              BIGSERIAL PRIMARY KEY,
    owner_id             BIGINT       NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    name                 VARCHAR(150) NOT NULL,
    slug                 VARCHAR(180) NOT NULL UNIQUE,
    description          TEXT,
    logo_url             TEXT,
    banner_url           TEXT,
    status               shop_status_enum NOT NULL DEFAULT 'ACTIVE',
    rating               DECIMAL(3,2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
    total_reviews        INTEGER      DEFAULT 0,
    total_products       INTEGER      DEFAULT 0,
    total_sales          INTEGER      DEFAULT 0,
    total_followers      INTEGER      DEFAULT 0,
    commission_rate      DECIMAL(5,4) DEFAULT 0.15,
    balance              DECIMAL(14,2) DEFAULT 0,
    featured_product_ids JSONB,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at           TIMESTAMP
);

-- ============================================================================
-- 6. MARKETPLACE PRODUCTS
-- ============================================================================

CREATE TABLE products (
    product_id       BIGSERIAL PRIMARY KEY,
    name             VARCHAR(255)  NOT NULL,
    description      TEXT,
    price            DECIMAL(12,2) NOT NULL CHECK (price >= 0),
    category_id      BIGINT NOT NULL REFERENCES categories(category_id) ON DELETE RESTRICT,
    seller_id        BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    shop_id          BIGINT REFERENCES shops(shop_id) ON DELETE SET NULL,
    stock_quantity   INTEGER       NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    stl_file_url     TEXT,
    rating           DECIMAL(3,2)  DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
    total_reviews    INTEGER       DEFAULT 0,
    total_sold       INTEGER       DEFAULT 0,
    status           VARCHAR(20)   NOT NULL DEFAULT 'PENDING',
    rejection_reason TEXT,
    is_active        BOOLEAN       DEFAULT TRUE,
    created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at       TIMESTAMP
);

CREATE TABLE product_images (
    image_id      BIGSERIAL PRIMARY KEY,
    product_id    BIGINT NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
    image_url     TEXT   NOT NULL,
    alt_text      VARCHAR(255),
    display_order INTEGER   DEFAULT 0,
    is_primary    BOOLEAN   DEFAULT FALSE,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at    TIMESTAMP
);

-- Multiple STL files per product; bundled into a ZIP on download.
CREATE TABLE product_stl_files (
    product_stl_file_id BIGSERIAL PRIMARY KEY,
    product_id          BIGINT NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
    file_url            TEXT   NOT NULL,
    file_name           VARCHAR(255),
    display_order       INTEGER   DEFAULT 0,
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- One review per user per product (UNIQUE constraint).
CREATE TABLE product_reviews (
    review_id            BIGSERIAL PRIMARY KEY,
    product_id           BIGINT NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
    user_id              BIGINT NOT NULL REFERENCES users(user_id)    ON DELETE CASCADE,
    rating               INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment              TEXT,
    is_verified_purchase BOOLEAN DEFAULT FALSE,
    helpful_count        INTEGER DEFAULT 0,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at           TIMESTAMP,
    UNIQUE (product_id, user_id)
);

-- ============================================================================
-- 7. 3D PRINTING SERVICE
-- ============================================================================

CREATE TABLE printing_requests (
    request_id             BIGSERIAL PRIMARY KEY,
    user_id                BIGINT       NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    file_name              VARCHAR(255) NOT NULL,
    file_url               TEXT         NOT NULL,
    file_size              BIGINT       NOT NULL CHECK (file_size > 0),
    file_format            VARCHAR(20),
    model_status           upload_model_status_enum NOT NULL DEFAULT 'REVIEWING',
    quote_amount           DECIMAL(12,2),
    quote_notes            TEXT,
    description            TEXT,
    requirements           TEXT,
    quote_expiry_date      TIMESTAMP,
    estimated_printing_days INTEGER,
    created_at             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at             TIMESTAMP
);

-- Metadata for uploaded STL files (S3 or local storage).
CREATE TABLE stl_uploads (
    upload_id       BIGSERIAL PRIMARY KEY,
    file_name       VARCHAR(255) NOT NULL,
    file_url        TEXT         NOT NULL,
    s3_key          VARCHAR(512),
    content_type    VARCHAR(128),
    file_size       BIGINT,
    sha256_checksum VARCHAR(128),
    title           VARCHAR(255),
    description     TEXT,
    material        VARCHAR(100),
    color           VARCHAR(50),
    uploaded_by     VARCHAR(255),
    uploaded_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 8. SHOPPING CART
-- ============================================================================

CREATE TABLE carts (
    cart_id     BIGSERIAL PRIMARY KEY,
    user_id     BIGINT        NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    total_items INTEGER       DEFAULT 0,
    total_price DECIMAL(12,2) DEFAULT 0,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at  TIMESTAMP
);

CREATE TABLE cart_items (
    cart_item_id BIGSERIAL PRIMARY KEY,
    cart_id      BIGINT NOT NULL REFERENCES carts(cart_id)       ON DELETE CASCADE,
    product_id   BIGINT NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
    quantity     INTEGER       NOT NULL CHECK (quantity > 0),
    unit_price   DECIMAL(12,2) NOT NULL CHECK (unit_price >= 0),
    subtotal     DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at   TIMESTAMP,
    UNIQUE (cart_id, product_id)
);

-- ============================================================================
-- 9. ORDERS
-- ============================================================================

CREATE TABLE orders (
    order_id                BIGSERIAL PRIMARY KEY,
    order_number            VARCHAR(50)   NOT NULL UNIQUE,
    user_id                 BIGINT        NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    total_amount            DECIMAL(12,2) NOT NULL CHECK (total_amount >= 0),
    shipping_address        TEXT          NOT NULL,
    shipping_city           VARCHAR(100),
    shipping_state_province VARCHAR(100),
    shipping_postal_code    VARCHAR(20),
    shipping_country        VARCHAR(100),
    order_status            order_status_enum NOT NULL DEFAULT 'PENDING',
    shipping_method         VARCHAR(50),
    tracking_number         VARCHAR(100),
    notes                   TEXT,
    estimated_delivery      TIMESTAMP,
    delivered_at            TIMESTAMP,
    created_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at              TIMESTAMP
);

CREATE TABLE order_items (
    order_item_id BIGSERIAL PRIMARY KEY,
    order_id      BIGINT        NOT NULL REFERENCES orders(order_id)   ON DELETE CASCADE,
    product_id    BIGINT        NOT NULL REFERENCES products(product_id) ON DELETE RESTRICT,
    quantity      INTEGER       NOT NULL CHECK (quantity > 0),
    unit_price    DECIMAL(12,2) NOT NULL CHECK (unit_price >= 0),
    subtotal      DECIMAL(12,2) NOT NULL CHECK (subtotal >= 0),
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at    TIMESTAMP
);

-- ============================================================================
-- 10. PAYMENTS
-- ============================================================================

CREATE TABLE payments (
    payment_id              BIGSERIAL PRIMARY KEY,
    order_id                BIGINT        NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    amount                  DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    payment_status          payment_status_enum NOT NULL DEFAULT 'PENDING',
    payment_method          VARCHAR(50),
    payment_gateway         VARCHAR(50),
    gateway_transaction_id  VARCHAR(255),
    gateway_response_code   VARCHAR(50),
    gateway_response_message TEXT,
    paid_at                 TIMESTAMP,
    created_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at              TIMESTAMP
);

CREATE TABLE payment_transactions (
    transaction_id   BIGSERIAL PRIMARY KEY,
    payment_id       BIGINT        NOT NULL REFERENCES payments(payment_id) ON DELETE CASCADE,
    transaction_type VARCHAR(50)   NOT NULL,
    amount           DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    response_code    VARCHAR(50),
    response_message TEXT,
    created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 11. SELLER ECOSYSTEM  (after shops AND orders because of FK references)
-- ============================================================================

-- BUYER requests to open a shop; admin reviews and creates a shop on approval.
CREATE TABLE seller_applications (
    application_id        BIGSERIAL PRIMARY KEY,
    applicant_id          BIGINT       NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    shop_name             VARCHAR(150) NOT NULL,
    description           TEXT,
    status                seller_application_status_enum NOT NULL DEFAULT 'PENDING',
    opening_fee           DECIMAL(12,2) DEFAULT 0,
    fee_paid              BOOLEAN       DEFAULT FALSE,
    fee_payment_reference VARCHAR(120),
    rejection_reason      TEXT,
    reviewed_by           BIGINT REFERENCES users(user_id) ON DELETE SET NULL,
    reviewed_at           TIMESTAMP,
    shop_id               BIGINT REFERENCES shops(shop_id) ON DELETE SET NULL,
    created_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Net revenue credited to a shop per completed order (gross − 15% commission).
CREATE TABLE shop_payouts (
    payout_id         BIGSERIAL PRIMARY KEY,
    shop_id           BIGINT        NOT NULL REFERENCES shops(shop_id)  ON DELETE CASCADE,
    order_id          BIGINT        NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    gross_amount      DECIMAL(14,2) NOT NULL CHECK (gross_amount >= 0),
    commission_rate   DECIMAL(5,4)  NOT NULL,
    commission_amount DECIMAL(14,2) NOT NULL CHECK (commission_amount >= 0),
    net_amount        DECIMAL(14,2) NOT NULL CHECK (net_amount >= 0),
    status            shop_payout_status_enum NOT NULL DEFAULT 'PAID',
    created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (shop_id, order_id)
);

-- User following a shop.
CREATE TABLE shop_follows (
    shop_follow_id BIGSERIAL PRIMARY KEY,
    shop_id        BIGINT NOT NULL REFERENCES shops(shop_id) ON DELETE CASCADE,
    user_id        BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (shop_id, user_id)
);

-- Buyer rates a shop as a whole (distinct from product reviews).
CREATE TABLE shop_reviews (
    shop_review_id BIGSERIAL PRIMARY KEY,
    shop_id        BIGINT NOT NULL REFERENCES shops(shop_id) ON DELETE CASCADE,
    user_id        BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    rating         INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment        TEXT,
    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at     TIMESTAMP,
    UNIQUE (shop_id, user_id)
);

-- ============================================================================
-- 12. REAL-TIME CHAT
-- ============================================================================

-- Persistent conversation room between two users.
CREATE TABLE chats (
    chat_id      BIGSERIAL PRIMARY KEY,
    initiator_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    recipient_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    chat_status  chat_status_enum DEFAULT 'ACTIVE',
    last_message_at TIMESTAMP,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at   TIMESTAMP,
    CHECK (initiator_id != recipient_id)
);

-- Messages stored inside a chat room.
CREATE TABLE messages (
    message_id      BIGSERIAL PRIMARY KEY,
    chat_id         BIGINT NOT NULL REFERENCES chats(chat_id) ON DELETE CASCADE,
    sender_id       BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    message_content TEXT   NOT NULL,
    is_read         BOOLEAN   DEFAULT FALSE,
    read_at         TIMESTAMP,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at      TIMESTAMP
);

-- WebSocket / STOMP direct messages (persisted for history, not tied to a chat room).
CREATE TABLE chat_messages (
    message_id     BIGSERIAL PRIMARY KEY,
    sender_id      BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    recipient_id   BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    content        TEXT,
    message_status VARCHAR(50) DEFAULT 'SENT',
    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 13. NOTIFICATIONS
-- ============================================================================

CREATE TABLE notifications (
    notification_id     BIGSERIAL PRIMARY KEY,
    user_id             BIGINT       NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    title               VARCHAR(255) NOT NULL,
    message             TEXT         NOT NULL,
    notification_type   notification_type_enum NOT NULL,
    related_entity_type VARCHAR(50),
    related_entity_id   BIGINT,
    is_read             BOOLEAN   DEFAULT FALSE,
    read_at             TIMESTAMP,
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at          TIMESTAMP
);

-- ============================================================================
-- 14. AUDIT LOGS
-- ============================================================================

CREATE TABLE audit_logs (
    log_id      BIGSERIAL PRIMARY KEY,
    user_id     BIGINT REFERENCES users(user_id) ON DELETE SET NULL,
    action      VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id   BIGINT       NOT NULL,
    old_values  JSONB,
    new_values  JSONB,
    ip_address  VARCHAR(45),
    user_agent  TEXT,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 15. SELLER WALLET — WITHDRAWALS
-- ============================================================================

-- Seller requests to withdraw earned balance from their shop wallet.
-- Amount is held (deducted) immediately on request; admin approves or rejects.
CREATE TABLE withdrawals (
    withdrawal_id       BIGSERIAL PRIMARY KEY,
    shop_id             BIGINT        NOT NULL REFERENCES shops(shop_id)  ON DELETE CASCADE,
    amount              DECIMAL(14,2) NOT NULL CHECK (amount > 0),
    bank_name           VARCHAR(120),
    bank_account_number VARCHAR(60),
    bank_account_name   VARCHAR(150),
    note                TEXT,
    status              VARCHAR(20)   NOT NULL DEFAULT 'PENDING',
    rejection_reason    TEXT,
    processed_by        BIGINT REFERENCES users(user_id) ON DELETE SET NULL,
    processed_at        TIMESTAMP,
    created_at          TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (status IN ('PENDING', 'PAID', 'REJECTED'))
);

-- ============================================================================
-- 16. WISHLIST
-- ============================================================================

-- Products saved to a user's wishlist (one record per product-user pair).
CREATE TABLE wishlist (
    wishlist_id BIGSERIAL PRIMARY KEY,
    product_id  BIGINT NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
    user_id     BIGINT NOT NULL REFERENCES users(user_id)       ON DELETE CASCADE,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (product_id, user_id)
);

-- ============================================================================
-- 17. INDEXES — AUTHENTICATION & USERS
-- ============================================================================

CREATE INDEX idx_users_email      ON users(email)     WHERE deleted_at IS NULL;
CREATE INDEX idx_users_role_id    ON users(role_id);
CREATE INDEX idx_users_is_active  ON users(is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_created_at ON users(created_at) WHERE deleted_at IS NULL;

CREATE INDEX idx_refresh_tokens_user_id    ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

CREATE INDEX idx_user_activities_user_id    ON user_activities(user_id);
CREATE INDEX idx_user_activities_created_at ON user_activities(created_at);

-- ============================================================================
-- 16. INDEXES — CATEGORIES & PRODUCTS
-- ============================================================================

CREATE INDEX idx_categories_name      ON categories(name)               WHERE deleted_at IS NULL;
CREATE INDEX idx_categories_is_active ON categories(is_active)          WHERE deleted_at IS NULL;
CREATE INDEX idx_categories_parent_id ON categories(parent_category_id) WHERE deleted_at IS NULL;

CREATE INDEX idx_products_category_id ON products(category_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_seller_id   ON products(seller_id)   WHERE deleted_at IS NULL;
CREATE INDEX idx_products_shop_id     ON products(shop_id)     WHERE deleted_at IS NULL;
CREATE INDEX idx_products_name        ON products(name)        WHERE deleted_at IS NULL;
CREATE INDEX idx_products_is_active   ON products(is_active)   WHERE deleted_at IS NULL;
CREATE INDEX idx_products_price       ON products(price)       WHERE deleted_at IS NULL;
CREATE INDEX idx_products_status      ON products(status)      WHERE deleted_at IS NULL;

CREATE INDEX idx_product_stl_files_product_id ON product_stl_files(product_id);

CREATE INDEX idx_product_images_product_id ON product_images(product_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_product_images_is_primary ON product_images(is_primary) WHERE deleted_at IS NULL;

CREATE INDEX idx_product_reviews_product_id ON product_reviews(product_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_product_reviews_user_id    ON product_reviews(user_id)    WHERE deleted_at IS NULL;
CREATE INDEX idx_product_reviews_created_at ON product_reviews(created_at) WHERE deleted_at IS NULL;

-- ============================================================================
-- 17. INDEXES — SHOPS & SELLER ECOSYSTEM
-- ============================================================================

CREATE INDEX idx_shops_owner_id ON shops(owner_id);
CREATE INDEX idx_shops_slug     ON shops(slug);
CREATE INDEX idx_shops_status   ON shops(status) WHERE deleted_at IS NULL;

CREATE INDEX idx_seller_app_applicant_id ON seller_applications(applicant_id);
CREATE INDEX idx_seller_app_status       ON seller_applications(status);

CREATE INDEX idx_shop_payouts_shop_id  ON shop_payouts(shop_id);
CREATE INDEX idx_shop_payouts_order_id ON shop_payouts(order_id);

CREATE INDEX idx_shop_follows_shop_id ON shop_follows(shop_id);
CREATE INDEX idx_shop_follows_user_id ON shop_follows(user_id);

CREATE INDEX idx_shop_reviews_shop_id ON shop_reviews(shop_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_shop_reviews_user_id ON shop_reviews(user_id) WHERE deleted_at IS NULL;

-- ============================================================================
-- 18. INDEXES — 3D PRINTING
-- ============================================================================

CREATE INDEX idx_printing_requests_user_id    ON printing_requests(user_id)       WHERE deleted_at IS NULL;
CREATE INDEX idx_printing_requests_status     ON printing_requests(model_status)  WHERE deleted_at IS NULL;
CREATE INDEX idx_printing_requests_created_at ON printing_requests(created_at)    WHERE deleted_at IS NULL;

CREATE INDEX idx_stl_uploads_s3_key      ON stl_uploads(s3_key);
CREATE INDEX idx_stl_uploads_file_name   ON stl_uploads(file_name);
CREATE INDEX idx_stl_uploads_uploaded_at ON stl_uploads(uploaded_at);

-- ============================================================================
-- 19. INDEXES — CART & ORDERS
-- ============================================================================

CREATE INDEX idx_carts_user_id        ON carts(user_id)     WHERE deleted_at IS NULL;
CREATE INDEX idx_cart_items_cart_id   ON cart_items(cart_id)    WHERE deleted_at IS NULL;
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id) WHERE deleted_at IS NULL;

CREATE INDEX idx_orders_user_id      ON orders(user_id)      WHERE deleted_at IS NULL;
CREATE INDEX idx_orders_order_status ON orders(order_status) WHERE deleted_at IS NULL;
CREATE INDEX idx_orders_created_at   ON orders(created_at)   WHERE deleted_at IS NULL;
CREATE INDEX idx_orders_order_number ON orders(order_number);

CREATE INDEX idx_order_items_order_id   ON order_items(order_id)   WHERE deleted_at IS NULL;
CREATE INDEX idx_order_items_product_id ON order_items(product_id) WHERE deleted_at IS NULL;

-- ============================================================================
-- 20. INDEXES — PAYMENTS
-- ============================================================================

CREATE INDEX idx_payments_order_id    ON payments(order_id)        WHERE deleted_at IS NULL;
CREATE INDEX idx_payments_status      ON payments(payment_status)  WHERE deleted_at IS NULL;
CREATE INDEX idx_payments_created_at  ON payments(created_at)      WHERE deleted_at IS NULL;

CREATE INDEX idx_payment_transactions_payment_id ON payment_transactions(payment_id);
CREATE INDEX idx_payment_transactions_created_at ON payment_transactions(created_at);

-- ============================================================================
-- 21. INDEXES — CHAT & NOTIFICATIONS
-- ============================================================================

CREATE INDEX idx_chats_initiator_id  ON chats(initiator_id)                   WHERE deleted_at IS NULL;
CREATE INDEX idx_chats_recipient_id  ON chats(recipient_id)                   WHERE deleted_at IS NULL;
CREATE INDEX idx_chats_participants  ON chats(initiator_id, recipient_id)      WHERE deleted_at IS NULL;

CREATE INDEX idx_messages_chat_id    ON messages(chat_id)   WHERE deleted_at IS NULL;
CREATE INDEX idx_messages_sender_id  ON messages(sender_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_messages_is_read    ON messages(is_read)   WHERE deleted_at IS NULL;
CREATE INDEX idx_messages_created_at ON messages(created_at) WHERE deleted_at IS NULL;

CREATE INDEX idx_chat_messages_sender_id    ON chat_messages(sender_id);
CREATE INDEX idx_chat_messages_recipient_id ON chat_messages(recipient_id);
CREATE INDEX idx_chat_messages_created_at   ON chat_messages(created_at);

CREATE INDEX idx_notifications_user_id    ON notifications(user_id)            WHERE deleted_at IS NULL;
CREATE INDEX idx_notifications_is_read    ON notifications(is_read)            WHERE deleted_at IS NULL;
CREATE INDEX idx_notifications_type       ON notifications(notification_type)  WHERE deleted_at IS NULL;
CREATE INDEX idx_notifications_created_at ON notifications(created_at)         WHERE deleted_at IS NULL;

-- ============================================================================
-- 22. INDEXES — AUDIT
-- ============================================================================

CREATE INDEX idx_audit_logs_user_id        ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity_type_id ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at     ON audit_logs(created_at);

-- ============================================================================
-- 23. INDEXES — WITHDRAWALS & WISHLIST
-- ============================================================================

CREATE INDEX idx_withdrawals_shop_id   ON withdrawals(shop_id);
CREATE INDEX idx_withdrawals_status    ON withdrawals(status);
CREATE INDEX idx_withdrawals_created_at ON withdrawals(created_at);

CREATE INDEX idx_wishlist_user_id    ON wishlist(user_id);
CREATE INDEX idx_wishlist_product_id ON wishlist(product_id);

-- ============================================================================
-- 23. AUTO-UPDATE updated_at TRIGGER FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 24. TRIGGERS
-- ============================================================================

CREATE TRIGGER trg_roles_updated_at                BEFORE UPDATE ON roles                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_users_updated_at                BEFORE UPDATE ON users                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_refresh_tokens_updated_at       BEFORE UPDATE ON refresh_tokens       FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_categories_updated_at           BEFORE UPDATE ON categories           FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_shops_updated_at                BEFORE UPDATE ON shops                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_products_updated_at             BEFORE UPDATE ON products             FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_product_images_updated_at       BEFORE UPDATE ON product_images       FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_product_reviews_updated_at      BEFORE UPDATE ON product_reviews      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_printing_requests_updated_at    BEFORE UPDATE ON printing_requests    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_carts_updated_at                BEFORE UPDATE ON carts                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_cart_items_updated_at           BEFORE UPDATE ON cart_items           FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_orders_updated_at               BEFORE UPDATE ON orders               FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_order_items_updated_at          BEFORE UPDATE ON order_items          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_payments_updated_at             BEFORE UPDATE ON payments             FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_payment_transactions_updated_at BEFORE UPDATE ON payment_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_seller_applications_updated_at  BEFORE UPDATE ON seller_applications  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_shop_reviews_updated_at         BEFORE UPDATE ON shop_reviews         FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_chats_updated_at                BEFORE UPDATE ON chats                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_messages_updated_at             BEFORE UPDATE ON messages             FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_chat_messages_updated_at        BEFORE UPDATE ON chat_messages        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_notifications_updated_at        BEFORE UPDATE ON notifications        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 25. SEED DATA — ROLES
-- ============================================================================

INSERT INTO roles (name, description) VALUES
    ('ADMIN',           'Administrator with full system access'),
    ('SELLER',          'Product seller in the marketplace'),
    ('BUYER',           'Regular customer / buyer'),
    ('PRINTER_PARTNER', 'Partner 3D printing service provider')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 26. SEED DATA — CATEGORIES
-- ============================================================================

INSERT INTO categories (name, description, display_order, is_active) VALUES
    ('Miniatures & Collectibles', 'Small figurines and collectible items',        1, TRUE),
    ('Functional Prints',         'Practical items for everyday use',             2, TRUE),
    ('Home Decor',                'Decorative items for home decoration',         3, TRUE),
    ('Gaming & Tabletop',         'Gaming miniatures and board game components',  4, TRUE),
    ('Jewelry',                   'Custom 3D printed jewelry items',              5, TRUE),
    ('Prototypes & Models',       'Engineering and product prototypes',           6, TRUE),
    ('Replacement Parts',         'Replacement components for various devices',   7, TRUE),
    ('Custom Services',           'Custom 3D printing orders',                   8, TRUE)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 27. SAMPLE USERS  (uncomment to seed test accounts)
-- ============================================================================
/*
INSERT INTO users (email, password_hash, full_name, role_id, is_verified, email_verified_at, is_active)
SELECT 'admin@printhub3d.com', crypt('Admin@123', gen_salt('bf')), 'Admin User',
       (SELECT role_id FROM roles WHERE name='ADMIN'), TRUE, NOW(), TRUE
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email='admin@printhub3d.com');

INSERT INTO users (email, password_hash, full_name, role_id, is_verified, email_verified_at, is_active)
SELECT 'seller@printhub3d.com', crypt('Seller@123', gen_salt('bf')), 'Seller User',
       (SELECT role_id FROM roles WHERE name='SELLER'), TRUE, NOW(), TRUE
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email='seller@printhub3d.com');

INSERT INTO users (email, password_hash, full_name, role_id, is_verified, email_verified_at, is_active)
SELECT 'buyer@printhub3d.com', crypt('Buyer@123', gen_salt('bf')), 'Buyer User',
       (SELECT role_id FROM roles WHERE name='BUYER'), TRUE, NOW(), TRUE
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email='buyer@printhub3d.com');
*/

-- ============================================================================
-- 28. TABLE COMMENTS
-- ============================================================================

COMMENT ON TABLE roles                IS 'System roles: ADMIN, SELLER, BUYER, PRINTER_PARTNER';
COMMENT ON TABLE users                IS 'User accounts with authentication and profile data';
COMMENT ON TABLE refresh_tokens       IS 'JWT refresh tokens (7-day TTL)';
COMMENT ON TABLE user_activities      IS 'Login/action audit trail per user';
COMMENT ON TABLE categories           IS 'Product category tree (supports subcategories)';
COMMENT ON TABLE shops                IS 'One shop per seller; created on SellerApplication approval';
COMMENT ON TABLE products             IS 'Marketplace listings uploaded by sellers';
COMMENT ON TABLE product_images       IS 'One-to-many product images; first is primary';
COMMENT ON TABLE product_stl_files    IS 'One-to-many STL files per product; bundled as ZIP on download';
COMMENT ON TABLE product_reviews      IS 'Buyer ratings 1-5; one review per (product, user)';
COMMENT ON TABLE printing_requests    IS 'Custom 3D printing jobs: upload STL → quote → print';
COMMENT ON TABLE stl_uploads          IS 'Raw STL file metadata (S3 or local fallback)';
COMMENT ON TABLE carts                IS 'One shopping cart per user';
COMMENT ON TABLE cart_items           IS 'Line items inside a cart';
COMMENT ON TABLE orders               IS 'Completed purchase orders';
COMMENT ON TABLE order_items          IS 'Line items inside an order';
COMMENT ON TABLE payments             IS 'Payment records tied to orders';
COMMENT ON TABLE payment_transactions IS 'Raw gateway transaction log';
COMMENT ON TABLE seller_applications  IS 'BUYER requests to become SELLER; admin approves/rejects';
COMMENT ON TABLE shop_payouts         IS 'Revenue credited to shop per order (after 15% commission)';
COMMENT ON TABLE shop_follows         IS 'Users following shops';
COMMENT ON TABLE shop_reviews         IS 'Buyer ratings of a shop (distinct from product reviews)';
COMMENT ON TABLE chats                IS 'Persistent chat rooms between two users';
COMMENT ON TABLE messages             IS 'Messages inside a chat room';
COMMENT ON TABLE chat_messages        IS 'WebSocket/STOMP direct messages (history store)';
COMMENT ON TABLE notifications        IS 'In-app notifications (order, payment, printing updates)';
COMMENT ON TABLE audit_logs           IS 'System-wide change log (CREATE/UPDATE/DELETE as JSONB)';
COMMENT ON TABLE withdrawals          IS 'Seller wallet withdrawal requests; amount held on create, refunded on reject';
COMMENT ON TABLE wishlist             IS 'Products saved to user wishlists (one row per product-user pair)';

-- ============================================================================
-- VERIFICATION (uncomment to check after running)
-- ============================================================================
-- SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;
-- SELECT typname FROM pg_type WHERE typtype='e' ORDER BY typname;
-- SELECT indexname FROM pg_indexes WHERE schemaname='public' ORDER BY indexname;
-- SELECT * FROM roles;

-- ============================================================================
-- END OF SCHEMA — 29 tables, 9 enums, 75+ indexes
-- ============================================================================
