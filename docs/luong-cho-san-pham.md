# Luồng "Chợ Sản Phẩm" (Marketplace) — Giải thích nghiệp vụ & code

> Tài liệu này mô tả điều gì xảy ra khi người dùng bấm vào **"Chợ sản phẩm"**: từ lúc click trên navbar,
> đến khi danh sách sản phẩm hiện ra, lọc/tìm kiếm/phân trang, và bấm vào 1 sản phẩm.
> Mỗi file được giải thích: **nó làm gì** và **ý nghĩa từng đoạn code**.

---

## 1. Bức tranh tổng thể (nghiệp vụ)

"Chợ" (marketplace) là nơi trưng bày **tất cả sản phẩm đang bán** của mọi "sạp" (shop) trên nền tảng.
Người dùng **không cần đăng nhập** vẫn xem được chợ (chỉ khi thêm vào giỏ / mua mới cần).

Luồng nghiệp vụ khi bấm "Chợ sản phẩm":

```
Người dùng bấm "Chợ" trên Navbar
        │
        ▼
React Router đổi URL → /marketplace
        │
        ▼
Component MarketplacePage được render
        │
        ▼
React Query gọi API GET /api/v1/products?page=0&size=12&sort=newest
        │
        ▼
Axios đính kèm token (nếu có) → gửi request tới backend Spring Boot
        │
        ▼
ProductController.getProducts(...) nhận request
        │
        ▼
ProductService.getProducts(...) build câu truy vấn động (Specification)
        │
        ▼
ProductRepository.findAll(spec, pageable) → JPA sinh SQL → truy vấn DB
        │
        ▼
Kết quả (Page<Product>) → map sang ProductDto → bọc trong ApiResponse
        │
        ▼
Frontend nhận JSON → render lưới sản phẩm (ProductCard)
        │
        ▼
Bấm vào 1 card → điều hướng /products/{id} (trang chi tiết)
```

**Nguyên tắc lọc quan trọng (chỉ hiện hàng "sống"):** backend luôn ép 2 điều kiện
`isActive = true` **và** `deletedAt IS NULL`. Sản phẩm bị ẩn/xoá mềm hoặc chưa duyệt sẽ không lên chợ.

---

## 2. Bản đồ các file tham gia

| Lớp | File | Vai trò |
|-----|------|---------|
| Định tuyến | [frontend/src/routes/AppRoutes.tsx](../frontend/src/routes/AppRoutes.tsx) | Khai báo URL `/marketplace` → `MarketplacePage` |
| Giao diện | [frontend/src/features/products/MarketplacePage.tsx](../frontend/src/features/products/MarketplacePage.tsx) | Trang chợ: search, filter, sort, grid, phân trang |
| Gọi API | [frontend/src/api/axios.ts](../frontend/src/api/axios.ts) | Axios client: baseURL, gắn token, xử lý 401 |
| Controller | [backend/.../controller/ProductController.java](../backend/src/main/java/com/printhub3/backend/controller/ProductController.java) | Nhận HTTP `GET /api/v1/products` |
| Service | [backend/.../service/ProductService.java](../backend/src/main/java/com/printhub3/backend/service/ProductService.java) | Logic lọc/sắp xếp, map sang DTO |
| Repository | [backend/.../repository/ProductRepository.java](../backend/src/main/java/com/printhub3/backend/repository/ProductRepository.java) | Truy vấn DB (JPA) |

---

## 3. Frontend — chi tiết từng đoạn code

### 3.1. Định tuyến — `AppRoutes.tsx`

```tsx
<Route path="marketplace" element={<MarketplacePage />} />
```

- Nằm trong `<Route path="/" element={<MainLayout />}>` → nên trang chợ **kèm navbar + footer** chung.
- Khi URL là `/marketplace`, React Router dựng `<MarketplacePage />`.
- Link "Chợ" trên navbar chỉ là một `<Link to="/marketplace">` — bấm vào là đổi URL, **không reload trang** (SPA).

### 3.2. Trang chợ — `MarketplacePage.tsx`

