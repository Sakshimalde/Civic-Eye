import React from 'react';
import { MapPin, Heart, MessageSquare, Share2 } from 'lucide-react';

const IssueCard = ({ issue, onCommentClick }) => {
    const daysAgo = Math.round((new Date() - new Date(issue.createdAt)) / (1000 * 60 * 60 * 24));

    return (
        <div className="issue-card">
            <img src={issue.imageUrl} alt={issue.title} className="issue-card-image" />
            <div className="issue-card-content">
                <div className="issue-card-header">
                    <h3>{issue.title}</h3>
                    <div className="issue-card-tags">
                        <span className={`tag status-${issue.status.replace(/\s+/g, '-').toLowerCase()}`}>{issue.status}</span>
                        <span className={`tag priority-${issue.priority.toLowerCase()}`}>{issue.priority}</span>
                    </div>
                </div>
                <p className="issue-card-description">{issue.description}</p>
                <div className="issue-card-meta">
                    <span><MapPin size={14} /> {issue.location}</span>
                    <span>{daysAgo} days ago</span>
                </div>
                <div className="issue-card-footer">
                    <span className="category-tag">{issue.category}</span>
                    <span className="reporter-info">Reported by {issue.reporter}</span>
                </div>
            </div>
            <div className="issue-card-engagement">
                <button><Heart size={16} /><span>{issue.upvotes}</span></button>
                <button onClick={onCommentClick}><MessageSquare size={16} /><span>{issue.comments.length}</span></button>
                <button><Share2 size={16} /><span>{issue.shares}</span></button>
            </div>
        </div>
    );
};

export default IssueCard;