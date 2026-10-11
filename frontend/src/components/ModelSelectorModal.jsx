import React, { useEffect } from 'react';
import { X, Check, Cpu, Cloud, Shield } from 'lucide-react';

export default function ModelSelectorModal({
  isOpen,
  onClose,
  models = [],
  selectedModelId,
  onSelectModel,
}) {
  // Support Escape key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fn-modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="fn-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="fn-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cpu size={16} color="var(--accent)" />
            <span id="modal-title" style={{ fontSize: '14.5px', fontWeight: 600 }}>
              Model & Provider Configuration
            </span>
          </div>
          <button className="fn-btn-icon" onClick={onClose} aria-label="Close modal">
            <X size={15} />
          </button>
        </div>

        <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
          Select the generation provider powering grounded research answers and essay composition.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {models.map((model) => {
            const isSelected = selectedModelId === model.id;
            const isConfigured = model.configured;

            return (
              <div
                key={model.id}
                onClick={() => {
                  if (isConfigured) {
                    onSelectModel(model.id);
                    onClose();
                  }
                }}
                role="button"
                tabIndex={isConfigured ? 0 : -1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && isConfigured) {
                    onSelectModel(model.id);
                    onClose();
                  }
                }}
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-xs)',
                  border: isSelected
                    ? '1.5px solid var(--accent)'
                    : '1px solid var(--border)',
                  backgroundColor: isSelected
                    ? 'var(--accent-soft)'
                    : 'var(--surface-secondary)',
                  cursor: isConfigured ? 'pointer' : 'not-allowed',
                  opacity: isConfigured ? 1 : 0.55,
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ marginTop: '2px' }}>
                    {model.is_local ? (
                      <Shield size={15} color="var(--accent)" />
                    ) : (
                      <Cloud size={15} color="var(--highlight)" />
                    )}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {model.name}
                      </span>
                      {model.is_local && (
                        <span className="fn-badge fn-badge-accent" style={{ fontSize: '9px' }}>
                          LOCAL & PRIVATE
                        </span>
                      )}
                      {!isConfigured && (
                        <span className="fn-badge fn-badge-neutral" style={{ fontSize: '9px' }}>
                          API KEY MISSING
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.4 }}>
                      {model.description}
                    </div>
                  </div>
                </div>

                {isSelected && (
                  <div style={{ color: 'var(--accent)', marginTop: '2px' }}>
                    <Check size={15} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: '20px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="fn-btn fn-btn-secondary fn-btn-sm" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
