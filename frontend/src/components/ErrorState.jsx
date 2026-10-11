import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

export default function ErrorState({ message, onRetry }) {
  return (
    <div
      style={{
        padding: '14px 18px',
        backgroundColor: 'var(--danger-bg)',
        border: '1px solid var(--danger)',
        borderRadius: 'var(--radius-xs)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        color: 'var(--danger)',
        margin: '12px 0',
      }}
    >
      <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '2px' }}>
          Inquiry Failed
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-primary)', opacity: 0.9 }}>
          {message || 'An unexpected backend error occurred.'}
        </div>
        {onRetry && (
          <button
            className="fn-btn fn-btn-secondary fn-btn-sm"
            onClick={onRetry}
            style={{
              marginTop: '8px',
              color: 'var(--danger)',
              borderColor: 'var(--danger)',
            }}
          >
            <RotateCcw size={11} />
            <span>Retry Inquiry</span>
          </button>
        )}
      </div>
    </div>
  );
}
