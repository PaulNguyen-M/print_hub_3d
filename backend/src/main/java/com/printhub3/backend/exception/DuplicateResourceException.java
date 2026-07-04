package com.printhub3.backend.exception;

/**
 * Exception thrown when attempting to create a resource that already exists
 */
public class DuplicateResourceException extends RuntimeException {

    private String resourceName;
    private String fieldName;
    private Object fieldValue;

    /**
     * Constructor with message only
     */
    public DuplicateResourceException(String message) {
        super(message);
    }

    /**
     * Constructor with resource details
     */
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
