import { useState } from 'react';
import FirebaseAuthService from '../FirebaseAuthService';

function LoginForm({ existingUser }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      await FirebaseAuthService.loginUser(username, password);

      setUsername('');
      setPassword('');
    } catch (error) {
      alert(error.message);
    }
  }

  function handleLogout() {
    FirebaseAuthService.logoutUser();
  }

  async function handleSendPasswordResetEmail() {
    if (!username) {
      alert('Missing username!');
      return;
    }

    try {
      await FirebaseAuthService.sendResetPassword(username);
      alert('Reset Email Sent');
    } catch (error) {
      alert(error.message);
    }
  }

  async function handleLoginWithGoogle() {
    try {
      await FirebaseAuthService.loginWithGoogle();
    } catch (error) {
      alert(error.message);
    }
  }

  return (
    <div className="login-form-container">
      {existingUser ? (
        <div className="row">
          <h3>Welcome, {existingUser.email}</h3>
          <button onClick={handleLogout} className="primary-button">
            Logout
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="login-form">
          <label className="input-label login-label">
            Username (email):
            <input
              type="email"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-text"
            />
          </label>
          <label className="input-label login-label">
            Password:
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-text"
            />
          </label>
          <div className="button-box">
            <button type="submit" className="primary-button">
              Login
            </button>
            <button
              type="button"
              className="primary-button"
              onClick={handleSendPasswordResetEmail}
            >
              Reset Email
            </button>
            {/* <button
              type="button"
              className="primary-button"
              onClick={handleLoginWithGoogle}
            >
              Login with Google
            </button> */}
          </div>
        </form>
      )}
    </div>
  );
}

export default LoginForm;
