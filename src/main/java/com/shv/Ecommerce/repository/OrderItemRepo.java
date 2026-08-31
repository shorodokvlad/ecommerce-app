package com.shv.Ecommerce.repository;

import com.shv.Ecommerce.entity.OrderItem;
import com.shv.Ecommerce.enums.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface OrderItemRepo extends JpaRepository<OrderItem, Long>, JpaSpecificationExecutor<OrderItem> {

    /**
     * Total units sold per product, excluding cancelled/returned order items.
     * Returns rows of [productId, totalSold].
     */
    @Query("SELECT oi.product.id AS productId, SUM(oi.quantity) AS totalSold " +
            "FROM OrderItem oi " +
            "WHERE oi.product IS NOT NULL " +
            "  AND (oi.status IS NULL OR oi.status NOT IN (:excludedStatuses)) " +
            "GROUP BY oi.product.id")
    List<Object[]> findTotalSoldByProduct(@Param("excludedStatuses") Collection<OrderStatus> excludedStatuses);
}
