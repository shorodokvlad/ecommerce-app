import React, { useState, useEffect } from "react";
import ApiService from "../../service/ApiService";
import { AdminListSkeleton } from "./AdminSkeleton";
import { useDemoRestriction } from "./demoRestriction";
import '../../style/adminOrderPage.css';
import '../../style/adminEmployees.css';

const ROLE_OPTIONS = ["MANAGER", "ADMIN_RESTRICTED", "ADMIN"];

const AdminEmployeesPage = () => {
    const [users, setUsers] = useState([]);
    const [roleFilter, setRoleFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const [showCreateForm, setShowCreateForm] = useState(false);
    const [createForm, setCreateForm] = useState({ name: '', email: '', role: 'MANAGER' });
    const [isCreating, setIsCreating] = useState(false);
    const [generatedPassword, setGeneratedPassword] = useState('');

    const [editingUser, setEditingUser] = useState(null);
    const [editForm, setEditForm] = useState({ name: '', email: '', role: 'USER' });
    const [isSaving, setIsSaving] = useState(false);

    const { readOnly, permissionMessage, blockWrite } = useDemoRestriction();
    const isManager = ApiService.isManager();

    // Managers cannot create or promote to ADMIN accounts
    const allowedRoles = isManager ? ROLE_OPTIONS.filter((r) => r !== 'ADMIN') : ROLE_OPTIONS;

    useEffect(() => {
        fetchUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await ApiService.getAllUsers();
            setUsers(response.userList || []);
        } catch (err) {
            showError(err.response?.data?.message || err.message || 'Unable to fetch users');
        } finally {
            setLoading(false);
        }
    };

    const showError = (text) => {
        setError(text);
        setTimeout(() => setError(''), 4000);
    };

    const showMessage = (text) => {
        setMessage(text);
        setTimeout(() => setMessage(''), 4000);
    };

    const handleCreateChange = (e) => {
        setCreateForm({ ...createForm, [e.target.name]: e.target.value });
    };

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        if (readOnly) {
            blockWrite();
            return;
        }
        try {
            setIsCreating(true);
            setGeneratedPassword('');
            const response = await ApiService.createEmployee(createForm);
            if (response.status === 200) {
                setGeneratedPassword(response.user?.password || '');
                showMessage(response.message || 'Employee account created successfully');
                setCreateForm({ name: '', email: '', role: 'MANAGER' });
                fetchUsers();
            }
        } catch (err) {
            showError(err.response?.data?.message || err.message || 'Failed to create employee account');
        } finally {
            setIsCreating(false);
        }
    };

    const handleEditClick = (user) => {
        if (readOnly) {
            blockWrite();
            return;
        }
        setEditingUser(user);
        setEditForm({ name: user.name || '', email: user.email || '', role: user.role || 'USER' });
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        if (readOnly) {
            blockWrite();
            return;
        }
        try {
            setIsSaving(true);
            const response = await ApiService.updateUser(editingUser.id, editForm);
            if (response.status === 200) {
                showMessage(response.message || 'User updated successfully');
                setEditingUser(null);
                fetchUsers();
            }
        } catch (err) {
            showError(err.response?.data?.message || err.message || 'Failed to update user');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (user) => {
        if (readOnly) {
            blockWrite();
            return;
        }
        const confirmed = window.confirm(`Are you sure you want to delete ${user.name} (${user.email})?`);
        if (!confirmed) return;
        try {
            await ApiService.deleteUser(user.id);
            showMessage('User deleted successfully');
            fetchUsers();
        } catch (err) {
            showError(err.response?.data?.message || err.message || 'Failed to delete user');
        }
    };

    const isProtectedAdminRow = (user) => isManager && user.role === 'ADMIN';

    // Customers (USER) are not employees - always hide them from this table
    const visibleUsers = users
        .filter((user) => user.role !== 'USER')
        .filter((user) => (roleFilter ? user.role === roleFilter : true));

    const renderRoleSelect = (name, value, onChange) => (
        <select name={name} value={value} onChange={onChange} required>
            {allowedRoles.map((role) => (
                <option key={role} value={role}>{role}</option>
            ))}
        </select>
    );

    return (
        <div className="admin-orders-page admin-employees-page">
            <div className="admin-employees-header">
                <h2>Employees</h2>
            </div>

            {permissionMessage && <p className="demo-permission-message">{permissionMessage}</p>}
            {error && <p className="error-message">{error}</p>}
            {message && <div className="message">{message}</div>}

            {showCreateForm && (
                <div className="employee-form-card">
                    <h3>Create employee account</h3>
                    <form onSubmit={handleCreateSubmit}>
                        <div className="employee-form-grid">
                            <div className="employee-form-group">
                                <label>Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    placeholder="e.g. Jane Smith"
                                    value={createForm.name}
                                    onChange={handleCreateChange}
                                    required
                                />
                            </div>
                            <div className="employee-form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="e.g. jane@shvstore.com"
                                    value={createForm.email}
                                    onChange={handleCreateChange}
                                    required
                                />
                            </div>
                            <div className="employee-form-group">
                                <label>Role</label>
                                {renderRoleSelect('role', createForm.role, handleCreateChange)}
                            </div>
                        </div>
                        <button
                            type="submit"
                            className={`btn-primary${readOnly ? ' demo-no-permission' : ''}`}
                            aria-disabled={readOnly}
                            disabled={isCreating}
                        >
                            {isCreating ? 'Creating...' : 'Create & Generate Password'}
                        </button>
                    </form>
                    {generatedPassword && (
                        <div className="generated-password-box">
                            <strong>Account created.</strong> Generated password:&nbsp;
                            <code>{generatedPassword}</code>
                            <p>Copy it now and share it with the employee — it will not be shown again.</p>
                        </div>
                    )}
                </div>
            )}

            <div className="filter-container employees-filter-row">
                <div className="roleFilter">
                    <label>Filter By Role</label>
                    <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                        <option value="">All</option>
                        {ROLE_OPTIONS.map((role) => (
                            <option key={role} value={role}>{role}</option>
                        ))}
                    </select>
                </div>
                <button
                    className="btn-primary create-employee-btn"
                    onClick={() => setShowCreateForm((prev) => !prev)}
                >
                    {showCreateForm ? 'Close Form' : 'Create employee account'}
                </button>
            </div>

            {loading ? (
                <AdminListSkeleton count={6} />
            ) : (
                <table className="orders-table employees-table">
                    <thead>
                        <tr>
                            <th>User ID</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {visibleUsers.length === 0 ? (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                                    {roleFilter ? 'No employees found for the selected role.' : 'No employees found.'}
                                </td>
                            </tr>
                        ) : (
                            visibleUsers.map((user) => {
                                const protectedRow = isProtectedAdminRow(user);
                                return (
                                    <tr key={user.id}>
                                        <td>{user.id}</td>
                                        <td>{user.name}</td>
                                        <td>{user.email}</td>
                                        <td>
                                            <span className={`role-badge role-${(user.role || '').toLowerCase()}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="employee-actions">
                                                <button
                                                    className={`btn-edit${readOnly || protectedRow ? ' demo-no-permission' : ''}`}
                                                    aria-disabled={readOnly || protectedRow}
                                                    title={protectedRow ? 'Managers cannot edit ADMIN accounts' : ''}
                                                    onClick={() => !protectedRow && handleEditClick(user)}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    className={`btn-delete${readOnly || protectedRow ? ' demo-no-permission' : ''}`}
                                                    aria-disabled={readOnly || protectedRow}
                                                    title={protectedRow ? 'Managers cannot delete ADMIN accounts' : ''}
                                                    onClick={() => !protectedRow && handleDelete(user)}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            )}

            {editingUser && (
                <div className="employee-modal-backdrop" onClick={() => setEditingUser(null)}>
                    <div className="employee-modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Edit employee #{editingUser.id}</h3>
                        <form onSubmit={handleEditSubmit}>
                            <div className="employee-form-group">
                                <label>Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="employee-form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={editForm.email}
                                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="employee-form-group">
                                <label>Role</label>
                                {renderRoleSelect('editRole', editForm.role, (e) => setEditForm({ ...editForm, role: e.target.value }))}
                            </div>
                            <div className="employee-modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setEditingUser(null)} disabled={isSaving}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary" disabled={isSaving}>
                                    {isSaving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminEmployeesPage;
