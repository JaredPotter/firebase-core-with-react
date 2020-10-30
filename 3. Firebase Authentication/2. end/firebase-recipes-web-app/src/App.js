import React from 'react';

function App() {
    const [username, setUsername] = React.useState('');
    const [password, setPassword] = React.useState('');

    function handleSubmit(event) {
        event.preventDefault();

        console.log(username);
        console.log(password);
    }

    return (
        <div className="App">
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
            <h1>My first firebase app!</h1>
        </div>
    );
}

export default App;
