package com.shv.Ecommerce.mapper;

import com.shv.Ecommerce.dto.*;
import com.shv.Ecommerce.entity.*;
import com.shv.Ecommerce.enums.UserRole;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
public class EntityDtoMapper {

    // User entity to User DTO
    public UserDto mapUserToDtoBasic(User user) {
        UserDto userDto = new UserDto();
        userDto.setId(user.getId());
        userDto.setPhoneNumber(user.getPhoneNumber());
        userDto.setEmail(user.getEmail());
        userDto.setRole(UserRole.valueOf(user.getRole().name()));
        userDto.setName(user.getName());

        return userDto;
    }

    // Address to DTO Basic
    public AddressDto mapAddressToDtoBasic(Address address) {
        AddressDto addressDto = new AddressDto();
        addressDto.setId(address.getId());
        addressDto.setCity(address.getCity());
        addressDto.setStreet(address.getStreet());
        addressDto.setState(address.getState());
        addressDto.setCountry(address.getCountry());
        addressDto.setZipCode(address.getZipCode());

        return addressDto;
    }

    // Category to DTO Basic
    public CategoryDto mapCategoryToDtoBasic(Category category) {
        CategoryDto categoryDto = new CategoryDto();
        categoryDto.setId(category.getId());
        categoryDto.setName(category.getName());

        if (category.getProductList() != null && !category.getProductList().isEmpty()) {
            category.getProductList().stream()
                    .filter(p -> p.getImageUrl() != null && !p.getImageUrl().isBlank())
                    .findFirst()
                    .ifPresent(p -> categoryDto.setImageUrl(p.getImageUrl()));
        }

        return categoryDto;
    }

    // OrderItem to DTO Basic
    public OrderItemDto mapOrderItemToDtoBasic(OrderItem orderItem) {
        OrderItemDto orderItemDto = new OrderItemDto();
        orderItemDto.setId(orderItem.getId());
        orderItemDto.setQuantity(orderItem.getQuantity());
        orderItemDto.setPrice(orderItem.getPrice());
        orderItemDto.setStatus(orderItem.getStatus().name());
        orderItemDto.setVariantId(orderItem.getVariantId());
        orderItemDto.setVariantTitle(orderItem.getVariantTitle());
        orderItemDto.setVariantImageUrl(orderItem.getVariantImageUrl());
        if (orderItem.getVariantAttributes() != null && !orderItem.getVariantAttributes().isEmpty()) {
            orderItemDto.setVariantAttributes(new java.util.HashMap<>(orderItem.getVariantAttributes()));
        }
        orderItemDto.setCreatedAt(orderItem.getCreatedAt());

        return orderItemDto;
    }


    // ProductVariant to DTO Basic
    public com.shv.Ecommerce.dto.ProductVariantDto mapProductVariantToDtoBasic(com.shv.Ecommerce.entity.ProductVariant variant) {
        com.shv.Ecommerce.dto.ProductVariantDto dto = new com.shv.Ecommerce.dto.ProductVariantDto();
        dto.setId(variant.getId());
        dto.setTitle(variant.getTitle());
        if (variant.getAttributes() != null && !variant.getAttributes().isEmpty()) {
            dto.setAttributes(new java.util.HashMap<>(variant.getAttributes()));
        }
        dto.setPrice(variant.getPrice());
        dto.setStockQuantity(variant.getStockQuantity());
        if (variant.getImageUrls() != null && !variant.getImageUrls().isEmpty()) {
            dto.setImageUrls(new java.util.ArrayList<>(variant.getImageUrls()));
        }
        if (variant.getWarehouseStocks() != null && !variant.getWarehouseStocks().isEmpty()) {
            dto.setStockByWarehouse(variant.getWarehouseStocks().stream()
                    .map(this::mapWarehouseStockToDtoBasic)
                    .toList());
        }
        return dto;
    }

    // Product to DTO Basic
    public ProductDto mapProductToDtoBasic(Product product) {
        ProductDto productDto = new ProductDto();
        productDto.setId(product.getId());
        productDto.setName(product.getName());
        productDto.setDescription(product.getDescription());
        productDto.setPrice(product.getPrice());
        productDto.setImageUrl(product.getImageUrl());
        productDto.setStockQuantity(product.getStockQuantity());

        // Only id + name: avoids lazily loading the category's whole product list
        if (product.getCategory() != null) {
            CategoryDto categoryDto = new CategoryDto();
            categoryDto.setId(product.getCategory().getId());
            categoryDto.setName(product.getCategory().getName());
            productDto.setCategory(categoryDto);
        }

        if (product.getImageUrls() != null && !product.getImageUrls().isEmpty()) {
            productDto.setImageUrls(new java.util.ArrayList<>(product.getImageUrls()));
        } else if (product.getImageUrl() != null && !product.getImageUrl().isBlank()) {
            productDto.setImageUrls(java.util.List.of(product.getImageUrl()));
        }

        if (product.getVariants() != null && !product.getVariants().isEmpty()) {
            productDto.setVariants(product.getVariants().stream()
                    .map(this::mapProductVariantToDtoBasic)
                    .toList());
        }

        return productDto;
    }

