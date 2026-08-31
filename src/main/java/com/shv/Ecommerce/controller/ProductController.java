package com.shv.Ecommerce.controller;

import com.shv.Ecommerce.dto.Response;
import com.shv.Ecommerce.exception.InvalidCredentialsException;
import com.shv.Ecommerce.service.interf.IProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;

@RestController
@RequestMapping("/product")
@RequiredArgsConstructor
public class ProductController {
    private final IProductService productService;

    @PostMapping("/create")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'MANAGER')")
    public ResponseEntity<Response> createProduct(
            @RequestParam Long categoryId,
            @RequestParam(required = false) MultipartFile image,
            @RequestParam(required = false) java.util.List<MultipartFile> images,
            @RequestParam String name,
            @RequestParam String description,
            @RequestParam(required = false) BigDecimal price,
            @RequestParam(required = false) Integer stockQuantity,
            @RequestParam(required = false) String variantsJson,
            jakarta.servlet.http.HttpServletRequest request
    ) {
        if (categoryId == null || name == null || name.isEmpty() || description == null || description.isEmpty()) {
            throw new InvalidCredentialsException("Category, Name, and Description are required");
        }

        java.util.Map<Integer, java.util.List<MultipartFile>> variantImagesMap = extractVariantImages(request);
        return ResponseEntity.ok(productService.createProduct(categoryId, image, images, name, description, price, stockQuantity, variantsJson, variantImagesMap));
    }

    @PutMapping("/update")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'MANAGER')")
    public ResponseEntity<Response> updateProduct(
            @RequestParam Long productId,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) MultipartFile image,
            @RequestParam(required = false) java.util.List<MultipartFile> images,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) BigDecimal price,
            @RequestParam(required = false) Integer stockQuantity,
            @RequestParam(required = false) java.util.List<String> existingImageUrls,
            @RequestParam(required = false) String variantsJson,
            jakarta.servlet.http.HttpServletRequest request
    ) {
        java.util.Map<Integer, java.util.List<MultipartFile>> variantImagesMap = extractVariantImages(request);
        return ResponseEntity.ok(productService.updateProduct(productId, categoryId, image, images, name, description, price, stockQuantity, existingImageUrls, variantsJson, variantImagesMap));
    }

    private java.util.Map<Integer, java.util.List<MultipartFile>> extractVariantImages(jakarta.servlet.http.HttpServletRequest request) {
        java.util.Map<Integer, java.util.List<MultipartFile>> variantImagesMap = new java.util.HashMap<>();
        if (request instanceof org.springframework.web.multipart.MultipartHttpServletRequest multipartRequest) {
            java.util.Map<String, java.util.List<MultipartFile>> fileMap = multipartRequest.getMultiFileMap();
            for (java.util.Map.Entry<String, java.util.List<MultipartFile>> entry : fileMap.entrySet()) {
                if (entry.getKey().startsWith("variant_images_")) {
                    try {
                        int variantIndex = Integer.parseInt(entry.getKey().substring("variant_images_".length()));
                        variantImagesMap.put(variantIndex, entry.getValue());
                    } catch (NumberFormatException ignored) {}
                }
            }
        }
        return variantImagesMap;
    }

    @DeleteMapping("/delete/{productId}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'MANAGER')")
    public ResponseEntity<Response> deleteProduct(@PathVariable Long productId) {
        return ResponseEntity.ok(productService.deleteProduct(productId));
    }

    @GetMapping("/get-by-product-id/{productId}")
    public ResponseEntity<Response> getProductById(@PathVariable Long productId) {
        return ResponseEntity.ok(productService.getProductById(productId));
    }

    @GetMapping("/get-all")
    public ResponseEntity<Response> getAllProducts(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size
    ) {
        return ResponseEntity.ok(productService.getAllProducts(page, size));
    }

    @GetMapping("/get-by-category-id/{categoryId}")
    public ResponseEntity<Response> getProductsByCategory(
            @PathVariable Long categoryId,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size
    ) {
        return ResponseEntity.ok(productService.getProductByCategory(categoryId, page, size));
    }

    @GetMapping("/search")
    public ResponseEntity<Response> searchForProduct(
            @RequestParam String searchValue,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size
    ) {
        return ResponseEntity.ok(productService.searchProduct(searchValue, page, size));
    }

    @GetMapping("/home-feed")
    public ResponseEntity<Response> getHomeFeedProducts(
            @RequestParam(required = false) Integer limit
    ) {
        return ResponseEntity.ok(productService.getHomeFeedProducts(limit));
    }
}