Đây là "bộ não" của màn hình. Có 3 phần: **state (bộ nhớ tạm)**, **gọi API**, và **render giao diện**.

#### a) Khai báo kiểu dữ liệu

```tsx
interface Product { id, title, price, thumbnailUrl?, category?, rating?, ... }
interface PageResponse<T> { content, totalElements, totalPages, size, number }
```

- `Product`: hình dạng 1 sản phẩm mà frontend cần (khớp với `ProductDto` backend trả về).
- `PageResponse<T>`: cấu trúc **phân trang** chuẩn của Spring Data — `content` là mảng sản phẩm của trang hiện tại, `totalPages` để vẽ nút phân trang.

#### b) Hàm gọi API

```tsx
async function fetchProducts(params): Promise<PageResponse<Product>> {
  const query = new URLSearchParams(params).toString()
  const res = await apiClient.get(`/products?${query}`)
  return res.data.data   // ← bóc 2 lớp
}
```

- Ghép object `params` thành query string, ví dụ: `page=0&size=12&sort=newest&search=dragon`.
- `res.data.data`: **bóc 2 lớp** vì backend bọc kết quả trong `ApiResponse` → JSON có dạng
  `{ success, message, data: { content: [...] } }`. Lớp `.data` đầu là của axios, lớp `.data` sau là field trong `ApiResponse`.

#### c) State — bộ nhớ của trang

```tsx
const [search, setSearch]       = useState(searchParams.get('q') ?? '')
const [sort, setSort]           = useState('newest')
const [category, setCategory]   = useState(searchParams.get('category') ?? 'all')
const [priceRange, setPriceRange] = useState<{min,max}|null>(null)
const [page, setPage]           = useState(0)
```

- Mỗi biến là 1 điều kiện lọc. `useSearchParams` cho phép mở chợ với sẵn từ khoá
  (ví dụ từ trang chủ: `/marketplace?q=dragon` hoặc `?category=Miniatures`).
- Mọi lần đổi filter đều `setPage(0)` để quay về trang 1 (tránh "lọc xong mà đang ở trang 5 trống trơn").

#### d) Tự đổi cách sắp xếp theo ngữ cảnh

```tsx
const isFilterMode = search.trim() !== '' || category !== 'all' || priceRange !== null
useEffect(() => {
  if (isFilterMode !== prevFilterMode.current) {
    setSort(isFilterMode ? 'rating' : 'newest')   // đang lọc → ưu tiên đánh giá cao
    setPage(0)
    prevFilterMode.current = isFilterMode
  }
}, [isFilterMode])
```

- **Ý nghĩa nghiệp vụ:** khi người dùng đang **tìm/lọc**, họ muốn thấy hàng "tốt nhất" trước → mặc định sort theo `rating`.
  Khi **duyệt chung**, họ muốn thấy hàng **mới nhất** → `newest`. Người dùng vẫn đổi tay được qua dropdown.
- Dùng `useRef` (`prevFilterMode`) để chỉ chạy khi **chuyển trạng thái** (có→không hoặc ngược lại), tránh ghi đè lựa chọn thủ công.

#### e) Ghép tham số + gọi API bằng React Query

```tsx
const params = useMemo(() => ({
  page: String(page), size: '12', sort,
  ...(search && { search }),
  ...(category !== 'all' && { category }),
  ...(priceRange && { minPrice: ..., maxPrice: ... }),
}), [page, sort, search, category, priceRange])

const { data, isLoading, isError } = useQuery({
  queryKey: ['products', params],
  queryFn: () => fetchProducts(params),
})
```

- `useMemo`: chỉ tạo lại object `params` khi một trong các filter đổi → tránh gọi API thừa.
- Cú pháp `...(search && { search })`: **chỉ thêm** field nếu có giá trị (không gửi `search=` rỗng lên server).
- `useQuery` với `queryKey: ['products', params]` là điểm cốt lõi:
  - **Mỗi tổ hợp filter là 1 cache key riêng.** Đổi filter → key đổi → React Query tự động gọi lại API.
  - Quay lại filter cũ → trả **cache ngay lập tức**, không gọi lại server (nhanh, mượt).
  - `isLoading` / `isError` để hiển thị skeleton / thông báo lỗi.

