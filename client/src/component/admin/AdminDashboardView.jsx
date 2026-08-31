import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AdminDashboardSkeleton } from "./AdminSkeleton";
import ApiService from "../../service/ApiService";
import { StarRating } from "../common/StarRating";
import "../../style/adminDashboard.css";
import {
    Search, Calendar, Bell, DollarSign, ShoppingCart,
    Users, Truck, ArrowUpRight
} from "lucide-react";

const formatPrice = (num) => {
    const val = Number(num) || 0;
    return val % 1 === 0 ? val.toFixed(0) : val.toFixed(2);
};

const getTodayDateString = () => {
    return new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short"
    }).format(new Date());
};

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const formatDay = (ymd) => {
    if (!ymd) return "";
    const [, m, d] = ymd.split("-");
    return `${parseInt(d, 10)} ${MONTH_LABELS[parseInt(m, 10) - 1]}`;
};

/* Top Products local cache — renders the two tables instantly on repeat visits,
   then refreshes from the API in the background (avoids the heavy aggregation call). */
const TOP_PRODUCTS_CACHE_KEY = "shv_admin_top_products";
const TOP_PRODUCTS_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

const readTopProductsCache = () => {
    try {
        const raw = localStorage.getItem(TOP_PRODUCTS_CACHE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || !parsed.savedAt || !parsed.data) return null;
        if (Date.now() - parsed.savedAt > TOP_PRODUCTS_CACHE_TTL_MS) {
            localStorage.removeItem(TOP_PRODUCTS_CACHE_KEY);
            return null;
        }
        const data = parsed.data;
        return {
            topSellingProducts: Array.isArray(data.topSellingProducts) ? data.topSellingProducts : [],
            topRatedProducts: Array.isArray(data.topRatedProducts) ? data.topRatedProducts : []
        };
    } catch {
        return null;
    }
};

const writeTopProductsCache = (data) => {
    try {
        localStorage.setItem(TOP_PRODUCTS_CACHE_KEY, JSON.stringify({
            savedAt: Date.now(),
            data
        }));
    } catch {
        // localStorage unavailable — the API fallback still works
    }
};

