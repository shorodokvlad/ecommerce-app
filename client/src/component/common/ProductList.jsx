import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useFavorites } from "../context/FavoritesContext";
import AddToCartModal from "./AddToCartModal";
import StarRating from "./StarRating";
import { configureProduct } from "../../utils/productVariant";
import { Heart, ShoppingBag } from "lucide-react";
import '../../style/productList.css';

const ProductList = ({ products }) => {
    const { dispatch } = useCart();
    const { isFavorite, toggleFavorite } = useFavorites();
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleAddToCart = (e, product) => {
        e.preventDefault();
        e.stopPropagation();
        dispatch({ type: 'ADD_ITEM', payload: product });
        setSelectedProduct(product);
        setIsModalOpen(true);
    };

    return (
        <div className="product-list emag-6-cols">
            {products.map((product) => {
                const defaultVariant = product.variants?.[0] || null;
                const configuredProduct = configureProduct(product, defaultVariant);
                const outOfStock = configuredProduct.stockQuantity === 0;
                const favorited = isFavorite(configuredProduct.favoriteKey);

                const currentPrice = configuredProduct.price || 0;
                const formattedPrice = currentPrice % 1 === 0 ? currentPrice.toFixed(0) : currentPrice.toFixed(2);

                return (
                    <article className="emag-product-card" key={product.id}>
                        {/* FAVORITE BUTTON */}
                        <div className="emag-card-top-bar" style={{ justifyContent: "flex-end" }}>
                            <button
                                type="button"
                                className={`emag-fav-btn ${favorited ? "active" : ""}`}
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    toggleFavorite(configuredProduct);
                                }}
                                title={favorited ? "Remove from favorites" : "Add to favorites"}
                            >
                                <Heart size={16} fill={favorited ? "#ef4444" : "none"} color={favorited ? "#ef4444" : "#94a3b8"} />
                            </button>
                        </div>

                        {/* PRODUCT CARD LINK */}
                        <Link to={configuredProduct.productUrl} className="emag-card-link">
                            {/* CENTERED PRODUCT IMAGE */}
                            <div className="emag-image-wrap">
                                <img 
                                    src={configuredProduct.imageUrl} 
                                    alt={product.name} 
                                    className="emag-product-img" 
                                />
                            </div>

                            {/* PRODUCT TITLE */}
                            <h3 className="emag-product-name">{product.name}</h3>

                            {/* RATING ROW - only for products that actually have reviews */}
                            {product.reviewCount > 0 && (
                                <div className="emag-rating-row">
                                    <StarRating
                                        value={product.averageRating || 0}
                                        count={product.reviewCount}
                                        size={12}
                                        showValue
                                    />
                                </div>
                            )}

                            {/* PRICE AND ADD TO CART ROW */}
                            <div className="emag-price-cart-row">
                                <div className="emag-price-group">
                                    <div className="emag-sale-price-wrap">
                                        <span className="emag-main-price">€{formattedPrice}</span>
                                    </div>
                                </div>

                                <button 
                                    type="button"
                                    className="emag-cart-btn" 
                                    onClick={(e) => handleAddToCart(e, configuredProduct)} 
                                    disabled={outOfStock}
                                    title={outOfStock ? "Out of stock" : "Add to cart"}
                                >
                                    <ShoppingBag size={17} />
                                </button>
                            </div>
                        </Link>
                    </article>
                );
            })}

            {/* Added to Cart Popup Modal */}
            <AddToCartModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                product={selectedProduct}
                price={selectedProduct?.price}
                imageUrl={selectedProduct?.imageUrl}
            />
        </div>
    );
};

export default ProductList;
