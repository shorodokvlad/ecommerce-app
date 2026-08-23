import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AdminListSkeleton } from "./AdminSkeleton";
import '../../style/adminProduct.css';
import Pagination from "../common/Pagination";
import ApiService from "../../service/ApiService";

const CACHE_KEY = 'admin_products_cache';
const CACHE_TTL_MS = 5 * 60 * 1000;

const AdminProductPage = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [allProducts, setAllProducts] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const itemsPerPage = 10;

    const readCache = () => {
        try {
            const raw = sessionStorage.getItem(CACHE_KEY);
            if (!raw) return null;
            const cached = JSON.parse(raw);
            if (Date.now() - cached.timestamp > CACHE_TTL_MS) return null;
            return cached.products;
        } catch {
            return null;
        }
    };

    const writeCache = (productList) => {
        try {
            sessionStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), products: productList }));
        } catch {
        }
    };

    const fetchProducts = async (force) => {
        try {
            setLoading(true);
            let productList = !force ? readCache() : null;
            if (!productList) {
                const response = await ApiService.getAllProducts();
                productList = response.productList || [];
                writeCache(productList);
            }
            setAllProducts(productList);
            setTotalPages(Math.ceil(productList.length / itemsPerPage));
            setProducts(productList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage));
        } catch (error) {
            setError(error.response?.data?.message || error.message || 'unable to fetch products');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        setProducts(allProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage));
    }, [currentPage, allProducts]);

    const handleEdit = async (id) => {
        navigate(`/admin/edit-product/${id}`);
    };

    const handleDelete = async (id) => {
        const confirmed = window.confirm("Are you sure you want to delete this product?");
        if (confirmed) {
            try {
                await ApiService.deleteProduct(id);
                sessionStorage.removeItem(CACHE_KEY);
                fetchProducts(true);
            } catch (error) {
                setError(error.response?.data?.message || error.message || 'unable to delete product');
            }
        }
    };

    return (
        <div className="admin-product-list">
            {error ? (
                <p className="error-message">{error}</p>
            ) : (
                <div>
                    <h2>Products</h2>
                    <button className="product-btn" onClick={() => { navigate('/admin/add-product'); }}>Add product</button>

                    {loading ? (
                        <AdminListSkeleton count={8} />
                    ) : (
                        <>
                            <ul>
                                {products.map((product) => (
                                    <li key={product.id}>
                                        <div className="admin-product-info">
                                            {product.imageUrl ? (
                                                <img src={product.imageUrl} alt={product.name} className="admin-product-thumb" />
                                            ) : (
                                                <div className="admin-product-thumb-placeholder">PROD</div>
                                            )}
                                            <span className="admin-product-name">{product.name}</span>
                                        </div>
                                        <div className="admin-product-actions">
                                            <button className="product-btn" onClick={() => handleEdit(product.id)}>Edit</button>
                                            <button className="product-btn-delete" onClick={() => handleDelete(product.id)}>Delete</button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={(page) => setCurrentPage(page)}
                            />
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminProductPage;