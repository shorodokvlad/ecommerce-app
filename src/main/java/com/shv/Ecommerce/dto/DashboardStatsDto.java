package com.shv.Ecommerce.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class DashboardStatsDto {
    private BigDecimal totalRevenue;
    private long totalOrders;
    private long totalCustomers;
    private long pendingDelivery;
    private List<SalesPointDto> sales;
}