#### f) Render giao diện (3 trạng thái)

```tsx
{isLoading ? <skeleton x12/>
 : isError  ? <thông báo lỗi>
 : !data?.content?.length ? <"Không tìm thấy sản phẩm">
 : <lưới ProductCard + phân trang>}
```

- **Đang tải:** 12 ô `ProductSkeleton` nhấp nháy → cảm giác nhanh.
- **Lỗi:** khung đỏ "không tải được".
- **Rỗng:** icon gói hàng + "đổi bộ lọc".
- **Có dữ liệu:** `data.content.map(p => <ProductCard product={p} />)`.

#### g) `ProductCard` — 1 ô sản phẩm

```tsx
<Link to={`/products/${product.id}`}>   {/* bấm card → trang chi tiết */}
  <img src={product.thumbnailUrl || placeholder} onError={...fallback} />
  <button onClick={handleAdd}>Thêm vào giỏ</button>   {/* nút hiện khi hover */}
  ...giá, rating, tên sạp...
</Link>
```

- Cả card bọc trong `<Link>` → bấm bất kỳ đâu (trừ nút) là sang trang chi tiết.
- Nút "Thêm vào giỏ" gọi `e.preventDefault()` để **không kích hoạt Link**, rồi `addToCart(product.id, 1)` (Zustand store).
- `formatPrice`: định dạng tiền VND (`toLocaleString('vi-VN', { currency: 'VND' })`).

#### h) Phân trang

```tsx
{data.totalPages > 1 && (
  <button onClick={() => setPage(p => p - 1)} disabled={page === 0}>Trước</button>
  ...các nút số trang...
  <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages-1}>Sau</button>
)}
```

- Đổi `page` → `params` đổi → `queryKey` đổi → React Query tải trang mới. Toàn bộ chuỗi tự động.

### 3.3. Axios client — `axios.ts`

```ts
const apiClient = axios.create({ baseURL: 'http://localhost:8080/api/v1', withCredentials: true })

apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
```

- **baseURL:** nên mọi lời gọi `apiClient.get('/products')` thực chất trỏ tới `http://localhost:8080/api/v1/products`.
- **Request interceptor:** tự gắn token vào mọi request nếu đã đăng nhập. Với chợ, endpoint là public nên **không có token vẫn chạy**.
- **Response interceptor (401):** nếu token hết hạn → xoá session + đá về `/auth/login`. Không ảnh hưởng chợ (public).

---

## 4. Backend — chi tiết từng đoạn code

### 4.1. Controller — `ProductController.java`

```java
@GetMapping                                   // GET /api/v1/products
public ResponseEntity<ApiResponse<Page<ProductDto>>> getProducts(
        @RequestParam(defaultValue = "0")  int page,
        @RequestParam(defaultValue = "12") int size,
        @RequestParam(defaultValue = "newest") String sort,
        @RequestParam(required = false) String search,
        @RequestParam(required = false) String category,
        @RequestParam(required = false) BigDecimal minPrice,
        @RequestParam(required = false) BigDecimal maxPrice) {

    Page<ProductDto> products =
        productService.getProducts(page, size, sort, search, category, minPrice, maxPrice);
    return ResponseEntity.ok(ApiResponse.success(products, "Products retrieved successfully"));
}
```

- **Không có `@PreAuthorize`** → endpoint **public**, ai cũng gọi được (đúng nghiệp vụ chợ).
- `@RequestParam` ánh xạ query string (`?page=&size=&...`) thành tham số Java. `defaultValue` cho giá trị mặc định khi thiếu.
- Controller **rất mỏng**: chỉ nhận request → gọi service → bọc kết quả trong `ApiResponse` (chuẩn hoá format `{ success, message, data }` mà frontend đang bóc ở mục 3.2b).

### 4.2. Service — `ProductService.getProducts(...)`

