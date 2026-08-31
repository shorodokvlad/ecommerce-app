package com.shv.Ecommerce.controller;

import com.shv.Ecommerce.dto.DashboardStatsDto;
import com.shv.Ecommerce.dto.Response;
import com.shv.Ecommerce.dto.TopProductsDto;
import com.shv.Ecommerce.service.interf.IDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final IDashboardService dashboardService;

    @GetMapping("/stats")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'MANAGER', 'ADMIN_RESTRICTED')")
    public ResponseEntity<Response> getDashboardStats(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "MONTH") String period
    ) {
        DashboardStatsDto stats = dashboardService.getDashboardStats(startDate, endDate, period);
        return ResponseEntity.ok(Response.builder()
                .status(200)
                .message("Dashboard statistics fetched successfully")
                .dashboardStats(stats)
                .build());
    }

    @GetMapping("/top-products")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'MANAGER', 'ADMIN_RESTRICTED')")
    public ResponseEntity<Response> getTopProducts() {
        TopProductsDto topProducts = dashboardService.getTopProducts();
        return ResponseEntity.ok(Response.builder()
                .status(200)
                .message("Top rated and top selling products fetched successfully")
                .topProducts(topProducts)
                .build());
    }
}