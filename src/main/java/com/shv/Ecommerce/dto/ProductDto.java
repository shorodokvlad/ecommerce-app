package com.shv.Ecommerce.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
@AllArgsConstructor
@NoArgsConstructor
public class ProductDto {
    private Long id;
    private String name;
    private String description;
    private BigDecimal price;
    private String imageUrl;
    private java.util.List<String> imageUrls;
    private Integer stockQuantity;
    private CategoryDto category;
    private java.util.List<ProductVariantDto> variants;
    private BigDecimal averageRating;
    private Integer reviewCount;

    @JsonProperty("isTopRated")
    private Boolean isTopRated;

    @JsonProperty("isBestSeller")
    private Boolean isBestSeller;
}