const AdminDashboardView = () => {
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalOrders: 0,
        totalCustomers: 0,
        pendingDelivery: 0
    });
    const [timeframe, setTimeframe] = useState("Year"); // "Day" | "Week" | "Month" | "Year"
    const [graphBuckets, setGraphBuckets] = useState([]);
    const [dateRange, setDateRange] = useState({ start: "", end: "" });
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [loading, setLoading] = useState(true);
    const [chartLoading, setChartLoading] = useState(false);
    const [statsLoading, setStatsLoading] = useState(false);
    const [draftRange, setDraftRange] = useState({ start: "", end: "" });
    const [hoveredPoint, setHoveredPoint] = useState(null);
    const [topProducts, setTopProducts] = useState({ topSellingProducts: [], topRatedProducts: [] });
    const [topProductsLoading, setTopProductsLoading] = useState(true);

    useEffect(() => {
        // Sales Analytics chart — refreshed ONLY when the timeframe tab changes.
        const fetchChartData = async () => {
            setChartLoading(true);
            try {
                const params = { period: timeframe };
                const orderRes = await ApiService.getDashboardStats(params);
                const data = orderRes.dashboardStats || {};

                setGraphBuckets(Array.isArray(data.sales)
                    ? data.sales.map(b => ({ label: b.label, revenue: Number(b.revenue) || 0 }))
                    : []);
            } catch (err) {
                console.error("Dashboard chart fetch error:", err);
            } finally {
                setLoading(false);
                setChartLoading(false);
            }
        };
        fetchChartData();
    }, [timeframe]);

    useEffect(() => {
        // Top 4 stat cards — refreshed ONLY when the date range is applied.
        const fetchStatsData = async () => {
            setStatsLoading(true);
            try {
                const params = {};
                if (dateRange.start) params.startDate = `${dateRange.start}T00:00:00`;
                if (dateRange.end) params.endDate = `${dateRange.end}T23:59:59`;

                const orderRes = await ApiService.getDashboardStats(params);
                const data = orderRes.dashboardStats || {};

                setStats({
                    totalRevenue: Number(data.totalRevenue) || 0,
                    totalOrders: Number(data.totalOrders) || 0,
                    totalCustomers: Number(data.totalCustomers) || 0,
                    pendingDelivery: Number(data.pendingDelivery) || 0
                });
            } catch (err) {
                console.error("Dashboard stats fetch error:", err);
            } finally {
                setLoading(false);
                setStatsLoading(false);
            }
        };
        fetchStatsData();
    }, [dateRange]);

    useEffect(() => {
        // Top Rated + Top Selling products — served instantly from localStorage
        // (when fresh), then refreshed from the API in the background.
        const fetchTopProducts = async () => {
            const cached = readTopProductsCache();
            if (cached) {
                setTopProducts(cached);
                setTopProductsLoading(false);
            }
            try {
                const res = await ApiService.getDashboardTopProducts();
                const data = res.topProducts || {};
                const normalized = {
                    topSellingProducts: Array.isArray(data.topSellingProducts) ? data.topSellingProducts : [],
                    topRatedProducts: Array.isArray(data.topRatedProducts) ? data.topRatedProducts : []
                };
                setTopProducts(normalized);
                writeTopProductsCache(normalized);
            } catch (err) {
                console.error("Dashboard top products fetch error:", err);
            } finally {
                setTopProductsLoading(false);
            }
        };
        fetchTopProducts();
    }, []);

    // Ensure the chosen from/to dates are in the correct order before fetching.
    const applyDateRange = () => {
        if (draftRange.start && draftRange.end && draftRange.start > draftRange.end) {
            setDateRange({ start: draftRange.end, end: draftRange.start });
        } else {
            setDateRange({ ...draftRange });
        }
        setShowDatePicker(false);
    };

    const resetDateRange = () => {
        setDraftRange({ start: "", end: "" });
        setDateRange({ start: "", end: "" });
        setShowDatePicker(false);
    };

    const hasRange = Boolean(dateRange.start || dateRange.end);
    const rangeLabel = hasRange
        ? `${formatDay(dateRange.start)} - ${formatDay(dateRange.end || dateRange.start)}`
        : getTodayDateString();

    const totalTimeframeRevenue = graphBuckets.reduce((sum, b) => sum + b.revenue, 0);

    // Calculate SVG Path for dynamic chart
    const maxRev = Math.max(...graphBuckets.map(b => b.revenue), 100);
    const chartWidth = 500;
    const chartHeight = 150;
    const padding = 20;

    const points = graphBuckets.map((b, idx) => {
        const x = (idx / Math.max(graphBuckets.length - 1, 1)) * (chartWidth - padding * 2) + padding;
        const y = chartHeight - padding - (b.revenue / maxRev) * (chartHeight - padding * 2);
        return { x, y, label: b.label, revenue: b.revenue };
    });

    // Build SVG smooth path string
    let svgPathD = "";
    if (points.length > 0) {
        svgPathD = `M ${points[0].x} ${points[0].y}`;
        for (let i = 0; i < points.length - 1; i++) {
            const p1 = points[i];
            const p2 = points[i + 1];
            const cx = (p1.x + p2.x) / 2;
            svgPathD += ` C ${cx} ${p1.y}, ${cx} ${p2.y}, ${p2.x} ${p2.y}`;
        }
    }

    const svgFillD = points.length > 0
        ? `${svgPathD} L ${points[points.length - 1].x} ${chartHeight} L ${points[0].x} ${chartHeight} Z`
        : "";

    if (loading) {
        return <AdminDashboardSkeleton />;
    }
    return (
        <div className="admin-dashboard-view">
            {/* OVERVIEW TOP HEADER */}
            <div className="admin-header-row">
                <h1 className="admin-view-title">Overview</h1>

                <div className="admin-header-actions">
                    <div className="admin-search-input-wrap">
                        <Search size={16} className="admin-search-icon" />
                        <input type="text" placeholder="Search orders, products..." />
                    </div>

                    {/* CUSTOM DATE RANGE PICKER (all-time by default) */}
                    <div className="admin-date-picker-wrap">
                        <button
                            type="button"
                            className={`admin-date-picker-btn ${hasRange ? "has-range" : ""}`}
                            onClick={() => {
                                if (!showDatePicker) setDraftRange(dateRange);
                                setShowDatePicker(prev => !prev);
                            }}
                        >
                            <Calendar size={15} />
                            <span>{rangeLabel}</span>
                        </button>

                        {showDatePicker && (
                            <div className="admin-date-picker-popover">
                                <div className="date-picker-row">
                                    <div className="date-picker-field">
                                        <label>From</label>
                                        <input
                                            type="date"
                                            value={draftRange.start}
                                            onChange={e => setDraftRange(prev => ({ ...prev, start: e.target.value }))}
                                        />
                                    </div>
                                    <div className="date-picker-field">
                                        <label>To</label>
                                        <input
                                            type="date"
                                            value={draftRange.end}
                                            onChange={e => setDraftRange(prev => ({ ...prev, end: e.target.value }))}
                                        />
                                    </div>
                                </div>
                                <div className="date-picker-actions">
                                    <button type="button" className="date-picker-reset" onClick={resetDateRange}>
                                        Reset
                                    </button>
                                    <button type="button" className="date-picker-apply" onClick={applyDateRange}>
                                        Apply
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <button type="button" className="admin-icon-circle-btn" title="Notifications">
                        <Bell size={18} />
                    </button>
                </div>
            </div>
            {/* 4 TOP STAT CARDS ROW (POWERED BY REAL BACKEND DATA) */}
            {statsLoading ? (
                <div className="admin-stats-grid">
                    <div className="stat-card-skeleton" />
                    <div className="stat-card-skeleton" />
                    <div className="stat-card-skeleton" />
                    <div className="stat-card-skeleton" />
                </div>
            ) : (
                <div className="admin-stats-grid">
                    {/* 1. Total Revenue */}
                    <div className="admin-stat-card">
                        <div className="stat-card-info">
                            <h4 className="stat-card-title">Total Revenue</h4>
                            <span className="stat-card-sub">Total sales to date</span>
                            <div className="stat-card-value">€{formatPrice(stats.totalRevenue)}</div>
                            <span className="stat-card-trend trend-up">
                                <ArrowUpRight size={14} /> Total revenue
                            </span>
                        </div>
                        <div className="stat-icon-wrap">
                            <DollarSign size={22} />
                        </div>
                    </div>

                    {/* 2. Total Order */}
                    <div className="admin-stat-card">
                        <div className="stat-card-info">
                            <h4 className="stat-card-title">Total Order</h4>
                            <span className="stat-card-sub">Orders placed</span>
                            <div className="stat-card-value">{stats.totalOrders}</div>
                            <span className="stat-card-trend trend-up">
                                <ArrowUpRight size={14} /> Total orders
                            </span>
                        </div>
                        <div className="stat-icon-wrap">
                            <ShoppingCart size={22} />
                        </div>
                    </div>

                    {/* 3. Total Customer */}
                    <div className="admin-stat-card">
                        <div className="stat-card-info">
                            <h4 className="stat-card-title">Total Customer</h4>
                            <span className="stat-card-sub">Unique buyers</span>
                            <div className="stat-card-value">{stats.totalCustomers}</div>
                            <span className="stat-card-trend trend-up">
                                <ArrowUpRight size={14} /> Registered buyers
                            </span>
                        </div>
                        <div className="stat-icon-wrap">
                            <Users size={22} />
                        </div>
                    </div>

                    {/* 4. Pending Delivery */}
                    <div className="admin-stat-card">
                        <div className="stat-card-info">
                            <h4 className="stat-card-title">Pending Delivery</h4>
                            <span className="stat-card-sub">Active shipments</span>
                            <div className="stat-card-value">{stats.pendingDelivery}</div>
                            <span className="stat-card-trend trend-up">
                                <ArrowUpRight size={14} /> Active orders
                            </span>
                        </div>
                        <div className="stat-icon-wrap">
                            <Truck size={22} />
                        </div>
                    </div>
                </div>
            )}
            {/* DASHBOARD SALES ANALYTIC WITH TIME TABS & REAL ORDER GRAPH */}
            <div className="admin-chart-card full-width-chart">
                <div className="chart-card-header">
                    <h3 className="chart-card-title">Sales Analytic</h3>

                    {/* TIME FRAME PILL TABS */}
                    <div className="analytics-time-pills">
                        {["Day", "Week", "Month", "Year"].map(tf => (
                            <button
                                key={tf}
                                type="button"
                                className={`time-pill-btn ${timeframe === tf ? "active" : ""}`}
                                onClick={() => setTimeframe(tf)}
                            >
                                {tf}
                            </button>
                        ))}
                    </div>
                </div>

                {chartLoading ? (
                    <div className="chart-loading-skeleton">
                        <div className="skeleton-shimmer" style={{ width: "70%", height: "30px", borderRadius: "8px" }} />
                        <div className="skeleton-shimmer" style={{ width: "100%", height: "220px", borderRadius: "12px" }} />
                    </div>
                ) : (
                    <>
                        <div className="chart-stats-summary">
                            <div className="summary-metric-box">
                                <span className="metric-label">Revenue ({timeframe})</span>
                                <span className="metric-val">€{formatPrice(totalTimeframeRevenue)}</span>
                            </div>
                        </div>

                        {/* DYNAMIC REAL REVENUE LINE SVG CHART */}
                        <div className="svg-chart-container">
                            <svg width="100%" height="100%" viewBox="0 0 500 150" preserveAspectRatio="none">
                                <defs>
                                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#6EC8C0" stopOpacity="0.4" />
                                        <stop offset="100%" stopColor="#6EC8C0" stopOpacity="0.0" />
                                    </linearGradient>
                                </defs>
                                {svgFillD && <path d={svgFillD} fill="url(#chartGradient)" />}
                                {svgPathD && <path d={svgPathD} fill="none" stroke="#1F4E63" strokeWidth="1.8" strokeLinecap="round" />}
                                {points.map((pt, i) => (
                                    <circle key={i} cx={pt.x} cy={pt.y} r="1.9" fill="#1F4E63" stroke="#ffffff" strokeWidth="0.9" />
                                ))}
                                {/* INVISIBLE LARGER HOVER TARGETS over each dot */}
                                {points.map((pt, i) => (
                                    <circle
                                        key={`hit-${i}`}
                                        cx={pt.x}
                                        cy={pt.y}
                                        r="8"
                                        fill="transparent"
                                        onMouseEnter={() => setHoveredPoint(i)}
                                        onMouseLeave={() => setHoveredPoint(null)}
                                    />
                                ))}
                            </svg>

                            {/* HOVER TOOLTIP: money earned in the hovered bucket */}
                            {hoveredPoint !== null && points[hoveredPoint] && (
                                <div
                                    className="chart-point-tooltip"
                                    style={{
                                        left: `${(points[hoveredPoint].x / chartWidth) * 100}%`,
                                        top: `${(points[hoveredPoint].y / chartHeight) * 100}%`
                                    }}
                                >
                                    <span className="tooltip-label">{points[hoveredPoint].label}</span>
                                    <span className="tooltip-value">€{formatPrice(points[hoveredPoint].revenue)}</span>
                                </div>
                            )}

                            {/* LEGEND LABELS horizontal underneath each dot */}
                            <div className="chart-legend">
                                {points.map((pt, i) => (
                                    <span
                                        key={i}
                                        className="chart-legend-label"
                                        style={{ left: `${(pt.x / chartWidth) * 100}%` }}
                                        onMouseEnter={() => setHoveredPoint(i)}
                                        onMouseLeave={() => setHoveredPoint(null)}
                                    >
                                        {pt.label}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
{/* TOP RATED + TOP SELLING PRODUCTS (BEST SELLER PER CATEGORY) */}
            <div className="top-products-grid">
                {/* TOP RATED ITEMS */}
                <div className="top-products-card">
                    <div className="top-products-header">
                        <div>
                            <h3 className="top-products-title">Top Rated Items</h3>
                            <span className="top-products-sub">Highest rated by customer reviews</span>
                        </div>
                    </div>

                    {topProductsLoading ? (
                        <div className="top-table-wrap">
                            <table className="top-products-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Product</th>
                                        <th>Rating</th>
                                        <th>Price</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <tr key={i}>
                                            <td className="top-rank-cell">
                                                <div className="skeleton-shimmer" style={{ width: "16px", height: "16px", borderRadius: "4px" }} />
                                            </td>
                                            <td>
                                                <div className="top-product-cell">
                                                    <div className="skeleton-shimmer" style={{ width: "38px", height: "38px", borderRadius: "8px", flexShrink: 0 }} />
                                                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
                                                        <div className="skeleton-shimmer" style={{ width: i % 2 === 0 ? "75%" : "60%", height: "14px", borderRadius: "4px" }} />
                                                        <div className="skeleton-shimmer" style={{ width: "40%", height: "10px", borderRadius: "4px" }} />
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="skeleton-shimmer" style={{ width: "85px", height: "18px", borderRadius: "6px" }} />
                                            </td>
                                            <td className="top-price-cell">
                                                <div className="skeleton-shimmer" style={{ width: "55px", height: "16px", borderRadius: "4px" }} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : topProducts.topRatedProducts.length === 0 ? (
                        <p className="top-products-empty">No highly rated products yet — products with great customer reviews will appear here.</p>
                    ) : (
                        <div className="top-table-wrap">
                            <table className="top-products-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Product</th>
                                        <th>Rating</th>
                                        <th>Price</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {topProducts.topRatedProducts.map(p => (
                                        <tr key={p.productId}>
                                            <td className="top-rank-cell">{p.rank}</td>
                                            <td>
                                                <div className="top-product-cell">
                                                    {p.imageUrl ? (
                                                        <img className="top-product-thumb" src={p.imageUrl} alt={p.name} />
                                                    ) : (
                                                        <div className="top-product-thumb top-product-thumb--empty">•</div>
                                                    )}
                                                    <div>
                                                        <Link to={`/product/${p.productId}`} className="top-product-name" title={p.name}>
                                                            {p.name}
                                                        </Link>
                                                        <div className="top-product-cat">{p.categoryName || "Uncategorized"}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="top-rating-cell">
                                                    <StarRating value={p.averageRating} size={13} />
                                                    <span className="top-rating-value">{Number(p.averageRating).toFixed(1)}</span>
                                                    <span className="top-review-count">({p.reviewCount})</span>
                                                </div>
                                            </td>
                                            <td className="top-price-cell">€{formatPrice(p.price)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
{/* TOP SELLING PRODUCTS */}
                <div className="top-products-card">
                    <div className="top-products-header">
                        <div>
                            <h3 className="top-products-title">Top Selling Products</h3>
                            <span className="top-products-sub">Best seller per category by units sold</span>
                        </div>
                    </div>

                    {topProductsLoading ? (
                        <div className="top-table-wrap">
                            <table className="top-products-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Product</th>
                                        <th>Units Sold</th>
                                        <th>Price</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <tr key={i}>
                                            <td className="top-rank-cell">
                                                <div className="skeleton-shimmer" style={{ width: "16px", height: "16px", borderRadius: "4px" }} />
                                            </td>
                                            <td>
                                                <div className="top-product-cell">
                                                    <div className="skeleton-shimmer" style={{ width: "38px", height: "38px", borderRadius: "8px", flexShrink: 0 }} />
                                                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
                                                        <div className="skeleton-shimmer" style={{ width: i % 2 === 0 ? "70%" : "80%", height: "14px", borderRadius: "4px" }} />
                                                        <div className="skeleton-shimmer" style={{ width: "35%", height: "10px", borderRadius: "4px" }} />
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="skeleton-shimmer" style={{ width: "65px", height: "18px", borderRadius: "6px" }} />
                                            </td>
                                            <td className="top-price-cell">
                                                <div className="skeleton-shimmer" style={{ width: "55px", height: "16px", borderRadius: "4px" }} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : topProducts.topSellingProducts.length === 0 ? (
                        <p className="top-products-empty">No sales yet — completed orders will appear here.</p>
                    ) : (
                        <div className="top-table-wrap">
                            <table className="top-products-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Product</th>
                                        <th>Units Sold</th>
                                        <th>Price</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {topProducts.topSellingProducts.map(p => (
                                        <tr key={p.productId}>
                                            <td className="top-rank-cell">{p.rank}</td>
                                            <td>
                                                <div className="top-product-cell">
                                                    {p.imageUrl ? (
                                                        <img className="top-product-thumb" src={p.imageUrl} alt={p.name} />
                                                    ) : (
                                                        <div className="top-product-thumb top-product-thumb--empty">•</div>
                                                    )}
                                                    <div>
                                                        <Link to={`/product/${p.productId}`} className="top-product-name" title={p.name}>
                                                            {p.name}
                                                        </Link>
                                                        <div className="top-product-cat">{p.categoryName || "Uncategorized"}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="top-sold-cell">
                                                    <span className="top-sold-count">{Number(p.totalSold).toLocaleString()}</span>
                                                    <span className="top-sold-unit">sold</span>
                                                </div>
                                            </td>
                                            <td className="top-price-cell">€{formatPrice(p.price)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboardView;