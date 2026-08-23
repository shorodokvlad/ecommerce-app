import React from "react";
import "../../style/productSkeleton.css";

export const CategoryListSkeleton = () => {
    return (
        <div style={{ maxWidth: "1440px", margin: "0 auto", padding: "32px" }}>
            {/* Title shimmer */}
            <div className="skeleton-shimmer" style={{ width: "220px", height: "32px", borderRadius: "8px", marginBottom: "28px" }} />

            {/* Grid of 8 Category Cards Shimmers */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "24px" }}>
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <div className="skeleton-shimmer" style={{ width: "120px", height: "120px", borderRadius: "12px", marginBottom: "16px" }} />
                        <div className="skeleton-shimmer" style={{ width: "140px", height: "20px", borderRadius: "6px" }} />
                    </div>
                ))}
            </div>
        </div>
    );
};

export const CategoryProductsSkeleton = () => {
    return (
        <div style={{ maxWidth: "1440px", margin: "0 auto", padding: "32px" }}>
            {/* Header banner / title shimmer */}
            <div className="skeleton-shimmer" style={{ width: "100%", height: "120px", borderRadius: "16px", marginBottom: "32px" }} />

            <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: "28px" }}>
                {/* Left Filter Sidebar Shimmer */}
                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "20px", height: "400px" }}>
                    <div className="skeleton-shimmer" style={{ width: "120px", height: "24px", borderRadius: "6px", marginBottom: "20px" }} />
                    <div className="skeleton-shimmer" style={{ width: "100%", height: "40px", borderRadius: "8px", marginBottom: "16px" }} />
                    <div className="skeleton-shimmer" style={{ width: "100%", height: "40px", borderRadius: "8px", marginBottom: "16px" }} />
                    <div className="skeleton-shimmer" style={{ width: "100%", height: "40px", borderRadius: "8px" }} />
                </div>

                {/* Right Product Grid Shimmer */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "20px" }}>
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                            <div className="skeleton-shimmer" style={{ width: "100%", height: "180px", borderRadius: "12px" }} />
                            <div className="skeleton-shimmer" style={{ width: "85%", height: "18px", borderRadius: "6px" }} />
                            <div className="skeleton-shimmer" style={{ width: "50%", height: "22px", borderRadius: "6px" }} />
                            <div className="skeleton-shimmer" style={{ width: "100%", height: "38px", borderRadius: "8px", marginTop: "auto" }} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
