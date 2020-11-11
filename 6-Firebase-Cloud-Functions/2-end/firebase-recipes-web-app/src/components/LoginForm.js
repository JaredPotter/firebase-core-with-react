import React from 'react';
import FirebaseAuthService from '../FirebaseAuthService';

function LoginForm() {
    const [username, setUsername] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [user, setUser] = React.useState(null);

    async function handleSubmit(event) {
        event.preventDefault();

        try {
            const authResponse = await FirebaseAuthService.loginUser(
                username,
                password
            );

            setUser(authResponse.user);
        } catch (error) {
            alert(error.message);
            throw error;
        }

        setUsername('');
        setPassword('');
    }

    function handleLogout() {
        FirebaseAuthService.logoutUser();
        setUser(null);
    }

    function handleSendPasswordResetEmail() {
        FirebaseAuthService.sendResetPassword(username);
        alert('Reset Email Sent');
    }

    async function handleLoginWithGoogle() {
        try {
            const loginResult = await FirebaseAuthService.loginWithGoogle();

            const user = loginResult.user;

            setUser(user);
        } catch (error) {
            alert(error.message);
            throw error;
        }
    }

    return (
        <div className="login-form-container">
            {user ? (
                <div className="row">
                    <h3>Welcome, {user.email}</h3>
                    <button onClick={handleLogout}>Logout</button>
                </div>
            ) : (
                <>
                    <form onSubmit={handleSubmit} className="login-form">
                        <label className="field">
                            Username (email):
                            <input
                                type="email"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </label>
                        <label>
                            Password:
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </label>
                        <button type="submit" className="button">
                            Login
                        </button>
                        <button
                            type="button"
                            className="button"
                            onClick={handleSendPasswordResetEmail}
                        >
                            Send Password Reset Email
                        </button>
                        <button
                            type="button"
                            className="button"
                            onClick={handleLoginWithGoogle}
                        >
                            Login with Google
                        </button>
                    </form>
                </>
            )}
        </div>
    );
}

export default LoginForm;
