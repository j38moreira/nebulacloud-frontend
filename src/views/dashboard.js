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
    const [username, setUsername] = useState('');
    const [newFolderName, setNewFolderName] = useState('');
    const [showPopup, setShowPopup] = useState(false); // State to control popup visibility
    const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
    const [showContextMenu, setShowContextMenu] = useState(false);
    const [currentFileToDownload, setCurrentFileToDownload] = useState(null);
    const [previewImage, setPreviewImage] = useState(null); // New state for image preview
    const navigate = useNavigate();

    useEffect(() => {
        const storedUsername = localStorage.getItem('username');
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
                { path },
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
            const lastPath = pathHistory.pop();
            setPathHistory([...pathHistory]); // Update history
            setCurrentPath(lastPath || ''); // Go back to the last path
        }
    };


    const handleFileChange = async (event) => {
        const files = Array.from(event.target.files); // Convert FileList to array

        if (files.length === 0) {
            alert('No files selected.');
            return;
        }

        const token = localStorage.getItem('access_token');
        const formData = new FormData();

        files.forEach((file) => {
            formData.append('file', file); // Add each file to FormData
        });
        formData.append('path', currentPath);

        try {
            const response = await axios.post('http://127.0.0.1:5000/upload', formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.status === 201) {
                alert('Files uploaded successfully!');
                fetchContents(token, currentPath); // Refresh file list
            } else {
                alert('Error uploading files.');
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Error uploading files.');
        }
    };


    const handleLogout = () => {
        localStorage.removeItem('access_token'); // Clear access token
        navigate('/login'); // Redirect to login page
    };

    const handleCreateFolder = async () => {
        const token = localStorage.getItem('access_token');
        const folderData = {
            path: currentPath,
            folder_name: newFolderName,
        };

        try {
            const response = await axios.post('http://127.0.0.1:5000/create_folder', folderData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.status === 201) {
                setNewFolderName(''); // Clear the input after success
                setShowPopup(false); // Close the popup
                fetchContents(token, currentPath); // Refresh the folder list
                alert('Folder created successfully!');
            } else {
                alert('Error creating folder.');
            }
        } catch (error) {
            alert('Error creating folder.');
        }
    };

    const handleFileDownload = async () => {
        const token = localStorage.getItem('access_token');
        const downloadPath = `${currentPath ? `${currentPath}/` : ''}${currentFileToDownload}`;

        try {
            const response = await axios.get('http://127.0.0.1:5000/download', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                params: { path: downloadPath }, // Send path as query parameter
                responseType: 'blob', // Important to handle the binary data
            });

            // Create a link element and trigger a download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', currentFileToDownload); // Set filename for download
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            alert('Error downloading file.');
        }

        // Close the context menu after download
        setShowContextMenu(false);
    };

    // Function to handle right-click
    const handleRightClick = (e, fileName) => {
        e.preventDefault(); // Prevent the default context menu
        setContextMenuPosition({ x: e.clientX, y: e.clientY });
        setCurrentFileToDownload(fileName);
        setShowContextMenu(true);
    };

    // Function to handle image click (for preview)
    const handleImageClick = (fileName) => {
        const token = localStorage.getItem('access_token');
        const imageUrl = `http://127.0.0.1:5000/preview?path=${currentPath ? `${currentPath}/` : ''}${fileName}`;

        axios.get(imageUrl, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            responseType: 'blob', // Important to handle the image as binary data
        })
            .then((response) => {
                const imageBlob = response.data;
                const imageObjectURL = URL.createObjectURL(imageBlob);
                setPreviewImage(imageObjectURL); // Set the image for preview
            })
            .catch((error) => {
                alert('Error previewing image: ' + error.response.data.error);
            });
    };

    // Close context menu when clicking outside
    const handleClickOutside = (e) => {
        if (!e.target.closest('.context-menu')) {
            setShowContextMenu(false);
        }
    };

    useEffect(() => {
        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, []);
    

    return (
        <div className="dashboard-container">
            {/* Banner */}
            <div className="dashboard-banner">
                <h1>Nebula Cloud - Welcome, {username}!</h1>
                <div className="menu">
                    <button className="create-folder-button" onClick={() => setShowPopup(true)}>
                        Create Folder
                    </button>
                    <div className="upload-section">
                        <input
                            type="file"
                            id="fileInput"
                            multiple
                            onChange={handleFileChange} // Automatically upload after selecting files
                            style={{display: 'none'}}
                        />
                        <button
                            className="upload-button"
                            onClick={() => document.getElementById('fileInput').click()} // Trigger file input click
                        >
                            Upload Files
                        </button>
                    </div>

                    <button className="logout-button" onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </div>

            {/* Error Message */}
            {errorMessage && <p className="error-message">{errorMessage}</p>}

            {/* Navigation Controls */}
            <div className="navigation-controls">
                <button className="go-back-button" onClick={handleGoBack} disabled={pathHistory.length === 0}>
                    Go Back
                </button>
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
                {files.map((file, index) => {
                    const isImage = file.match(/\.(jpeg|jpg|png|gif)$/i);
                    return (
                        <div
                            key={index}
                            className="grid-item file-item"
                            onContextMenu={(e) => handleRightClick(e, file)} // Handle right-click
                            onClick={() => isImage && handleImageClick(file)} // Handle image click for preview
                        >
                            <span role="img" aria-label="file">📄</span>
                            <h4>{file}</h4>

                            {/* Display image preview if it's an image file */}
                            {isImage && (
                                <img
                                    src={`http://127.0.0.1:5000/preview?path=${currentPath ? `${currentPath}/` : ''}${file}`}
                                    alt={file}
                                    style={{ width: '100px', height: '100px' }}
                                />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Image Preview Modal */}
            {previewImage && (
                <div className="image-preview-modal">
                    <div className="image-preview-overlay" onClick={() => setPreviewImage(null)}></div>
                    <div className="image-preview-content">
                        <button className="close-preview-btn" onClick={() => setPreviewImage(null)}>×</button>
                        <img
                            src={previewImage} // Use the object URL for the image source
                            alt="Preview"
                        />
                    </div>
                </div>
            )}

            {/* Create Folder Popup */}
            {showPopup && (
                <div className="popup-overlay">
                    <div className="popup">
                        <h2>Create a New Folder</h2>
                        <input
                            type="text"
                            placeholder="Enter folder name"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                        />
                        <button onClick={handleCreateFolder}>Create</button>
                        <button onClick={() => setShowPopup(false)}>Cancel</button>
                    </div>
                </div>
            )}

            {/* Context Menu for File Download */}
            {showContextMenu && (
                <div
                    className="context-menu"
                    style={{ left: `${contextMenuPosition.x}px`, top: `${contextMenuPosition.y}px` }}
                >
                    <button onClick={handleFileDownload}>Download</button>
                </div>
            )}
        </div>
    );
}

export default Dashboard;
