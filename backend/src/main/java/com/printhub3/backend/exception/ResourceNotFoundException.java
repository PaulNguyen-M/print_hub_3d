package com.printhub3.backend.exception;

/**
 * ResourceNotFoundException — Ném khi không tìm thấy tài nguyên yêu cầu.
 */
public class ResourceNotFoundException extends RuntimeException {

    private String resourceName;
    private String fieldName;
    private Object fieldValue;

    /** Khởi tạo chỉ với thông điệp. */
    public ResourceNotFoundException(String message) {
        super(message);
    }

    /** Khởi tạo với thông điệp và nguyên nhân. */
    public ResourceNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }

    /** Khởi tạo với chi tiết tài nguyên (tên, tên field, giá trị) — tự dựng thông điệp. */
    public ResourceNotFoundException(String resourceName, String fieldName, Object fieldValue) {
        super(String.format("%s not found with %s: '%s'", resourceName, fieldName, fieldValue));
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
