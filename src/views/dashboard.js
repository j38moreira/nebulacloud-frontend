import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/dashboard.css';

function Dashboard() {
    const [folders, setFolders] = useState([]);
    const [files, setFiles] = useState([]);
    const [errorMessage, setErrorMessage] = useState('');
    const [currentPath, setCurrentPath] = useState('');
    const [pathHistory, setPathHistory] = useState([]); // Track navigation history
    const [selectedFile, setSelectedFile] = useState(null);
    const [username, setUsername] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const storedUsername = localStorage.getItem('username'); // Retrieve username
        if (storedUsername) {
            setUsername(storedUsername); // Display username
        } else {
            navigate('/login'); // Redirect if not logged in
        }

        const token = localStorage.getItem('access_token');
        if (!token) {
            navigate('/login');
        } else {
            fetchContents(token, currentPath);
        }
    }, [currentPath, navigate]);

    const fetchContents = async (token, path) => {
        try {
            const response = await axios.post(
                'http://127.0.0.1:5000/list',
                { path }, // Include path in the body
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (response.status === 200) {
                setFolders(response.data.folders);
                setFiles(response.data.files);
                setErrorMessage('');
            } else {
                setErrorMessage('Failed to fetch contents.');
            }
        } catch (error) {
            setErrorMessage('Error fetching contents.');
        }
    };

    const handleFolderClick = (folderName) => {
        const newPath = `${currentPath ? `${currentPath}/` : ''}${folderName}`;
        setPathHistory([...pathHistory, currentPath]); // Save current path in history
        setCurrentPath(newPath);
    };

    const handleGoBack = () => {
        if (pathHistory.length > 0) {
            const lastPath = pathHistory.pop(); // Get the last path
            setPathHistory([...pathHistory]); // Update history
            setCurrentPath(lastPath || ''); // Go back to the last path
        }
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file);
        }
    };

    const handleFileUpload = async () => {
        if (selectedFile) {
            const token = localStorage.getItem('access_token');
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('path', currentPath);

            try {
                const response = await axios.post('http://127.0.0.1:5000/upload', formData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data',
                    },
                });

                if (response.status === 200) {
                    fetchContents(token, currentPath);
                    setSelectedFile(null);
                    alert('File uploaded successfully!');
                }
            } catch (error) {
                alert('Error uploading file.');
            }
        } else {
            alert('Please select a file to upload.');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('access_token'); // Clear access token
        navigate('/login'); // Redirect to login page
    };

    return (
        <div className="dashboard-container">
            {/* Banner */}
            <div className="dashboard-banner">
                <h1>Nebula Cloud - Welcome, {username}!</h1>
                <div className="menu">
                    <button className="create-folder-button">Create Folder</button>
                    <button className="upload-button" onClick={handleFileUpload}>Upload File</button>
                    <button className="logout-button" onClick={handleLogout}>Logout</button>
                </div>
            </div>

            {/* Error Message */}
            {errorMessage && <p className="error-message">{errorMessage}</p>}

            {/* Navigation Controls */}
            <div className="navigation-controls">
                <button className="go-back-button" onClick={handleGoBack} disabled={pathHistory.length === 0}>
                    Go Back
                </button>
                <p className="current-path">Current Path: {currentPath || 'Root'}</p>
            </div>

            {/* Content */}
            <div className="content-container">
                {/* Render Folders */}
                {folders.map((folder, index) => (
                    <div key={index} className="grid-item folder-item" onClick={() => handleFolderClick(folder)}>
                        <span role="img" aria-label="folder">📁</span>
                        <h4>{folder}</h4>
                    </div>
                ))}

                {/* Render Files */}
                {files.map((file, index) => (
                    <div key={index} className="grid-item file-item">
                        <span role="img" aria-label="file">📄</span>
                        <h4>{file}</h4>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Dashboard;
