import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import ApiService from "../../service/ApiService";
import '../../style/register.css'

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

const LoginPage = () => {

    const [formData, setFormData] = useState({
        email: 'demo.admin@shvstore.com',
        password: '123456'
    });

    const navigate = useNavigate();
    const location = useLocation();
    const [message, setMessage] = useState(location.state?.message || null);
    const googleButtonRef = useRef(null);

    const finishLogin = useCallback((response) => {
        localStorage.setItem('token', response.token);
        localStorage.setItem('role', response.role);
        const from = location.state?.from?.pathname;
        const adminRoles = ['ADMIN', 'MANAGER', 'ADMIN_RESTRICTED'];
        const destination = from || (adminRoles.includes(response.role) ? '/admin' : '/');
        navigate(destination, { replace: true });
    }, [location.state, navigate]);

    // Google Sign-In: load the GIS script and render the official button
    useEffect(() => {
        if (!GOOGLE_CLIENT_ID) return;

        const handleCredential = async (credentialResponse) => {
            try {
                const response = await ApiService.googleLogin(credentialResponse.credential);
                if (response.status === 200) {
                    finishLogin(response);
                }
            } catch (error) {
                setMessage(error.response?.data?.message || "Google sign-in failed");
            }
        };

        const renderButton = () => {
            if (!window.google || !googleButtonRef.current) return;
            window.google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: handleCredential,
            });
            window.google.accounts.id.renderButton(googleButtonRef.current, {
                theme: 'outline',
                size: 'large',
                width: 320,
            });
        };

        if (window.google) {
            renderButton();
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.onload = renderButton;
        document.body.appendChild(script);
    }, [finishLogin]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await ApiService.loginUser(formData);
            if (response.status === 200) {
                finishLogin(response);
            }
        } catch (error) {
            setMessage(error.response?.data.message || error.message || "Unable to sign in — check your email and password");
        }
    }

    return (
        <div className="register-page">
            <h2>Sign in</h2>
            {message && <p className="message">{message}</p>}
            <form onSubmit={handleSubmit}>
                <label>Email: </label>
                <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required />

                <label>Password: </label>
                <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required />

                    <p className="forgot-link">
                        <Link to="/forgot-password">Forgot password?</Link>
                    </p>

                    <button type="submit">Sign in</button>

                    {GOOGLE_CLIENT_ID && (
                        <>
                            <div className="auth-divider"><span>or</span></div>
                            <div className="google-button" ref={googleButtonRef}></div>
                        </>
                    )}

                    <p className="register-link">
                        Don't have an account? <Link to="/register">Sign up</Link>
                    </p>
            </form>
        </div>
    )
}

export default LoginPage;
