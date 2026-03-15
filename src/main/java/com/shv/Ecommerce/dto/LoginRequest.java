package com.shv.Ecommerce.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {
    @NotBlank(message = "Email number is required")
    private String email;

    @NotBlank(message = "Password number is required")
    private String password;
}
