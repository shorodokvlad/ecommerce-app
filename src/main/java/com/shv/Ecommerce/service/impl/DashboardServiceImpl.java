package com.shv.Ecommerce.service.impl;

import com.shv.Ecommerce.dto.DashboardStatsDto;
import com.shv.Ecommerce.dto.SalesPointDto;
import com.shv.Ecommerce.dto.TopProductDto;
import com.shv.Ecommerce.dto.TopProductsDto;
import com.shv.Ecommerce.entity.OrderItem;
import com.shv.Ecommerce.entity.Product;
import com.shv.Ecommerce.enums.OrderStatus;
import com.shv.Ecommerce.repository.OrderItemRepo;
import com.shv.Ecommerce.repository.ProductRepo;
import com.shv.Ecommerce.repository.ReviewRepo;
import com.shv.Ecommerce.service.interf.IDashboardService;
import com.shv.Ecommerce.specification.OrderItemSpecification;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.time.temporal.IsoFields;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements IDashboardService {

    private static final Set<OrderStatus> REVENUE_EXCLUDED_STATUSES =
            Set.of(OrderStatus.CANCELLED, OrderStatus.RETURNED);

    private static final Set<OrderStatus> PENDING_STATUSES =
            Set.of(OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.SHIPPED);

    private static final BigDecimal TOP_RATED_THRESHOLD = new BigDecimal("4.8");
    private static final int TOP_PRODUCTS_LIMIT = 8;

    private static final DateTimeFormatter DAY_LABEL_FORMAT =
            DateTimeFormatter.ofPattern("HH:00", Locale.ENGLISH);

    private static final DateTimeFormatter WEEKDAY_LABEL_FORMAT =
            DateTimeFormatter.ofPattern("EEE(d.MM)", Locale.ENGLISH);

    private static final DateTimeFormatter WEEK_DATE_FORMAT =
            DateTimeFormatter.ofPattern("d.MM", Locale.ENGLISH);

    private final OrderItemRepo orderItemRepo;
    private final ProductRepo productRepo;
    private final ReviewRepo reviewRepo;

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

    @Override
    @Cacheable(cacheNames = "topProducts", key = "'all'")
    public TopProductsDto getTopProducts() {
        return TopProductsDto.builder()
                .topSellingProducts(buildTopSellingProducts())
                .topRatedProducts(buildTopRatedProducts())
                .build();
    }

    private List<TopProductDto> buildTopSellingProducts() {
        Map<Long, Long> totalSoldByProduct = new HashMap<>();
        for (Object[] row : orderItemRepo.findTotalSoldByProduct(REVENUE_EXCLUDED_STATUSES)) {
            Long productId = row[0] != null ? ((Number) row[0]).longValue() : null;
            long totalSold = row[1] != null ? ((Number) row[1]).longValue() : 0L;
            if (productId != null) {
                totalSoldByProduct.put(productId, totalSold);
            }
        }

        if (totalSoldByProduct.isEmpty()) {
            return List.of();
        }

        Map<Long, Product> productById = productRepo.findAllById(totalSoldByProduct.keySet()).stream()
                .collect(Collectors.toMap(Product::getId, Function.identity()));

        // Best seller per category (products without a category are their own group).
        Map<Object, SalesEntry> bestPerCategory = new LinkedHashMap<>();
        for (Map.Entry<Long, Long> entry : totalSoldByProduct.entrySet()) {
            Product product = productById.get(entry.getKey());
            if (product == null) {
                continue;
            }
            Object groupKey = product.getCategory() != null
                    ? product.getCategory().getId()
                    : "p" + product.getId();
            SalesEntry candidate = new SalesEntry(product, entry.getValue());
            SalesEntry current = bestPerCategory.get(groupKey);
            if (current == null || candidate.totalSold() > current.totalSold()
                    || (candidate.totalSold() == current.totalSold()
                    && candidate.product().getId() < current.product().getId())) {
                bestPerCategory.put(groupKey, candidate);
            }
        }

        List<SalesEntry> winners = new ArrayList<>(bestPerCategory.values());
        winners.sort(Comparator
                .comparingLong(SalesEntry::totalSold).reversed()
                .thenComparing(entry -> entry.product().getName(), String.CASE_INSENSITIVE_ORDER));

        List<TopProductDto> result = new ArrayList<>();
        for (int i = 0; i < Math.min(winners.size(), TOP_PRODUCTS_LIMIT); i++) {
            SalesEntry entry = winners.get(i);
            result.add(toTopProductDto(entry.product(), i + 1)
                    .totalSold(entry.totalSold())
                    .build());
        }
        return result;
    }

    private List<TopProductDto> buildTopRatedProducts() {
        List<RatedEntry> ratedEntries = new ArrayList<>();
        for (Object[] row : reviewRepo.findAverageRatingByProduct()) {
            Long productId = row[0] != null ? ((Number) row[0]).longValue() : null;
            double average = row[1] != null ? ((Number) row[1]).doubleValue() : 0;
            int reviewCount = row[2] != null ? ((Number) row[2]).intValue() : 0;
            if (productId == null) {
                continue;
            }
            BigDecimal rounded = BigDecimal.valueOf(average).setScale(1, RoundingMode.HALF_UP);
            if (rounded.compareTo(TOP_RATED_THRESHOLD) >= 0) {
                ratedEntries.add(new RatedEntry(productId, rounded, reviewCount));
            }
        }

        if (ratedEntries.isEmpty()) {
            return List.of();
        }

        ratedEntries.sort(Comparator
                .comparing(RatedEntry::averageRating).reversed()
                .thenComparing(Comparator.comparingInt(RatedEntry::reviewCount).reversed()));

        List<Long> productIds = ratedEntries.stream().map(RatedEntry::productId).toList();
        Map<Long, Product> productById = productRepo.findAllById(productIds).stream()
                .collect(Collectors.toMap(Product::getId, Function.identity()));

        List<TopProductDto> result = new ArrayList<>();
        for (int i = 0; i < Math.min(ratedEntries.size(), TOP_PRODUCTS_LIMIT); i++) {
            RatedEntry entry = ratedEntries.get(i);
            Product product = productById.get(entry.productId());
            if (product == null) {
                continue;
            }
            result.add(toTopProductDto(product, i + 1)
                    .averageRating(entry.averageRating())
                    .reviewCount(entry.reviewCount())
                    .build());
        }
        return result;
    }

    private TopProductDto.TopProductDtoBuilder toTopProductDto(Product product, int rank) {
        TopProductDto.TopProductDtoBuilder builder = TopProductDto.builder()
                .rank(rank)
                .productId(product.getId())
                .name(product.getName())
                .imageUrl(product.getImageUrl())
                .price(product.getPrice());
        if (product.getCategory() != null) {
            builder.categoryId(product.getCategory().getId());
            builder.categoryName(product.getCategory().getName());
        }
        return builder;
    }

    private record SalesEntry(Product product, long totalSold) {}

    private record RatedEntry(Long productId, BigDecimal averageRating, int reviewCount) {}

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
                // Default: the full current ISO week, Monday through Sunday
                LocalDate monday = today.minusDays((long) today.getDayOfWeek().getValue() - 1L);
                bucketStart = start != null ? start : monday;
                bucketEnd = end != null ? end : monday.plusDays(6);
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
                            ? "W" + week + "(" + monday.format(WEEK_DATE_FORMAT) + ")"
                            : "W" + week + "(" + monday.format(WEEK_DATE_FORMAT)
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