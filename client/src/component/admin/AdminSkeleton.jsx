import React from "react";
import "../../style/productSkeleton.css";

export const AdminDashboardSkeleton = () => {
    return (
        <div style={{ width: "100%" }}>
            {/* Top Stat Cards Skeleton */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", marginBottom: "28px" }}>
                <div className="skeleton-shimmer" style={{ height: "130px", borderRadius: "16px" }} />
                <div className="skeleton-shimmer" style={{ height: "130px", borderRadius: "16px" }} />
                <div className="skeleton-shimmer" style={{ height: "130px", borderRadius: "16px" }} />
                <div className="skeleton-shimmer" style={{ height: "130px", borderRadius: "16px" }} />
            </div>
            {/* Chart Skeleton */}
            <div className="skeleton-shimmer" style={{ width: "100%", height: "260px", borderRadius: "16px" }} />
        </div>
    );
};

export const AdminListSkeleton = ({ count = 5 }) => {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "20px" }}>
            {Array.from({ length: count }).map((_, idx) => (
                <div className="skeleton-shimmer" key={idx} style={{ width: "100%", height: "64px", borderRadius: "12px" }} />
            ))}
        </div>
    );
};
