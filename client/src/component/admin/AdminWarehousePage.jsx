import React, { useState, useEffect } from "react";
import ApiService from "../../service/ApiService";
import { useNavigate } from "react-router-dom";
import { AdminListSkeleton } from "./AdminSkeleton";
import { useDemoRestriction } from "./demoRestriction";
import '../../style/adminWarehouse.css';

const AdminWarehousePage = () => {
    const [warehouses, setWarehouses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedWarehouse, setSelectedWarehouse] = useState(null);
    const [productsLoading, setProductsLoading] = useState(false);
    const navigate = useNavigate();
    const { readOnly, permissionMessage, blockWrite } = useDemoRestriction();

    useEffect(() => {
        fetchWarehouses();
    }, []);

    const fetchWarehouses = async () => {
        try {
            setLoading(true);
            const response = await ApiService.getAllWarehouses();
            setWarehouses(response.warehouseList || []);
        } catch (error) {
            console.log("Error fetching warehouse list", error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = async (id) => {
        navigate(`/admin/edit-warehouse/${id}`);
    };

    const handleDelete = async (id) => {
        if (readOnly) {
            blockWrite();
            return;
        }
        const confirmed = window.confirm("Are you sure you want to delete this warehouse? Its stored stock will also be removed.");
        if (confirmed) {
            try {
                await ApiService.deleteWarehouse(id);
                fetchWarehouses();
            } catch (error) {
                console.log("Error deleting warehouse by id", error);
            }
        }
    };

    const handleViewProducts = async (warehouse) => {
        setSelectedWarehouse(warehouse);
        setProductsLoading(true);
        try {
            const response = await ApiService.getWarehouseById(warehouse.id);
            setSelectedWarehouse(response.warehouse);
        } catch (error) {
            console.log("Error fetching warehouse details", error);
        } finally {
            setProductsLoading(false);
        }
    };

    const formatAddress = (wh) => {
        const parts = [wh.street, wh.city, wh.state, wh.zipCode, wh.country].filter(Boolean);
        return parts.length > 0 ? parts.join(", ") : "No address provided";
    };

    return (
        <div className="admin-warehouse-page">
            <div className="admin-warehouse-list">
                <h2>Warehouses</h2>
                {permissionMessage && <p className="demo-permission-message">{permissionMessage}</p>}
                <button onClick={() => navigate('/admin/add-warehouse')}>Add Warehouse</button>

                {loading ? (
                    <AdminListSkeleton count={4} />
                ) : warehouses.length === 0 ? (
                    <p className="warehouse-empty-hint">
                        No warehouses yet. Add your first warehouse to start allocating product stock.
                    </p>
                ) : (
                    <ul>
                        {warehouses.map((warehouse) => (
                            <li key={warehouse.id} className="warehouse-list-item">
                                <div className="warehouse-item-info">
                                    <span className="warehouse-item-name">{warehouse.name}</span>
                                    <span className="warehouse-item-address">{formatAddress(warehouse)}</span>
                                    <span className={`warehouse-stock-badge ${warehouse.totalStockQuantity > 0 ? 'in-stock' : 'no-stock'}`}>
                                        {warehouse.totalStockQuantity > 0
                                            ? `${warehouse.totalStockQuantity} units in stock`
                                            : "Empty"}
                                    </span>
                                </div>
                                <div className="admin-bt">
                                    <button className="admin-btn-view" onClick={() => handleViewProducts(warehouse)}>View Products</button>
                                    <button className="admin-btn-edit" onClick={() => handleEdit(warehouse.id)}>Edit</button>
                                    <button className={readOnly ? "demo-no-permission" : ""} aria-disabled={readOnly} onClick={() => handleDelete(warehouse.id)}>Delete</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {selectedWarehouse && (
                <div className="warehouse-modal-backdrop" onClick={() => setSelectedWarehouse(null)}>
                    <div className="warehouse-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="warehouse-modal-header">
                            <div>
                                <h3>{selectedWarehouse.name}</h3>
                                <p className="warehouse-modal-address">{formatAddress(selectedWarehouse)}</p>
                            </div>
                            <button className="warehouse-modal-close" onClick={() => setSelectedWarehouse(null)}>✕</button>
                        </div>

                        <div className="warehouse-modal-stock-total">
                            Total stock: <strong>{selectedWarehouse.totalStockQuantity ?? 0} units</strong>
                        </div>

                        {productsLoading ? (
                            <div style={{ textAlign: "center", padding: "32px 0", color: "var(--muted)" }}>
                                <span className="button-spinner" style={{ width: "24px", height: "24px", borderColor: "var(--line)", borderTopColor: "var(--ink)" }} />
                                <p style={{ marginTop: "12px", fontSize: "0.85rem" }}>Loading stored products...</p>
                            </div>
                        ) : selectedWarehouse.warehouseStocks && selectedWarehouse.warehouseStocks.length > 0 ? (
                            <table className="warehouse-products-table">
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Configuration</th>
                                        <th>Quantity</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedWarehouse.warehouseStocks.map((stock) => (
                                        <tr key={`${stock.variantId}-${stock.warehouseId}`}>
                                            <td>
                                                <div className="warehouse-product-cell">
                                                    {stock.productImageUrl && (
                                                        <img src={stock.productImageUrl} alt={stock.productName} className="warehouse-product-thumb" />
                                                    )}
                                                    <span>{stock.productName}</span>
                                                </div>
                                            </td>
                                            <td>{stock.variantTitle}</td>
                                            <td><strong>{stock.quantity}</strong></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p className="warehouse-empty-hint">This warehouse does not contain any products yet.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminWarehousePage;