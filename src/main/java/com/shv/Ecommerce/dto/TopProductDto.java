package com.shv.Ecommerce.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class TopProductDto {
    private Integer rank;
    private Long productId;
    private String name;
    private String imageUrl;
    private Long categoryId;
    private String categoryName;
    private BigDecimal price;

    // Top selling products: total units sold (excluding cancelled/returned orders)
    private Long totalSold;

    // Top rated products: average rating rounded to 1 decimal + number of reviews
    private BigDecimal averageRating;
    private Integer reviewCount;
}