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
    const [filePreviews, setFilePreviews] = useState({}); // Add here

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

    const handleDelete = async () => {
        const token = localStorage.getItem('access_token');
        const deletePath = `${currentPath ? `${currentPath}/` : ''}${currentFileToDownload}`;

        try {
            const response = await axios.delete('http://127.0.0.1:5000/delete', {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                data: {
                    path: deletePath, // Send the full path to the folder to be deleted
                },
            });

            if (response.status === 200) {
                alert('Folder deleted successfully!');
                // Refresh the contents after deletion
                fetchContents(token, currentPath);
            } else {
                alert('Error deleting the folder.');
            }
        } catch (error) {
            console.error('Error deleting folder:', error);
            alert('Error deleting the folder.');
        }

        // Close the context menu after deletion
        setShowContextMenu(false);
    };


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

                // Fetch previews for image files
                const imageFiles = response.data.files.filter((file) =>
                    file.match(/\.(jpeg|jpg|png|gif)$/i)
                );
                fetchFilePreviews(imageFiles);
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

    const fetchFilePreviews = async (imageFiles) => {
        const token = localStorage.getItem('access_token');

        const previews = {};
        await Promise.all(
            imageFiles.map(async (file) => {
                try {
                    const imageUrl = `http://127.0.0.1:5000/preview?path=${currentPath ? `${currentPath}/` : ''}${file}`;
                    const response = await axios.get(imageUrl, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                        responseType: 'blob',
                    });
                    const imageBlob = response.data;
                    const imageObjectURL = URL.createObjectURL(imageBlob);
                    previews[file] = imageObjectURL;
                } catch (error) {
                    console.error(`Failed to load preview for ${file}`, error);
                }
            })
        );

        setFilePreviews((prev) => ({ ...prev, ...previews })); // Merge with existing previews
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

    const handleRightClickFolder = (e, folderName) => {
        e.preventDefault(); // Prevent the default context menu
        setContextMenuPosition({ x: e.clientX, y: e.clientY });
        setCurrentFileToDownload(folderName);  // Set current folder name for deletion
        setShowContextMenu(true); // Show the context menu
    };

    // Function to handle image click (for preview)
    const handleImageClick = (fileName) => {
        const token = localStorage.getItem('access_token');
        const imageUrl = `http://127.0.0.1:5000/preview?path=${currentPath ? `${currentPath}/` : ''}${fileName}`;

        axios.get(imageUrl, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            responseType: 'blob',
        })
            .then((response) => {
                const imageBlob = response.data;
                const imageObjectURL = URL.createObjectURL(imageBlob);
                setPreviewImage(imageObjectURL); // Set the image URL for preview
            })
            .catch((error) => {
                alert('Error previewing image: ' + error.response?.data?.error || 'Unknown error');
            });
    };


    const toggleZoomAndPan = (e) => {
        const imageElement = e.target;

        // Toggle Zoom
        if (!imageElement.classList.contains('zoomed-in')) {
            imageElement.classList.add('zoomed-in');
            imageElement.style.transform = 'scale(2) translate(0px, 0px)'; // Reset translation
            return;
        }

        // Zoomed-In State
        if (imageElement.classList.contains('zoomed-in')) {
            imageElement.classList.remove('zoomed-in');
            imageElement.style.transform = ''; // Reset zoom and translation
        }
    };

    const enablePan = (imageElement) => {
        let isDragging = false;
        let startX = 0;
        let startY = 0;
        let translateX = 0;
        let translateY = 0;

        const onMouseDown = (e) => {
            if (!imageElement.classList.contains('zoomed-in')) return;

            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            imageElement.classList.add('dragging');
        };

        const onMouseMove = (e) => {
            if (!isDragging) return;

            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;

            // Update translations
            translateX += deltaX;
            translateY += deltaY;

            // Apply translation to the image
            imageElement.style.transform = `scale(2) translate(${translateX}px, ${translateY}px)`;

            // Update start positions for smooth panning
            startX = e.clientX;
            startY = e.clientY;
        };

        const onMouseUp = () => {
            isDragging = false;
            imageElement.classList.remove('dragging');
        };

        // Attach event listeners
        imageElement.addEventListener('mousedown', onMouseDown);
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);

        // Clean up event listeners on unmount (if needed)
        return () => {
            imageElement.removeEventListener('mousedown', onMouseDown);
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
    };

    // Attach the pan functionality to the image on render
    const handleImageLoad = (imageElement) => {
        enablePan(imageElement);
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
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                        />
                        <button
                            className="upload-button"
                            onClick={() => document.getElementById('fileInput').click()}
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
                    <div
                        key={index}
                        className="grid-item folder-item"
                        onClick={() => handleFolderClick(folder)}
                        onContextMenu={(e) => handleRightClickFolder(e, folder)}
                    >
                        {/* Folder Icon (SVG) */}
                        <svg
                            className="folder-icon"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#fff"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M10 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-6l-2-2h-4a2 2 0 0 0-2 2z" />
                        </svg>
                        <h4>{folder}</h4>
                    </div>
                ))}

                {files.map((file, index) => {
                    const isImage = file.match(/\.(jpeg|jpg|png|gif)$/i);
                    const previewUrl = filePreviews[file]; // Fetch preview URL for the image

                    return (
                        <div
                            key={index}
                            className="grid-item file-item"
                            onContextMenu={(e) => handleRightClick(e, file)}
                            onClick={() => isImage && handleImageClick(file)}
                        >
                            {isImage ? (
                                <img
                                    src={previewUrl || 'placeholder-image-url'}
                                    alt={file}
                                    className="file-preview"
                                />
                            ) : (
                                <img
                                    src="path/to/file-placeholder.png"
                                    alt="File"
                                    className="file-placeholder"
                                />
                            )}
                            <h4>{file.length > 15 ? file.slice(0, 15) + '...' : file}</h4> {/* Truncate the file name */}
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
                            src={previewImage}
                            alt="Preview"
                            onClick={toggleZoomAndPan} // Toggle zoom and enable pan
                            onLoad={(e) => handleImageLoad(e.target)} // Attach pan functionality
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
                    <button onClick={handleDelete}>Delete</button> {/* Delete option for folders */}
                </div>
            )}

        </div>
    );
}

export default Dashboard;
