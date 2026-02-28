// ════════════════════════════════════════════════════════════════
//  ISSUESBROWSER.JS — ONLY THE 3 PARTS THAT CHANGE
//  Copy-paste each section into the correct location
// ════════════════════════════════════════════════════════════════

// ── CHANGE 1 ─────────────────────────────────────────────────────
// In fetchIssues → the return { ... } object inside .map(comp => {
// ADD these 2 fields:

return {
    id: comp._id,
    title: comp.title,
    description: comp.description,
    location: locationText,
    category: displayCategory,
    status: statusText,
    isRejected: comp.isRejected || false,          // ← ADD THIS
    rejectionNote: comp.rejectionNote || '',        // ← ADD THIS
    createdAt: comp.createdAt,
    votes: 0,
    comments: comp.comments?.length || 0,
    views: Math.floor(Math.random() * 200),
    priority: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)],
    urgency: 'Community Concern',
    user: userName,
    userAvatar: getUserInitials(userName),
    counts: { upvote: 0, downVote: 0 }
};


// ── CHANGE 2 ─────────────────────────────────────────────────────
// Replace the entire <div key={issue.id} className="issue-card">
// block with this (adds rejected banner + disables actions):

<div key={issue.id} className={`issue-card ${issue.isRejected ? 'issue-card-rejected' : ''}`}>
    {/* Rejected Banner — shown to all citizens */}
    {issue.isRejected && (
        <div className="issue-rejected-banner">
            <span className="rejected-icon">✕</span>
            <div>
                <strong>This complaint was rejected by admin</strong>
                {issue.rejectionNote && (
                    <p className="rejected-reason">Reason: {issue.rejectionNote}</p>
                )}
            </div>
        </div>
    )}

    <div className="issue-header">
        <div className="issue-meta-left">
            <div
                className="issue-category-tag"
                style={{
                    backgroundColor: issueCategories.find(c => c.category === issue.category)?.color + '20',
                    color: issueCategories.find(c => c.category === issue.category)?.color
                }}
            >
                {issue.category}
            </div>
            <div className={`priority-indicator priority-${issue.priority}`}>
                <div className={`priority-dot priority-${issue.priority}`}></div>
                {issue.priority} priority
            </div>
        </div>
        <div className="issue-urgency">
            {issue.urgency}
        </div>
    </div>

    <h4 className="issue-title">{issue.title}</h4>
    <p className="issue-description">{issue.description}</p>

    <div className="issue-meta">
        <div className="meta-item">
            <MapPin size={16} />
            <span>{issue.location}</span>
        </div>
        <div className="meta-item">
            <Clock size={16} />
            <span>{getRelativeTime(issue.createdAt)}</span>
        </div>
    </div>

    <div className="issue-footer">
        <div className="user-info">
            <div className="user-avatar-small">
                {issue.userAvatar}
            </div>
            <div className="user-details">
                <span className="user-name">{issue.user}</span>
                <span className="report-time">{getRelativeTime(issue.createdAt)}</span>
            </div>
        </div>
    </div>

    <div className="issue-actions">
        <div className="vote-section">
            {/* Upvote — disabled if rejected */}
            <button
                className={`vote-btn upvote ${userVotes[issue.id] === 'upvote' ? 'voted' : ''}`}
                onClick={() => !issue.isRejected && handleVote(issue.id, 'upvote')}
                disabled={issue.isRejected || userVotes[issue.id] === 'upvote' || busyVotes[issue.id]}
                title={issue.isRejected ? 'Voting disabled — complaint rejected' : ''}
            >
                <Heart size={16} />
                <span>{issue.counts?.upvote || 0}</span>
            </button>
            {/* Downvote — disabled if rejected */}
            <button
                className={`vote-btn downvote ${userVotes[issue.id] === 'downvote' ? 'voted' : ''}`}
                onClick={() => !issue.isRejected && handleVote(issue.id, 'downvote')}
                disabled={issue.isRejected || userVotes[issue.id] === 'downvote' || busyVotes[issue.id]}
                title={issue.isRejected ? 'Voting disabled — complaint rejected' : ''}
            >
                <ThumbsDown size={16} />
                <span>{issue.counts?.downVote || 0}</span>
            </button>
        </div>

        <div className={`status-badge status-${issue.isRejected ? 'rejected' : issue.status.replace(' ', '').toLowerCase()}`}>
            {issue.isRejected ? 'Rejected' : issue.status}
        </div>
    </div>

    {/* Comments toggle — disabled if rejected */}
    {!issue.isRejected && (
        <div className="comments-toggle">
            <button className="comments-open-btn" onClick={() => toggleComments(issue.id)}>
                <ChevronsDown size={14} /> {commentsOpen[issue.id] ? 'Hide' : 'Show'} Comments ({issue.comments || 0})
            </button>
        </div>
    )}

    {/* Comments panel — hidden if rejected */}
    {!issue.isRejected && commentsOpen[issue.id] && (
        <div className="comments-panel">
            {/* Add Comment */}
            <div className="add-comment">
                <textarea
                    placeholder="Write your comment..."
                    value={commentDrafts[issue.id] || ''}
                    onChange={(e) => handleCommentChange(issue.id, e.target.value)}
                    rows={2}
                />
                <div className="comment-actions">
                    <button onClick={() => postComment(issue.id)} disabled={busyComments[issue.id]}>
                        {busyComments[issue.id] ? 'Posting...' : 'Post Comment'}
                    </button>
                </div>
            </div>
            {/* Comments List — keep your existing comments rendering here unchanged */}
            {(commentsStore[issue.id] || []).map(c => {
                const commenterName = c.userId?.name || 'User';
                const isOwner = (c.userId?._id || c.userId) === user._id;
                const isEditing = editingComment?.commentId === c._id;
                // ... rest of your existing comment rendering code unchanged
            })}
        </div>
    )}
</div>


// ── CHANGE 3 ─────────────────────────────────────────────────────
// Add these CSS rules to IssuesBrowser.css (or the inline style block)

/*
.issue-card-rejected {
    opacity: 0.82;
    border: 1px solid #fecdd3 !important;
    background: #fff8f8 !important;
}

.issue-rejected-banner {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    background: #fff1f2;
    border: 1px solid #fecdd3;
    border-radius: 8px;
    padding: 10px 14px;
    margin-bottom: 12px;
    color: #be123c;
    font-size: 13px;
}

.rejected-icon {
    width: 20px;
    height: 20px;
    background: #fecdd3;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: 700;
    flex-shrink: 0;
    color: #be123c;
}

.rejected-reason {
    margin: 3px 0 0;
    color: #9f1239;
    font-size: 12px;
}

.status-badge.status-rejected {
    background: #fff1f2;
    color: #be123c;
    border: 1px solid #fecdd3;
}

.vote-btn:disabled[title] {
    cursor: not-allowed;
    opacity: 0.45;
}
*/