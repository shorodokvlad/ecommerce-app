import React, { useState, useEffect } from "react";
import ApiService from "../../service/ApiService";
import { useNavigate } from "react-router-dom";
import { AdminListSkeleton } from "./AdminSkeleton";
import { useDemoRestriction } from "./demoRestriction";
import '../../style/adminCategory.css';

const AdminCategoryPage = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { readOnly, permissionMessage, blockWrite } = useDemoRestriction();

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const response = await ApiService.getAllCategory();
            setCategories(response.categoryList || []);
        } catch (error) {
            console.log("Error fetching category list", error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = async (id) => {
        navigate(`/admin/edit-category/${id}`);
    };

    const handleDelete = async (id) => {
        if (readOnly) {
            blockWrite();
            return;
        }
        const confirmed = window.confirm("Are you sure you want to delete this category?");
        if (confirmed) {
            try {
                sessionStorage.removeItem("shv_categories_list");
                sessionStorage.removeItem("shv_categories_list_time");
                await ApiService.deleteCategory(id);
                fetchCategories();
            } catch (error) {
                console.log("Error deleting category by id");
            }
        }
    };

    return (
        <div className="admin-category-page">
            <div className="admin-category-list">
                <h2>Categories</h2>
                {permissionMessage && <p className="demo-permission-message">{permissionMessage}</p>}
                <button onClick={() => navigate('/admin/add-category')}>Add Category</button>

                {loading ? (
                    <AdminListSkeleton count={5} />
                ) : (
                    <ul>
                        {categories.map((category) => (
                            <li key={category.id}>
                                <span>{category.name}</span>
                                <div className="admin-bt">
                                    <button className="admin-btn-edit" onClick={() => handleEdit(category.id)}>Edit</button>
                                    <button className={readOnly ? "demo-no-permission" : ""} aria-disabled={readOnly} onClick={() => handleDelete(category.id)}>Delete</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default AdminCategoryPage;