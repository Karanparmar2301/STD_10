import React, { useEffect, useState } from 'react';
import './StatCard.css';

const StatCard = ({
    title,
    value,
    unit = '',
    icon,
    gradient,
    trend = null,
    riskLevel = 'low',
    onClick
}) => {
    const [displayValue, setDisplayValue] = useState(0);

    // Animated counter effect
    useEffect(() => {
        if (typeof value !== 'number') return;

        const duration = 1000; // 1 second
        const steps = 60;
        const increment = value / steps;
        let current = 0;
        let step = 0;

        const timer = setInterval(() => {
            step++;
            current += increment;

            if (step >= steps) {
                setDisplayValue(value);
                clearInterval(timer);
            } else {
                setDisplayValue(Math.floor(current));
            }
        }, duration / steps);

        return () => clearInterval(timer);
    }, [value]);

    const getRiskColor = () => {
        switch (riskLevel) {
            case 'high': return '#ef4444';
            case 'medium': return '#f59e0b';
            case 'low': return '#10b981';
            default: return '#10b981';
        }
    };

    const getTrendIcon = () => {
        if (trend === null) return null;
        if (trend > 0) return '📈';
        if (trend < 0) return '📉';
        return '➡️';
    };

    return (
        <div
            className={`stat-card ${gradient}`}
            onClick={onClick}
            style={{ cursor: onClick ? 'pointer' : 'default' }}
        >
            {/* Decorative Circle */}
            <div className="stat-card-circle"></div>

            {/* Icon */}
            <div className="stat-card-icon">
                {icon}
            </div>

            {/* Content */}
            <div className="stat-card-content">
                <h3 className="stat-card-title">{title}</h3>
                <div className="stat-card-value-container">
                    <span className="stat-card-value">
                        {typeof value === 'number' ? displayValue : value}
                    </span>
                    {unit && <span className="stat-card-unit">{unit}</span>}
                </div>

                {/* Trend Indicator */}
                {trend !== null && (
                    <div className="stat-card-trend">
                        <span className="trend-icon">{getTrendIcon()}</span>
                        <span className="trend-value" style={{ color: trend > 0 ? '#10b981' : '#ef4444' }}>
                            {trend > 0 ? '+' : ''}{trend}%
                        </span>
                    </div>
                )}

                {/* Risk Indicator */}
                {riskLevel && riskLevel !== 'low' && (
                    <div className="stat-card-risk" style={{ backgroundColor: getRiskColor() }}>
                        {riskLevel === 'high' ? '⚠️ Action Needed' : '⚡ Watch'}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StatCard;
