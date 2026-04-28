import React from 'react';

export default function ExplainabilityPanel({ features, confidence, modelBreakdown, ensembleModels }) {
  return (
    <div className="explain-card fade-in">

      {/* Ensemble models used */}
      {ensembleModels && ensembleModels.length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          <div className="explain-title" style={{ marginBottom: '8px' }}>
            🤖 Ensemble Models
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {ensembleModels.map((m) => (
              <span key={m} style={{
                padding: '3px 10px',
                background: 'var(--accent-light)',
                color: 'var(--accent)',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'capitalize',
              }}>
                {m}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Per-model score breakdown */}
      {modelBreakdown && modelBreakdown.length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          <div className="explain-title" style={{ marginBottom: '8px' }}>
            📊 Model Scores
          </div>
          {modelBreakdown.map((item) => (
            <div key={item.model} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '6px 0',
              borderBottom: '1px solid var(--bg-hover)',
              fontSize: '12px',
            }}>
              <span style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                {item.model}
              </span>
              <span style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                  weight: {(item.weight * 100).toFixed(0)}%
                </span>
                <span style={{
                  fontWeight: 700,
                  color: item.score < 0.33 ? 'var(--success)' :
                         item.score < 0.66 ? '#e37400' : 'var(--danger)',
                }}>
                  {(item.score * 100).toFixed(0)}%
                </span>
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Feature importance */}
      <div className="explain-title">Why this route?</div>
      {features.map((feature, idx) => (
        <div className="feature-row" key={idx}>
          <div className="feature-label">
            <span className="feature-name">{feature.name}</span>
            <span className="feature-value">{feature.impact}%</span>
          </div>
          <div className="feature-bar">
            <div className="feature-fill" style={{ width: `${feature.impact}%` }} />
          </div>
        </div>
      ))}

      <div className="explain-note">
        Weighted ensemble of XGBoost ({'>'}40%), LightGBM (35%), and CatBoost (25%) predicts
        congestion 20 minutes ahead. Higher model agreement = higher confidence.
      </div>
    </div>
  );
}
