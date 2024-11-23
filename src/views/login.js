import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // Add this for navigation

import '../assets/css/login/animations.css';
import '../assets/css/login/layout.css';
import '../assets/css/login/login-dark.css';

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [loading, setLoading] = useState(false); // Initially set to false
    const navigate = useNavigate(); // For navigation after login success

    const handleLogin = async (e) => {
        e.preventDefault(); // Prevent default form submission
        setLoading(true);
        setErrorMessage('');

        try {
            // Send login request to the backend
            const response = await axios.post('http://127.0.0.1:5000/login', {
                username, // Send as an object
                password,
            });

            // Log the response to check the data structure
            console.log('Response:', response.data);

            if (response.status === 200) {
                console.log('Login successful:', response.data);

                // Check if response contains 'state' and if it's 'Success' (case-sensitive)
                if ('state' in response.data && response.data.state === 'Success') {
                    if ('access_token' in response.data) {
                        const { access_token } = response.data;

                        // Store the access token in localStorage (or sessionStorage)
                        localStorage.setItem('access_token', access_token);
                        localStorage.setItem('username', username);

                        // Redirect to dashboard
                        navigate('/dashboard');
                    } else {
                        setErrorMessage('Access token is missing.');
                    }
                } else {
                    setErrorMessage('Invalid username or password.');
                }
            } else {
                setErrorMessage('Invalid username or password.');
            }
        } catch (error) {
            console.error('Error occurred:', error);
            // Show a general error message in case of network or server issues
            setErrorMessage(error.response?.data?.message || 'Something went wrong.');
        } finally {
            setLoading(false); // Reset loading state after request
        }
    };


    return (
        <div className="login-container">
            <form onSubmit={handleLogin}>
                <h2 className="formal-font">Nebula Cloud</h2> {/* This heading is now above the inputs */}
                <div className="form-group">
                    <label className="formal-font" htmlFor="username">Username</label>
                    <input
                        type="text"
                        id="username"
                        placeholder="Enter your username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label className="formal-font" htmlFor="password">Password</label>
                    <input
                        type="password"
                        id="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                {errorMessage && <p className="error-message">{errorMessage}</p>}
                <button
                    type="submit"
                    className="login-button formal-font"
                    disabled={loading}
                >
                    {loading ? 'Logging in...' : 'Login'}
                </button>
            </form>
        </div>
    );
}

export default Login;
