import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/dashboard.css';

function Dashboard() {
    const [folders, setFolders] = useState([]);
    const [files, setFiles] = useState([]);
    const [errorMessage, setErrorMessage] = useState('');
    const [currentPath, setCurrentPath] = useState('');
    const [loading, setLoading] = useState(false);  // Track loading state
    const navigate = useNavigate();
    const [selectedFile, setSelectedFile] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            navigate('/login');
        } else {
            fetchContents(token, currentPath);
        }
    }, [navigate, currentPath]);

    useEffect(() => {
        // Clear folders and files whenever the path changes
        setFolders([]);
        setFiles([]);
    }, [currentPath]);  // Effect will run every time currentPath changes

    const fetchContents = async (token, path) => {
        setLoading(true);  // Set loading to true before fetching
        try {
            const response = await axios.get('http://127.0.0.1:5000/list', {
                headers: { Authorization: `Bearer ${token}` },
                params: { path },
            });

            if (response.status === 200) {
                setFolders(response.data.folders);
                setFiles(response.data.files);
                setErrorMessage('');
            } else {
                setErrorMessage('Failed to fetch contents.');
            }
        } catch (error) {
            setErrorMessage('Error fetching contents.');
        } finally {
            setLoading(false);  // Set loading to false after fetching
        }
    };

    const handleFolderClick = (folderName) => {
        // Update the currentPath, which triggers the useEffect to clear state
        const newPath = `${currentPath ? currentPath + '/' : ''}${folderName}`;
        setCurrentPath(newPath); // Update the current path to include the selected folder
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
                    setFiles([...files, selectedFile.name]);
                    setSelectedFile(null); // Reset file input
                    alert('File uploaded successfully!');
                }
            } catch (error) {
                alert('Error uploading file.');
            }
        } else {
            alert('Please select a file to upload.');
        }
    };

    return (
        <div className="dashboard-container">
            {/* Banner with menu */}
            <div className="dashboard-banner">
                <h1>Dashboard</h1>
                <div className="menu">
                    <button className="create-folder-button">Create Folder</button>
                    <button className="upload-button" onClick={handleFileUpload}>Upload File</button>
                    <button className="logout-button">Logout</button>
                </div>
            </div>

            {/* Error message */}
            {errorMessage && <p className="error-message">{errorMessage}</p>}

            {/* File upload input */}
            <input
                type="file"
                className="file-input"
                onChange={handleFileChange}
                style={{ display: 'none' }}
            />

            {/* Content container for folders and files */}
            <div className="content-container">
                {/* Loading state */}
                {loading ? (
                    <p>Loading...</p> // Show loading text while fetching
                ) : (
                    <>
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
                    </>
                )}
            </div>
        </div>
    );
}

export default Dashboard;