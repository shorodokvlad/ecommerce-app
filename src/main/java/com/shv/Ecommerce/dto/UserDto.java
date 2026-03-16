package com.shv.Ecommerce.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.shv.Ecommerce.enums.UserRole;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
@AllArgsConstructor
@NoArgsConstructor
public class UserDto {
    private Long id;
    private String name;
    private String email;
    private String password;
    private String phoneNumber;
    private UserRole role;
    private List<OrderItemDto> orderItemList;
    private AddressDto address;
}
