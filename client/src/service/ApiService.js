import axios from "axios"

export const SESSION_EXPIRED_EVENT = "auth:session-expired";

const clearSession = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
};

const isJwtExpired = (token) => {
    if (!token) return true;

    try {
        const payloadPart = token.split('.')[1];
        if (!payloadPart) return true;

        const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
        const padding = '='.repeat((4 - (base64.length % 4)) % 4);
        const payload = JSON.parse(window.atob(base64 + padding));

        return !payload.exp || payload.exp * 1000 <= Date.now();
    } catch {
        return true;
    }
};

axios.interceptors.response.use(
    response => response,
    error => {
        const status = error.response?.status;
        const requestHadToken = Boolean(error.config?.headers?.Authorization);
        const storedToken = localStorage.getItem('token');
        const expiredTokenRejected = status === 403 && isJwtExpired(storedToken);
        const profileSessionRejected = status === 403
            && error.config?.url?.includes('/user/my-info');

        if (requestHadToken && (status === 401 || expiredTokenRejected || profileSessionRejected)) {
            clearSession();
            window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
        }

        return Promise.reject(error);
    }
);

export default class ApiService {
    static BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:2424"

    static getHeader() {
        const token = localStorage.getItem("token");
        return {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        };
    }

    /* Auth and Users API */
    static async registerUser(registration) {
        const response = await axios.post(`${this.BASE_URL}/auth/register`, registration)
        return response.data;
    }

    static async loginUser(loginDetails) {
        const response = await axios.post(`${this.BASE_URL}/auth/login`, loginDetails)
        return response.data;
    }

    static async forgotPassword(email) {
        const response = await axios.post(`${this.BASE_URL}/auth/forgot-password`, { email })
        return response.data;
    }

    static async resetPassword(token, newPassword) {
        const response = await axios.post(`${this.BASE_URL}/auth/reset-password`, { token, newPassword })
        return response.data;
    }

    static async googleLogin(idToken) {
        const response = await axios.post(`${this.BASE_URL}/auth/google`, { idToken })
        return response.data;
    }

    static async verifyEmail(token) {
        const response = await axios.post(`${this.BASE_URL}/auth/verify-email`, { token })
        return response.data;
    }

    static async resendVerification(email) {
        const response = await axios.post(`${this.BASE_URL}/auth/resend-verification`, { email })
        return response.data;
    }

    static async getLoggedInUserInfo() {
        const response = await axios.get(`${this.BASE_URL}/user/my-info`, {
            headers: this.getHeader()
        });
        if (response.data?.user) {
            try {
                sessionStorage.setItem("shv_user_info", JSON.stringify(response.data.user));
            } catch (e) {
                // Ignore storage errors
            }
        }
        return response.data;
    }

    /* PRODUCT ENDPOINT */

    static async addProduct(formData) {
        const response = await axios.post(`${this.BASE_URL}/product/create`, formData, {
            headers: {
                ...this.getHeader(),
                "Content-Type": "multipart/form-data"
            }
        });
        return response.data;
    }

    static async updateProduct(formData) {
        const response = await axios.put(`${this.BASE_URL}/product/update`, formData, {
            headers: {
                ...this.getHeader(),
                "Content-Type": "multipart/form-data"
            }
        });
        return response.data;
    }

    static async getAllProducts(page, size) {
        const params = {};
        if (page !== undefined && page !== null) params.page = page;
        if (size !== undefined && size !== null) params.size = size;
        const response = await axios.get(`${this.BASE_URL}/product/get-all`, { params });
        return response.data;
    }

    static async searchProducts(searchValue, page, size) {
        const params = { searchValue };
        if (page !== undefined && page !== null) params.page = page;
        if (size !== undefined && size !== null) params.size = size;
        const response = await axios.get(`${this.BASE_URL}/product/search`, { params });
        return response.data;
    }

    static async getProductByCategoryId(categoryId, page, size) {
        const params = {};
        if (page !== undefined && page !== null) params.page = page;
        if (size !== undefined && size !== null) params.size = size;
        const response = await axios.get(`${this.BASE_URL}/product/get-by-category-id/${categoryId}`, { params });
        return response.data;
    }

    static async getProductById(productId) {
        const response = await axios.get(`${this.BASE_URL}/product/get-by-product-id/${productId}`)
        return response.data;
    }

    static async deleteProduct(productId) {
        const response = await axios.delete(`${this.BASE_URL}/product/delete/${productId}`, {
            headers: this.getHeader()
        });
        return response.data;
    }

    /* REVIEW ENDPOINTS */
    static async getReviewsByProductId(productId) {
        const response = await axios.get(`${this.BASE_URL}/review/get-by-product-id/${productId}`);
        return response.data;
    }

    static async createReview(productId, body) {
        const response = await axios.post(`${this.BASE_URL}/review/create/${productId}`, body, {
            headers: this.getHeader()
        });
        return response.data;
    }

    static async deleteReview(reviewId) {
        const response = await axios.delete(`${this.BASE_URL}/review/delete/${reviewId}`, {
            headers: this.getHeader()
        });
        return response.data;
    }

    /**CATEGORY */
    static async createCategory(body) {
        const response = await axios.post(`${this.BASE_URL}/category/create`, body, {
            headers: this.getHeader()
        })
        return response.data;
    }

