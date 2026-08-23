package com.shv.Ecommerce.service.interf;

import com.shv.Ecommerce.dto.DashboardStatsDto;

import java.time.LocalDateTime;

public interface IDashboardService {
    DashboardStatsDto getDashboardStats(LocalDateTime startDate, LocalDateTime endDate, String period);
}