package com.shv.Ecommerce.controller;

import com.shv.Ecommerce.dto.Response;
import com.shv.Ecommerce.service.interf.IBannerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/banner")
@RequiredArgsConstructor
public class BannerController {
    private final IBannerService bannerService;

    @GetMapping("/active")
    public ResponseEntity<Response> getActiveBanners() {
        return ResponseEntity.ok(bannerService.getActiveBanners());
    }

    @GetMapping("/all")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'MANAGER', 'ADMIN_RESTRICTED')")
    public ResponseEntity<Response> getAllBanners() {
        return ResponseEntity.ok(bannerService.getAllBanners());
    }

    @GetMapping("/{bannerId}")
    public ResponseEntity<Response> getBannerById(@PathVariable Long bannerId) {
        return ResponseEntity.ok(bannerService.getBannerById(bannerId));
    }

    @PostMapping("/create")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'MANAGER')")
    public ResponseEntity<Response> createBanner(
            @RequestParam(required = false) MultipartFile image,
            @RequestParam(required = false) String imageUrl,
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String linkUrl,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) Integer displayOrder
    ) {
        return ResponseEntity.ok(bannerService.createBanner(image, imageUrl, title, linkUrl, active, displayOrder));
    }

    @PutMapping("/update/{bannerId}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'MANAGER')")
    public ResponseEntity<Response> updateBanner(
            @PathVariable Long bannerId,
            @RequestParam(required = false) MultipartFile image,
            @RequestParam(required = false) String imageUrl,
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String linkUrl,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) Integer displayOrder
    ) {
        return ResponseEntity.ok(bannerService.updateBanner(bannerId, image, imageUrl, title, linkUrl, active, displayOrder));
    }

    @DeleteMapping("/delete/{bannerId}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'MANAGER')")
    public ResponseEntity<Response> deleteBanner(@PathVariable Long bannerId) {
        return ResponseEntity.ok(bannerService.deleteBanner(bannerId));
    }
}