Đây là nơi chứa **logic nghiệp vụ**. Chia 3 bước: **sắp xếp → điều kiện lọc → truy vấn & map**.

#### Bước 1: Chọn cách sắp xếp

```java
Sort sortObj = switch (sort == null ? "newest" : sort) {
    case "popular"    -> Sort.by(DESC, "totalSold");   // bán chạy
    case "price_asc"  -> Sort.by(ASC,  "price");        // giá tăng dần
    case "price_desc" -> Sort.by(DESC, "price");        // giá giảm dần
    case "rating"     -> Sort.by(DESC, "rating");       // đánh giá cao
    default           -> Sort.by(DESC, "createdAt");    // mới nhất
};
Pageable pageable = PageRequest.of(page, size, sortObj);
```

- Chuỗi `sort` từ frontend (ví dụ `"price_asc"`) được dịch sang tiêu chí sắp xếp thật của DB.
- `PageRequest.of(page, size, sortObj)`: gói **trang + kích thước + sắp xếp** thành 1 object → JPA tự thêm `LIMIT / OFFSET / ORDER BY`.

#### Bước 2: Build điều kiện lọc động (Specification)

```java
Specification<Product> spec = (root, query, cb) -> {
    var predicates = new ArrayList<Predicate>();

    predicates.add(cb.isTrue(root.get("isActive")));      // ★ chỉ hàng đang bán
    predicates.add(cb.isNull(root.get("deletedAt")));     // ★ chưa xoá mềm

    if (search != null && !search.isBlank())              // tìm theo tên (LIKE)
        predicates.add(cb.like(cb.lower(root.get("name")), "%" + search.toLowerCase() + "%"));

    if (category != null && !"all".equalsIgnoreCase(category))   // lọc danh mục
        predicates.add(cb.equal(cb.lower(root.get("category").get("name")), category.toLowerCase()));

    if (minPrice != null) predicates.add(cb.greaterThanOrEqualTo(root.get("price"), minPrice));
    if (maxPrice != null) predicates.add(cb.lessThanOrEqualTo(root.get("price"), maxPrice));

    return cb.and(predicates.toArray(new Predicate[0]));  // nối tất cả bằng AND
};
```

- **Specification = câu WHERE lắp ghép.** Chỉ thêm điều kiện nào **thực sự có giá trị**, nên cùng 1 hàm phục vụ mọi tổ hợp filter mà không cần viết N câu query riêng.
- **2 dòng ★ luôn luôn có** → đảm bảo chợ chỉ hiện hàng "sống" (đây là chốt chặn an toàn nghiệp vụ, dù frontend có gửi gì đi nữa).
- `cb.like(cb.lower(name), "%...%")`: tìm gần đúng, **không phân biệt hoa/thường**.
- `category.get("name")`: **join** sang bảng Category để so tên danh mục.

#### Bước 3: Truy vấn & chuyển sang DTO

```java
return productRepository.findAll(spec, pageable).map(this::mapToProductDto);
```

- `findAll(spec, pageable)`: JPA sinh SQL (WHERE + ORDER BY + LIMIT/OFFSET) → trả `Page<Product>`.
- `.map(this::mapToProductDto)`: đổi **entity DB** → **DTO** (chỉ những field frontend cần, thêm tên sạp, gộp ảnh...). `Page.map` giữ nguyên thông tin phân trang (`totalPages`, `totalElements`).

#### `mapToProductDto` — vì sao cần?

```java
return ProductDto.builder()
    .id(product.getProductId())
    .title(product.getName())
    .price(product.getPrice().doubleValue())
    .thumbnailUrl(getPrimaryImageUrl(product).orElse(null))   // ảnh chính
    .category(categoryName)
    .sellerName(...getFullName()...orElse("Print Hub Creator"))
    .shopName(...).shopSlug(...)          // để card link về sạp
    .rating(...).reviewCount(...)
    .build();
```