    static async getAllCategory() {
        const response = await axios.get(`${this.BASE_URL}/category/get-all`)
        return response.data;
    }

    static async getCategoryById(categoryId) {
        const response = await axios.get(`${this.BASE_URL}/category/get-category-by-id/${categoryId}`)
        return response.data;
    }

    static async updateCategory(categoryId, body) {
        const response = await axios.put(`${this.BASE_URL}/category/update/${categoryId}`, body, {
            headers: this.getHeader()
        })
        return response.data;
    }

    static async deleteCategory(categoryId) {
        const response = await axios.delete(`${this.BASE_URL}/category/delete/${categoryId}`, {
            headers: this.getHeader()
        })
        return response.data;
    }

    /**ORDEDR */
    static async createOrder(body) {
        const response = await axios.post(`${this.BASE_URL}/order/create`, body, {
            headers: this.getHeader()
        })
        return response.data;
    }

    static async getAllOrders() {
        const response = await axios.get(`${this.BASE_URL}/order/filter`, {
            headers: this.getHeader()
        })
        return response.data;
    }

    static async getOrderItemById(itemId) {
        const response = await axios.get(`${this.BASE_URL}/order/filter`, {
            headers: this.getHeader(),
            params: {itemId}
        })
        return response.data;
    }

    static async getAllOrderItemsByStatus(status) {
        const response = await axios.get(`${this.BASE_URL}/order/filter`, {
            headers: this.getHeader(),
            params: {status}
        })
        return response.data;
    }

    static async updateOrderitemStatus(orderItemId, status) {
        const response = await axios.put(`${this.BASE_URL}/order/update-item-status/${orderItemId}`, {}, {
            headers: this.getHeader(),
            params: {status}
        })
        return response.data;
    }
/**DASHBOARD STATISTICS */
    static async getDashboardStats(params) {
        const response = await axios.get(`${this.BASE_URL}/dashboard/stats`, {
            headers: this.getHeader(),
            params
        });
        return response.data;
    }


    /***ADDRESS */
    static async saveAddress(body) {
        const response = await axios.post(`${this.BASE_URL}/address/save`, body, {
            headers: this.getHeader()
        })
        return response.data;
    }

    /* BANNER ENDPOINTS */
    static async getActiveBanners() {
        const response = await axios.get(`${this.BASE_URL}/banner/active`);
        return response.data;
    }

    static async getAllBanners() {
        const response = await axios.get(`${this.BASE_URL}/banner/all`, {
            headers: this.getHeader()
        });
        return response.data;
    }

    static async createBanner(formData) {
        const response = await axios.post(`${this.BASE_URL}/banner/create`, formData, {
            headers: {
                ...this.getHeader(),
                "Content-Type": "multipart/form-data"
            }
        });
        return response.data;
    }

    static async updateBanner(bannerId, formData) {
        const response = await axios.put(`${this.BASE_URL}/banner/update/${bannerId}`, formData, {
            headers: {
                ...this.getHeader(),
                "Content-Type": "multipart/form-data"
            }
        });
        return response.data;
    }

    static async deleteBanner(bannerId) {
        const response = await axios.delete(`${this.BASE_URL}/banner/delete/${bannerId}`, {
            headers: this.getHeader()
        });
        return response.data;
    }

    /* DELIVERY ESTIMATE ENDPOINTS */
    static async getDeliveryEstimate(params) {
        const response = await axios.get(`${this.BASE_URL}/delivery/estimate`, { params });
        return response.data;
    }

    static async getDeliveryCounties() {
        const response = await axios.get(`${this.BASE_URL}/delivery/counties`);
        return response.data;
    }

    static async getDeliveryLocalities(county) {
        const response = await axios.get(`${this.BASE_URL}/delivery/localities`, { params: { county } });
        return response.data;
    }

    /* WAREHOUSE ENDPOINTS */
    static async getAllWarehouses() {
        const response = await axios.get(`${this.BASE_URL}/warehouse/get-all`);
        return response.data;
    }

    static async getWarehouseById(warehouseId) {
        const response = await axios.get(`${this.BASE_URL}/warehouse/get-by-id/${warehouseId}`);
        return response.data;
    }

    static async createWarehouse(body) {
        const response = await axios.post(`${this.BASE_URL}/warehouse/create`, body, {
            headers: this.getHeader()
        });
        return response.data;
    }

    static async updateWarehouse(warehouseId, body) {
        const response = await axios.put(`${this.BASE_URL}/warehouse/update/${warehouseId}`, body, {
            headers: this.getHeader()
        });
        return response.data;
    }

    static async deleteWarehouse(warehouseId) {
        const response = await axios.delete(`${this.BASE_URL}/warehouse/delete/${warehouseId}`, {
            headers: this.getHeader()
        });
        return response.data;
    }

    /***AUTHEMNTICATION CHECKER */
    static logout(){
        clearSession()
    }    static isAuthenticated(){
        const token = localStorage.getItem('token')
        return Boolean(token) && !isJwtExpired(token)
    }

    static isAdmin(){
        const role = localStorage.getItem('role')
        return this.isAuthenticated() && role === 'ADMIN'
    }
}
