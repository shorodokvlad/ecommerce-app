package com.shv.Ecommerce.service.impl;

import com.shv.Ecommerce.dto.DashboardStatsDto;
import com.shv.Ecommerce.dto.SalesPointDto;
import com.shv.Ecommerce.entity.OrderItem;
import com.shv.Ecommerce.enums.OrderStatus;
import com.shv.Ecommerce.repository.OrderItemRepo;
import com.shv.Ecommerce.service.interf.IDashboardService;
import com.shv.Ecommerce.specification.OrderItemSpecification;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.time.temporal.IsoFields;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements IDashboardService {

    private static final Set<OrderStatus> REVENUE_EXCLUDED_STATUSES =
            Set.of(OrderStatus.CANCELLED, OrderStatus.RETURNED);

    private static final Set<OrderStatus> PENDING_STATUSES =
            Set.of(OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.SHIPPED);

    private static final DateTimeFormatter DAY_LABEL_FORMAT =
            DateTimeFormatter.ofPattern("HH:00", Locale.ENGLISH);

    private static final DateTimeFormatter WEEKDAY_LABEL_FORMAT =
            DateTimeFormatter.ofPattern("EEE(d.MM)", Locale.ENGLISH);

    private static final DateTimeFormatter WEEK_DATE_FORMAT =
            DateTimeFormatter.ofPattern("d.MM", Locale.ENGLISH);

    private final OrderItemRepo orderItemRepo;

    @Override
    public DashboardStatsDto getDashboardStats(LocalDateTime startDate, LocalDateTime endDate, String period) {
        Specification<OrderItem> spec = Specification.where(OrderItemSpecification.createdBeetween(startDate, endDate));
        List<OrderItem> items = orderItemRepo.findAll(spec);

        BigDecimal totalRevenue = BigDecimal.ZERO;
        Set<Long> orderIds = new HashSet<>();
        Set<Long> customerIds = new HashSet<>();
        long pendingDelivery = 0;

        for (OrderItem item : items) {
            OrderStatus status = item.getStatus();
            if (status == null || !REVENUE_EXCLUDED_STATUSES.contains(status)) {
                if (item.getPrice() != null) {
                    totalRevenue = totalRevenue.add(item.getPrice());
                }
            }
        }

        for (OrderItem item : items) {
            if (item.getOrder() != null && item.getOrder().getId() != null) {
                orderIds.add(item.getOrder().getId());
            }
            if (item.getUser() != null && item.getUser().getId() != null) {
                customerIds.add(item.getUser().getId());
            }
            if (item.getStatus() != null && PENDING_STATUSES.contains(item.getStatus())) {
                pendingDelivery++;
            }
        }

        return DashboardStatsDto.builder()
                .totalRevenue(totalRevenue)
                .totalOrders(orderIds.size())
                .totalCustomers(customerIds.size())
                .pendingDelivery(pendingDelivery)
                .sales(buildSalesSeries(items, startDate, endDate, period))
                .build();
    }
// Aggregate revenue into buckets based on the requested period and (optional) custom date range.
    private List<SalesPointDto> buildSalesSeries(List<OrderItem> items, LocalDateTime startDate, LocalDateTime endDate, String period) {
        SalesPeriod salesPeriod = parsePeriod(period);

        LocalDate today = LocalDate.now();
        LocalDate start = startDate != null ? startDate.toLocalDate() : null;
        LocalDate end = endDate != null ? endDate.toLocalDate() : null;

        LocalDate bucketStart;
        LocalDate bucketEnd;

        switch (salesPeriod) {
            case DAY -> {
                bucketStart = start != null ? start : today;
                bucketEnd = end != null ? end : today;
            }
            case WEEK -> {
                bucketStart = start != null ? start : today;
                bucketEnd = end != null ? end : today;
            }
            case MONTH -> {
                bucketStart = start != null ? start : today.withDayOfMonth(1);
                bucketEnd = end != null ? end : today;
            }
            default -> {
                bucketStart = start != null ? start : today.withDayOfYear(1);
                bucketEnd = end != null ? end : today;
            }
        }

        if (bucketStart.isAfter(bucketEnd)) {
            LocalDate tmp = bucketStart;
            bucketStart = bucketEnd;
            bucketEnd = tmp;
        }

        List<SalesPointDto> sales = new ArrayList<>();

        switch (salesPeriod) {
            case DAY -> {
                LocalDateTime startTime = bucketStart.atStartOfDay();
                LocalDateTime endTime = bucketEnd.atTime(LocalTime.MAX);
                for (LocalDateTime h = startTime; !h.isAfter(endTime); h = h.plusHours(1)) {
                    LocalDateTime hEnd = h.plusHours(1).minusNanos(1);
                    sales.add(point(h.format(DAY_LABEL_FORMAT), revenueBetween(items, h, hEnd)));
                }
            }
            case WEEK -> {
                for (LocalDate d = bucketStart; !d.isAfter(bucketEnd); d = d.plusDays(1)) {
                    sales.add(point(WEEKDAY_LABEL_FORMAT.format(d),
                            revenueBetween(items, d.atStartOfDay(), d.atTime(LocalTime.MAX))));
                }
            }
            case MONTH -> {
                LocalDate monday = bucketStart.minusDays((long) bucketStart.getDayOfWeek().getValue() - 1L);
                while (!monday.isAfter(bucketEnd)) {
                    LocalDate sunday = monday.plusDays(6);
                    int week = monday.get(IsoFields.WEEK_OF_WEEK_BASED_YEAR);
                    String label = monday.equals(sunday)
                            ? "w" + week + "(" + monday.format(WEEK_DATE_FORMAT) + ")"
                            : "w" + week + "(" + monday.format(WEEK_DATE_FORMAT)
                            + " - " + sunday.format(WEEK_DATE_FORMAT) + ")";
                    sales.add(point(label,
                            revenueBetween(items, monday.atStartOfDay(), sunday.atTime(LocalTime.MAX))));
                    monday = monday.plusWeeks(1);
                }
            }
            default -> {
                YearMonth ym = YearMonth.from(bucketStart);
                YearMonth lastMonth = YearMonth.from(bucketEnd);
                while (!ym.isAfter(lastMonth)) {
                    String label = ym.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH);
                    sales.add(point(label,
                            revenueBetween(items, ym.atDay(1).atStartOfDay(), ym.atEndOfMonth().atTime(LocalTime.MAX))));
                    ym = ym.plusMonths(1);
                }
            }
        }

        return sales;
    }

    private BigDecimal revenueBetween(List<OrderItem> items, LocalDateTime from, LocalDateTime to) {
        return items.stream()
                .filter(item -> item.getCreatedAt() != null)
                .filter(item -> item.getStatus() == null || !REVENUE_EXCLUDED_STATUSES.contains(item.getStatus()))
                .filter(item -> {
                    LocalDateTime t = item.getCreatedAt();
                    return !t.isBefore(from) && !t.isAfter(to);
                })
                .map(OrderItem::getPrice)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private SalesPeriod parsePeriod(String period) {
        if (period == null) {
            return SalesPeriod.MONTH;
        }
        try {
            return SalesPeriod.valueOf(period.trim().toUpperCase());
        } catch (IllegalArgumentException ignored) {
            return SalesPeriod.MONTH;
        }
    }

    private SalesPointDto point(String label, BigDecimal revenue) {
        return SalesPointDto.builder().label(label).revenue(revenue).build();
    }

    private enum SalesPeriod {
        DAY, WEEK, MONTH, YEAR
    }
}