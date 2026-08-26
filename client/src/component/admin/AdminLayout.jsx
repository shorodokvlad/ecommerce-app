import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "../../style/adminDashboard.css";
import { 
    LayoutDashboard, Layers, Package, ShoppingBag, 
    Tag, Building2, Users, ArrowLeft, Menu, X 
} from "lucide-react";

const AdminLayout = ({ children }) => {
    const [collapsed, setCollapsed] = useState(false);
    const location = useLocation();

    const navItems = [
        { path: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
        { path: "/admin/categories", label: "Manage Categories", icon: Layers },
        { path: "/admin/products", label: "Manage Products", icon: Package },
        { path: "/admin/orders", label: "Manage Orders", icon: ShoppingBag },
        { path: "/admin/banners", label: "Manage Banners", icon: Tag },
        { path: "/admin/warehouses", label: "Manage Warehouses", icon: Building2 },
        { path: "/admin/employees", label: "Manage Employees", icon: Users },
    ];

    const toggleSidebar = () => {
        setCollapsed(!collapsed);
    };

    return (
        <div className={`admin-full-wrapper ${collapsed ? "sidebar-collapsed" : ""}`}>
            {/* SINGLE UNIFIED ADMIN SIDEBAR */}
            <aside className={`admin-sidebar-box ${collapsed ? "collapsed" : ""}`}>
                <div>
                    {/* BRAND HEADER & HAMBURGER TOGGLE */}
                    <div className="admin-brand-header-row">
                        {!collapsed && (
                            <Link to="/" className="navbar-brand" title="SHV Store Home">
                                <span className="brand-mark">SHV</span>
                                <span className="brand-word">Store</span>
                            </Link>
                        )}
                        <button
                            type="button"
                            className="admin-sidebar-toggle-btn"
                            onClick={toggleSidebar}
                            title={collapsed ? "Expand Menu" : "Collapse Menu"}
                        >
                            {collapsed ? <Menu size={20} /> : <X size={20} />}
                        </button>
                    </div>

                    {/* NAVIGATION MENU ITEMS WITH NEW LUCIDE ICONS */}
                    <nav className="admin-nav-menu">
                        {navItems.map((item) => {
                            const IconComponent = item.icon;
                            const isActive = item.exact 
                                ? location.pathname === "/admin" 
                                : location.pathname.startsWith(item.path);

                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`admin-nav-link ${isActive ? "active" : ""}`}
                                    title={item.label}
                                >
                                    <IconComponent size={18} className="admin-nav-icon" />
                                    {!collapsed && <span>{item.label}</span>}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* SIDEBAR FOOTER: BACK TO STORE */}
                <div className="admin-sidebar-footer">
                    <Link to="/" className="back-to-store-btn" title="Back to Store">
                        <ArrowLeft size={18} />
                        {!collapsed && <span>Back to Store</span>}
                    </Link>
                </div>
            </aside>

            {/* MAIN ADMIN CONTENT VIEW */}
            <main className="admin-main-view">
                {children}
            </main>
        </div>
    );
};

export default AdminLayout;
