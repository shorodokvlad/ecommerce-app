import React, { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import ProductList from "../common/ProductList";
import Pagination from "../common/Pagination";
import ApiService from "../../service/ApiService";
import BannerCarousel from "../common/BannerCarousel";
import ProductSkeleton from "../common/ProductSkeleton";
import '../../style/home.css';

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache validity
const HOME_FEED_LIMIT = 24; // max products shown on the home feed (no pagination)
const SEARCH_PAGE_SIZE = 18;

const Home = () => {
    const location = useLocation();
    const [products, setProducts] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    const searchItem = new URLSearchParams(location.search).get('search');

    // A new search should always start from the first page
    useEffect(() => {
        setCurrentPage(1);
    }, [location.search]);

    useEffect(() => {
        const fetchProducts = async () => {
            const pageIndex = currentPage - 1;

            // The home feed is a single curated list (no pagination) — cached in
            // sessionStorage so revisits render instantly instead of re-shuffling.
            if (!searchItem) {
                const cachedData = sessionStorage.getItem('shv_home_feed_v3');
                const cachedTime = sessionStorage.getItem('shv_home_feed_v3_time');
                if (cachedData && cachedTime && (Date.now() - parseInt(cachedTime, 10)) < CACHE_TTL) {
                    try {
                        setProducts(JSON.parse(cachedData).productList || []);
                        setLoading(false);
                        return;
                    } catch (e) {
                        // Ignore cache parse errors and fall through to a fresh fetch
                    }
                }
            }

            setLoading(true);

            try {
                setError(null);
                const response = searchItem
                    ? await ApiService.searchProducts(searchItem, pageIndex, SEARCH_PAGE_SIZE)
                    : await ApiService.getHomeFeedProducts(HOME_FEED_LIMIT);

                setProducts(response.productList || []);
                setTotalPages(response.totalPage || 1);

                if (!searchItem) {
                    sessionStorage.setItem('shv_home_feed_v3', JSON.stringify(response));
                    sessionStorage.setItem('shv_home_feed_v3_time', Date.now().toString());
                }
            } catch (err) {
                // If we already loaded cached feed data, don't display blocking error
                if (searchItem || !sessionStorage.getItem('shv_home_feed_v3')) {
                    setError(err.response?.data?.message || err.message || 'Unable to fetch products');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [searchItem, currentPage]);

    return (
        <div className="home">
            {searchItem ? (
                <header className="shop-band">
                    <p className="shop-eyebrow">Search results</p>
                    <h1>“{searchItem}”</h1>
                    <Link to="/" className="shop-band-clear">Clear search</Link>
                </header>
            ) : (
                <BannerCarousel />
            )}

            {error && <p className="error-message">{error}</p>}

            {loading && products.length === 0 ? (
                <section className="best-sellers-section">
                    {!searchItem && <h2 className="section-title emag-section-title">Products chosen for you</h2>}
                    <ProductSkeleton count={searchItem ? SEARCH_PAGE_SIZE : HOME_FEED_LIMIT} />
                </section>
            ) : products.length === 0 ? (
                <div className="search-empty-state">
                    <h3>No products found matching "{searchItem || ''}".</h3>
                    <Link to="/" className="shop-band-clear">View All Products</Link>
                </div>
            ) : (
                <section className="best-sellers-section">
                    {!searchItem && <h2 className="section-title emag-section-title">Products chosen for you</h2>}
                    <ProductList products={products} />
                    {/* Pagination only for search results — the home feed is a single curated list */}
                    {searchItem && totalPages > 1 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={(page) => setCurrentPage(page)}
                        />
                    )}
                </section>
            )}
        </div>
    );
};

export default Home;
