import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/dashboard.css';

function Dashboard() {
    const [folders, setFolders] = useState([]);
    const [files, setFiles] = useState([]);
    const [errorMessage, setErrorMessage] = useState('');
    const [currentPath, setCurrentPath] = useState('');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
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

    const fetchContents = async (token, path) => {
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
        }
    };

    const handleFolderClick = (folderName) => {
        const newPath = `${currentPath ? currentPath + '/' : ''}${folderName}`;
        setCurrentPath(newPath);
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
                    // Re-fetch the folder contents to show the new file
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

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    return (
        <div className="dashboard-container">
            <div className="dashboard-banner">
                <h1>My Drive</h1>
                <span className="hamburger-icon" onClick={toggleMenu}>☰</span>
                <div className={`menu ${isMenuOpen ? 'hamburger-menu' : ''}`}>
                    <button className="menu-button" onClick={handleFileUpload}>Upload</button>
                    <button className="menu-button">Create Folder</button>
                    <button className="menu-button">Logout</button>
                </div>
            </div>

            {errorMessage && <p className="error-message">{errorMessage}</p>}

            <div className="content-container">
                {folders.map((folder, index) => (
                    <div key={index} className="grid-item" onClick={() => handleFolderClick(folder)}>
                        <div className="grid-item-icon">📁</div>
                        <h4>{folder}</h4>
                    </div>
                ))}

                {files.map((file, index) => (
                    <div key={index} className="grid-item">
                        <div className="grid-item-icon">📄</div>
                        <h4>{file}</h4>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Dashboard;
