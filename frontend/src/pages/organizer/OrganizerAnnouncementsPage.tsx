import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import { Event } from '../../types';
import { MessageSquare, Pin, Plus, Save } from 'lucide-react';

interface Props {
    onNotification: (msg: string, type?: 'success' | 'error') => void;
    selectedEvent: Event;
}

export const OrganizerAnnouncementsPage: React.FC<Props> = ({ onNotification, selectedEvent }) => {
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isPinned, setIsPinned] = useState(false);

    useEffect(() => {
        if (selectedEvent) {
            loadAnnouncements();
        }
    }, [selectedEvent]);

    const loadAnnouncements = async () => {
        setLoading(true);
        try {
            const data = await api.getAnnouncements(selectedEvent.id);
            setAnnouncements(data);
        } catch (err: any) {
            onNotification(err.message || 'Failed to load announcements', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !content) {
            onNotification('Title and content are required.', 'error');
            return;
        }
        setSubmitting(true);
        try {
            const newAnn = await api.createAnnouncement(selectedEvent.id, {
                title, content, is_pinned: isPinned
            });
            setAnnouncements([newAnn, ...announcements]);
            setIsCreating(false);
            setTitle('');
            setContent('');
            setIsPinned(false);
            onNotification('Announcement posted successfully!', 'success');
        } catch (err: any) {
            onNotification(err.message || 'Failed to post announcement', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (!selectedEvent) return <div>No event selected.</div>;

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Community Announcements</h1>
                    <p className="page-subtitle">Draft and publish updates that will be broadcasted to all participants.</p>
                </div>
                <button className="btn btn-primary" onClick={() => setIsCreating(!isCreating)}>
                    <Plus size={15} /> {isCreating ? 'Cancel' : 'New Announcement'}
                </button>
            </div>

            {isCreating && (
                <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
                    <form onSubmit={handleCreate}>
                        <div className="form-group">
                            <label className="form-label">Title</label>
                            <input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="E.g., Submissions extended!" required />
                        </div>
                        <div className="form-group" style={{ marginTop: '16px' }}>
                            <label className="form-label">Message Content</label>
                            <textarea className="textarea" rows={4} value={content} onChange={e => setContent(e.target.value)} placeholder="Type your announcement here..." required />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px' }}>
                            <input type="checkbox" id="pin" checked={isPinned} onChange={e => setIsPinned(e.target.checked)} />
                            <label htmlFor="pin" style={{ fontSize: '13px', fontWeight: 600 }}>Pin to top of feed</label>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                            <button type="submit" className="btn btn-primary" disabled={submitting}>
                                <Save size={15} /> Publish Update
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {loading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
            ) : announcements.length === 0 ? (
                <div className="empty-state">
                    <MessageSquare size={36} color="var(--text-tertiary)" style={{ margin: '0 auto' }} />
                    <h3 className="empty-state-title">No announcements</h3>
                    <p className="empty-state-desc">You haven't posted any updates for this event yet.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {announcements.map(ann => (
                        <div key={ann.id} className="card" style={{ padding: '20px', borderLeft: ann.is_pinned ? '4px solid var(--brand-primary)' : '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {ann.is_pinned && <Pin size={14} color="var(--brand-primary)" />}
                                    {ann.title}
                                </h3>
                                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                    {new Date(ann.created_at).toLocaleString()}
                                </span>
                            </div>
                            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                                {ann.content}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
