import React from 'react';

export default function MetricCard({ title, value, icon: Icon, color = 'var(--primary)', bgLight = 'var(--primary-light)', subtext }) {
  return (
    <div className="metric-card">
      <div className="metric-header">
        <span className="metric-title">{title}</span>
        <div 
          className="metric-icon-wrapper" 
          style={{ backgroundColor: bgLight, color: color }}
        >
          {Icon && <Icon size={20} />}
        </div>
      </div>
      <div className="metric-value">{value}</div>
      {subtext && (
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '-8px' }}>
          {subtext}
        </div>
      )}
    </div>
  );
}
