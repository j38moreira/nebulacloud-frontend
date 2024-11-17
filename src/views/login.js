import '../styles/login.css';
import {useState} from 'react';
import axios from 'axios';

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [loading, setLoading] = useState(false); // Initially set to false

    const handleLogin = async (e) => {
        e.preventDefault(); // Prevent default form submission
        setLoading(true);
        setErrorMessage('');

        try {
            const response = await axios.post('http://127.0.0.1:5000/login', {
                username, // Send as an object
                password,
            });

            if (response.status === 200) {
                console.log('Login successful:', response.data);

                if ('state' in response.data) {
                    if (response.data.state === 'success') {
                        if ('access_token' in response.data) {

                        }
                    }
                }

                // Handle success (e.g., redirect or store authentication token)
            } else {
                setErrorMessage('Invalid username or password.');
            }
        } catch (error) {
            console.error('Error occurred:', error);
            setErrorMessage(error.response?.data?.message || 'Something went wrong.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <h2 className="formal-font">Nebula Cloud</h2>
            <form onSubmit={handleLogin}>
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
