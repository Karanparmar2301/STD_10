import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logoutUser } from '../store/authSlice';
import './ProfileMenu.css';

const ProfileMenu = ({ studentName, studentClass, onEditProfile }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const getInitials = (name) => {
        if (!name) return '?';
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        // Close on ESC key
        const handleEscapeKey = (event) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleEscapeKey);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscapeKey);
        };
    }, [isOpen]);

    const toggleDropdown = () => {
        setIsOpen(!isOpen);
    };

    const handleProfile = () => {
        setIsOpen(false);
        navigate('/profile');
    };

    const handleEditProfile = () => {
        setIsOpen(false);
        if (onEditProfile) {
            onEditProfile();
        }
    };

    const handleLogout = async () => {
        setIsOpen(false);
        // Clear auth token from localStorage
        localStorage.removeItem('authToken');
        
        // Dispatch logout action
        await dispatch(logoutUser());
        
        // Navigate to login page
        navigate('/');
    };

    return (
        <div className="profile-menu-wrapper" ref={menuRef}>
            {/* Profile Button */}
            <button
                className="profile-button"
                onClick={toggleDropdown}
                aria-haspopup="true"
                aria-expanded={isOpen}
                type="button"
            >
                <div className="profile-avatar">
                    {getInitials(studentName)}
                </div>
                <div className="profile-info">
                    <div className="profile-name">{studentName}</div>
                    <div className="profile-class">{studentClass}</div>
                </div>
                <div className={`profile-chevron ${isOpen ? 'open' : ''}`}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path
                            d="M4 6L8 10L12 6"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </div>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="profile-dropdown" role="menu">
                    {/* Profile Option */}
                    <button
                        className="dropdown-item"
                        onClick={handleProfile}
                        role="menuitem"
                        type="button"
                    >
                        <svg
                            className="dropdown-icon"
                            width="20"
                            height="20"
                            viewBox="0 0 20 20"
                            fill="none"
                        >
                            <path
                                d="M10 10C12.7614 10 15 7.76142 15 5C15 2.23858 12.7614 0 10 0C7.23858 0 5 2.23858 5 5C5 7.76142 7.23858 10 10 10Z"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            <path
                                d="M2 20C2 16.6863 5.13401 14 10 14C14.866 14 18 16.6863 18 20"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                        <span>Profile</span>
                    </button>

                    {/* Edit Profile Option */}
                    <button
                        className="dropdown-item"
                        onClick={handleEditProfile}
                        role="menuitem"
                        type="button"
                    >
                        <svg
                            className="dropdown-icon"
                            width="20"
                            height="20"
                            viewBox="0 0 20 20"
                            fill="none"
                        >
                            <path
                                d="M14.166 2.5C14.3849 2.28113 14.6447 2.10752 14.9307 1.98906C15.2167 1.87061 15.5232 1.80969 15.8327 1.80969C16.1422 1.80969 16.4487 1.87061 16.7347 1.98906C17.0206 2.10752 17.2805 2.28113 17.4993 2.5C17.7182 2.71887 17.8918 2.97871 18.0103 3.26468C18.1287 3.55064 18.1897 3.85714 18.1897 4.16667C18.1897 4.47619 18.1287 4.78269 18.0103 5.06865C17.8918 5.35462 17.7182 5.61446 17.4993 5.83333L6.24935 17.0833L1.66602 18.3333L2.91602 13.75L14.166 2.5Z"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                        <span>Edit Profile</span>
                    </button>

                    {/* Divider */}
                    <div className="dropdown-divider"></div>

                    {/* Logout Option */}
                    <button
                        className="dropdown-item logout-item"
                        onClick={handleLogout}
                        role="menuitem"
                        type="button"
                    >
                        <svg
                            className="dropdown-icon"
                            width="20"
                            height="20"
                            viewBox="0 0 20 20"
                            fill="none"
                        >
                            <path
                                d="M13 14L17 10L13 6"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            <path
                                d="M17 10H7"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            <path
                                d="M7 17H3C2.44772 17 2 16.5523 2 16V4C2 3.44772 2.44772 3 3 3H7"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                        <span>Logout</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default ProfileMenu;
