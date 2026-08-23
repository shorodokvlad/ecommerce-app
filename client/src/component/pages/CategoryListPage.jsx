import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ApiService from "../../service/ApiService";
import { CategoryListSkeleton } from "../common/CategorySkeleton";
import '../../style/categoryListPage.css';

const CACHE_KEY = "shv_categories_list";
const CACHE_TIME_KEY = "shv_categories_list_time";
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const CategoryListPage = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        // Read cached categories from sessionStorage for instant render
        const cachedData = sessionStorage.getItem(CACHE_KEY);
        const cachedTime = sessionStorage.getItem(CACHE_TIME_KEY);
        const now = Date.now();

        if (cachedData && cachedTime && (now - parseInt(cachedTime, 10)) < CACHE_TTL) {
            try {
                const parsed = JSON.parse(cachedData);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setCategories(parsed);
                    setLoading(false);
                }
            } catch (e) {
                // Ignore parse errors
            }
        }

        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            if (!sessionStorage.getItem(CACHE_KEY)) {
                setLoading(true);
            }
            const response = await ApiService.getAllCategory();
            const fetched = response.categoryList || [];
            setCategories(fetched);
            sessionStorage.setItem(CACHE_KEY, JSON.stringify(fetched));
            sessionStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
        } catch (err) {
            if (!sessionStorage.getItem(CACHE_KEY)) {
                setError(err.response?.data?.message || err.message || 'Unable to fetch categories');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCategoryClick = (categoryId) => {
        navigate(`/category/${categoryId}`);
    };

    return (
        <div className="category-list">
            {error ? (
                <p className="error-message">{error}</p>
            ) : (
                <div>
                    <header className="shop-band">
                        <p className="shop-eyebrow">SHV Store</p>
                        <h1>Explore categories</h1>
                    </header>

                    {loading && categories.length === 0 ? (
                        <CategoryListSkeleton />
                    ) : (
                        <div className="category-grid">
                            {categories.map((category) => {
                                const catName = category.name ? category.name.toLowerCase() : '';
                                const isSmaller = catName.includes('table') || catName.includes('wearable');
                                return (
                                    <div
                                        className="category-card"
                                        key={category.id}
                                        data-category={catName}
                                        onClick={() => handleCategoryClick(category.id)}
                                    >
                                        <div className="category-image-wrap">
                                            {category.imageUrl ? (
                                                <img
                                                    src={category.imageUrl}
                                                    alt={category.name}
                                                    className={`category-image ${isSmaller ? 'category-image-small' : ''}`}
                                                />
                                            ) : (
                                                <div className="category-placeholder-img">
                                                    <span>{category.name.substring(0, 2).toUpperCase()}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="category-info">
                                            <h3>{category.name}</h3>
                                            <span className="category-cta">Browse →</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CategoryListPage;