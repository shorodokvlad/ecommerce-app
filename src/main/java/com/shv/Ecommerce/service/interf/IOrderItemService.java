package com.shv.Ecommerce.service.interf;

import com.shv.Ecommerce.dto.OrderRequest;
import com.shv.Ecommerce.dto.Response;
import com.shv.Ecommerce.enums.OrderStatus;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;

public interface IOrderItemService {
    Response placeOrder(OrderRequest orderRequest);

    Response updateOrderItemStatus(Long orderItemId, String status);

    Response filterOrderItems(OrderStatus status, LocalDateTime startDate, LocalDateTime endDate, Long itemId, Pageable pageable);

}
