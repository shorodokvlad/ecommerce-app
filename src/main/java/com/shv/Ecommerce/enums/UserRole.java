package com.shv.Ecommerce.enums;

public enum UserRole {
    // Stored as ORDINAL in the DB - new values must be appended at the end
    ADMIN,
    USER,
    ADMIN_RESTRICTED,
    MANAGER
}
