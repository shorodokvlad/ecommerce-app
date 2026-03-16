package com.shv.Ecommerce.controller;

import com.shv.Ecommerce.dto.Response;
import com.shv.Ecommerce.service.interf.IUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/user")
@RequiredArgsConstructor
public class UserController {
    private final IUserService userService;

    @GetMapping("/get-all")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Response> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/my-info")
    public ResponseEntity<Response> getUserInfoAndOrderHistory() {
        return ResponseEntity.ok(userService.getUserInfoAndOrderHistory());
    }
}
