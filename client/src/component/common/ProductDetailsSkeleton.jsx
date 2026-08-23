import React from "react";
import "../../style/productSkeleton.css";

const ProductDetailsSkeleton = () => {
    return (
        <div className="product-details-skeleton-container" style={{ maxWidth: "1440px", margin: "0 auto", padding: "32px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px" }}>
                {/* Left Gallery Shimmer */}
                <div>
                    <div className="skeleton-shimmer" style={{ width: "100%", height: "420px", borderRadius: "16px", marginBottom: "16px" }} />
                    <div style={{ display: "flex", gap: "12px" }}>
                        <div className="skeleton-shimmer" style={{ width: "70px", height: "70px", borderRadius: "10px" }} />
                        <div className="skeleton-shimmer" style={{ width: "70px", height: "70px", borderRadius: "10px" }} />
                        <div className="skeleton-shimmer" style={{ width: "70px", height: "70px", borderRadius: "10px" }} />
                    </div>
                </div>

                {/* Right Product Details Info Shimmer */}
                <div>
                    <div className="skeleton-shimmer" style={{ width: "85%", height: "28px", borderRadius: "6px", marginBottom: "12px" }} />
                    <div className="skeleton-shimmer" style={{ width: "50%", height: "20px", borderRadius: "6px", marginBottom: "24px" }} />
                    <div className="skeleton-shimmer" style={{ width: "40%", height: "36px", borderRadius: "8px", marginBottom: "32px" }} />
                    <div className="skeleton-shimmer" style={{ width: "100%", height: "120px", borderRadius: "14px", marginBottom: "24px" }} />
                    <div className="skeleton-shimmer" style={{ width: "200px", height: "48px", borderRadius: "12px" }} />
                </div>
            </div>
        </div>
    );
};

export default ProductDetailsSkeleton;
