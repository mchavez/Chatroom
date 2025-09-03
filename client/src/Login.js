import { useState } from "react";
import Register from "./Register";

export default function Login({ onLogin }) {
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          "credentials": 'include',
        },
        credentials: 'include',
        body: JSON.stringify(credentials),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error("Error: " + msg || "Login failed");
      }

      const data = await res.json();
      setShowRegister(false);
      onLogin({ username: credentials.username, token: data.token });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading protected data...</div>;
  if (showRegister) return <Register onRegister={setCredentials} />;   // show register page

  return (
    <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
      }}
    >
      <div style={{ height: 120, 
        padding: 100,
        width: "fit-content", 
        background: "#fdfcf7", 
        border: "1px solid #ccc"
         }}>
        <h2>Login/Sign in</h2>
        <input 
          name="username" 
          placeholder="Username" 
          value={credentials.username} 
          onChange={handleChange} 
        />
        <input 
          name="password" 
          placeholder="Password" 
          type="password" 
          value={credentials.password} 
          onChange={handleChange} 
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button onClick={handleLogin}>Login</button>
        <div>
          <p className="text-center mt-4">Don’t have an account yet?{" "}
            <button
              onClick={() => setShowRegister(true)}
              className="text-blue-600 hover:underline"
              type="button"
            >sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