- **Không trả thẳng entity** vì entity chứa quan hệ nặng (ảnh, STL, seller, shop...) → dễ lộ dữ liệu thừa và gây lỗi vòng lặp JSON.
- DTO là "hợp đồng" gọn gàng giữa backend và frontend — đúng bằng `interface Product` ở mục 3.2a.
- `getPrimaryImageUrl`: lấy ảnh có `isPrimary = true`, nếu không có thì lấy ảnh đầu tiên.

### 4.3. Repository — `ProductRepository.java`

```java
public interface ProductRepository
        extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {
    ...
}
```

- `JpaRepository`: có sẵn `findById`, `save`, `findAll`, phân trang... khỏi viết SQL.
- `JpaSpecificationExecutor`: cấp hàm `findAll(Specification, Pageable)` — chính là cái Service dùng để lọc động ở bước 3.
- Đây là lý do ta **không phải viết một dòng SQL nào** cho tính năng lọc phức tạp này.

---

## 5. Ví dụ chạy thật: người dùng gõ "dragon", chọn danh mục "Miniatures"

1. **Frontend:** `search = "dragon"`, `category = "Miniatures"` → `isFilterMode = true` → sort tự đổi thành `rating`, `page = 0`.
2. `params` = `{ page:"0", size:"12", sort:"rating", search:"dragon", category:"Miniatures" }`.
3. React Query thấy `queryKey` mới → gọi
   `GET /api/v1/products?page=0&size=12&sort=rating&search=dragon&category=Miniatures`.
4. **Axios** gắn token (nếu đăng nhập) → gửi tới `localhost:8080`.
5. **Controller** nhận, map các `@RequestParam`, gọi `productService.getProducts(...)`.
6. **Service:**
   - `sortObj = Sort by rating DESC`.
   - Specification = `isActive=true AND deletedAt IS NULL AND name LIKE '%dragon%' AND category.name = 'miniatures'`.
7. **Repository** `findAll(spec, pageable)` → SQL:
   ```sql
   SELECT * FROM products p JOIN categories c ON ...
   WHERE p.is_active = true AND p.deleted_at IS NULL
     AND LOWER(p.name) LIKE '%dragon%' AND LOWER(c.name) = 'miniatures'
   ORDER BY p.rating DESC LIMIT 12 OFFSET 0;
   ```
8. Kết quả `Page<Product>` → `.map(mapToProductDto)` → bọc `ApiResponse` → JSON trả về.
9. **Frontend** bóc `res.data.data`, `isLoading = false` → render lưới `ProductCard`, hiện tổng số ở header (`data.totalElements`).
10. Người dùng **bấm 1 card** → `<Link to="/products/42">` → Router dựng `ProductDetailPage` (một luồng tương tự, gọi `GET /products/42`).

---

## 6. Tóm tắt "ai làm gì"

| Câu hỏi | Trả lời |
|---------|---------|
| Ai quyết định URL nào ra trang nào? | `AppRoutes.tsx` |
| Ai giữ trạng thái filter/sort/page? | `useState` trong `MarketplacePage.tsx` |
| Ai gọi server và cache kết quả? | React Query (`useQuery` + `queryKey`) |
| Ai gắn token & xử lý hết hạn? | Interceptor trong `axios.ts` |
| Ai nhận HTTP request? | `ProductController.getProducts` |
| Ai chứa logic lọc/sắp xếp? | `ProductService.getProducts` (Specification) |
| Ai đảm bảo chỉ hiện hàng "sống"? | 2 điều kiện `isActive` + `deletedAt` trong Specification |
| Ai chạy SQL? | `ProductRepository` (JPA + Specification) |
| Ai chuyển entity → dữ liệu gọn cho FE? | `mapToProductDto` |

> **Điểm mấu chốt cần nhớ:** filter/sort/page ở frontend chỉ là *state* → khi đổi, chúng biến thành *query string* →
> backend dịch thành *Specification (WHERE)* + *Pageable (ORDER BY/LIMIT)* → JPA sinh *SQL*. Toàn bộ chuỗi
> được React Query tự động kích hoạt lại mỗi khi `queryKey` thay đổi.
