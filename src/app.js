import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './views/login';
import Dashboard from './views/dashboard';

function App() {
    const token = localStorage.getItem('access_token');  // Check if the token exists

    return (
        <Router>
            <Routes>
                <Route path="/" element={<Login />} />

                <Route path="/login" element={<Login />} />
                <Route path="/dashboard" element={token ? <Dashboard /> : <Navigate to="/login" />} />
            </Routes>
        </Router>
    );
}

export default App;
