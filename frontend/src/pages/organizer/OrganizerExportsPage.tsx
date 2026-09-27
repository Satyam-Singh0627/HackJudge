import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import { Event } from '../../types';
import { Download, FileSpreadsheet, FileText, Database } from 'lucide-react';

export const OrganizerExportsPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const data = await api.listEvents();
      setEvents(data);
      if (data.length > 0) setSelectedEventId(data[0].id);
    } catch (err) {
      console.error(err);
    }
  };

  const exportItems = [
    {
      title: 'Normalized Competition Rankings',
      desc: 'Final calculated Z-scores, ranks, and aggregate evaluation counts.',
      type: 'rankings' as const
    },
    {
      title: 'Raw Judge Evaluations & Feedback',
      desc: 'All individual criterion scores, raw totals, judge IDs, and qualitative notes.',
      type: 'scores' as const
    },
    {
      title: 'Project Submissions & Metadata',
      desc: 'Full submission roster including repo links, demo URLs, and tags.',
      type: 'submissions' as const
    },
    {
      title: 'Formed Teams & Rosters',
      desc: 'Team names, member rosters, user IDs, and join dates.',
      type: 'teams' as const
    },
    {
      title: 'Registered Participants Directory',
      desc: 'All registered participants for this event with bios and usernames.',
      type: 'participants' as const
    },
    {
      title: 'Platform Immutable Audit Log',
      desc: 'System-wide event audit trail including timestamps, IPs, and actors.',
      type: 'audit' as const
    }
  ];

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Local Streaming CSV Exports</h1>
          <p className="page-subtitle">Download unfiltered, high-integrity data dumps directly from the database.</p>
        </div>

        {events.length > 1 && (
          <select
            className="select"
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
          >
            {events.map(ev => (
              <option key={ev.id} value={ev.id}>{ev.title}</option>
            ))}
          </select>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
        {exportItems.map((item, idx) => (
          <div key={idx} className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '6px', background: 'var(--brand-primary-subtle)', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileSpreadsheet size={18} />
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: 700 }}>{item.title}</h3>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px', flex: 1, lineHeight: 1.5 }}>
              {item.desc}
            </p>

            <a
              href={api.getExportUrl(item.type, selectedEventId)}
              download
              className="btn btn-secondary"
              style={{ width: '100%', gap: '8px', fontSize: '13px' }}
            >
              <Download size={14} /> Download {item.type.toUpperCase()}.csv
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};
