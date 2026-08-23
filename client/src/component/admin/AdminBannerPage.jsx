import React, { useState, useEffect } from "react";
import ApiService from "../../service/ApiService";
import { AdminListSkeleton } from "./AdminSkeleton";
import "../../style/adminBanner.css";

const AdminBannerPage = () => {
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingBannerId, setEditingBannerId] = useState(null);

    const [title, setTitle] = useState("");
    const [linkUrl, setLinkUrl] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [imageFile, setImageFile] = useState(null);
    const [active, setActive] = useState(true);
    const [displayOrder, setDisplayOrder] = useState(0);
    const [message, setMessage] = useState("");
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        fetchBanners();
    }, []);

    const fetchBanners = async () => {
        try {
            setLoading(true);
            const res = await ApiService.getAllBanners();
            setBanners(res.bannerList || []);
        } catch (err) {
            console.error("Failed to fetch banners", err);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setTitle("");
        setLinkUrl("");
        setImageUrl("");
        setImageFile(null);
        setActive(true);
        setDisplayOrder(0);
        setEditingBannerId(null);
        setShowForm(false);
    };

    const handleEditClick = (banner) => {
        setEditingBannerId(banner.id);
        setTitle(banner.title || "");
        setLinkUrl(banner.linkUrl || "");
        setImageUrl(banner.imageUrl || "");
        setImageFile(null);
        setActive(banner.active);
        setDisplayOrder(banner.displayOrder || 0);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this banner?")) {
            try {
                sessionStorage.removeItem("shv_home_banners");
                sessionStorage.removeItem("shv_home_banners_time");
                await ApiService.deleteBanner(id);
                fetchBanners();
            } catch (err) {
                alert("Failed to delete banner");
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");

        const formData = new FormData();
        if (imageFile) {
            formData.append("image", imageFile);
        }
        if (imageUrl) {
            formData.append("imageUrl", imageUrl);
        }
        if (title) formData.append("title", title);
        if (linkUrl) formData.append("linkUrl", linkUrl);
        formData.append("active", active);
        formData.append("displayOrder", displayOrder);

        try {
            setIsUploading(true);
            sessionStorage.removeItem("shv_home_banners");
            sessionStorage.removeItem("shv_home_banners_time");
            if (editingBannerId) {
                await ApiService.updateBanner(editingBannerId, formData);
                setMessage("Banner updated successfully!");
            } else {
                await ApiService.createBanner(formData);
                setMessage("Banner created successfully!");
            }
            resetForm();
            await fetchBanners();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to save banner");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="admin-banner-container">
            {isUploading && (
                <div className="upload-overlay">
                    <div className="upload-modal-card">
                        <div className="banner-upload-spinner"></div>
                        <h3>Uploading Banner...</h3>
                        <p>Please wait while the image is being uploaded to S3 and saved.</p>
                    </div>
                </div>
            )}

            <div className="admin-banner-header">
                <h2>Manage Carousel Banners</h2>
                {!showForm && (
                    <button className="btn-primary" onClick={() => setShowForm(true)}>
                        + Add New Banner
                    </button>
                )}
            </div>

            {message && <div style={{ padding: "10px", marginBottom: "15px", background: "#dcfce7", color: "#15803d", borderRadius: "8px" }}>{message}</div>}

            {showForm && (
                <div className="banner-form-card">
                    <h3>{editingBannerId ? "Edit Banner" : "Add New Banner"}</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Banner Title (Optional)</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Summer Sale 30% Off"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label>Link URL (Optional)</label>
                                <input
                                    type="text"
                                    placeholder="e.g. /category/1 or https://..."
                                    value={linkUrl}
                                    onChange={(e) => setLinkUrl(e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label>Image URL (or upload file below)</label>
                                <input
                                    type="text"
                                    placeholder="https://images.unsplash.com/..."
                                    value={imageUrl}
                                    onChange={(e) => setImageUrl(e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label>Upload Image File (Max 25MB)</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (file && file.size > 25 * 1024 * 1024) {
                                            alert("File size exceeds 25MB limit. Please select a smaller image.");
                                            e.target.value = null;
                                            setImageFile(null);
                                            return;
                                        }
                                        setImageFile(file);
                                    }}
                                />
                            </div>

                            <div className="form-group">
                                <label>Display Order</label>
                                <input
                                    type="number"
                                    value={displayOrder}
                                    onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
                                />
                            </div>

                            <div className="form-group">
                                <label>Status</label>
                                <select
                                    value={active ? "true" : "false"}
                                    onChange={(e) => setActive(e.target.value === "true")}
                                >
                                    <option value="true">Active (Visible)</option>
                                    <option value="false">Inactive (Hidden)</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-actions">
                            <button type="button" className="btn-secondary" onClick={resetForm} disabled={isUploading}>
                                Cancel
                            </button>
                            <button type="submit" className="btn-primary" disabled={isUploading}>
                                {isUploading ? "Uploading..." : (editingBannerId ? "Update Banner" : "Save Banner")}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {loading ? (
                <AdminListSkeleton count={4} />
            ) : (
                <table className="banner-table">
                    <thead>
                        <tr>
                            <th>Image</th>
                            <th>Title / Details</th>
                            <th>Link URL</th>
                            <th>Order</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {banners.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={{ textAlign: "center", padding: "24px", color: "#64748b" }}>
                                    No custom banners created yet. The carousel is using default fallback banners.
                                </td>
                            </tr>
                        ) : (
                            banners.map((banner) => (
                                <tr key={banner.id}>
                                    <td>
                                        <img src={banner.imageUrl} alt={banner.title || "Banner"} className="banner-thumb" />
                                    </td>
                                    <td>
                                        <strong>{banner.title || "Untitled Banner"}</strong>
                                    </td>
                                    <td>{banner.linkUrl || "-"}</td>
                                    <td>{banner.displayOrder}</td>
                                    <td>
                                        <span className={`status-badge ${banner.active ? "active" : "inactive"}`}>
                                            {banner.active ? "Active" : "Inactive"}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-btns">
                                            <button className="btn-edit" onClick={() => handleEditClick(banner)}>
                                                Edit
                                            </button>
                                            <button className="btn-delete" onClick={() => handleDelete(banner.id)}>
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default AdminBannerPage;
