package com.shv.Ecommerce.service.impl;

import com.shv.Ecommerce.dto.LoginRequest;
import com.shv.Ecommerce.dto.Response;
import com.shv.Ecommerce.dto.UserDto;
import com.shv.Ecommerce.entity.User;
import com.shv.Ecommerce.enums.UserRole;
import com.shv.Ecommerce.exception.InvalidCredentialsException;
import com.shv.Ecommerce.exception.NotFoundException;
import com.shv.Ecommerce.mapper.EntityDtoMapper;
import com.shv.Ecommerce.repository.UserRepo;
import com.shv.Ecommerce.security.JwtUtils;
import com.shv.Ecommerce.service.interf.IUserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class UserServiceImpl implements IUserService {
    private final UserRepo userRepo;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final EntityDtoMapper entityDtoMapper;
    @Override
    public Response registerUser(UserDto registrationRequest) {
        UserRole role = UserRole.USER;

        /*
        if (registrationRequest.getRole() != null && registrationRequest.getRole().equals("ADMIN")) {
            role = UserRole.ADMIN;
        }
         */
        if (registrationRequest.getRole() != null && registrationRequest.getRole() == UserRole.ADMIN) {
            role = UserRole.ADMIN;
        }
        User user = User.builder()
                .name(registrationRequest.getName())
                .email(registrationRequest.getEmail())
                .password(passwordEncoder.encode(registrationRequest.getPassword()))
                .phoneNumber(registrationRequest.getPhoneNumber())
                .role(role)
                .build();

        User savedUser = userRepo.save(user);

        UserDto userDto = entityDtoMapper.mapUserToDtoBasic(savedUser);

        return Response.builder()
                .status(200)
                .message("User succsessfuly added")
                .user(userDto)
                .build();
    }

    @Override
    public Response loginRequest(LoginRequest loginRequest) {
        User user = userRepo.findByEmail(loginRequest.getEmail()).orElseThrow(()-> new NotFoundException("Email not found"));

        if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
            throw new InvalidCredentialsException("Password does not match");
        }
        String token = jwtUtils.generateToken(user);

        return Response.builder()
                .status(200)
                .message("User succsessfully logged in")
                .token(token)
                .expirationTime("6 month")
                .role(user.getRole().name())
                .build();
    }

    @Override
    public Response getAllUsers() {
        List<User> users = userRepo.findAll();
        List<UserDto> userDtos = users.stream()
                .map(entityDtoMapper::mapUserToDtoBasic)
                .toList();

        return Response.builder()
                .status(200)
                .message("Succsessful")
                .userList(userDtos)
                .build();
    }

    @Override
    public User getLoginUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        log.info("User email is: " + email);

        return userRepo.findByEmail(email)
                .orElseThrow(()-> new UsernameNotFoundException("User not found"));
    }

    @Override
    public Response getUserInfoAndOrderHistory() {
        User user = getLoginUser();
        UserDto userDto = entityDtoMapper.mapUserToDtoPlusAddressAndOrderHistory(user);


        return Response.builder()
                .status(200)
                .user(userDto)
                .build();
    }
}
