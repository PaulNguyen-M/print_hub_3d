# 09 — Dịch vụ in 3D theo yêu cầu & Tải/Xem file STL

> Hai chức năng liên quan tới **file mô hình 3D**: đặt **in 3D theo yêu cầu** (gửi file của bạn để được in),
> và **xem trước mô hình 3D** ngay trên trình duyệt.

---

## PHẦN 1 — DỊCH VỤ IN 3D THEO YÊU CẦU

### 1.1. Là gì?
Người dùng **tải lên file mô hình** (STL/OBJ...), chọn **vật liệu, màu, độ đặc (infill), độ dày lớp, số lượng**,
xem giá ước tính, rồi gửi yêu cầu in. Đây là "in gia công" — khác với mua sản phẩm có sẵn ngoài chợ.

### 1.2. Giao diện 4 bước ([PrintingServicePage.tsx](../frontend/src/pages/PrintingServicePage.tsx))

```
Bước 1: Tải file    →   Bước 2: Cấu hình         →   Bước 3: Xác nhận   →   Bước 4: Xem 3D
(kéo-thả STL)           (vật liệu/màu/infill/...)     (xem giá, gửi)         (xem trước mô hình)
```

Các lựa chọn được định nghĩa sẵn trong file:

```ts
const MATERIALS = [
  { id: 'PLA',  price: 150, ... },   // giá mỗi loại vật liệu (đ/gram)
  { id: 'PETG', price: 200, ... },
  { id: 'RESIN', price: 350, ... }, ...
]
```

### 1.3. Ước tính giá — tính ngay ở frontend

```ts
// Ước lượng đơn giản: cân nặng ≈ dung lượng file / 8000 (gram)
const estimatedWeight = file ? Math.max(20, Math.round(file.size / 8000)) : 0
const materialCost = estimatedWeight * selectedMat.price / 1000
const serviceFee = 50000
const total = Math.round((materialCost + serviceFee) * qty)
```

- Giá **tạm tính** để người dùng tham khảo (cân nặng đoán theo dung lượng file × đơn giá vật liệu + phí dịch vụ 50k).
- Đây chỉ là ước tính hiển thị; giá chính thức do người in xác nhận sau.

### 1.4. Gửi yêu cầu

```ts
const fd = new FormData()
fd.append('file', file)                      // gửi cả FILE nên dùng FormData, không phải JSON
fd.append('material', material)
fd.append('infillDensity', String(infill))
...
await apiClient.post('/printing-requests', fd, {
  headers: { 'Content-Type': 'multipart/form-data' },   // ★ gửi file cần kiểu này
})
```

- Vì có **file đính kèm**, request dùng `multipart/form-data` (không phải JSON như các chức năng khác).

### 1.5. ⚠️ Trạng thái hiện tại của backend (ghi chú trung thực)

- Phía **admin đã có**: xem danh sách yêu cầu in và đổi trạng thái
  ([AdminController](../backend/src/main/java/com/printhub3/backend/controller/AdminController.java)):
  ```java
  @GetMapping("/printing-requests")                     // xem danh sách
  @PutMapping("/printing-requests/{requestId}/status")  // đổi trạng thái (PENDING/PROCESSING/...)
  ```
- **Nhưng** endpoint **tạo** yêu cầu (`POST /api/v1/printing-requests`) mà frontend đang gọi **chưa có controller xử lý**
  trong mã nguồn hiện tại (chỉ có bảng `PrintingRequest` + phần admin). Nghĩa là luồng gửi từ trang dịch vụ **chưa thông suốt** —
  đây là phần **còn dang dở / cần bổ sung**, không phải đã hoàn chỉnh.

> Mình nêu rõ điểm này để bạn không hiểu nhầm là đã chạy được. Nếu muốn, mình có thể viết endpoint
> `POST /printing-requests` để hoàn thiện luồng (nhận file → lưu → tạo `PrintingRequest` PENDING).

### 1.6. Trạng thái yêu cầu in (`ModelStatus`)
Admin điều khiển vòng đời yêu cầu qua `updatePrintingRequestStatus`:

```java
request.setModelStatus(PrintingRequest.ModelStatus.valueOf(status));  // ví dụ PENDING → PROCESSING → COMPLETED
```

---

## PHẦN 2 — TẢI & XEM FILE STL (3D)

