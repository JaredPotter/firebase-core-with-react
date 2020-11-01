import React from 'react';
import FirebaseAuthService from './FirebaseAuthService';

function App() {
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
        <div className="App">
            {user ? (
                <>
                    <h3>Welcome, {user.email}</h3>
                    <button onClick={handleLogout}>Logout</button>
                </>
            ) : (
                <>
                    <form onSubmit={handleSubmit}>
                        <label>
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
                        <button type="submit">Login</button>
                    </form>
                    <button onClick={handleSendPasswordResetEmail}>
                        Send Password Reset Email
                    </button>
                    <button onClick={handleLoginWithGoogle}>
                        Login with Google
                    </button>
                </>
            )}

            <h1>My first firebase app!</h1>
        </div>
    );
}

export default App;
