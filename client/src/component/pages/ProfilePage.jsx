import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import ApiService from "../../service/ApiService";
import '../../style/profile.css';
import Pagination from "../common/Pagination";
import { ShoppingBag, MapPin, LogOut, ChevronRight, PackageCheck, AlertCircle } from "lucide-react";
import ProfileSkeleton from "../common/ProfileSkeleton";

const CACHE_KEY = 'profile_user_info_cache';
const CACHE_TTL_MS = 60 * 1000;

const formatPrice = (val) => {
    const num = Number(val) || 0;
    return num % 1 === 0 ? num.toFixed(0) : num.toFixed(2);
};

const formatDate = (isoString) => {
    if (!isoString) return "Recent Order";
    try {
        const date = new Date(isoString);
        return new Intl.DateTimeFormat("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }).format(date);
    } catch (e) {
        return "Recent Order";
    }
};

const ProfilePage = () => {
    const [userInfo, setUserInfo] = useState(null);
    const [activeTab, setActiveTab] = useState("orders"); // "orders" | "address"
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    const navigate = useNavigate();

    const readUserInfoCache = () => {
        try {
            const raw = sessionStorage.getItem(CACHE_KEY);
            if (!raw) return null;
            const cached = JSON.parse(raw);
            if (Date.now() - cached.timestamp > CACHE_TTL_MS) return null;
            if (cached.token !== localStorage.getItem('token')) return null;
            return cached.user;
        } catch {
            return null;
        }
    };

    useEffect(() => {
        fetchUserInfo();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchUserInfo = async () => {
        try {
            const cachedUser = readUserInfoCache();
            if (cachedUser) {
                setUserInfo(cachedUser);
                return;
            }
            const response = await ApiService.getLoggedInUserInfo();
            setUserInfo(response.user);
            try {
                sessionStorage.setItem(CACHE_KEY, JSON.stringify({
                    timestamp: Date.now(),
                    token: localStorage.getItem('token'),
                    user: response.user
                }));
            } catch {
                // Ignore storage error
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Unable to fetch user info');
        }
    };

    const handleLogout = () => {
        if (window.confirm("Log out of your account?")) {
            sessionStorage.removeItem(CACHE_KEY);
            ApiService.logout();
            navigate('/login');
        }
    };

    const handleAddressClick = () => {
        navigate(userInfo?.address ? '/edit-address' : '/add-address');
    };

    if (error) {
        return (
            <div className="profile-page-wrapper">
                <div className="profile-container">
                    <p className="error-message">{error}</p>
                </div>
            </div>
        );
    }

    if (!userInfo) {
        return <ProfileSkeleton />;
    }

    const orderItemList = userInfo.orderItemList || [];
    const totalPages = Math.ceil(orderItemList.length / itemsPerPage);
    const paginatedOrders = orderItemList.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const userInitial = userInfo.name ? userInfo.name.charAt(0).toUpperCase() : "U";

    const getStatusClass = (status) => {
        const s = (status || "").toLowerCase();
        if (s.includes("deliver")) return "status-delivered";
        if (s.includes("cancel")) return "status-cancelled";
        if (s.includes("ship") || s.includes("confirm")) return "status-shipped";
        return "status-pending";
    };

    return (
        <div className="profile-page-wrapper">
            <div className="profile-container">
                <div className="profile-layout">
                    {/* LEFT SIDEBAR MENU (eMAG STYLE) */}
                    <aside className="profile-sidebar">
                        {/* USER PROFILE CARD */}
                        <div className="profile-user-card">
                            <div className="profile-avatar-circle">
                                {userInitial}
                            </div>
                            <div className="profile-user-details">
                                <h3 className="profile-user-name">{userInfo.name}</h3>
                                <span className="profile-user-badge">SHV Store Customer</span>
                            </div>
                        </div>

                        {/* SIDEBAR NAVIGATION ITEMS */}
                        <nav className="profile-sidebar-nav">
                            <button
                                type="button"
                                className={`profile-nav-item ${activeTab === "orders" ? "active" : ""}`}
                                onClick={() => setActiveTab("orders")}
                            >
                                <ShoppingBag size={18} />
                                <span>My Orders</span>
                                <ChevronRight size={16} className="profile-nav-chevron" />
                            </button>

                            <button
                                type="button"
                                className={`profile-nav-item ${activeTab === "address" ? "active" : ""}`}
                                onClick={() => setActiveTab("address")}
                            >
                                <MapPin size={18} />
                                <span>Delivery Addresses</span>
                                <ChevronRight size={16} className="profile-nav-chevron" />
                            </button>

                            <button
                                type="button"
                                className="profile-nav-item logout-item"
                                onClick={handleLogout}
                            >
                                <LogOut size={18} />
                                <span>Log Out</span>
                            </button>
                        </nav>
                    </aside>

                    {/* RIGHT MAIN CONTENT PANEL */}
                    <main className="profile-main-panel">
                        {activeTab === "orders" && (
                            <div>
                                <div className="profile-panel-header">
                                    <h2 className="profile-panel-title">My Orders ({orderItemList.length})</h2>
                                </div>

                                {orderItemList.length === 0 ? (
                                    <div className="profile-empty-orders">
                                        <PackageCheck size={48} color="#94a3b8" style={{ marginBottom: "12px" }} />
                                        <h3 className="profile-empty-title">You haven't placed any orders yet</h3>
                                        <p>Browse our store and place your first order to track it here.</p>
                                        <Link to="/" style={{ display: "inline-block", marginTop: "16px", padding: "10px 24px", background: "#1F4E63", color: "#ffffff", borderRadius: "10px", textDecoration: "none", fontWeight: 700 }}>
                                            Start Shopping
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="profile-orders-list">
                                        {paginatedOrders.map((order) => {
                                            const product = order.product || order.productDto;
                                            const itemPrice = order.price || product?.price || 0;
                                            const totalItemPrice = itemPrice * (order.quantity || 1);
                                            const orderDate = formatDate(order.createdAt);
                                            const statusClass = getStatusClass(order.status);

                                            return (
                                                <article className="emag-order-card" key={order.id}>
                                                    {/* Header Bar */}
                                                    <div className="emag-order-header">
                                                        <span className="emag-order-num">Order #{order.id || 500634720}</span>
                                                        <span className="emag-order-date-total">
                                                            {orderDate} • Total: <strong>€{formatPrice(totalItemPrice)}</strong>
                                                        </span>
                                                    </div>

                                                    {/* Subheader */}
                                                    <div className="emag-order-subhead">
                                                        Sold & delivered by <strong>SHV Store</strong> | Subtotal: <strong>€{formatPrice(totalItemPrice)}</strong>
                                                    </div>

                                                    {/* Order Body */}
                                                    <div className="emag-order-body">
                                                        <img
                                                            src={order.variantImageUrl || product?.imageUrl}
                                                            alt={product?.name || "Product"}
                                                            className="emag-order-thumb"
                                                        />
                                                        <div className="emag-order-info">
                                                            <h4 className="emag-order-product-name">{product?.name || "Product"}</h4>
                                                            {order.variantTitle && (
                                                                <span className="emag-order-variant">Config: {order.variantTitle}</span>
                                                            )}
                                                            <div className="emag-order-meta-row">
                                                                <span className="emag-order-qty">Qty: {order.quantity || 1}</span>
                                                                <span className="emag-order-price">€{formatPrice(itemPrice)}</span>
                                                                <span className={`order-status-badge ${statusClass}`}>
                                                                    {order.status || "PENDING"}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </article>
                                            );
                                        })}
                                    </div>
                                )}

                                {totalPages > 1 && (
                                    <Pagination
                                        currentPage={currentPage}
                                        totalPages={totalPages}
                                        onPageChange={(page) => setCurrentPage(page)}
                                    />
                                )}
                            </div>
                        )}

                        {activeTab === "address" && (
                            <div>
                                <div className="profile-panel-header">
                                    <h2 className="profile-panel-title">Delivery Address</h2>
                                </div>

                                {userInfo.address ? (
                                    <div className="profile-address-card">
                                        <div className="address-grid">
                                            <div>
                                                <span className="address-item-label">Street: </span>
                                                <span>{userInfo.address.street}</span>
                                            </div>
                                            <div>
                                                <span className="address-item-label">City / Locality: </span>
                                                <span>{userInfo.address.city}</span>
                                            </div>
                                            <div>
                                                <span className="address-item-label">County / State: </span>
                                                <span>{userInfo.address.state}</span>
                                            </div>
                                            <div>
                                                <span className="address-item-label">Zip Code: </span>
                                                <span>{userInfo.address.zipCode}</span>
                                            </div>
                                            <div>
                                                <span className="address-item-label">Country: </span>
                                                <span>{userInfo.address.country}</span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ padding: "24px 0", color: "#64748b" }}>
                                        <AlertCircle size={32} color="#94a3b8" style={{ marginBottom: "8px" }} />
                                        <p style={{ margin: "0 0 16px", fontSize: "0.95rem" }}>No shipping address saved in your account.</p>
                                    </div>
                                )}

                                <button
                                    type="button"
                                    className="profile-edit-addr-btn"
                                    onClick={handleAddressClick}
                                >
                                    {userInfo.address ? "Edit Address" : "Add Address"}
                                </button>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
