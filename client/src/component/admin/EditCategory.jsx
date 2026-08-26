import React, { useState, useEffect } from "react";
import ApiService from "../../service/ApiService";
import { useNavigate, useParams } from "react-router-dom";
import { useDemoRestriction } from "./demoRestriction";
import '../../style/addCategory.css'

const EditCategory = () => {
    const { categoryId } = useParams();
    const [name, setName] = useState('')
    const [message, setMessage] = useState('');
    const navigate = useNavigate();
    const { readOnly, permissionMessage, blockWrite } = useDemoRestriction();


    useEffect(() => {
        const fetchCategory = async () => {
            try {
                const response = await ApiService.getCategoryById(categoryId);
                setName(response.category.name);

            } catch (error) {
                setMessage(error.response?.data?.message || error.message || "Failed to get a category by id")
                setTimeout(() => {
                    setMessage('');
                }, 3000)
            }
        }
        fetchCategory();
    }, [categoryId])

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (readOnly) {
            blockWrite();
            return;
        }
        try {
            const response = await ApiService.updateCategory(categoryId, { name });
            if (response.status === 200) {
                setMessage(response.message);
                setTimeout(() => {
                    setMessage('');
                    navigate("/admin/categories")
                }, 3000)
            }
        } catch (error) {
            setMessage(error.response?.data?.message || error.message || "Failed to save a category")
        }
    }

    return (
        <div className="add-category-page">
            {permissionMessage && <p className="demo-permission-message">{permissionMessage}</p>}
            {message && <p className="message">{message}</p>}
            <form onSubmit={handleSubmit} className="category-form">
                <h2>Edit Category</h2>
                <input type="text"
                    placeholder="Category Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)} />

                <button type="submit" className={readOnly ? "demo-no-permission" : ""} aria-disabled={readOnly}>Update</button>
            </form>
        </div>
    )

}

export default EditCategory;