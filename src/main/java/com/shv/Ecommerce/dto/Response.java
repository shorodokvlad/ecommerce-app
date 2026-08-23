package com.shv.Ecommerce.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class Response {
    private int status;
    private String message;

    private LocalDateTime timeStamp = LocalDateTime.now();

    private String token;
    private String role;
    private String expirationTime;

    private int totalPage;
    private int totalElement;

    private AddressDto address;

    private UserDto user;
    private List<UserDto> userList;

    private CategoryDto category;
    private List<CategoryDto> categoryList;

    private ProductDto product;
    private List<ProductDto> productList;

    private OrderItemDto orderItem;
    private List<OrderItemDto> orderItemList;

    private BannerDto banner;
    private List<BannerDto> bannerList;

    private ReviewDto review;
    private List<ReviewDto> reviewList;

    private DeliveryEstimateDto deliveryEstimate;
    private List<String> countyList;
    private List<LocalityDto> localityList;
    private WarehouseDto warehouse;
    private List<WarehouseDto> warehouseList;

    private DashboardStatsDto dashboardStats;
}
