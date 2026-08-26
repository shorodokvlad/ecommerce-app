import React, { useState, useEffect, useMemo } from "react";
import { useParams, Link, useLocation, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useFavorites } from "../context/FavoritesContext";
import StockBadge from "../common/StockBadge";
import SpecificationsTable from "../common/SpecificationsTable";
import AddToCartModal from "../common/AddToCartModal";
import AddReviewModal from "../common/AddReviewModal";
import ProductDetailsSkeleton from "../common/ProductDetailsSkeleton";
import StarRating from "../common/StarRating";
import DeliveryEstimate from "../delivery/DeliveryEstimate";
import ApiService from "../../service/ApiService";
import { parseSpecifications } from "../../utils/specParser";
import { configureProduct, findVariantFromSearch, getProductIdFromRoute, getProductPath } from "../../utils/productVariant";
import { CheckCircle2, Star } from "lucide-react";
import '../../style/productDetailsPage.css';

const getColorHex = (colorName) => {
    if (!colorName) return null;
    const name = colorName.toLowerCase().trim();
    const colorMap = {
        'black': '#000000',
        'space black': '#1d1d1f',
        'white': '#ffffff',
        'silver': '#e3e4e5',
        'space gray': '#68696d',
        'space grey': '#68696d',
        'gold': '#f5e0c3',
        'rose gold': '#e0a96d',
        'blue': '#2563eb',
        'sky blue': '#87ceeb',
        'ultramarine': '#4169e1',
        'green': '#16a34a',
        'pink': '#ec4899',
        'yellow': '#eab308',
        'purple': '#a855f7',
        'red': '#dc2626',
        'midnight': '#191970',
        'starlight': '#f0eae1',
        'natural titanium': '#8a8782',
        'desert titanium': '#c2b29f',
        'white titanium': '#f2f1ed',
        'black titanium': '#2e2d2b',
        'dark titanium': '#3c3d3e'
    };
    return colorMap[name] || null;
};

