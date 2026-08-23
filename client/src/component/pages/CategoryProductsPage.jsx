import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import ApiService from "../../service/ApiService";
import ProductList from "../common/ProductList";
import Pagination from "../common/Pagination";
import { CategoryProductsSkeleton } from "../common/CategorySkeleton";
import '../../style/home.css';

const CategoryProductsPage = () => {
    const { categoryId } = useParams();
    const [products, setProducts] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const itemsPerPage = 15;

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                const pageIndex = currentPage - 1;
                const response = await ApiService.getProductByCategoryId(categoryId, pageIndex, itemsPerPage);
                setProducts(response.productList || []);
                setTotalPages(response.totalPage || 1);
            } catch (error) {
                setError(error.response?.data?.message || error.message || 'Unable to fetch products by category ID');
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [categoryId, currentPage]);

    return (
        <div className="home">
            {error ? (
                <p className="error-message">{error}</p>
            ) : loading ? (
                <CategoryProductsSkeleton />
            ) : (
                <div>
                    <ProductList products={products} />
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={(page) => setCurrentPage(page)}
                    />
                </div>
            )}
        </div>
    );
};

export default CategoryProductsPage;