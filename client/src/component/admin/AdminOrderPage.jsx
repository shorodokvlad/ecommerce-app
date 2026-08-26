import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AdminListSkeleton } from "./AdminSkeleton";
import '../../style/adminOrderPage.css';
import Pagination from "../common/Pagination";
import ApiService from "../../service/ApiService";

const OrderStatus = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED"];

const AdminOrdersPage = () => {
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [statusFilter, setStatusFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [loading, setLoading] = useState(true);

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [error, setError] = useState(null);
    const itemsPerPage = 10;

    const navigate = useNavigate();

    const dateFilterActive = Boolean(startDate || endDate);

    useEffect(() => {
        fetchOrders();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [startDate, endDate, currentPage]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            setError(null);
            let response;
            if (dateFilterActive) {
                response = await ApiService.getAllOrderItemsByDateRange(startDate, endDate);
            } else {
                response = await ApiService.getAllOrders();
            }
            const orderList = response.orderItemList || [];

            setTotalPages(Math.ceil(orderList.length / itemsPerPage));
            setOrders(orderList);
            setFilteredOrders(orderList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage));
        } catch (error) {
            if (error.response?.status === 404) {
                // No orders found for the selected date range
                setOrders([]);
                setFilteredOrders([]);
                setTotalPages(0);
            } else {
                setError(error.response?.data?.message || error.message || 'unable to fetch orders');
                setTimeout(() => {
                    setError('');
                }, 3000);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const filterValue = e.target.value;
        setStatusFilter(filterValue);
        setCurrentPage(1);

        if (filterValue) {
            const filtered = orders.filter(order => order.status === filterValue);
            setFilteredOrders(filtered.slice(0, itemsPerPage));
            setTotalPages(Math.ceil(filtered.length / itemsPerPage));
        } else {
            setFilteredOrders(orders.slice(0, itemsPerPage));
            setTotalPages(Math.ceil(orders.length / itemsPerPage));
        }
    };

    const handleStartDateChange = (e) => {
        setStartDate(e.target.value);
        setStatusFilter('');
        setCurrentPage(1);
    };

    const handleEndDateChange = (e) => {
        setEndDate(e.target.value);
        setStatusFilter('');
        setCurrentPage(1);
    };

    const clearDateFilter = () => {
        setStartDate('');
        setEndDate('');
        setStatusFilter('');
        setCurrentPage(1);
    };

    const handleOrderDetails = (id) => {
        navigate(`/admin/order-details/${id}`);
    };

    return (
        <div className="admin-orders-page">
            <h2>Orders</h2>
            {error && <p className="error-message">{error}</p>}
            <div className="filter-container">
                <div className="statusFilter">
                    <label>Filter By Status</label>
                    <select value={statusFilter} onChange={handleFilterChange}>
                        <option value="">All</option>
                        {OrderStatus.map(status => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>
                </div>
                <div className="dateFilter">
                    <label>Filter By Date</label>
                    <div className="date-filter-inputs">
                        <input type="date" value={startDate} onChange={handleStartDateChange} />
                        <span>—</span>
                        <input type="date" value={endDate} onChange={handleEndDateChange} />
                        {dateFilterActive && (
                            <button type="button" className="date-filter-clear" onClick={clearDateFilter}>Clear</button>
                        )}
                    </div>
                </div>
            </div>

            {loading ? (
                <AdminListSkeleton count={8} />
            ) : (
                <>
                    <table className="orders-table">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Customer</th>
                                <th>Status</th>
                                <th>Price</th>
                                <th>Date Ordered</th>
                                <th>Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredOrders.map(order => {
                                const user = order.user || order.userDto;
                                return (
                                    <tr key={order.id}>
                                        <td>{order.id}</td>
                                        <td>{user?.name || 'Unknown User'}</td>
                                        <td>{order.status}</td>
                                        <td>€{(order.price || 0).toFixed(2)}</td>
                                        <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            <button onClick={() => handleOrderDetails(order.id)}>Details</button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {filteredOrders.length === 0 && (
                        <p className="orders-empty-hint">No orders found for the selected filters.</p>
                    )}

                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={(page) => setCurrentPage(page)}
                    />
                </>
            )}
        </div>
    );
};

export default AdminOrdersPage;
