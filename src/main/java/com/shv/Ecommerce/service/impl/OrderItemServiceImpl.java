package com.shv.Ecommerce.service.impl;

import com.shv.Ecommerce.dto.OrderItemDto;
import com.shv.Ecommerce.dto.OrderRequest;
import com.shv.Ecommerce.dto.Response;
import com.shv.Ecommerce.entity.Order;
import com.shv.Ecommerce.entity.OrderItem;
import com.shv.Ecommerce.entity.Product;
import com.shv.Ecommerce.entity.User;
import com.shv.Ecommerce.enums.OrderStatus;
import com.shv.Ecommerce.exception.NotFoundException;
import com.shv.Ecommerce.mapper.EntityDtoMapper;
import com.shv.Ecommerce.repository.OrderItemRepo;
import com.shv.Ecommerce.repository.OrderRepo;
import com.shv.Ecommerce.repository.ProductRepo;
import com.shv.Ecommerce.service.interf.IOrderItemService;
import com.shv.Ecommerce.service.interf.IUserService;
import com.shv.Ecommerce.specification.OrderItemSpecification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;


import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class OrderItemServiceImpl implements IOrderItemService {
    private final OrderRepo orderRepo;
    private final OrderItemRepo orderItemRepo;
    private final ProductRepo productRepo;
    private final IUserService userService;
    private final EntityDtoMapper entityDtoMapper;
    @Override
    public Response placeOrder(OrderRequest orderRequest) {
        User user = userService.getLoginUser();

        // map order request items to order entities
        List<OrderItem> orderItems = orderRequest.getItems().stream().map(orderItemRequest ->{
            Product product = productRepo.findById(orderItemRequest.getProductId())
                    .orElseThrow(()->new NotFoundException("Product not found"));

            OrderItem orderItem = new OrderItem();
            orderItem.setProduct(product);
            orderItem.setQuantity(orderItemRequest.getQuantity());
            orderItem.setPrice(product.getPrice()
                    .multiply(BigDecimal.valueOf(orderItemRequest.getQuantity())));

            orderItem.setStatus(OrderStatus.PENDING);
            orderItem.setUser(user);

            return orderItem;

        }).toList();

        // Calculate the total price
        BigDecimal totalPrice = orderRequest.getTotalPrice() != null && orderRequest.getTotalPrice().compareTo(BigDecimal.ZERO) > 0
                ? orderRequest.getTotalPrice()
                : orderItems.stream().map(OrderItem::getPrice).reduce(BigDecimal.ZERO, BigDecimal::add);

        // Create order entity
        Order order = new Order();
        order.setOrderItemList(orderItems);
        order.setTotalPrice(totalPrice);

        // Set the order reference in each order item
        orderItems.forEach(orderItem -> orderItem.setOrder(order));

        orderRepo.save(order);

        return Response.builder()
                .status(200)
                .message("Order was successfully placed")
                .build();
    }

    @Override
    public Response updateOrderItemStatus(Long orderItemId, String status) {
        OrderItem orderItem = orderItemRepo.findById(orderItemId)
                .orElseThrow(()->new NotFoundException("Order Item not found"));

        orderItem.setStatus(OrderStatus.valueOf(status.toUpperCase()));
        orderItemRepo.save(orderItem);

        return Response.builder()
                .status(200)
                .message("Order status updated successfully")
                .build();
    }

    @Override
    public Response filterOrderItems(OrderStatus status, LocalDateTime startDate, LocalDateTime endDate, Long itemId, Pageable pageable) {
        Specification<OrderItem> spec = Specification.where(OrderItemSpecification.hasStatus(status))
                .and(OrderItemSpecification.createdBeetween(startDate, endDate))
                .and(OrderItemSpecification.hasItemId(itemId));

        Page<OrderItem> orderItemPage = orderItemRepo.findAll(spec, pageable);

        if (orderItemPage.isEmpty()) {
            throw new NotFoundException("No Order Found");
        }

        List<OrderItemDto> orderItemDtos = orderItemPage.getContent().stream()
                .map(entityDtoMapper::mapOrderItemToDtoPlusProductAndUser)
                .toList();

        return Response.builder()
                .status(200)
                .orderItemList(orderItemDtos)
                .totalPage(orderItemPage.getTotalPages())
                .totalElement((int) orderItemPage.getTotalElements())
                .build();
    }
}
