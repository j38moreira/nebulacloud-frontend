import logo from '../img/logo.svg';
import '../styles/login.css';

function Login() {
    return (
        <div className="login-container">
            <h2 className="formal-font">Nebula Cloud</h2>
            <form>
                <div className="form-group">
                    <label className="formal-font" for="username">Username</label>
                    <input type="text" id="username" placeholder="Enter your username" required/>
                </div>
                <div className="form-group">
                    <label for="password">Password</label>
                    <input type="password" id="password" placeholder="Enter your password" required/>
                </div>
                <button type="submit" className="login-button formal-font">Login</button>
            </form>
        </div>

    );
}

export default Login;