const ProductDetailsPage = () => {
    const { productId: productRoute } = useParams();
    const productId = getProductIdFromRoute(productRoute);
    const location = useLocation();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
    const [selectedAttributes, setSelectedAttributes] = useState({});
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [isCartModalOpen, setIsCartModalOpen] = useState(false);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

    const [reviews, setReviews] = useState([]);
    const [reviewMessage, setReviewMessage] = useState(null);
    const [reviewError, setReviewError] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);

    const { dispatch } = useCart();
    const { isFavorite, toggleFavorite } = useFavorites();

    const isAuthenticated = ApiService.isAuthenticated();
    const isAdmin = ApiService.isAdmin();

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const response = await ApiService.getReviewsByProductId(productId);
                setReviews(response.reviewList || []);
            } catch (error) {
                console.error("Error fetching reviews:", error);
            }
        };
        fetchReviews();
    }, [productId]);

    useEffect(() => {
        let active = true;
        if (!isAuthenticated) {
            setCurrentUserId(null);
            return;
        }
        ApiService.getLoggedInUserInfo()
            .then((response) => {
                if (active) setCurrentUserId(response.user?.id ?? null);
            })
            .catch(() => {
                if (active) setCurrentUserId(null);
            });
        return () => {
            active = false;
        };
    }, [isAuthenticated]);

    useEffect(() => {
        const cacheKey = `shv_product_details_${productId}`;
        const cacheTimeKey = `shv_product_details_time_${productId}`;
        const CACHE_TTL = 5 * 60 * 1000;

        // Check sessionStorage cache for instant render
        const cachedData = sessionStorage.getItem(cacheKey);
        const cachedTime = sessionStorage.getItem(cacheTimeKey);
        const now = Date.now();

        if (cachedData && cachedTime && (now - parseInt(cachedTime, 10)) < CACHE_TTL) {
            try {
                const fetchedProduct = JSON.parse(cachedData);
                setProduct(fetchedProduct);
            } catch (e) {
                // Ignore parse errors
            }
        }

        const fetchProduct = async () => {
            try {
                const response = await ApiService.getProductById(productId);
                const fetchedProduct = response.product;
                setProduct(fetchedProduct);

                sessionStorage.setItem(cacheKey, JSON.stringify(fetchedProduct));
                sessionStorage.setItem(cacheTimeKey, Date.now().toString());
            } catch (error) {
                console.error("Error fetching product details:", error);
            }
        };

        fetchProduct();
    }, [productId]);

    useEffect(() => {
        if (!product?.variants?.length) return;

        const requestedVariant = findVariantFromSearch(product, location.search);
        const nextVariant = requestedVariant || product.variants[0];
        const nextIndex = product.variants.findIndex((variant) => variant.id === nextVariant.id);

        setSelectedVariantIndex(nextIndex >= 0 ? nextIndex : 0);
        setSelectedAttributes({ ...(nextVariant.attributes || {}) });
        setActiveImageIndex(0);
    }, [product, location.search]);

    // Group available attributes across all variants
    const attributeGroups = useMemo(() => {
        if (!product || !product.variants) return {};
        const groups = {};

        product.variants.forEach((v) => {
            if (v.attributes) {
                Object.entries(v.attributes).forEach(([k, val]) => {
                    if (!groups[k]) groups[k] = [];
                    if (!groups[k].includes(val)) {
                        groups[k].push(val);
                    }
                });
            }
        });

        return groups;
    }, [product]);

    // Active variant matching current attribute selection
    const activeVariant = useMemo(() => {
        if (!product || !product.variants || product.variants.length === 0) return null;

        const exactMatch = product.variants.find((v) => {
            if (!v.attributes) return false;
            return Object.entries(selectedAttributes).every(
                ([k, val]) => v.attributes[k] === val
            );
        });

        return exactMatch || product.variants[selectedVariantIndex] || product.variants[0];
    }, [product, selectedAttributes, selectedVariantIndex]);

    const handleSelectAttribute = (attrKey, val) => {
        const updatedAttrs = { ...selectedAttributes, [attrKey]: val };
        setSelectedAttributes(updatedAttrs);

        if (product?.variants) {
            const vIndex = product.variants.findIndex((v) => {
                if (!v.attributes) return false;
                return Object.entries(updatedAttrs).every(
                    ([k, vVal]) => v.attributes[k] === vVal
                );
            });
            if (vIndex !== -1) {
                setSelectedVariantIndex(vIndex);
            }
        }
        setActiveImageIndex(0);
    };

    const handleSelectVariantCard = (vIndex) => {
        setSelectedVariantIndex(vIndex);
        if (product?.variants?.[vIndex]?.attributes) {
            setSelectedAttributes({ ...product.variants[vIndex].attributes });
        }
        setActiveImageIndex(0);
    };

    // Determine photos to show in gallery
    const currentImages = useMemo(() => {
        if (activeVariant && activeVariant.imageUrls && activeVariant.imageUrls.length > 0) {
            return activeVariant.imageUrls;
        }
        if (product && product.imageUrls && product.imageUrls.length > 0) {
            return product.imageUrls;
        }
        return product ? [product.imageUrl] : [];
    }, [product, activeVariant]);

    const activePrice = activeVariant?.price ?? product?.price ?? 0;
    const activeStock = activeVariant?.stockQuantity ?? product?.stockQuantity ?? 0;
    const configuredProduct = useMemo(
        () => configureProduct(product, activeVariant),
        [product, activeVariant]
    );

    useEffect(() => {
        if (!product) return;
        const canonicalPath = getProductPath(product, activeVariant);
        const currentPath = `${location.pathname}${location.search}`;
        if (canonicalPath !== currentPath) {
            navigate(canonicalPath, { replace: true });
        }
    }, [activeVariant, location.pathname, location.search, navigate, product]);

    const specSections = useMemo(() => parseSpecifications(product?.description), [product?.description]);

    const overallRating = useMemo(() => {
        if (!reviews.length) return null;
        const sum = reviews.reduce((acc, review) => acc + (review.rating || 0), 0);
        return sum / reviews.length;
    }, [reviews]);

    const displayRating = overallRating ?? (product?.reviewCount > 0 ? product.averageRating : null);
    const displayCount = reviews.length > 0 ? reviews.length : (product?.reviewCount || 0);

    const ratingBreakdown = useMemo(() => {
        if (!displayCount) return [];
        const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        if (reviews.length > 0) {
            reviews.forEach((r) => {
                const rRating = Math.min(5, Math.max(1, Math.round(r.rating || 5)));
                counts[rRating] = (counts[rRating] || 0) + 1;
            });
        } else if (product?.reviewCount > 0) {
            const avg = product.averageRating || 5;
            counts[5] = Math.round(product.reviewCount * (avg / 5));
            counts[4] = product.reviewCount - counts[5];
        }
        return [5, 4, 3, 2, 1].map((star) => {
            const cnt = counts[star] || 0;
            const pct = displayCount > 0 ? Math.round((cnt / displayCount) * 100) : 0;
            const color = star === 5 ? "#22c55e" : star === 4 ? "#84cc16" : star === 3 ? "#eab308" : star === 2 ? "#f97316" : "#ef4444";
            return { label: `${star} star${star === 1 ? "" : "s"}`, count: cnt, pct, color };
        });
    }, [reviews, product, displayCount]);

    const handleOpenReviewModal = () => {
        if (isAuthenticated) {
            setIsReviewModalOpen(true);
        } else {
            navigate("/login");
        }
    };

    const handleModalReviewSubmit = async ({ rating, content }) => {
        setReviewMessage(null);
        setReviewError(null);
        await ApiService.createReview(productId, { rating, content });
        setReviewMessage("Thank you! Your review has been saved.");
        const response = await ApiService.getReviewsByProductId(productId);
        setReviews(response.reviewList || []);
    };

    const handleDeleteReview = async (reviewId) => {
        setReviewMessage(null);
        setReviewError(null);
        try {
            await ApiService.deleteReview(reviewId);
            const response = await ApiService.getReviewsByProductId(productId);
            setReviews(response.reviewList || []);
        } catch (error) {
            setReviewError(error.response?.data?.message || "Unable to delete review");
        }
    };

    const formatReviewDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
    };

    const outOfStock = activeStock === 0;
    const favorited = configuredProduct ? isFavorite(configuredProduct.favoriteKey) : false;

    const addToCart = () => {
        if (!product || outOfStock) return;
        dispatch({ type: 'ADD_ITEM', payload: configuredProduct });
        setIsCartModalOpen(true);
    };

    if (!product) {
        return <ProductDetailsSkeleton />;
    }

    const currentImage = currentImages[activeImageIndex] || currentImages[0] || product.imageUrl;
    const hasAttributeGroups = Object.keys(attributeGroups).length > 0;
    const hasVariantsList = product.variants && product.variants.length > 0;

    const checkOptionStock = (attrKey, val) => {
        if (!product || !product.variants) return 1;
        const hypotheticalAttrs = { ...selectedAttributes, [attrKey]: val };

        let matched = product.variants.find((v) => {
            if (!v.attributes) return false;
            return Object.entries(hypotheticalAttrs).every(
                ([k, vVal]) => v.attributes[k] === vVal
            );
        });

        if (!matched) {
            matched = product.variants.find((v) => v.attributes && v.attributes[attrKey] === val);
        }

        if (!matched) return 0;
        return matched.stockQuantity ?? 0;
    };

    return (
        <div className="product-detail-page-wrapper">
            {/* Breadcrumbs */}
            <nav className="product-breadcrumb">
                <Link to="/">Home</Link>
                <span className="crumb-sep">/</span>
                <Link to="/categories">Categories</Link>
                {product.category?.name && (
                    <>
                        <span className="crumb-sep">/</span>
                        <Link to={`/category/${product.category.id}`}>{product.category.name}</Link>
                    </>
                )}
                <span className="crumb-sep">/</span>
                <span className="crumb-current">{product.name}</span>
            </nav>

            {/* 3-Column Widescreen Layout: Media Left | Title & Options Middle | Purchasing Card Right */}
            <div className="product-detail-3col">
                {/* Column 1: Media Stage & Thumbnails */}
                <div className="product-media-col">
                    <div className="product-media-stage">
                        {currentImages.length > 1 && (
                            <div className="vertical-thumbnails-strip">
                                {currentImages.map((imgUrl, idx) => (
                                    <button
                                        key={idx}
                                        className={`v-thumb-btn ${idx === activeImageIndex ? 'active' : ''}`}
                                        onMouseEnter={() => setActiveImageIndex(idx)}
                                        onClick={() => setActiveImageIndex(idx)}
                                        type="button"
                                        aria-label={`View photo ${idx + 1}`}
                                    >
                                        <img src={imgUrl} alt={`${product.name} ${idx + 1}`} />
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="product-main-media-box">
                            <img src={currentImage} alt={product.name} />
                        </div>
                    </div>
                </div>

                {/* Column 2: Title, Variant Option Pickers & Guarantees */}
                <div className="product-options-col">
                    {product.category?.name && <span className="product-eyebrow">{product.category.name}</span>}
                    <h1>{product.name}</h1>

                    {displayRating != null && (
                        <div className="product-overall-rating">
                            <span className="product-overall-score">{displayRating.toFixed(1)}</span>
                            <StarRating value={displayRating} size={16} />
                            <span className="product-overall-count">
                                {displayCount} review{displayCount === 1 ? '' : 's'}
                            </span>
                        </div>
                    )}

                    {!specSections && <p className="product-detail-desc">{product.description}</p>}

                    {/* Configurations / Variant Options Section */}
                    {hasVariantsList && (
                        <div className="variant-selectors">
                            {hasAttributeGroups ? (
                                Object.entries(attributeGroups).map(([attrKey, attrValues]) => (
                                    <div className="option-group" key={attrKey}>
                                        <label className="option-label">
                                            {attrKey}: <strong>{selectedAttributes[attrKey] || attrValues[0]}</strong>
                                        </label>
                                        <div className="option-pills">
                                            {attrValues.map((val) => {
                                                const isSelected = selectedAttributes[attrKey] === val;
                                                const isColorAttr = attrKey.toLowerCase().includes("color");
                                                const hexColor = isColorAttr ? getColorHex(val) : null;
                                                const stockVal = checkOptionStock(attrKey, val);
                                                const isOutOfStockOption = stockVal === 0;

                                                return (
                                                    <button
                                                        key={val}
                                                        type="button"
                                                        disabled={isOutOfStockOption}
                                                        className={`option-pill ${isSelected ? 'active' : ''} ${isOutOfStockOption ? 'is-out-of-stock' : ''}`}
                                                        onClick={() => !isOutOfStockOption && handleSelectAttribute(attrKey, val)}
                                                        title={isOutOfStockOption ? `${val} (Out of stock)` : val}
                                                    >
                                                        {hexColor && (
                                                            <span
                                                                className="swatch-circle"
                                                                style={{ backgroundColor: hexColor, opacity: isOutOfStockOption ? 0.4 : 1 }}
                                                            />
                                                        )}
                                                        <span>{val}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="option-group">
                                    <label className="option-label">Configuration</label>
                                    <div className="option-pills">
                                        {product.variants.map((v, idx) => {
                                            const isConfigOut = (v.stockQuantity ?? 0) === 0;
                                            return (
                                                <button
                                                    key={v.id || idx}
                                                    type="button"
                                                    disabled={isConfigOut}
                                                    className={`option-pill ${selectedVariantIndex === idx ? 'active' : ''} ${isConfigOut ? 'is-out-of-stock' : ''}`}
                                                    onClick={() => !isConfigOut && handleSelectVariantCard(idx)}
                                                    title={isConfigOut ? `${v.title || `Config #${idx + 1}`} (Out of stock)` : v.title}
                                                >
                                                    {v.title || `Config #${idx + 1}`}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Delivery Estimate below Configuration Variants */}
                    <DeliveryEstimate defaultSubtotal={activePrice} />
                </div>

                {/* Column 3: Compact Purchasing Sidebar Card on Right Side */}
                <div className="product-buy-sidebar-col">
                    <div className="sidebar-price-row">
                        <span className="emag-price-ticket">€{activePrice.toFixed(2)}</span>
                        <div>
                            <StockBadge stockQuantity={activeStock} />
                        </div>
                    </div>

                    <div className="sidebar-actions-stack">
                        <button
                            className="add-to-cart-btn-lg"
                            onClick={addToCart}
                            disabled={outOfStock}
                            style={{
                                width: "100%",
                                height: "52px",
                                background: outOfStock ? "#cbd5e1" : "var(--ink, #1F4E63)",
                                color: "#ffffff",
                                border: "none",
                                borderRadius: "12px",
                                fontSize: "1.05rem",
                                fontWeight: "700",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "10px",
                                cursor: outOfStock ? "not-allowed" : "pointer",
                                boxShadow: outOfStock ? "none" : "0 4px 14px rgba(31, 78, 99, 0.35)",
                                transition: "all 0.15s ease"
                            }}
                        >
                            <img src="/cart.svg" alt="Cart" style={{ width: "22px", height: "22px", filter: "brightness(0) invert(1)" }} />
                            <span>{outOfStock ? 'Out of stock' : 'Add to Cart'}</span>
                        </button>

                        <button
                            onClick={() => toggleFavorite(configuredProduct)}
                            title={favorited ? "Remove from favorites" : "Add to favorites"}
                            style={{
                                width: "100%",
                                height: "48px",
                                background: favorited ? "#fee2e2" : "#ffffff",
                                border: favorited ? "2px solid #f87171" : "2px solid var(--ink, #1F4E63)",
                                borderRadius: "12px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "10px",
                                cursor: "pointer",
                                fontSize: "1rem",
                                fontWeight: "700",
                                color: favorited ? "#b91c1c" : "var(--ink, #1F4E63)",
                                transition: "all 0.15s ease"
                            }}
                        >
                            <img src="/favorite.svg" alt="Favorite" style={{ width: "20px", height: "20px" }} />
                            <span>{favorited ? "Favorited" : "Add to Favorites"}</span>
                        </button>
                    </div>

                    {/* Delivery & Protection Info Card */}
                    <div className="delivery-info-card">
                        <div className="delivery-line">
                            <img src="/truck.svg" alt="Shipping" style={{ width: "20px", height: "20px" }} />
                            <span>Shipping: <strong>Free Express Shipping</strong></span>
                        </div>
                        <div className="delivery-line">
                            <img src="/shield.svg" alt="Warranty" style={{ width: "20px", height: "20px" }} />
                            <span>Warranty: <strong>2-Year Official Warranty</strong></span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Full-Width Product Specifications Section at Bottom */}
            {specSections && (
                <div className="product-specifications-section">
                    <SpecificationsTable sections={specSections} />
                </div>
            )}

            {/* eMAG Reviews Breakdown Section */}
            <div className="emag-reviews-container" id="reviews">
                <h2 className="emag-reviews-main-title">
                    Reviews <span className="emag-reviews-count-pill">({displayCount} reviews)</span>
                </h2>

                {reviewMessage && <p className="message">{reviewMessage}</p>}
                {reviewError && <p className="error-message">{reviewError}</p>}

                {displayCount === 0 ? (
                    /* Zero Reviews Banner Card (Matching Screenshot in English) */
                    <div className="emag-zero-reviews-card">
                        <div className="emag-zero-content">
                            <h3 className="emag-zero-title">Be the first to write a review</h3>
                            <p className="emag-zero-subtext">Share your opinion by rating the product</p>
                        </div>
                        <div className="emag-zero-action-group">
                            <div 
                                className="emag-action-star-row"
                                onClick={handleOpenReviewModal}
                                style={{ cursor: "pointer" }}
                            >
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <Star key={s} size={22} color="#cbd5e1" strokeWidth={1.5} />
                                ))}
                                <span className="emag-rate-hint">Rate this product</span>
                            </div>

                            <button
                                type="button"
                                className="emag-zero-review-btn"
                                onClick={handleOpenReviewModal}
                            >
                                Add a review
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* 4-Column Breakdown Dashboard Card */}
                        <div className="emag-reviews-dashboard-card">
                            {/* Col 1: Big Score */}
                            <div className="emag-rev-col emag-rev-score-col">
                                <div className="emag-big-score">{displayRating ? displayRating.toFixed(2) : "0.00"}</div>
                                <div className="emag-score-stars">
                                    <StarRating value={displayRating || 0} size={18} />
                                </div>
                                <div className="emag-score-subtext">{displayCount} review{displayCount === 1 ? '' : 's'}</div>
                            </div>

                            {/* Col 2: Star Breakdown Progress Bars */}
                            <div className="emag-rev-col emag-rev-bars-col">
                                {ratingBreakdown.map((bar) => (
                                    <div className="emag-bar-row" key={bar.label}>
                                        <span className="emag-bar-label">{bar.label}</span>
                                        <div className="emag-bar-track">
                                            <div className="emag-bar-fill" style={{ width: `${bar.pct}%`, backgroundColor: bar.color }} />
                                        </div>
                                        <span className="emag-bar-count">({bar.count})</span>
                                    </div>
                                ))}
                            </div>

                            {/* Col 3: Verified Buyer Badge */}
                            <div className="emag-rev-col emag-rev-verified-col">
                                <div className="emag-verified-badge-icon">
                                    <CheckCircle2 size={24} color="#22c55e" fill="#22c55e" />
                                </div>
                                <div className="emag-verified-count">{displayCount}</div>
                                <div className="emag-verified-subtext">Verified Buyer Reviews</div>
                            </div>

                            {/* Col 4: Action Box - Add a Review */}
                            <div className="emag-rev-col emag-rev-action-col">
                                <h4 className="emag-action-heading">Do you own or have you used this product?</h4>
                                <p className="emag-action-subtext">Share your opinion by rating the product</p>
                                
                                <div 
                                    className="emag-action-star-row"
                                    onClick={handleOpenReviewModal}
                                >
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <Star key={s} size={22} color="#cbd5e1" strokeWidth={1.5} />
                                    ))}
                                    <span className="emag-rate-hint">Rate this product</span>
                                </div>

                                <button
                                    type="button"
                                    className="emag-add-review-btn"
                                    onClick={handleOpenReviewModal}
                                >
                                    Add a review
                                </button>
                            </div>
                        </div>

                        {/* Reviews List */}
                        <div className="reviews-list">
                            {reviews.map((review) => (
                                <article className="review-card" key={review.id}>
                                    <div className="review-card-head">
                                        <StarRating value={review.rating} size={13} />
                                        <span className="review-author">{review.userName || 'Anonymous'}</span>
                                        <span className="review-date">{formatReviewDate(review.createdAt)}</span>
                                        {(isAdmin || currentUserId === review.userId) && (
                                            <button
                                                type="button"
                                                className="review-delete-btn"
                                                onClick={() => handleDeleteReview(review.id)}
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                    {review.content && <p className="review-content">{review.content}</p>}
                                </article>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Added to Cart Popup Modal */}
            <AddToCartModal
                isOpen={isCartModalOpen}
                onClose={() => setIsCartModalOpen(false)}
                product={product}
                activeVariant={activeVariant}
                price={activePrice}
                imageUrl={currentImage}
            />

            {/* Add Review Modal (Matching Screenshot 3) */}
            <AddReviewModal
                isOpen={isReviewModalOpen}
                onClose={() => setIsReviewModalOpen(false)}
                product={configuredProduct || product}
                onSubmitReview={handleModalReviewSubmit}
            />
        </div>
    );
};

export default ProductDetailsPage;
