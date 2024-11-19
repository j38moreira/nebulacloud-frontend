import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
    const [folders, setFolders] = useState([]);
    const [files, setFiles] = useState([]);
    const [errorMessage, setErrorMessage] = useState('');
    const [currentPath, setCurrentPath] = useState(''); // Start with an empty path
    const navigate = useNavigate();

    // Fetch folders and files when component mounts or currentPath changes
    useEffect(() => {
        console.log('Current Path:', currentPath); // Debugging line
        const token = localStorage.getItem('access_token');
        if (!token) {
            navigate('/login');
        } else {
            fetchContents(token, currentPath);  // Fetch contents at the current path
        }
    }, [navigate, currentPath]);  // Only run when currentPath changes

    const fetchContents = async (token, path) => {
        console.log('Fetching contents for path:', path);  // Log the current path to ensure it's correct
        try {
            const response = await axios.get('http://127.0.0.1:5000/list', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                params: {
                    path: path,  // Send the current path as a query parameter
                },
            });

            if (response.status === 200) {
                console.log('Fetched contents:', response.data); // Log the fetched data to debug
                // Check if the response has folders and files
                if (response.data.folders && response.data.files) {
                    setFolders(response.data.folders);  // Update the folders state
                    setFiles(response.data.files);  // Update the files state
                    setErrorMessage(''); // Clear any previous error messages
                } else {
                    setErrorMessage('No folders or files found in this folder.');
                }
            } else {
                setErrorMessage('Failed to fetch contents. Please try again later.');
            }
        } catch (error) {
            console.error('Error fetching contents:', error);
            setErrorMessage('Error occurred while fetching contents.');
        }
    };

    const handleFolderClick = (folderName) => {
        const newPath = `${currentPath ? currentPath + '/' : ''}${folderName}`;  // Append folder name to the current path
        console.log('Folder clicked, new path:', newPath); // Debugging line
        setCurrentPath(newPath);  // Update the path to the clicked folder
    };


    return (
        <div className="dashboard-container">
            {errorMessage && <p className="error-message">{errorMessage}</p>}

            {/* Container for Folders and Files */}
            <div className="content-container">
                {/* Folders and Files in a horizontal row */}
                <div className="folders-files-row">
                    {/* Folders Section */}
                    <div className="folders-section">
                        <div className="folder-list">
                            {folders.length > 0 ? (
                                folders.map((folder, index) => (
                                    <div
                                        key={index}
                                        className="folder-item"
                                        onClick={() => handleFolderClick(folder)}  // Handle click to navigate
                                    >
                                        <span role="img" aria-label="folder">📁</span>  {/* Display folder emoji */}
                                        <h4>{folder}</h4>  {/* Display each folder name */}
                                    </div>
                                ))
                            ) : (
                                <p>No folders found.</p>
                            )}
                        </div>
                    </div>

                    {/* Files Section */}
                    <div className="files-section">
                        <div className="file-list">
                            {files.length > 0 ? (
                                files.map((file, index) => (
                                    <div key={index} className="file-item">
                                        <h4>{file}</h4>  {/* Display each file name */}
                                    </div>
                                ))
                            ) : (
                                <p>No files found.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
