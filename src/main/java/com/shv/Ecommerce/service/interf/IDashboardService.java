package com.shv.Ecommerce.service.interf;

import com.shv.Ecommerce.dto.DashboardStatsDto;
import com.shv.Ecommerce.dto.TopProductsDto;

import java.time.LocalDateTime;

public interface IDashboardService {
    DashboardStatsDto getDashboardStats(LocalDateTime startDate, LocalDateTime endDate, String period);

    /**
     * Builds the admin dashboard "leaderboard" data:
     *  - top rated products (average rating >= 4.8, ordered by rating then review count)
     *  - top selling products (best seller per category by units sold,
     *    excluding cancelled/returned order items)
     */
    TopProductsDto getTopProducts();
}