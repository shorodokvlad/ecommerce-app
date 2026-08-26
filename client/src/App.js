import './App.css';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ProtectedRoute, AdminRoute } from './service/Guard';
import Navbar from './component/common/NavBar';
import Footer from './component/common/footer';
import { CartProvider } from './component/context/CartContext';
import { FavoritesProvider } from './component/context/FavoritesContext';
import Home from './component/pages/Home';
import ProductDetailsPage from './component/pages/ProductDetailsPage';
import CategoryListPage from './component/pages/CategoryListPage';
import CategoryProductsPage from './component/pages/CategoryProductsPage';
import CartPage from './component/pages/CartPage';
import FavoritesPage from './component/pages/FavoritesPage';
import RegisterPage from './component/pages/RegisterPage';
import LoginPage from './component/pages/LoginPage';
import ForgotPasswordPage from './component/pages/ForgotPasswordPage';
import ResetPasswordPage from './component/pages/ResetPasswordPage';
import VerifyEmailPage from './component/pages/VerifyEmailPage';
import ProfilePage from './component/pages/ProfilePage';
import AddressPage from './component/pages/AddressPage';
import AdminPage from './component/admin/AdminPage';
import AdminCategoryPage from './component/admin/AdminCategoryPage';
import AddCategory from './component/admin/AddCategory';
import EditCategory from './component/admin/EditCategory';
import AdminProductPage from './component/admin/AdminProductPage';
import AddProductPage from './component/admin/AddProductPage';
import EditProductPage from './component/admin/EditProductPage';
import AdminOrdersPage from './component/admin/AdminOrderPage';
import AdminOrderDetailsPage from './component/admin/AdminOrderDetailsPage';
import AdminBannerPage from './component/admin/AdminBannerPage';
import AdminWarehousePage from './component/admin/AdminWarehousePage';
import AddWarehousePage from './component/admin/AddWarehousePage';
import EditWarehousePage from './component/admin/EditWarehousePage';
import AdminEmployeesPage from './component/admin/AdminEmployeesPage';
import SessionExpiryHandler from './component/common/SessionExpiryHandler';

const AppContent = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className={isAdminRoute ? "admin-app-shell" : "app-shell"}>
      {!isAdminRoute && <Navbar />}
      <main className={isAdminRoute ? "admin-app-main" : "app-main"}>
        <Routes>
          <Route exact path='/' element={<Home />} />
          <Route path='/product/:productId' element={<ProductDetailsPage />} />
          <Route path='/categories' element={<CategoryListPage />} />
          <Route path='/category/:categoryId' element={<CategoryProductsPage />} />
          <Route path='/cart' element={<CartPage />} />
          <Route path='/favorites' element={<FavoritesPage />} />
          <Route path='/register' element={<RegisterPage />} />
          <Route path='/login' element={<LoginPage />} />
          <Route path='/forgot-password' element={<ForgotPasswordPage />} />
          <Route path='/reset-password' element={<ResetPasswordPage />} />
          <Route path='/verify-email' element={<VerifyEmailPage />} />

          <Route path='/profile' element={<ProtectedRoute element={<ProfilePage />} />} />
          <Route path='/add-address' element={<ProtectedRoute element={<AddressPage />} />} />
          <Route path='/edit-address' element={<ProtectedRoute element={<AddressPage />} />} />

          <Route path='/admin' element={<AdminRoute element={<AdminPage />} />} />
          <Route path='/admin/categories' element={<AdminRoute element={<AdminCategoryPage />} />} />
          <Route path='/admin/add-category' element={<AdminRoute element={<AddCategory />} />} />
          <Route path='/admin/edit-category/:categoryId' element={<AdminRoute element={<EditCategory />} />} />
          <Route path='/admin/products' element={<AdminRoute element={<AdminProductPage />} />} />
          <Route path='/admin/add-product' element={<AdminRoute element={<AddProductPage />} />} />
          <Route path='/admin/edit-product/:productId' element={<AdminRoute element={<EditProductPage />} />} />

          <Route path='/admin/orders' element={<AdminRoute element={<AdminOrdersPage />} />} />
          <Route path='/admin/order-details/:itemId' element={<AdminRoute element={<AdminOrderDetailsPage />} />} />
          <Route path='/admin/banners' element={<AdminRoute element={<AdminBannerPage />} />} />
          <Route path='/admin/warehouses' element={<AdminRoute element={<AdminWarehousePage />} />} />
          <Route path='/admin/add-warehouse' element={<AdminRoute element={<AddWarehousePage />} />} />
          <Route path='/admin/edit-warehouse/:warehouseId' element={<AdminRoute element={<EditWarehousePage />} />} />
          <Route path='/admin/employees' element={<AdminRoute element={<AdminEmployeesPage />} />} />
        </Routes>
      </main>
      {!isAdminRoute && <Footer />}
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <FavoritesProvider>
          <SessionExpiryHandler />
          <AppContent />
        </FavoritesProvider>
      </CartProvider>
    </BrowserRouter>
  );
}

export default App;
