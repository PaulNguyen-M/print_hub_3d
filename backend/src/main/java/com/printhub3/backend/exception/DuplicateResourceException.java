package com.printhub3.backend.exception;

/**
 * DuplicateResourceException — Ném khi tạo một tài nguyên đã tồn tại (vd email trùng).
 */
public class DuplicateResourceException extends RuntimeException {

    private String resourceName;
    private String fieldName;
    private Object fieldValue;

    /** Khởi tạo chỉ với thông điệp. */
    public DuplicateResourceException(String message) {
        super(message);
    }

    /** Khởi tạo với chi tiết tài nguyên (tên, tên field, giá trị) — tự dựng thông điệp. */
    public DuplicateResourceException(String resourceName, String fieldName, Object fieldValue) {
        super(String.format("%s already exists with %s: '%s'", resourceName, fieldName, fieldValue));
        this.resourceName = resourceName;
        this.fieldName = fieldName;
        this.fieldValue = fieldValue;
    }

    public String getResourceName() {
        return resourceName;
    }

    public String getFieldName() {
        return fieldName;
    }

    public Object getFieldValue() {
        return fieldValue;
    }
}
