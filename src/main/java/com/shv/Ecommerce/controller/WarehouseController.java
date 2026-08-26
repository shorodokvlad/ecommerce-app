package com.shv.Ecommerce.controller;

import com.shv.Ecommerce.dto.Response;
import com.shv.Ecommerce.dto.WarehouseDto;
import com.shv.Ecommerce.service.interf.IWarehouseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/warehouse")
@RequiredArgsConstructor
public class WarehouseController {
    private final IWarehouseService warehouseService;

    @PostMapping("/create")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'MANAGER')")
    public ResponseEntity<Response> createWarehouse(@RequestBody WarehouseDto warehouseDto) {
        return ResponseEntity.ok(warehouseService.createWarehouse(warehouseDto));
    }

    @GetMapping("/get-all")
    public ResponseEntity<Response> getAllWarehouses() {
        return ResponseEntity.ok(warehouseService.getAllWarehouses());
    }

    @GetMapping("/get-by-id/{warehouseId}")
    public ResponseEntity<Response> getWarehouseById(@PathVariable Long warehouseId) {
        return ResponseEntity.ok(warehouseService.getWarehouseById(warehouseId));
    }

    @PutMapping("/update/{warehouseId}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'MANAGER')")
    public ResponseEntity<Response> updateWarehouse(@PathVariable Long warehouseId, @RequestBody WarehouseDto warehouseDto) {
        return ResponseEntity.ok(warehouseService.updateWarehouse(warehouseId, warehouseDto));
    }

    @DeleteMapping("/delete/{warehouseId}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'MANAGER')")
    public ResponseEntity<Response> deleteWarehouse(@PathVariable Long warehouseId) {
        return ResponseEntity.ok(warehouseService.deleteWarehouse(warehouseId));
    }
}