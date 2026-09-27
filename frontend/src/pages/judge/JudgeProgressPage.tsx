import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import { JudgeDashboardData } from '../../types';
import { BarChart3, CheckCircle2, Clock, Scale } from 'lucide-react';

export const JudgeProgressPage: React.FC = () => {
  const [dashData, setDashData] = useState<JudgeDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const evList = await api.listEvents();
      if (evList.length > 0) {
        const data = await api.getJudgeDashboard(evList[0].id);
        setDashData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const assigned = dashData?.assigned_projects || [];
  const completed = assigned.filter(a => a.assignment_status === 'COMPLETED' || a.is_finalized || a.status === 'COMPLETED');
  const pending = assigned.filter(a => !(a.assignment_status === 'COMPLETED' || a.is_finalized || a.status === 'COMPLETED'));
  const pct = assigned.length > 0 ? Math.round((completed.length / assigned.length) * 100) : 0;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Judging Progress & Metrics</h1>
          <p className="page-subtitle">Track your review completion rates before the judging period closes.</p>
        </div>
      </div>

      <div className="card" style={{ padding: '32px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px' }}>Workload Completion</h3>

        {/* Progress Bar */}
        <div style={{ background: 'var(--bg-subtle)', borderRadius: '9999px', height: '14px', overflow: 'hidden', marginBottom: '16px' }}>
          <div style={{ width: `${pct}%`, background: 'var(--brand-primary)', height: '100%', transition: 'width 0.3s ease' }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)' }}>
          <span>{completed.length} of {assigned.length} reviews finalized</span>
          <span style={{ fontWeight: 700, color: 'var(--brand-primary)' }}>{pct}% Complete</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <CheckCircle2 size={18} color="var(--status-success)" />
            <span style={{ fontWeight: 700 }}>Completed Submissions</span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--status-success)' }}>
            {completed.length}
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Scores recorded and factored into cross-judge Z-score calculations.
          </p>
        </div>

        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Clock size={18} color="var(--status-warning)" />
            <span style={{ fontWeight: 700 }}>Pending Submissions</span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--status-warning)' }}>
            {pending.length}
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Please finalize all reviews before the judging deadline expires.
          </p>
        </div>
      </div>
    </div>
  );
};
