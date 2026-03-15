package com.shv.Ecommerce.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
@AllArgsConstructor
@NoArgsConstructor
public class AddressDto {
    private Long id;

    private String street;
    private String city;
    private String state;
    private String zipCode;
    private String country;

    private UserDto user;

    private final LocalDateTime createdAt = LocalDateTime.now();
}
