package com.shv.Ecommerce.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
@AllArgsConstructor
@NoArgsConstructor
public class  OrderItemDto {
    private Long id;
    private int quantity;
    private BigDecimal price;
    private String status;
    private UserDto userDto;
    private ProductDto productDto;

    private LocalDateTime createdAt;
}
