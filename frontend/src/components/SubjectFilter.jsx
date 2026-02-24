
import React from 'react';
import './SubjectFilter.css';

const SubjectFilter = ({ selected, onChange }) => {
    const subjects = ['all', 'math', 'english'];

    return (
        <div className="subject-filter">
            <span className="filter-label">Subject:</span>
            {subjects.map(sub => (
                <button
                    key={sub}
                    className={`filter-btn ${selected === sub ? 'active' : ''}`}
                    onClick={() => onChange(sub)}
                >
                    {sub}
                </button>
            ))}
        </div>
    );
};

export default SubjectFilter;
