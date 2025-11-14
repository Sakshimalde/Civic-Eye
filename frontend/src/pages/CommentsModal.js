import React, { useState } from 'react';
import { X, Send, User } from 'lucide-react';

const CommentsModal = ({ issue, onClose }) => {
    const [newComment, setNewComment] = useState('');

    const handlePostComment = (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        console.log('Posting comment:', newComment);
        // Add logic to post comment to backend here
        setNewComment('');
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Comments: {issue.title}</h3>
                    <button onClick={onClose} className="close-button"><X size={24} /></button>
                </div>
                <div className="comments-list">
                    {issue.comments.length > 0 ? (
                        issue.comments.map(comment => (
                            <div key={comment.id} className="comment-item">
                                <div className="comment-author-icon"><User size={16} /></div>
                                <div className="comment-body">
                                    <div className="comment-author-header">
                                        <strong>{comment.author}</strong>
                                        <span>{comment.time}</span>
                                    </div>
                                    <p>{comment.text}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p>No comments yet. Be the first to share your thoughts!</p>
                    )}
                </div>
                <form className="comment-form" onSubmit={handlePostComment}>
                    <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Share your thoughts..." />
                    <button type="submit"><Send size={16} /> Post Comment</button>
                </form>
            </div>
        </div>
    );
};

export default CommentsModal;