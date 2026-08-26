import React, { useState, useEffect, useRef } from "react";
import '../../style/navbar.css';
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import ApiService from "../../service/ApiService";
import { useCart } from "../context/CartContext";
import { useFavorites } from "../context/FavoritesContext";
import { Menu, Search, User, Heart, ShoppingBag, ChevronDown, UserCog, Tag, RefreshCw, Zap, HelpCircle } from "lucide-react";

const Navbar = () => {
    const [searchValue, setSearchValue] = useState("");
    const [categories, setCategories] = useState([]);
    const [isCategoryHovered, setIsCategoryHovered] = useState(false);
    const categoryRef = useRef(null);

    const navigate = useNavigate();
    const location = useLocation();
    const { cart } = useCart();
    const { favoritesCount } = useFavorites();

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const searchParam = queryParams.get("search");
        setSearchValue(searchParam || "");
    }, [location.search]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const cached = sessionStorage.getItem("shv_categories_list");
                if (cached) {
                    setCategories(JSON.parse(cached));
                } else {
                    const response = await ApiService.getAllCategory();
                    if (response.categoryList) {
                        setCategories(response.categoryList);
                        sessionStorage.setItem("shv_categories_list", JSON.stringify(response.categoryList));
                    }
                }
            } catch (err) {
                // Ignore fetch errors
            }
        };
        fetchCategories();
    }, []);

    const isAdmin = ApiService.isAdmin();
    const isAuthenticated = ApiService.isAuthenticated();
    const cartCount = cart.reduce((n, item) => n + item.quantity, 0);

    const handleSearchChange = (e) => {
        setSearchValue(e.target.value);
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        const trimmed = searchValue.trim();
        if (trimmed) {
            navigate(`/?search=${encodeURIComponent(trimmed)}`);
        } else {
            navigate("/");
        }
    };

    const handleCategorySelect = (categoryId) => {
        setIsCategoryHovered(false);
        if (categoryId) {
            navigate(`/category/${categoryId}`);
        } else {
            navigate("/categories");
        }
    };

    return (
        <header className="emag-header-wrapper">
            {/* TOP MAIN HEADER BAR */}
            <div className="emag-top-header">
                <div className="navbar-container">
                    {/* BRAND LOGO: SHV STORE */}
                    <NavLink to="/" className="navbar-brand">
                        <span className="brand-mark">SHV</span>
                        <span className="brand-word">Store</span>
                    </NavLink>

                    {/* PILL SEARCH FORM */}
                    <form className="navbar-search" onSubmit={handleSearchSubmit} role="search">
                        <input 
                            type="text"
                            placeholder="Search for products..."
                            aria-label="Search products"
                            value={searchValue}
                            onChange={handleSearchChange} 
                        />
                        <button type="submit" aria-label="Submit search">
                            <Search size={18} />
                        </button>
                    </form>

                    {/* USER ACTIONS */}
                    <div className="navbar-actions">
                        {/* Admin Panel */}
                        {isAdmin && (
                            <NavLink to="/admin" className="nav-action-item admin-badge-link" title="Admin Panel">
                                <UserCog size={20} className="nav-action-icon" />
                                <span className="nav-action-label">Admin</span>
                            </NavLink>
                        )}

                        {/* My Account */}
                        <NavLink 
                            to={isAuthenticated ? "/profile" : "/login"} 
                            className="nav-action-item account-action"
                            title={isAuthenticated ? "My Account" : "Sign In / Register"}
                        >
                            <div className="account-icon-wrap">
                                <User size={20} className="nav-action-icon" />
                            </div>
                            <div className="account-text-group">
                                <span className="account-eyebrow">MY ACCOUNT</span>
                                <span className="account-title">{isAuthenticated ? "My Account" : "Sign In / Register"}</span>
                            </div>
                        </NavLink>

                        {/* Favorites */}
                        <NavLink to="/favorites" className="nav-action-item icon-only-item" title="Favorites">
                            <div className="nav-icon-badge-wrap">
                                <Heart size={22} className="nav-action-icon" />
                                <span className="action-badge fav-badge">{favoritesCount}</span>
                            </div>
                        </NavLink>

                        {/* Cart */}
                        <NavLink to="/cart" className="nav-action-item icon-only-item" title="Shopping Cart">
                            <div className="nav-icon-badge-wrap">
                                <ShoppingBag size={22} className="nav-action-icon" />
                                <span className="action-badge cart-badge">{cartCount}</span>
                            </div>
                        </NavLink>
                    </div>
                </div>
            </div>

            {/* eMAG-STYLE SUB-NAVBAR (DEEP TEAL THEME) */}
            <div className="emag-sub-navbar">
                <div className="navbar-container sub-nav-container">
                    {/* HOVER HAMBURGER CATEGORY DROPDOWN MENU */}
                    <div 
                        className="emag-category-dropdown-wrapper" 
                        ref={categoryRef}
                        onMouseEnter={() => setIsCategoryHovered(true)}
                        onMouseLeave={() => setIsCategoryHovered(false)}
                    >
                        <button 
                            type="button" 
                            className={`emag-category-btn ${isCategoryHovered ? "active" : ""}`}
                            onClick={() => navigate("/categories")}
                        >
                            <Menu size={18} className="cat-btn-icon" />
                            <span>Products & Categories</span>
                            <ChevronDown size={15} className={`cat-chevron ${isCategoryHovered ? "open" : ""}`} />
                        </button>

                        {/* HOVER OVERLAY MENU */}
                        {isCategoryHovered && (
                            <div className="emag-hover-category-menu">
                                <div className="hover-menu-header">
                                    <NavLink to="/categories" onClick={() => setIsCategoryHovered(false)}>All categories</NavLink>
                                </div>
                                <div className="hover-menu-grid">
                                    {categories.map((cat) => (
                                        <button
                                            key={cat.id}
                                            className="hover-category-item"
                                            onClick={() => handleCategorySelect(cat.id)}
                                        >
                                            <span className="cat-item-name">{cat.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* SUB-NAV QUICK DEAL LINKS */}
                    <div className="sub-nav-links">
                        <NavLink to="/" className="sub-link-item">
                            <Tag size={15} />
                            <span>Deals</span>
                        </NavLink>
                        <NavLink to="/" className="sub-link-item">
                            <RefreshCw size={15} />
                            <span>Easy BuyBack</span>
                        </NavLink>
                        <NavLink to="/" className="sub-link-item">
                            <Zap size={15} />
                            <span>Daily Offers</span>
                        </NavLink>
                    </div>

                    {/* RIGHT LINK: HELP (no page yet - not clickable) */}
                    <div className="sub-nav-right">
                        <button type="button" className="sub-link-item help-right-link">
                            <HelpCircle size={15} />
                            <span>Help</span>
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Navbar;
