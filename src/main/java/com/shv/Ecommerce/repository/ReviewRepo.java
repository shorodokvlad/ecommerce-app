package com.shv.Ecommerce.repository;

import com.shv.Ecommerce.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ReviewRepo extends JpaRepository<Review, Long> {
    List<Review> findByProductId(Long productId);
    Optional<Review> findByProductIdAndUserId(Long productId, Long userId);

    /**
     * Average rating + review count per product.
     * Returns rows of [productId, averageRating, reviewCount].
     */
    @Query("SELECT r.product.id AS productId, AVG(r.rating) AS averageRating, COUNT(r) AS reviewCount " +
            "FROM Review r " +
            "WHERE r.product IS NOT NULL " +
            "GROUP BY r.product.id")
    List<Object[]> findAverageRatingByProduct();
}