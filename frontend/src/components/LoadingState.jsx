import React, { useState, useEffect } from 'react';

const STAGES = [
  "Searching 32,000+ podcast transcript passages...",
  "Reviewing guest models & citations...",
  "Formulating grounded synthesis...",
];

export default function LoadingState() {
  const [currentStage, setCurrentStage] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStage((prev) => (prev < STAGES.length - 1 ? prev + 1 : prev));
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '12px 16px',
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderLeft: '3px solid var(--accent)',
        borderRadius: 'var(--radius-xs)',
        fontSize: '13px',
        color: 'var(--text-secondary)',
        fontFamily: 'var(--font-mono)',
      }}
    >
      <span className="fn-status-dot online" style={{ animation: 'pulse 1s infinite' }} />
      <span>{STAGES[currentStage]}</span>
    </div>
  );
}
