import React, { useState, useEffect } from "react";
import ApiService from "../../service/ApiService";
import { useNavigate, useParams } from "react-router-dom";
import { useDemoRestriction } from "./demoRestriction";
import '../../style/adminWarehouse.css';

const EditWarehousePage = () => {
    const { warehouseId } = useParams();
    const [form, setForm] = useState({
        name: '',
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
    });
    const [message, setMessage] = useState('');
    const navigate = useNavigate();
    const { readOnly, permissionMessage, blockWrite } = useDemoRestriction();

    useEffect(() => {
        const fetchWarehouse = async () => {
            try {
                const response = await ApiService.getWarehouseById(warehouseId);
                const wh = response.warehouse;
                setForm({
                    name: wh.name || '',
                    street: wh.street || '',
                    city: wh.city || '',
                    state: wh.state || '',
                    zipCode: wh.zipCode || '',
                    country: wh.country || ''
                });
            } catch (error) {
                setMessage(error.response?.data?.message || error.message || "Failed to get a warehouse by id")
                setTimeout(() => {
                    setMessage('');
                }, 3000)
            }
        }
        fetchWarehouse();
    }, [warehouseId])

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (readOnly) {
            blockWrite();
            return;
        }
        try {
            const response = await ApiService.updateWarehouse(warehouseId, form);
            if (response.status === 200) {
                setMessage(response.message);
                setTimeout(() => {
                    setMessage('');
                    navigate("/admin/warehouses")
                }, 2000)
            }
        } catch (error) {
            setMessage(error.response?.data?.message || error.message || "Failed to save a warehouse")
        }
    }

    return (
        <div className="warehouse-form-page">
            {permissionMessage && <p className="demo-permission-message">{permissionMessage}</p>}
            {message && <p className="message">{message}</p>}
            <form onSubmit={handleSubmit} className="warehouse-form">
                <h2>Edit Warehouse</h2>

                <div className="warehouse-form-group">
                    <label>Warehouse Name *</label>
                    <input
                        type="text"
                        name="name"
                        placeholder="e.g. Main Depot Amsterdam"
                        value={form.name}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="warehouse-form-row">
                    <div className="warehouse-form-group">
                        <label>Street</label>
                        <input
                            type="text"
                            name="street"
                            placeholder="e.g. Industrieweg 12"
                            value={form.street}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="warehouse-form-group">
                        <label>City</label>
                        <input
                            type="text"
                            name="city"
                            placeholder="e.g. Amsterdam"
                            value={form.city}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                <div className="warehouse-form-row">
                    <div className="warehouse-form-group">
                        <label>State / Region</label>
                        <input
                            type="text"
                            name="state"
                            placeholder="e.g. North Holland"
                            value={form.state}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="warehouse-form-group">
                        <label>Zip Code</label>
                        <input
                            type="text"
                            name="zipCode"
                            placeholder="e.g. 1013"
                            value={form.zipCode}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                <div className="warehouse-form-group">
                    <label>Country</label>
                    <input
                        type="text"
                        name="country"
                        placeholder="e.g. Netherlands"
                        value={form.country}
                        onChange={handleChange}
                    />
                </div>

                <button type="submit" className={readOnly ? "demo-no-permission" : ""} aria-disabled={readOnly}>Update Warehouse</button>
            </form>
        </div>
    )
}

export default EditWarehousePage;