import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useDemoRestriction } from "./demoRestriction";
import '../../style/adminOrderDetails.css'
import ApiService from "../../service/ApiService";


const OrderStatus = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED"];

const AdminOrderDetailsPage = () => {
    const { itemId } = useParams();
    const [orderItems, setOrderItems] = useState([]);
    const [message, setMessage] = useState('');
    const [selectedStatus, setSelectedStatus] = useState({});
    const { readOnly, permissionMessage, blockWrite } = useDemoRestriction();


    useEffect(() => {
        fetchOrderDetails(itemId);
    }, [itemId]);

    const fetchOrderDetails = async (itemId) => {
        try {
            const response = await ApiService.getOrderItemById(itemId);
            setOrderItems(response.orderItemList)
        } catch (error) {
            console.log(error.message || error);
        }
    }

    const handleStatusChange = (orderItemId, newStatus) => {
        setSelectedStatus({ ...selectedStatus, [orderItemId]: newStatus })
    }

    const handleSubmitStatusChange = async (orderItemId) => {
        if (readOnly) {
            blockWrite();
            return;
        }
        try {
            await ApiService.updateOrderitemStatus(orderItemId, selectedStatus[orderItemId]);
            setMessage('order item status was successfully updated')
            setTimeout(() => {
                setMessage('');
            }, 3000)
        } catch (error) {
            setMessage(error.response?.data?.message || error.message || 'unable  to update order item status')
        }
    }


    return (
        <div className="order-details-page">
            {permissionMessage && <p className="demo-permission-message">{permissionMessage}</p>}
            {message && <div className="message">{message}</div>}
            <h2>Order Details</h2>
            {orderItems.length ? (
                orderItems.map((orderItem) => {
                    const user = orderItem.user || orderItem.userDto || {};
                    const product = orderItem.product || orderItem.productDto || {};
                    return (
                    <div key={orderItem.id} className="order-item-details">
                        <div className="info">
                            <h3>Order Information</h3>
                            <p><strong>Order Item ID:</strong>{orderItem.id}</p>
                            <p><strong>Quantity:</strong>{orderItem.quantity}</p>
                            <p><strong>Total Price:</strong>{orderItem.price}</p>
                            <p><strong>Order Status:</strong>{orderItem.status}</p>
                            <p><strong>date Ordered:</strong>{new Date(orderItem.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="info">
                            <h3>User Information</h3>
                            <p><strong>Name:</strong>{user.name}</p>
                            <p><strong>Email:</strong>{user.email}</p>
                            <p><strong>Phone:</strong>{user.phoneNumber}</p>
                            <p><strong>Role:</strong>{user.role}</p>

                            <div className="info">
                                <h3>Delivery Address</h3>
                                <p><strong>Country:</strong>{user.address?.country}</p>
                                <p><strong>State:</strong>{user.address?.state}</p>
                                <p><strong>City:</strong>{user.address?.city}</p>
                                <p><strong>Street:</strong>{user.address?.street}</p>
                                <p><strong>Zip Code:</strong>{user.address?.zipCode}</p>
                            </div>
                        </div>
                        <div>
                            <h2>Product Information</h2>
                            <img src={orderItem.variantImageUrl || product.imageUrl} alt={product.name} />
                            <p><strong>Name:</strong>{product.name}</p>
                            {orderItem.variantTitle && <p><strong>Configuration:</strong>{orderItem.variantTitle}</p>}
                            {orderItem.variantAttributes && Object.entries(orderItem.variantAttributes).map(([key, value]) => (
                                <p key={key}><strong>{key}:</strong>{value}</p>
                            ))}
                            <p><strong>Price:</strong>{product.price}</p>
                        </div>
                        <div className="status-change">
                            <h4>Change Status</h4>
                            <select
                                className="status-option"
                                value={selectedStatus[orderItem.id] || orderItem.status}
                                onChange={(e) => handleStatusChange(orderItem.id, e.target.value)}>

                                {OrderStatus.map(status => (
                                    <option key={status} value={status}>{status}</option>
                                ))}
                            </select>
                            <button
                                className={`update-status-button${readOnly ? " demo-no-permission" : ""}`}
                                aria-disabled={readOnly}
                                onClick={() => handleSubmitStatusChange(orderItem.id)}
                            >
                                Update Status
                            </button>
                        </div>
                    </div>

                )})
            ) : (
                <p>Loading order details ....</p>
            )}
        </div>
    );

}

export default AdminOrderDetailsPage;
