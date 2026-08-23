import React from "react";
import "../../style/productSkeleton.css";

const ProfileSkeleton = () => {
    return (
        <div className="profile-page-wrapper">
            <div className="profile-container" style={{ maxWidth: "1440px", margin: "0 auto", padding: "0 32px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: "24px" }}>
                    {/* Left Sidebar Skeleton */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        <div className="skeleton-shimmer" style={{ width: "100%", height: "88px", borderRadius: "14px" }} />
                        <div className="skeleton-shimmer" style={{ width: "100%", height: "180px", borderRadius: "14px" }} />
                    </div>

                    {/* Right Main Panel Skeleton */}
                    <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "28px", minHeight: "500px" }}>
                        <div className="skeleton-shimmer" style={{ width: "220px", height: "28px", borderRadius: "6px", marginBottom: "28px" }} />
                        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                            <div className="skeleton-shimmer" style={{ width: "100%", height: "140px", borderRadius: "12px" }} />
                            <div className="skeleton-shimmer" style={{ width: "100%", height: "140px", borderRadius: "12px" }} />
                            <div className="skeleton-shimmer" style={{ width: "100%", height: "140px", borderRadius: "12px" }} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileSkeleton;
