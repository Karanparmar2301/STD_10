import React from 'react';
import { useSelector } from 'react-redux';
import InfoCard from './InfoCard';
import './Profile.css';

/**
 * Profile Component - Dashboard Landing Section
 * 
 * Displays student personal information in a clean card-based layout.
 * Stats (Level, XP, Streak) are shown in Topbar, not here.
 */
function Profile({ profile }) {
    const user = useSelector((state) => state.auth.user);

    if (!profile) {
        return (
            <div className="profile-loading">
                <div className="spinner"></div>
                <p>Loading student profile...</p>
            </div>
        );
    }

    // Personal information fields configuration
    const personalInfoFields = [
        { label: 'STUDENT NAME', value: profile.student_name },
        { label: 'STUDENT ID', value: profile.student_id },
        { label: 'CLASS & SECTION', value: profile.class_section },
        { label: "FATHER'S NAME", value: profile.father_name },
        { label: "MOTHER'S NAME", value: profile.mother_name },
        { label: 'MOBILE NUMBER', value: profile.mobile },
        { label: 'EMAIL', value: profile.email || user?.email },
        { label: 'ADDRESS', value: profile.address }
    ];

    return (
        <div className="profile-dashboard-section">
            {/* Section Header */}
            <div className="profile-section-header">
                <h2 className="profile-section-title">Student Profile</h2>
                <p className="profile-section-subtitle">
                    Personal identity and contact information
                </p>
            </div>

            {/* Personal Information Grid */}
            <div className="personal-info-grid">
                {personalInfoFields.map((field, index) => (
                    <InfoCard
                        key={field.label}
                        label={field.label}
                        value={field.value}
                        index={index}
                    />
                ))}
            </div>
        </div>
    );
}

export default Profile;
