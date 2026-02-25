import React, { useState, useRef, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { MapPin, Camera, AlertCircle, ArrowRight, User, FileText, Map, Navigation, Mail, Phone, Globe, X, Search } from 'lucide-react';
import MapComponent from './MapComponent'; // Assuming this component exists and works
import './ReportIssue.css'; // Assuming you have the corresponding CSS file

// --- Configuration Mapping for Backend Integration ---

// Map frontend categories to the backend's Complaint model 'assignedTo' enum
const CATEGORY_TO_ASSIGNEDTO_MAP = {
    'Garbage & Waste': 'Municipal sanitation and public health',
    'Potholes': 'Roads and street infrastructure',
    'Street Lights': 'Street lighting and electrical assets',
    'Water Issues': 'Water, sewerage, and stormwater',
    'Vandalism': 'Ward/zone office and central admin', // A common fallback for public area issues
    'Other': 'Ward/zone office and central admin'
};

const UserReportIssue = () => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [aiValidating, setAiValidating] = useState(false);
    const [aiValidationResult, setAiValidationResult] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        category: 'Select issue category', // Maps to 'assignedTo' in backend
        description: '',
        location: '', // User-friendly address string
        additionalAddress: '', // Maps to 'address' array in backend
        volunteer: 'Select a volunteer (optional)', // Not used in backend model, remove or ignore
        priority: 'medium', // Not used in backend model, remove or ignore
        photo: null, // File object
        photoPreview: null // URL for preview
    });
    const [loading, setLoading] = useState(false);
    const [showMapModal, setShowMapModal] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState(null); // { lat, lng, address }
    const [mapLoading, setMapLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
    const API_BASE_URL =  `${BACKEND_URL}/api/v1`; // Assuming default server config

    const categories = useMemo(() => [
        'Select issue category',
        'Garbage & Waste',
        'Potholes',
        'Water Issues',
        'Street Lights',
        'Vandalism',
        'Other'
    ], []);

    // Priorities and Volunteers are not directly mapped to the Complaint model but kept for frontend UX
    const priorityLevels = useMemo(() => [
        { level: 'low', label: 'Low Priority', description: 'Minor issue - expected response within 7-10 days', color: '🟢' },
        { level: 'medium', label: 'Medium Priority', description: 'Moderate issue - expected response within 3-5 days', color: '🟡' },
        { level: 'high', label: 'High Priority', description: 'Urgent issue - expected response within 24-48 hours', color: '🔴' }
    ], []);
    
    // Define volunteers separately to manage the optional field
    const volunteers = useMemo(() => [
        'Select a volunteer (optional)',
        'Neighborhood Watch Team',
        'Local Cleanup Crew',
        'Individual Volunteer'
    ], []);


    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Map frontend categories to model class labels
    const CATEGORY_TO_MODEL_LABEL = {
        'Garbage & Waste': 'Garbage',
        'Potholes': 'Potholes',
        'Street Lights': 'Street Lights',
        'Water Issues': 'Water Issues',
        'Vandalism': 'Vandalism',
        'Other': null
    };

    const validateImageWithAI = async (file, category) => {
        setAiValidating(true);
        setAiValidationResult(null);
    
        try {
            const aiFormData = new FormData();
            aiFormData.append('photo', file);
            aiFormData.append('category', category);
    
            const response = await axios.post(
                `${API_BASE_URL}/ai/validate-photo`,
                aiFormData,
                { withCredentials: true }
            );
    
            const { valid, serverDown, predictedClass, confidence, message } = response.data;
    
            // 🔴 If backend explicitly says serverDown
            if (serverDown) {
                setAiValidationResult({
                    valid: false,
                    serverDown: true,
                    predictedClass: null,
                    confidence: null,
                    message
                });
                return false;
            }
    
            setAiValidationResult({
                valid,
                serverDown: false,
                predictedClass,
                confidence,
                message
            });
    
            return valid;
    
        } catch (error) {
            console.error('AI validation error:', error);
    
            // 🔴 If backend returned 503 OR network error
            if (error.response?.status === 503) {
                setAiValidationResult({
                    valid: false,
                    serverDown: true,
                    predictedClass: null,
                    confidence: null,
                    message: error.response.data?.message || 
                             'AI validation server is currently down. Please try again later.'
                });
            } else {
                setAiValidationResult({
                    valid: false,
                    serverDown: true,
                    predictedClass: null,
                    confidence: null,
                    message: 'Unable to connect to AI validation server.'
                });
            }
    
            return false;
        } finally {
            setAiValidating(false);
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            alert('File size must be less than 10MB');
            return;
        }

        if (!file.type.startsWith('image/')) {
            alert('Please select an image file (JPG, PNG)');
            return;
        }

        const previewUrl = URL.createObjectURL(file);

        setFormData(prev => ({
            ...prev,
            photo: file,
            photoPreview: previewUrl
        }));

        // Run AI validation if a valid category is selected
        const selectedCategory = formData.category;
        const expectedLabel = CATEGORY_TO_MODEL_LABEL[selectedCategory];

        if (selectedCategory !== 'Select issue category' && expectedLabel !== null) {
            await validateImageWithAI(file, selectedCategory);
        } else if (selectedCategory === 'Select issue category') {
            setAiValidationResult({
                valid: null,
                message: 'Select a category to enable AI photo validation.'
            });
        }
    };

    const removePhoto = () => {
        if (formData.photoPreview) {
            URL.revokeObjectURL(formData.photoPreview);
        }
        setFormData(prev => ({
            ...prev,
            photo: null,
            photoPreview: null
        }));
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const reverseGeocode = async (lat, lng) => {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
        );
        const data = await response.json();
        return data.display_name || `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
    }

    const getCurrentLocation = useCallback(() => {
        setMapLoading(true);

        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser');
            setMapLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;

                try {
                    const address = await reverseGeocode(latitude, longitude);

                    setFormData(prev => ({
                        ...prev,
                        location: address
                    }));

                    setSelectedLocation({
                        lat: latitude,
                        lng: longitude,
                        address: address
                    });

                    alert(`Location set to: ${address}`);
                } catch (error) {
                    console.error('Error getting address:', error);
                    alert('Error getting address for location. Coordinates saved.');
                } finally {
                    setMapLoading(false);
                }
            },
            (error) => {
                console.error('Error getting location:', error);
                setMapLoading(false);
                alert(`Location error (${error.code}): ${error.message}. Please select on map or enter manually.`);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
        );
    }, []);

    const searchLocations = useCallback(async (query) => {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`
            );
            const data = await response.json();

            setSearchResults(data);
        } catch (error) {
            console.error('Error searching locations:', error);
            alert('Error searching for locations. Please try again.');
        } finally {
            setIsSearching(false);
        }
    }, []);

    const handleLocationSelect = useCallback((result) => {
        const address = result.display_name;
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);

        setFormData(prev => ({
            ...prev,
            location: address
        }));

        setSelectedLocation({
            lat: lat,
            lng: lng,
            address: address
        });

        setSearchQuery('');
        setSearchResults([]);
        setShowMapModal(false);

        alert(`Location set to: ${address}`);
    }, []);

    const handleMapLocationSelect = useCallback(async (lat, lng) => {
        try {
            const address = await reverseGeocode(lat, lng);

            setFormData(prev => ({
                ...prev,
                location: address
            }));

            setSelectedLocation({
                lat: lat,
                lng: lng,
                address: address
            });

            setShowMapModal(false);
            alert(`Location set to: ${address}`);
        } catch (error) {
            console.error('Error reverse geocoding:', error);
            const fallbackAddress = `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
            setFormData(prev => ({
                ...prev,
                location: fallbackAddress
            }));
            setShowMapModal(false);
            alert(`Location set to coordinates: ${fallbackAddress}`);
        }
    }, []);

    // --- Submission Logic Integration ---
 // ... (lines 1-136, including all imports and state initialization, remain the same)

// --- Submission Logic Integration ---
const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Frontend Validation
    const trimmedTitle = formData.title.trim();
    const trimmedDescription = formData.description.trim();
    const trimmedLocation = formData.location.trim();
    
    if (!trimmedTitle || formData.category === 'Select issue category' || !trimmedDescription || !trimmedLocation || !selectedLocation) {
        alert('Please fill in Issue Title, select a Category, fill Description, and confirm Location (using text input and selecting a location via GPS, map, or search).');
        return;
    }

    const assignedToDepartment = CATEGORY_TO_ASSIGNEDTO_MAP[formData.category];
    if (!assignedToDepartment) {
        alert('Invalid issue category selected.');
        return;
    }

    setLoading(true);

    // Block submission if AI validation failed or server is down
    if (aiValidationResult && aiValidationResult.valid === false) {
        alert(aiValidationResult.serverDown
            ? 'AI validation server is currently down. Please try again after some time.'
            : `Photo rejected: ${aiValidationResult.message}\n\nPlease upload a photo that matches the selected category.`
        );
        setLoading(false);
        return;
    }

    // 2. Prepare FormData for multipart/form-data upload
    const submitData = new FormData();
    submitData.append('title', trimmedTitle);
    submitData.append('description', trimmedDescription);

    // --- FIX: Send complex data as JSON strings for backend explicit parsing ---
    
    const addressArray = [trimmedLocation, formData.additionalAddress.trim()].filter(Boolean);
    // Send as a single JSON string
    submitData.append('address', JSON.stringify(addressArray)); 

    submitData.append('assignedTo', assignedToDepartment);

    // Send coordinates as a single JSON string array: ["lng", "lat"]
    submitData.append('locationCoords', JSON.stringify([selectedLocation.lng, selectedLocation.lat]));

    // Backend file field is 'complaintPhoto'
    if (formData.photo) {
        submitData.append('complaintPhoto', formData.photo);
    }

    // 3. API Call to Backend
    try {
        const response = await axios.post(
            `${API_BASE_URL}/complaints/register`, 
            submitData, 
            {
                withCredentials: true // Important for sending cookies (JWT)
            }
        );

        console.log('Complaint Registration Success:', response.data);
        alert('Issue reported successfully! Our team will review it shortly.');
        navigate('/browse-issues');

    } catch (error) {
        console.error('Complaint Submission Error:', error.response?.data || error.message);
        // Display a user-friendly error
        alert(`Failed to submit report: ${error.response?.data?.message || 'Check your network or ensure your backend server is running correctly.'}`);
    } finally {
        setLoading(false);
    }
};
// ... (rest of the component JSX and functions remain the same)

    const handleLogout = () => {
        axios.post(`${API_BASE_URL}/users/logout`, {}, { withCredentials: true })
            .catch((error) => console.error("Logout failed:", error))
            .finally(() => {
                signOut();
                navigate('/');
            });
    };

    const getUserInitials = (name) => {
        if (!name) return 'CS';
        const nameParts = name.split(' ');
        const initials = nameParts.map(part => part[0]).join('');
        return initials.toUpperCase();
    };

    if (!user) {
        return <div>Loading user info...</div>;
    }

    return (
        <>
            <header className="header-top">
               
                <nav className="nav-links">
                    <Link to="/dashboard">Dashboard</Link>
                    <Link to="/browse-issues">Browse Issues</Link>
                    <Link to="/report-issue" className="active">Report Issue</Link>
                </nav>
                <div className="user-profile">
                    <Link to="/profile" className="profile-link">
                        <div className="user-initials">{getUserInitials(user.name)}</div>
                        <span className="user-name">{user.name}</span>
                    </Link>
                    <button onClick={handleLogout} className="logout-btn-header">
                        <ArrowRight size={20} />
                    </button>
                </div>
            </header>

            <div className="dashboard-container">
                {/* Hero Section */}
                <div className="dashboard-hero">
                    <div className="hero-content-wrapper">
                        <h2>Report a Public Issue</h2>
                        <p>Help improve your community by reporting issues like potholes, broken streetlights, garbage, or water problems. Your voice makes a difference!</p>
                    </div>
                </div>

                {/* Main Content */}
                <div className="report-issue-main">
                    <div className="report-form-container">
                        <div className="form-header">
                            <h3>Submit Your Report</h3>
                            <p>Provide detailed information to help authorities address the issue quickly and effectively.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="report-form">
                            {/* Reporter Info */}
                            <div className="form-section">
                                <div className="form-group">
                                    <label className="form-label">
                                        <User size={16} />
                                        Reporter Name
                                    </label>
                                    <div className="input-with-description">
                                        <input
                                            type="text"
                                            value={user.name || 'John Doe'}
                                            className="form-input"
                                            disabled
                                        />
                                        <div className="input-description">
                                            Your name is automatically populated
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Issue Basic Info */}
                            <div className="form-section">
                                <div className="form-group">
                                    <label className="form-label">
                                        <FileText size={16} />
                                        Issue Title *
                                    </label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        placeholder="Brief, clear description of the issue"
                                        className="form-input"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">
                                        <AlertCircle size={16} />
                                        Issue Category *
                                    </label>
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleInputChange}
                                        className="form-select"
                                        required
                                    >
                                        {categories.map(category => (
                                            <option key={category} value={category}>
                                                {category}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">
                                        Description *
                                    </label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        placeholder="Provide a detailed description of the issue. Include any relevant details that would help authorities understand and address the problem."
                                        className="form-textarea"
                                        rows="4"
                                        required
                                    />
                                    <div className="input-hint">
                                        The more details you provide, the better we can help!
                                    </div>
                                </div>
                            </div>

                            {/* Location Section */}
                            <div className="form-section">
                                <h4 className="section-title">Location Details *</h4>

                                <div className="form-group">
                                    <label className="form-label">
                                        <MapPin size={16} />
                                        Street address or landmark
                                    </label>
                                    <input
                                        type="text"
                                        name="location"
                                        value={formData.location}
                                        onChange={handleInputChange}
                                        placeholder="Complete street address with zip code"
                                        className="form-input"
                                        required
                                    />
                                    <div className="input-hint">
                                        Please provide the complete address including zip code for accurate routing
                                    </div>
                                </div>

                                <div className="location-options">
                                    <button
                                        type="button"
                                        className="location-option-btn"
                                        onClick={() => setShowMapModal(true)}
                                    >
                                        <Map size={16} />
                                        Select on Map
                                    </button>
                                    <button
                                        type="button"
                                        className="location-option-btn"
                                        onClick={getCurrentLocation}
                                        disabled={mapLoading}
                                    >
                                        <Navigation size={16} />
                                        {mapLoading ? 'Getting Location...' : 'Use GPS Location'}
                                    </button>
                                </div>

                                {selectedLocation && (
                                    <div className="location-status success">
                                        <MapPin size={14} />
                                        Location confirmed: {selectedLocation.address}
                                        <span className='coords-text'> (Lng: {selectedLocation.lng.toFixed(4)}, Lat: {selectedLocation.lat.toFixed(4)})</span>
                                    </div>
                                )}

                                <div className="form-group">
                                    <label className="form-label">
                                        Additional Address Details
                                    </label>
                                    <input
                                        type="text"
                                        name="additionalAddress"
                                        value={formData.additionalAddress}
                                        onChange={handleInputChange}
                                        placeholder="Apartment number, building name, or additional location details"
                                        className="form-input"
                                    />
                                </div>
                            </div>

                            {/* Volunteer Assignment (Optional Field)
                            <div className="form-section">
                                <div className="form-group">
                                    <label className="form-label">
                                        Volunteer Assignment
                                    </label>
                                    <select
                                        name="volunteer"
                                        value={formData.volunteer}
                                        onChange={handleInputChange}
                                        className="form-select"
                                    >
                                        {volunteers.map(volunteer => (
                                            <option key={volunteer} value={volunteer}>
                                                {volunteer}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div> */}

                            {/* Priority Section (Optional Field) */}
                            <div className="form-section">
                                <h4 className="section-title">Priority Level</h4>
                                <div className="priority-options">
                                    {priorityLevels.map(priority => (
                                        <label key={priority.level} className="priority-option">
                                            <input
                                                type="radio"
                                                name="priority"
                                                value={priority.level}
                                                checked={formData.priority === priority.level}
                                                onChange={handleInputChange}
                                                className="priority-radio"
                                            />
                                            <div className="priority-content">
                                                <div className="priority-header">
                                                    <span className="priority-icon">{priority.color}</span>
                                                    <span className="priority-label">{priority.label}</span>
                                                </div>
                                                <div className="priority-description">
                                                    {priority.description}
                                                </div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Photo Upload */}
<div className="form-section">
    <div className="form-group">
        <label className="form-label">
            <Camera size={16} />
            Add Photo Evidence
        </label>
        <div className="photo-upload-container">
            <input
                type="file"
                id="photo-upload"
                ref={fileInputRef}
                accept="image/jpeg,image/png,image/jpg"
                onChange={handleFileChange}
                className="photo-input"
            />
            {/* NEW: Hidden camera input */}
            <input
                type="file"
                id="camera-capture"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="photo-input"
                style={{ display: 'none' }}
            />

            {formData.photoPreview ? (
                <div className="photo-preview-active">
                    <div className="preview-header">
                        <span>Photo Preview</span>
                        <button
                            type="button"
                            className="remove-photo-btn"
                            onClick={removePhoto}
                        >
                            <X size={16} />
                        </button>
                    </div>
                    <div className="preview-image-container">
                        <img
                            src={formData.photoPreview}
                            alt="Preview"
                            className="preview-image"
                        />
                    </div>
                    <div className="preview-info">
                        <span className="file-name">{formData.photo.name}</span>
                        <span className="file-size">
                            {(formData.photo.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                    </div>
                </div>
            ) : (
                <div className="upload-options-row">
                    {/* Upload from gallery */}
                    <label htmlFor="photo-upload" className="photo-upload-label">
                        <Camera size={28} />
                        <div className="upload-text">
                            <strong>Choose Photo</strong>
                            <span>From gallery</span>
                        </div>
                    </label>

                    {/* NEW: Take photo with camera */}
                    <label htmlFor="camera-capture" className="photo-upload-label camera-label">
                        <Camera size={28} />
                        <div className="upload-text">
                            <strong>Take Photo</strong>
                            <span>Use camera</span>
                        </div>
                    </label>
                </div>
            )}
        </div>
        <div className="input-hint">JPG, PNG up to 10MB • Photos help get faster responses</div>
    </div>
</div>

                            {/* AI Validation Status */}
                            {aiValidating && (
                                <div className="ai-validation-badge ai-validating">
                                    <div className="loading-spinner-small"></div>
                                    <span>🤖 AI is verifying your photo matches the selected category...</span>
                                </div>
                            )}
                            {!aiValidating && aiValidationResult && (
                                <div className={`ai-validation-badge ${
                                    aiValidationResult.serverDown ? 'ai-server-down' :
                                    aiValidationResult.valid === false ? 'ai-rejected' :
                                    aiValidationResult.valid === true ? 'ai-accepted' : 'ai-info'
                                }`}>
                                    {aiValidationResult.serverDown && (
                                        <span>🔴 <strong>Server Down:</strong> {aiValidationResult.message}</span>
                                    )}
                                    {!aiValidationResult.serverDown && aiValidationResult.valid === false && (
                                        <>
                                            <span>❌ <strong>Photo Mismatch:</strong> {aiValidationResult.message}</span>
                                            {aiValidationResult.predictedClass && (
                                                <span className="ai-detail">
                                                    Detected: <strong>{aiValidationResult.predictedClass}</strong>
                                                    {aiValidationResult.confidence && ` (${(aiValidationResult.confidence * 100).toFixed(1)}% confidence)`}
                                                </span>
                                            )}
                                            <span className="ai-action">Please remove the photo and upload one that shows a <strong>{formData.category}</strong> issue.</span>
                                        </>
                                    )}
                                    {!aiValidationResult.serverDown && aiValidationResult.valid === true && (
                                        <>
                                            <span>✅ <strong>Photo Verified:</strong> {aiValidationResult.message || 'Photo matches the selected category.'}</span>
                                            {aiValidationResult.predictedClass && (
                                                <span className="ai-detail">
                                                    Detected: <strong>{aiValidationResult.predictedClass}</strong>
                                                    {aiValidationResult.confidence && ` (${(aiValidationResult.confidence * 100).toFixed(1)}% confidence)`}
                                                </span>
                                            )}
                                        </>
                                    )}
                                    {aiValidationResult.valid === null && (
                                        <span>ℹ️ {aiValidationResult.message}</span>
                                    )}
                                </div>
                            )}

                            {/* Submit Button */}
                            <div className="form-actions">
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => navigate('/browse-issues')}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={
                                        loading ||
                                        aiValidating ||
                                        (aiValidationResult && aiValidationResult.valid === false)
                                    }
                                    title={
                                        aiValidationResult?.serverDown
                                            ? 'AI server is down. Try again later.'
                                            : aiValidationResult?.valid === false
                                            ? 'Please upload a valid photo for the selected category'
                                            : ''
                                    }
                                >
                                    {loading ? (
                                        <>
                                            <div className="loading-spinner-small"></div>
                                            Submitting...
                                        </>
                                    ) : aiValidating ? (
                                        <>
                                            <div className="loading-spinner-small"></div>
                                            Validating Photo...
                                        </>
                                    ) : (
                                        'Submit Report'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Sidebar with Tips (Unchanged) */}
                    <div className="report-sidebar">
                        <div className="sidebar-panel">
                            <h4>📝 Reporting Tips</h4>
                            <ul className="tips-list">
                                <li>Be specific about the location</li>
                                <li>Include clear, well-lit photos</li>
                                <li>Describe safety concerns clearly</li>
                                <li>Mention how long the issue has existed</li>
                                <li>Provide accurate contact information</li>
                            </ul>
                        </div>

                        <div className="sidebar-panel">
                            <h4>📍 Location Help</h4>
                            <ul className="tips-list">
                                <li><strong>GPS Location:</strong> Uses your device's location services</li>
                                <li><strong>Select on Map:</strong> Choose exact location on interactive map</li>
                                <li><strong>Manual Entry:</strong> Type full address with zip code</li>
                                <li>Include landmarks for better accuracy</li>
                            </ul>
                        </div>

                        <div className="sidebar-panel">
                            <h4>⏱️ What Happens Next?</h4>
                            <div className="process-steps">
                                <div className="process-step">
                                    <span className="step-number">1</span>
                                    <div className="step-content">
                                        <strong>Report Submitted</strong>
                                        <p>Your issue is logged in our system</p>
                                    </div>
                                </div>
                                <div className="process-step">
                                    <span className="step-number">2</span>
                                    <div className="step-content">
                                        <strong>Under Review</strong>
                                        <p>Authorities assess the priority</p>
                                    </div>
                                </div>
                                <div className="process-step">
                                    <span className="step-number">3</span>
                                    <div className="step-content">
                                        <strong>Action Taken</strong>
                                        <p>Issue is assigned for resolution</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="sidebar-panel">
                            <h4>📞 Need Help?</h4>
                            <div className="contact-info">
                                <p><Mail size={16} /> <a href="mailto:support@civiceye.org">support@civiceye.org</a></p>
                                <p><Phone size={16} /> <a href="tel:5551234567">(555) 123-HELP</a></p>
                                <p><Globe size={16} /> <a href="#">Live Chat Support</a></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Map Modal */}
            {showMapModal && (
                <div className="modal-overlay">
                    <div className="map-modal">
                        <div className="modal-header">
                            <h3>Select Location on Map</h3>
                            <button
                                className="close-modal-btn"
                                onClick={() => setShowMapModal(false)}
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-content">
                            {/* Search Bar */}
                            <div className="map-search-container">
                                <div className="search-bar">
                                    <Search size={20} className="search-icon" />
                                    <input
                                        type="text"
                                        placeholder="Search for an address or place..."
                                        value={searchQuery}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value);
                                            searchLocations(e.target.value);
                                        }}
                                        className="search-input"
                                    />
                                    {isSearching && (
                                        <div className="search-loading">
                                            <div className="loading-spinner-small"></div>
                                        </div>
                                    )}
                                </div>

                                {/* Search Results */}
                                {searchResults.length > 0 && (
                                    <div className="search-results">
                                        {searchResults.map((result) => (
                                            <div
                                                key={result.place_id}
                                                className="search-result-item"
                                                onClick={() => handleLocationSelect(result)}
                                            >
                                                <MapPin size={16} />
                                                <div className="result-details">
                                                    <div className="result-main-text">{result.display_name}</div>
                                                    <div className="result-type">
                                                        Type: {result.type} • {result.class}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Interactive Map */}
                            <div className="map-container">
                                <MapComponent
                                    onLocationSelect={handleMapLocationSelect}
                                    initialCenter={selectedLocation ? { lat: selectedLocation.lat, lng: selectedLocation.lng } : null}
                                />
                            </div>

                            <div className="map-instructions">
                                <p>💡 <strong>Click anywhere on the map</strong> to select the exact location of the issue</p>
                                <p>🗺️ Powered by OpenStreetMap - Free and open-source mapping</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <footer className="footer">
                <div className="footer-column footer-logo-section">
                    
                    <p className="footer-tagline">Civic Engagement Platform</p>
                    <p>Empowering communities to report, track, and resolve civic issues through collaborative engagement between citizens and local authorities.</p>
                </div>
                <div className="footer-column">
                    <h4>Platform</h4>
                    <ul>
                        <li><a href="/">How it Works</a></li>
                        <li><a href="/">Features</a></li>
                        <li><a href="/">Pricing</a></li>
                        <li><a href="/">Mobile App</a></li>
                    </ul>
                </div>
                <div className="footer-column">
                    <h4>Support</h4>
                    <ul>
                        <li><a href="/">Help Center</a></li>
                        <li><a href="/">Contact Us</a></li>
                        <li><a href="/">User Guide</a></li>
                        <li><a href="/">Community Forum</a></li>
                    </ul>
                </div>
                <div className="footer-column">
                    <h4>Company</h4>
                    <ul>
                        <li><a href="/">About Us</a></li>
                        <li><a href="/">Careers</a></li>
                        <li><a href="/">Press Kit</a></li>
                        <li><a href="/">Blog</a></li>
                    </ul>
                </div>
            </footer>
        </>
    );
};

export default UserReportIssue;