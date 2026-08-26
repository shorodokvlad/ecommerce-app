package com.shv.Ecommerce.service.impl;

import com.shv.Ecommerce.dto.Response;
import com.shv.Ecommerce.dto.ReviewDto;
import com.shv.Ecommerce.entity.Product;
import com.shv.Ecommerce.entity.Review;
import com.shv.Ecommerce.entity.User;
import com.shv.Ecommerce.enums.UserRole;
import com.shv.Ecommerce.exception.InvalidCredentialsException;
import com.shv.Ecommerce.exception.NotFoundException;
import com.shv.Ecommerce.mapper.EntityDtoMapper;
import com.shv.Ecommerce.repository.ProductRepo;
import com.shv.Ecommerce.repository.ReviewRepo;
import com.shv.Ecommerce.service.interf.IReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements IReviewService {
    private final ReviewRepo reviewRepo;
    private final ProductRepo productRepo;
    private final EntityDtoMapper entityDtoMapper;

    @Override
    public Response getReviewsByProductId(Long productId) {
        List<Review> reviews = reviewRepo.findByProductId(productId);

        List<ReviewDto> reviewDtoList = reviews.stream()
                .map(entityDtoMapper::mapReviewToDtoBasic)
                .toList();

        return Response.builder()
                .status(200)
                .reviewList(reviewDtoList)
                .build();
    }

    @Override
    @Transactional
    public Response createReview(Long productId, Integer rating, String content, User user) {
        if (rating == null || rating < 1 || rating > 5) {
            throw new InvalidCredentialsException("Rating must be between 1 and 5 stars");
        }

        Product product = productRepo.findById(productId)
                .orElseThrow(() -> new NotFoundException("Product not found"));

        Review review = reviewRepo.findByProductIdAndUserId(productId, user.getId())
                .orElseGet(Review::new);
        review.setProduct(product);
        review.setUser(user);
        review.setRating(rating);
        review.setContent(content);
        reviewRepo.save(review);

        return Response.builder()
                .status(200)
                .message("Review saved successfully")
                .review(entityDtoMapper.mapReviewToDtoBasic(review))
                .build();
    }

    @Override
    @Transactional
    public Response deleteReview(Long reviewId, User user) {
        Review review = reviewRepo.findById(reviewId)
                .orElseThrow(() -> new NotFoundException("Review not found"));

        boolean isOwner = review.getUser().getId().equals(user.getId());
        boolean isAdmin = user.getRole() == UserRole.ADMIN || user.getRole() == UserRole.MANAGER;

        if (!isOwner && !isAdmin) {
            throw new InvalidCredentialsException("You can only delete your own reviews");
        }

        reviewRepo.delete(review);

        return Response.builder()
                .status(200)
                .message("Review deleted successfully")
                .build();
    }
}