### 2.1. Tải file STL của một sản phẩm về (ZIP)
Đã nói ở file [03](03-chi-tiet-san-pham-danh-gia.md) mục 6: `GET /products/{id}/download` gói mọi file STL thành 1 ZIP.
Điểm an toàn: chỉ đọc file trong thư mục `uploads/`, **chống truy cập trái phép đường dẫn** (path traversal):

```java
// ProductService.resolveLocalPath — chặn mánh khoé "../../etc/passwd"
Path resolved = base.resolve(rel).normalize();
return resolved.startsWith(base) ? resolved : null;   // chỉ cho phép trong thư mục uploads
```

### 2.2. Xem trước mô hình 3D ngay trên web
Đây là phần "wow": xoay/zoom mô hình 3D ngay trong trình duyệt, dùng **Three.js** (thư viện đồ hoạ 3D cho web) qua React Three Fiber.

Các mảnh ghép trong [features/stl-viewer/](../frontend/src/features/stl-viewer/):

| File | Vai trò |
|------|---------|
| [StlViewer.tsx](../frontend/src/features/stl-viewer/StlViewer.tsx) | Khung xem 3D chính |
| [StlScene.tsx](../frontend/src/features/stl-viewer/StlScene.tsx) | "Sân khấu" 3D: ánh sáng, camera, nền |
| [StlModel.tsx](../frontend/src/features/stl-viewer/StlModel.tsx) | Nạp file STL → dựng khối 3D |
| [StlControls.tsx](../frontend/src/features/stl-viewer/StlControls.tsx) | Nút xoay/zoom/đổi màu |
| [StlFileViewer.tsx](../frontend/src/features/stl-viewer/StlFileViewer.tsx) | Xem trực tiếp một `File` vừa chọn (dùng ở trang dịch vụ in) |
| [providers/StlViewerProvider.tsx](../frontend/src/features/stl-viewer/providers/StlViewerProvider.tsx) | Cung cấp state chung cho cụm viewer |

### 2.3. Upload file STL riêng ([StlUploadController](../backend/src/main/java/com/printhub3/backend/controller/StlUploadController.java))

```java
@PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
public ... uploadStl(@RequestPart("file") MultipartFile file, ...title, ...material, Principal principal) {
    StlUploadResponse response = stlUploadService.uploadStlFile(file, title, ..., principal.getName());
    return created(response, "STL file uploaded successfully");
}
```

- Nhận file qua `@RequestPart("file")` (multipart).
- `StlUploadService` lưu file (lên S3 hoặc ổ đĩa) + ghi metadata (bảng `StlUpload`).
- `GET /api/v1/stl/**` để **công khai** (xem [WebSecurityConfig](../backend/src/main/java/com/printhub3/backend/config/WebSecurityConfig.java)) nên ai cũng xem/tải model đã upload.

---

## 3. Các file tham gia

| Nhóm | File |
|------|------|
| FE dịch vụ in | [PrintingServicePage.tsx](../frontend/src/pages/PrintingServicePage.tsx) |
| FE xem 3D | [features/stl-viewer/](../frontend/src/features/stl-viewer/) (nhiều file, xem bảng 2.2) |
| BE upload STL | [StlUploadController](../backend/src/main/java/com/printhub3/backend/controller/StlUploadController.java), [StlUploadService](../backend/src/main/java/com/printhub3/backend/service/StlUploadService.java) |
| BE yêu cầu in | (admin) [AdminController](../backend/src/main/java/com/printhub3/backend/controller/AdminController.java), `entity/PrintingRequest.java` — *thiếu endpoint tạo* |
| BE tải ZIP | [ProductController.downloadStlZip](../backend/src/main/java/com/printhub3/backend/controller/ProductController.java) |

---

## 4. Ví dụ chạy thật (phần đã chạy được)

1. Vào trang chi tiết sản phẩm có mô hình → khung 3D hiện lên, kéo chuột **xoay/zoom** mô hình (Three.js).
2. Bấm "Tải file" → `GET /products/42/download` → trình duyệt tải về `rong-than.zip` chứa các file STL.
3. Ở trang Dịch vụ in: kéo-thả file STL của bạn → xem trước 3D (bước 4) + xem giá ước tính.
   *(Bước gửi yêu cầu tới backend hiện chưa hoàn chỉnh — xem mục 1.5.)*

---

## ✅ Hết bộ tài liệu
Quay lại [README.md](README.md) để xem mục lục, hoặc đọc lại [luong-cho-san-pham.md](luong-cho-san-pham.md) cho luồng mẫu chi tiết nhất.
