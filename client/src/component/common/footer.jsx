import React from "react";
import '../../style/footer.css';
import { NavLink } from "react-router-dom";
import { MapPin, Phone, Mail } from "lucide-react";

const Footer = () => {
    return (
        <footer className="site-footer">
            <div className="footer-container">
                <div className="footer-grid">
                    {/* Column 1: Help & Support */}
                    <div className="footer-column">
                        <h4 className="footer-heading">Help & Support</h4>
                        <ul className="footer-contact-list">
                            <li>
                                <div className="contact-icon-wrap"><MapPin size={16} className="contact-icon" /></div>
                                <span>Calea Victoriei 145, Sector 1, Bucharest, Romania</span>
                            </li>
                            <li>
                                <div className="contact-icon-wrap"><Phone size={16} className="contact-icon" /></div>
                                <a href="tel:+40219876543">+40 21 987 6543</a>
                            </li>
                            <li>
                                <div className="contact-icon-wrap"><Mail size={16} className="contact-icon" /></div>
                                <a href="mailto:support@shv-store.com">support@shv-store.com</a>
                            </li>
                        </ul>
                        <div className="footer-socials">
                            {/* Facebook */}
                            <a href="#facebook" aria-label="Facebook" className="social-link">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                            </a>
                            {/* X / Twitter */}
                            <a href="#twitter" aria-label="X / Twitter" className="social-link">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                            </a>
                            {/* Instagram */}
                            <a href="#instagram" aria-label="Instagram" className="social-link">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                            </a>
                            {/* LinkedIn */}
                            <a href="#linkedin" aria-label="LinkedIn" className="social-link">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                            </a>
                        </div>
                    </div>

                    {/* Column 2: Account */}
                    <div className="footer-column">
                        <h4 className="footer-heading">Account</h4>
                        <ul className="footer-links-list">
                            <li><NavLink to="/login">Login / Register</NavLink></li>
                            <li><NavLink to="/cart">Cart</NavLink></li>
                            <li><NavLink to="/favorites">Wishlist</NavLink></li>
                            <li><NavLink to="/">Shop</NavLink></li>
                        </ul>
                    </div>

                    {/* Column 3: Quick Link */}
                    <div className="footer-column">
                        <h4 className="footer-heading">Quick Link</h4>
                        <ul className="footer-links-list">
                            <li><NavLink to="/">Privacy Policy</NavLink></li>
                            <li><NavLink to="/">Refund Policy</NavLink></li>
                            <li><NavLink to="/">Terms of Use</NavLink></li>
                            <li><NavLink to="/">FAQ's</NavLink></li>
                            <li><NavLink to="/">Contact</NavLink></li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Bottom Copyright & Payment Methods Bar */}
            <div className="footer-bottom-bar">
                <div className="footer-container bottom-container">
                    <p className="copyright-text">© 2026. All rights reserved by <strong>SHV Store</strong>.</p>
                    <div className="payment-accept-group">
                        <span className="accept-label">We Accept:</span>
                        <div className="payment-icons-row">
                            <span className="payment-badge mastercard">MasterCard</span>
                            <span className="payment-badge visa">VISA</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
