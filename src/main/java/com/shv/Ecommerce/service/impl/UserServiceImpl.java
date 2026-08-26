package com.shv.Ecommerce.service.impl;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.shv.Ecommerce.dto.LoginRequest;
import com.shv.Ecommerce.dto.Response;
import com.shv.Ecommerce.dto.UserDto;
import com.shv.Ecommerce.entity.EmailVerificationToken;
import com.shv.Ecommerce.entity.PasswordResetToken;
import com.shv.Ecommerce.entity.User;
import com.shv.Ecommerce.enums.UserRole;
import com.shv.Ecommerce.exception.InvalidCredentialsException;
import com.shv.Ecommerce.exception.NotFoundException;
import com.shv.Ecommerce.mapper.EntityDtoMapper;
import com.shv.Ecommerce.repository.EmailVerificationTokenRepo;
import com.shv.Ecommerce.repository.PasswordResetTokenRepo;
import com.shv.Ecommerce.repository.UserRepo;
import com.shv.Ecommerce.security.JwtUtils;
import com.shv.Ecommerce.service.MailService;
import com.shv.Ecommerce.service.interf.IUserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class UserServiceImpl implements IUserService {
    private static final int RESET_TOKEN_VALIDITY_MINUTES = 15;

    private final UserRepo userRepo;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final EntityDtoMapper entityDtoMapper;
    private final PasswordResetTokenRepo passwordResetTokenRepo;
    private final EmailVerificationTokenRepo emailVerificationTokenRepo;
    private final MailService mailService;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Value("${app.google.client-id}")
    private String googleClientId;
    @Override
    @Transactional
    public Response registerUser(UserDto registrationRequest) {
        if (userRepo.findByEmail(registrationRequest.getEmail()).isPresent()) {
            throw new InvalidCredentialsException("Email is already registered. Please log in or reset your password.");
        }

        UserRole role = UserRole.USER;

        if (registrationRequest.getRole() != null && registrationRequest.getRole() == UserRole.ADMIN) {
            role = UserRole.ADMIN;
        }
        User user = User.builder()
                .name(registrationRequest.getName())
                .email(registrationRequest.getEmail())
                .password(passwordEncoder.encode(registrationRequest.getPassword()))
                .phoneNumber(registrationRequest.getPhoneNumber())
                .role(role)
                .emailVerified(false)
                .build();

        User savedUser = userRepo.save(user);

        // Generate email verification token (valid for 24 hours)
        String token = UUID.randomUUID().toString();
        EmailVerificationToken verificationToken = EmailVerificationToken.builder()
                .token(token)
                .user(savedUser)
                .expiresAt(LocalDateTime.now().plusHours(24))
                .used(false)
                .build();
        emailVerificationTokenRepo.save(verificationToken);

        String verifyLink = frontendUrl + "/verify-email?token=" + token;
        mailService.sendQuietly(
                savedUser.getEmail(),
                "Verify your email - SHV Store",
                "Hello " + savedUser.getName() + ",\n\n"
                        + "Thank you for registering at SHV Store. Please click the link below to verify your email address:\n\n"
                        + verifyLink + "\n\n"
                        + "This link will expire in 24 hours.\n\n"
                        + "If you did not register for an account, please ignore this email."
        );

        UserDto userDto = entityDtoMapper.mapUserToDtoBasic(savedUser);

        return Response.builder()
                .status(200)
                .message("Registration successful! Please check your email to verify your account before logging in.")
                .user(userDto)
                .build();
    }

    @Override
    public Response loginRequest(LoginRequest loginRequest) {
        User user = userRepo.findByEmail(loginRequest.getEmail()).orElseThrow(()-> new NotFoundException("Email not found"));

        if (!user.isEmailVerified()) {
            throw new InvalidCredentialsException("Your email address is not verified. Please check your inbox for the verification link.");
        }

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
    @Transactional
    public Response verifyEmail(String token) {
        EmailVerificationToken verificationToken = emailVerificationTokenRepo.findByToken(token)
                .orElseThrow(() -> new InvalidCredentialsException("Verification link is invalid"));

        if (verificationToken.isUsed()) {
            throw new InvalidCredentialsException("Verification link has already been used");
        }

        if (verificationToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new InvalidCredentialsException("Verification link has expired — please request a new one");
        }

        User user = verificationToken.getUser();
        user.setEmailVerified(true);
        userRepo.save(user);

        verificationToken.setUsed(true);
        emailVerificationTokenRepo.save(verificationToken);

        return Response.builder()
                .status(200)
                .message("Email verified successfully! You can now log in.")
                .build();
    }

    @Override
    @Transactional
    public Response resendVerification(String email) {
        User user = userRepo.findByEmail(email).orElseThrow(() -> new NotFoundException("Email not found"));

        if (user.isEmailVerified()) {
            return Response.builder()
                    .status(200)
                    .message("Email is already verified")
                    .build();
        }

        emailVerificationTokenRepo.deleteAllByUser(user);

        String token = UUID.randomUUID().toString();
        EmailVerificationToken verificationToken = EmailVerificationToken.builder()
                .token(token)
                .user(user)
                .expiresAt(LocalDateTime.now().plusHours(24))
                .used(false)
                .build();
        emailVerificationTokenRepo.save(verificationToken);

        String verifyLink = frontendUrl + "/verify-email?token=" + token;
        mailService.sendQuietly(
                user.getEmail(),
                "Verify your email - SHV Store",
                "Hello " + user.getName() + ",\n\n"
                        + "Please click the link below to verify your email address:\n\n"
                        + verifyLink + "\n\n"
                        + "This link will expire in 24 hours."
        );

        return Response.builder()
                .status(200)
                .message("Verification email sent! Please check your inbox.")
                .build();
    }

    @Override
    @Transactional
    public Response forgotPassword(String email) {
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("No account found with email: " + email));

        passwordResetTokenRepo.deleteAllByUser(user);

        PasswordResetToken resetToken = PasswordResetToken.builder()
                .token(UUID.randomUUID().toString())
                .user(user)
                .expiresAt(LocalDateTime.now().plusMinutes(RESET_TOKEN_VALIDITY_MINUTES))
                .used(false)
                .build();
        passwordResetTokenRepo.save(resetToken);

        String resetLink = frontendUrl + "/reset-password?token=" + resetToken.getToken();
        mailService.sendQuietly(
                user.getEmail(),
                "Reset your SHV Store password",
                "Hi " + user.getName() + ",\n\n"
                        + "We received a request to reset your password. "
                        + "Open the link below to choose a new one. "
                        + "It expires in " + RESET_TOKEN_VALIDITY_MINUTES + " minutes.\n\n"
                        + resetLink + "\n\n"
                        + "If you didn't request this, you can ignore this email."
        );

        return Response.builder()
                .status(200)
                .message("Password reset link has been sent to " + email + ". Please check your inbox.")
                .build();
    }

    @Override
    @Transactional
    public Response resetPassword(String token, String newPassword) {
        PasswordResetToken resetToken = passwordResetTokenRepo.findByToken(token)
                .orElseThrow(() -> new InvalidCredentialsException("Reset link is invalid"));

        if (resetToken.isUsed() || resetToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new InvalidCredentialsException("Reset link has expired — request a new one");
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepo.save(user);

        resetToken.setUsed(true);
        passwordResetTokenRepo.save(resetToken);

        return Response.builder()
                .status(200)
                .message("Password updated — you can now log in")
                .build();
    }

    @Override
    @Transactional
    public Response googleLogin(String idTokenString) {
        GoogleIdToken.Payload payload = verifyGoogleIdToken(idTokenString);

        String email = payload.getEmail();
        String name = (String) payload.get("name");

        User user = userRepo.findByEmail(email).map(existing -> {
            if (!existing.isEmailVerified()) {
                existing.setEmailVerified(true);
                userRepo.save(existing);
            }
            return existing;
        }).orElseGet(() -> {
            User newUser = User.builder()
                    .name(name != null ? name : email)
                    .email(email)
                    // Google users authenticate via Google; the local password
                    // is an unguessable random value they never use
                    .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                    .phoneNumber("google-oauth")
                    .role(UserRole.USER)
                    .emailVerified(true)
                    .build();
            log.info("Creating new user from Google sign-in: {}", email);
            return userRepo.save(newUser);
        });

        String token = jwtUtils.generateToken(user);

        return Response.builder()
                .status(200)
                .message("User succsessfully logged in")
                .token(token)
                .expirationTime("6 month")
                .role(user.getRole().name())
                .build();
    }

    private volatile GoogleIdTokenVerifier googleVerifier;

    private GoogleIdTokenVerifier getGoogleVerifier() {
        if (googleVerifier == null) {
            synchronized (this) {
                if (googleVerifier == null) {
                    googleVerifier = new GoogleIdTokenVerifier.Builder(
                            new NetHttpTransport(), GsonFactory.getDefaultInstance())
                            .setAudience(List.of(googleClientId))
                            .build();
                }
            }
        }
        return googleVerifier;
    }

    private GoogleIdToken.Payload verifyGoogleIdToken(String idTokenString) {
        try {
            GoogleIdToken idToken = getGoogleVerifier().verify(idTokenString);
            if (idToken == null) {
                throw new InvalidCredentialsException("Google sign-in could not be verified");
            }
            return idToken.getPayload();
        } catch (InvalidCredentialsException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Google token verification failed: {}", e.getMessage());
            throw new InvalidCredentialsException("Google sign-in could not be verified");
        }
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

    @Override
    @Transactional
    public Response createEmployee(UserDto employeeRequest) {
        User caller = getLoginUser();

        if (employeeRequest.getRole() == null) {
            throw new InvalidCredentialsException("Role is required");
        }
        if (caller.getRole() == UserRole.MANAGER && employeeRequest.getRole() == UserRole.ADMIN) {
            throw new InvalidCredentialsException("Managers cannot create ADMIN accounts");
        }
        if (userRepo.findByEmail(employeeRequest.getEmail()).isPresent()) {
            throw new InvalidCredentialsException("Email is already registered: " + employeeRequest.getEmail());
        }

        String generatedPassword = generatePassword();

        User user = User.builder()
                .name(employeeRequest.getName())
                .email(employeeRequest.getEmail())
                .password(passwordEncoder.encode(generatedPassword))
                .phoneNumber(employeeRequest.getPhoneNumber() != null && !employeeRequest.getPhoneNumber().isBlank()
                        ? employeeRequest.getPhoneNumber() : "N/A")
                .role(employeeRequest.getRole())
                .emailVerified(true)
                .build();

        User savedUser = userRepo.save(user);

        mailService.sendQuietly(
                savedUser.getEmail(),
                "Your SHV Store staff account",
                "Hello " + savedUser.getName() + ",\n\n"
                        + "An account has been created for you at SHV Store.\n\n"
                        + "Email: " + savedUser.getEmail() + "\n"
                        + "Temporary password: " + generatedPassword + "\n\n"
                        + "Please log in and change your password."
        );

        UserDto userDto = entityDtoMapper.mapUserToDtoBasic(savedUser);
        userDto.setPassword(generatedPassword);

        return Response.builder()
                .status(200)
                .message("Employee account created successfully")
                .user(userDto)
                .build();
    }

    @Override
    @Transactional
    public Response updateUser(Long userId, UserDto updateRequest) {
        User caller = getLoginUser();
        User target = userRepo.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));

        if (caller.getRole() == UserRole.MANAGER
                && (target.getRole() == UserRole.ADMIN || updateRequest.getRole() == UserRole.ADMIN)) {
            throw new InvalidCredentialsException("Managers cannot update ADMIN accounts");
        }

        if (updateRequest.getEmail() != null && !updateRequest.getEmail().equals(target.getEmail())) {
            userRepo.findByEmail(updateRequest.getEmail()).ifPresent(existing -> {
                if (!existing.getId().equals(target.getId())) {
                    throw new InvalidCredentialsException("Email is already registered: " + updateRequest.getEmail());
                }
            });
            target.setEmail(updateRequest.getEmail());
        }
        if (updateRequest.getName() != null && !updateRequest.getName().isBlank()) {
            target.setName(updateRequest.getName());
        }
        if (updateRequest.getRole() != null) {
            target.setRole(updateRequest.getRole());
        }

        User savedUser = userRepo.save(target);

        return Response.builder()
                .status(200)
                .message("User updated successfully")
                .user(entityDtoMapper.mapUserToDtoBasic(savedUser))
                .build();
    }

    @Override
    @Transactional
    public Response deleteUser(Long userId) {
        User caller = getLoginUser();
        User target = userRepo.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));

        if (target.getId().equals(caller.getId())) {
            throw new InvalidCredentialsException("You cannot delete your own account");
        }
        if (caller.getRole() == UserRole.MANAGER && target.getRole() == UserRole.ADMIN) {
            throw new InvalidCredentialsException("Managers cannot delete ADMIN accounts");
        }

        userRepo.delete(target);

        return Response.builder()
                .status(200)
                .message("User deleted successfully")
                .build();
    }

    private String generatePassword() {
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
        java.security.SecureRandom random = new java.security.SecureRandom();
        StringBuilder password = new StringBuilder();
        for (int i = 0; i < 10; i++) {
            password.append(chars.charAt(random.nextInt(chars.length())));
        }
        return password.toString();
    }
}
