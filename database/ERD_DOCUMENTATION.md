# Print Hub 3D - Entity Relationship Diagram & Database Documentation

**Version:** 2.0.0  
**Last Updated:** 2026-05-16  
**Database:** PostgreSQL 14+

---

## 📊 ERD Overview

This document provides a comprehensive Entity Relationship Diagram (ERD) for the Print Hub 3D marketplace and 3D printing service platform. The system manages users, products, orders, custom printing requests, payments, and real-time communications.

---

## 🏗️ Database Architecture

### Core Modules:
1. **Authentication & Authorization** - User accounts, roles, JWT tokens
2. **Marketplace** - Products, categories, reviews, inventory
3. **3D Printing Services** - Custom printing requests, uploads, quotes
4. **Orders & Payments** - Order management, cart, payment processing
5. **Communications** - Chat, notifications, real-time messaging
6. **Analytics & Audit** - Activity tracking, audit logs

---

## 📋 Entity Relationships Map

```
┌─────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION LAYER                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Roles ◄─────────┐                                           │
│   (1:N)          │                                           │
│                  ├──────► Users ◄──────────┐                │
│  RefreshTokens   │        (1:N)            │                │
│   (1:N) ◄────────┘                         │                │
│                                      UserActivities         │
│                                           (1:N)             │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    MARKETPLACE LAYER                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Categories ◄────────────┐                                  │
│   (1:N)                  │                                  │
│   (Self-ref)             ├──────► Products                 │
│                          │        (1:N)                    │
│                          │          ├──► ProductImages    │
│                          │          │    (1:N)            │
│                          │          │                      │
│                          │          └──► ProductReviews   │
│                          │               (1:N)            │
│                          │               ├─ Users (N:N)  │
│                          │                                 │
│  Users (Seller) ─────────┘                                │
│   (1:N)                                                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  3D PRINTING SERVICES LAYER                  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  PrintingRequests ◄──────► Users                           │
│   (1:N)                    (1:N)                            │
│     │                                                       │
│     ├──► PrintingRequestFiles (1:N)                        │
│     │                                                       │
│     ├──► PrintingRequestQuotes (1:N)                       │
│     │                                                       │
│     └──► ModelStatus (tracked internally)                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  ORDERS & CART LAYER                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Users ◄──── Cart (1:1)                                     │
│   (1:N)        └──► CartItems (1:N)                         │
│     │                 └─ Products (N:N)                    │
│     │                                                       │
│     └──► Orders (1:N) ◄────┐                              │
│            │                │                              │
│            ├──► OrderItems  │                              │
│            │    (1:N)       │                              │
│            │    └─ Products (N:N)                          │
│            │                │                              │
│            ├──► Payments    │                              │
│            │    (1:N)       │                              │
│            │    └─ PaymentTransactions (1:N)               │
│            │                │                              │
│            └─────────────────┘                             │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                COMMUNICATIONS LAYER                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Chats ◄──────► Users (N:N)                                │
│   (1:N)                                                     │
│     │                                                       │
│     └──► Messages (1:N) ◄──────► Users (N:N)              │
│                                                              │
│  Notifications (1:N) ◄──────► Users (1:N)                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    AUDIT LAYER                               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  AuditLogs (1:N) ◄──────► Users                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📌 Entity Details

### 1️⃣ AUTHENTICATION & USERS

#### **roles**
- `role_id` (PK) - Auto-increment ID
- `name` - Unique role name (ADMIN, SELLER, BUYER, etc.)
- `description` - Role description
- `created_at`, `updated_at` - Timestamps

#### **users**
- `user_id` (PK) - Auto-increment ID
- `email` (UNIQUE) - Email address
- `password_hash` - Encrypted password
- `full_name` - User's full name
- `phone` - Phone number
- `profile_image_url` - Profile picture URL
- `address`, `city`, `state_province`, `postal_code`, `country` - Address details
- `role_id` (FK) - Links to `roles`
- `is_verified` - Email verification status
- `email_verified_at`, `phone_verified_at` - Verification timestamps
- `last_login_at` - Last login timestamp
- `is_active` - Account status
- `created_at`, `updated_at`, `deleted_at` - Timestamps

#### **refresh_tokens**
- `token_id` (PK) - Auto-increment ID
- `user_id` (FK) - Links to `users` (CASCADE delete)
- `token_hash` (UNIQUE) - Hashed refresh token
- `expires_at` - Token expiration time
- `revoked_at` - Revocation timestamp (NULL if active)
- `created_at`, `updated_at` - Timestamps

#### **user_activities**
- `activity_id` (PK) - Auto-increment ID
- `user_id` (FK) - Links to `users` (CASCADE delete)
- `activity_type` - Type of activity (LOGIN, LOGOUT, PURCHASE, etc.)
- `description` - Activity description
- `ip_address` - User's IP address
- `user_agent` - Browser/client information
- `created_at` - Activity timestamp

---

### 2️⃣ MARKETPLACE

#### **categories**
- `category_id` (PK) - Auto-increment ID
- `name` (UNIQUE) - Category name
- `description` - Category description
- `icon_url` - Category icon
- `parent_category_id` (FK, NULLABLE) - Self-reference for subcategories
- `display_order` - Sort order
- `is_active` - Category status
- `created_at`, `updated_at`, `deleted_at` - Timestamps

#### **products**
- `product_id` (PK) - Auto-increment ID
- `name` - Product name
- `description` - Product description
- `price` - Product price (CHECK >= 0)
- `category_id` (FK) - Links to `categories`
- `seller_id` (FK) - Links to `users` (seller)
- `stock_quantity` - Available stock
- `rating` - Average rating (0-5)
- `total_reviews` - Number of reviews
- `total_sold` - Units sold
- `is_active` - Product status
- `created_at`, `updated_at`, `deleted_at` - Timestamps

#### **product_images**
- `image_id` (PK) - Auto-increment ID
- `product_id` (FK) - Links to `products` (CASCADE delete)
- `image_url` - Image URL
- `alt_text` - Alternative text
- `display_order` - Sort order
- `is_primary` - Primary image flag
- `created_at`, `updated_at`, `deleted_at` - Timestamps

#### **product_reviews**
- `review_id` (PK) - Auto-increment ID
- `product_id` (FK) - Links to `products` (CASCADE delete)
- `user_id` (FK) - Links to `users` (CASCADE delete)
- `rating` - Review rating (1-5)
- `comment` - Review text
- `is_verified_purchase` - Verified purchase flag
- `helpful_count` - Helpful votes count
- `created_at`, `updated_at`, `deleted_at` - Timestamps
- **UNIQUE(product_id, user_id)** - One review per user per product

---

### 3️⃣ 3D PRINTING SERVICES

#### **printing_requests**
- `request_id` (PK) - Auto-increment ID
- `user_id` (FK) - Links to `users` (request creator)
- `title` - Request title
- `description` - Request description
- `desired_delivery_date` - Expected delivery
- `budget` - Budget estimate
- `status` - Status enum (REVIEWING, QUOTED, ACCEPTED, PRINTING, COMPLETED, REJECTED)
- `created_at`, `updated_at`, `deleted_at` - Timestamps

#### **printing_request_files**
- `file_id` (PK) - Auto-increment ID
- `request_id` (FK) - Links to `printing_requests` (CASCADE delete)
- `file_url` - Uploaded file path
- `file_size` - File size in bytes
- `file_type` - File type (STL, OBJ, etc.)
- `uploaded_at` - Upload timestamp
- `created_at`, `updated_at` - Timestamps

#### **printing_request_quotes**
- `quote_id` (PK) - Auto-increment ID
- `request_id` (FK) - Links to `printing_requests` (CASCADE delete)
- `seller_id` (FK) - Links to `users` (seller/vendor)
- `quoted_price` - Quoted price
- `delivery_date` - Proposed delivery date
- `description` - Quote details
- `status` - Quote status (PENDING, ACCEPTED, REJECTED)
- `created_at`, `updated_at`, `deleted_at` - Timestamps

---

### 4️⃣ SHOPPING CART & ORDERS

#### **carts**
- `cart_id` (PK) - Auto-increment ID
- `user_id` (FK, UNIQUE) - Links to `users` (one cart per user)
- `created_at`, `updated_at` - Timestamps

#### **cart_items**
- `item_id` (PK) - Auto-increment ID
- `cart_id` (FK) - Links to `carts` (CASCADE delete)
- `product_id` (FK) - Links to `products`
- `quantity` - Item quantity
- `added_at` - Added timestamp

#### **orders**
- `order_id` (PK) - Auto-increment ID
- `user_id` (FK) - Links to `users` (customer)
- `order_number` (UNIQUE) - Order reference number
- `total_amount` - Total order amount
- `status` - Status enum (PENDING, PROCESSING, PRINTING, FINISHING, SHIPPING, DELIVERED, CANCELLED)
- `shipping_address` - Shipping address
- `shipping_date` - Shipped date
- `estimated_delivery_date` - Expected delivery
- `actual_delivery_date` - Actual delivery date
- `notes` - Order notes
- `created_at`, `updated_at`, `deleted_at` - Timestamps

#### **order_items**
- `order_item_id` (PK) - Auto-increment ID
- `order_id` (FK) - Links to `orders` (CASCADE delete)
- `product_id` (FK) - Links to `products`
- `quantity` - Quantity ordered
- `unit_price` - Price at time of order
- `subtotal` - Line item total
- `created_at` - Timestamp

---

### 5️⃣ PAYMENTS

#### **payments**
- `payment_id` (PK) - Auto-increment ID
- `order_id` (FK) - Links to `orders` (CASCADE delete)
- `amount` - Payment amount
- `status` - Status enum (PENDING, PAID, FAILED, REFUNDED)
- `method` - Payment method (CREDIT_CARD, PAYPAL, BANK_TRANSFER, etc.)
- `created_at`, `updated_at` - Timestamps

#### **payment_transactions**
- `transaction_id` (PK) - Auto-increment ID
- `payment_id` (FK) - Links to `payments` (CASCADE delete)
- `transaction_reference` - External payment gateway reference
- `amount` - Transaction amount
- `status` - Transaction status (SUCCESS, FAILED, PENDING)
- `gateway_response` - Payment gateway response
- `created_at` - Timestamp

---

### 6️⃣ COMMUNICATIONS

#### **chats**
- `chat_id` (PK) - Auto-increment ID
- `name` - Chat room name
- `status` - Status enum (ACTIVE, ARCHIVED, BLOCKED)
- `created_at`, `updated_at`, `deleted_at` - Timestamps

#### **chat_users** (junction table)
- `chat_id` (FK) - Links to `chats`
- `user_id` (FK) - Links to `users`
- **PRIMARY KEY(chat_id, user_id)**

#### **messages**
- `message_id` (PK) - Auto-increment ID
- `chat_id` (FK) - Links to `chats` (CASCADE delete)
- `sender_id` (FK) - Links to `users`
- `content` - Message text
- `is_edited` - Edit flag
- `edited_at` - Edit timestamp
- `created_at` - Timestamp

#### **notifications**
- `notification_id` (PK) - Auto-increment ID
- `user_id` (FK) - Links to `users` (CASCADE delete)
- `type` - Type enum (ORDER_CONFIRMATION, MODEL_QUOTE, PAYMENT_CONFIRMATION, etc.)
- `title` - Notification title
- `message` - Notification message
- `reference_id` - Related entity ID
- `is_read` - Read status
- `read_at` - Read timestamp
- `created_at` - Timestamp

---

### 7️⃣ AUDIT LOGGING

#### **audit_logs**
- `log_id` (PK) - Auto-increment ID
- `user_id` (FK, NULLABLE) - Links to `users` (CASCADE delete)
- `entity_name` - Entity being changed
- `entity_id` - ID of changed entity
- `action` - Action type (CREATE, UPDATE, DELETE)
- `changes` - JSON of changes
- `timestamp` - Action timestamp

---

## 🔗 Key Relationships

| Entity A | Relationship | Entity B | Cardinality | Notes |
|----------|--------------|----------|------------|-------|
| users | has | roles | N:1 | Many users per role |
| users | has | refresh_tokens | 1:N | Multiple tokens per user |
| users | generates | user_activities | 1:N | Track user actions |
| users | creates | products | 1:N | User as seller |
| categories | has | products | 1:N | Products in categories |
| products | has | product_images | 1:N | Multiple images per product |
| products | has | product_reviews | 1:N | Multiple reviews per product |
| users | writes | product_reviews | 1:N | One review per user per product |
| users | creates | printing_requests | 1:N | Multiple requests per user |
| printing_requests | has | printing_request_files | 1:N | Multiple files per request |
| printing_requests | receives | printing_request_quotes | 1:N | Multiple quotes per request |
| users | has | carts | 1:1 | One cart per user |
| carts | contains | cart_items | 1:N | Multiple items per cart |
| users | places | orders | 1:N | Multiple orders per user |
| orders | contains | order_items | 1:N | Multiple items per order |
| orders | requires | payments | 1:N | Multiple payments per order |
| payments | has | payment_transactions | 1:N | Multiple transactions per payment |
| chats | includes | users | N:N | Junction: chat_users |
| chats | contains | messages | 1:N | Multiple messages per chat |
| users | sends | messages | 1:N | User sends messages |
| users | receives | notifications | 1:N | Multiple notifications per user |
| users | generates | audit_logs | 1:N | Action audit trail |

---

## 📊 Enum Types

### order_status_enum
- PENDING
- PROCESSING
- PRINTING
- FINISHING
- SHIPPING
- DELIVERED
- CANCELLED

### payment_status_enum
- PENDING
- PAID
- FAILED
- REFUNDED

### upload_model_status_enum
- REVIEWING
- QUOTED
- ACCEPTED
- PRINTING
- COMPLETED
- REJECTED

### notification_type_enum
- ORDER_CONFIRMATION
- ORDER_UPDATE
- PAYMENT_CONFIRMATION
- MODEL_QUOTE
- MODEL_STATUS_UPDATE
- CHAT_MESSAGE
- PROMOTION
- SYSTEM_ALERT

### chat_status_enum
- ACTIVE
- ARCHIVED
- BLOCKED

---

## 🔐 Constraints & Rules

### Data Integrity
- Foreign key constraints with appropriate cascade/restrict rules
- Unique constraints on email, product names, review combinations
- Check constraints for positive prices and valid ratings
- Soft deletes using `deleted_at` field

### Business Rules
- One review per user per product
- One cart per user
- Multiple payments possible per order
- Soft-delete pattern for audit trail preservation
- Timestamps for all audit needs (created_at, updated_at, deleted_at)

### Cascading Rules
- Delete user → Delete all related tokens, activities, products, orders, carts, etc. (CASCADE)
- Delete product → Delete images, reviews (CASCADE)
- Delete order → Delete items, payments, transactions (CASCADE)
- Delete category → Set products to NULL (for subcategories) or RESTRICT parent
- Delete role → RESTRICT (prevent deletion if users assigned)

---

## 📈 Indexes

Recommended indexes for performance:
```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_seller_id ON products(seller_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_cart_user_id ON carts(user_id);
CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
```

---

## ✅ Validation Rules

### Users
- Email must be valid and unique
- Password minimum 8 characters
- Phone must be valid format
- Address fields optional but validate if provided

### Products
- Name required, max 255 characters
- Price > 0
- Stock >= 0
- Rating 0-5

### Orders
- Total amount > 0
- Order number unique
- Status must be valid enum value

### Payments
- Amount > 0
- Method must be valid
- Status must be valid enum value

### Reviews
- Rating 1-5
- Unique per product per user
- Optional comment

---

## 🔄 Transaction Flow Examples

### Order Creation Flow
1. User adds items to cart (cart_items)
2. User initiates checkout → Order created
3. Order items created from cart_items
4. Payment initiated → Payment record created
5. Payment transaction recorded
6. Order status updated to PROCESSING
7. User notification sent

### 3D Printing Request Flow
1. User creates printing request
2. User uploads files
3. Sellers submit quotes
4. User accepts quote → Request status = ACCEPTED
5. Order created from accepted quote
6. Payment processed
7. Printing begins → Status = PRINTING
8. Completion and delivery tracking

### Authentication Flow
1. User login → Validate credentials
2. Generate JWT access token (short-lived)
3. Generate refresh token (stored in DB)
4. User activity logged
5. User login timestamp updated
6. Access token valid for API calls
7. Refresh token used to get new access token when expired

---

## 📝 Notes

- All timestamps use UTC
- Soft deletes preserve data for audit compliance
- JWT tokens managed in refresh_tokens table
- WebSocket for real-time chat and notifications
- Activity logging for security audit trail
- Support for multi-currency (prices in base unit)