    public UserDto mapUserToDtoPlusAddress(User user) {
        UserDto userDto = mapUserToDtoBasic(user);

        if (user.getAddress() != null) {
            AddressDto addressDto = mapAddressToDtoBasic(user.getAddress());
            userDto.setAddress(addressDto);
        }

        return userDto;
    }

    // Order to DTO plus Product
    public OrderItemDto mapOrderItemToDtoPlusAProduct(OrderItem orderItem) {

        OrderItemDto orderItemDto = mapOrderItemToDtoBasic(orderItem);

        if (orderItem.getProduct() != null) {
            ProductDto productDto = mapProductToDtoBasic(orderItem.getProduct());
            orderItemDto.setProductDto(productDto);
        }

        return orderItemDto;
    }



    // OrderItem to DTO plus product and user
    public OrderItemDto mapOrderItemToDtoPlusProductAndUser(OrderItem orderItem) {
        OrderItemDto orderItemDto = mapOrderItemToDtoPlusAProduct(orderItem);
        if (orderItem.getUser() != null) {
            UserDto userDto = mapUserToDtoPlusAddress(orderItem.getUser());
            orderItemDto.setUserDto(userDto);
        }
        return orderItemDto;
    }

    // User to DTO with Addresss and Order Items History
    public UserDto mapUserToDtoPlusAddressAndOrderHistory(User user) {
        UserDto userDto = mapUserToDtoPlusAddress(user);

        if (user.getOrderItemList() != null && !user.getOrderItemList().isEmpty()) {
            userDto.setOrderItemList(user.getOrderItemList()
                    .stream()
                    .map(this::mapOrderItemToDtoPlusAProduct)
                    .collect(Collectors.toList()));
        }
        return userDto;
    }

    // Banner entity to Banner DTO
    public BannerDto mapBannerToDtoBasic(Banner banner) {
        BannerDto bannerDto = new BannerDto();
        bannerDto.setId(banner.getId());
        bannerDto.setTitle(banner.getTitle());
        bannerDto.setLinkUrl(banner.getLinkUrl());
        bannerDto.setImageUrl(banner.getImageUrl());
        bannerDto.setActive(banner.isActive());
        bannerDto.setDisplayOrder(banner.getDisplayOrder());
        bannerDto.setCreatedAt(banner.getCreatedAt());
        return bannerDto;
    }

    // WarehouseStock to DTO Basic
    public WarehouseStockDto mapWarehouseStockToDtoBasic(WarehouseStock warehouseStock) {
        WarehouseStockDto dto = new WarehouseStockDto();
        dto.setId(warehouseStock.getId());
        dto.setQuantity(warehouseStock.getQuantity());

        if (warehouseStock.getWarehouse() != null) {
            dto.setWarehouseId(warehouseStock.getWarehouse().getId());
            dto.setWarehouseName(warehouseStock.getWarehouse().getName());
        }

        if (warehouseStock.getVariant() != null) {
            dto.setVariantId(warehouseStock.getVariant().getId());
            dto.setVariantTitle(warehouseStock.getVariant().getTitle());
            if (warehouseStock.getVariant().getProduct() != null) {
                dto.setProductId(warehouseStock.getVariant().getProduct().getId());
                dto.setProductName(warehouseStock.getVariant().getProduct().getName());
                dto.setProductImageUrl(warehouseStock.getVariant().getProduct().getImageUrl());
            }
        }

        return dto;
    }

    // Warehouse to DTO Basic
    public WarehouseDto mapWarehouseToDtoBasic(Warehouse warehouse) {
        WarehouseDto dto = new WarehouseDto();
        dto.setId(warehouse.getId());
        dto.setName(warehouse.getName());
        dto.setStreet(warehouse.getStreet());
        dto.setCity(warehouse.getCity());
        dto.setState(warehouse.getState());
        dto.setZipCode(warehouse.getZipCode());
        dto.setCountry(warehouse.getCountry());
        return dto;
    }

    // Review entity to Review DTO
    public ReviewDto mapReviewToDtoBasic(Review review) {
        ReviewDto reviewDto = new ReviewDto();
        reviewDto.setId(review.getId());
        reviewDto.setContent(review.getContent());
        reviewDto.setRating(review.getRating());
        reviewDto.setCreatedAt(review.getCreatedAt());

        if (review.getUser() != null) {
            reviewDto.setUserId(review.getUser().getId());
            reviewDto.setUserName(review.getUser().getName());
        }

        return reviewDto;
    }
}
