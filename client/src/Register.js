import React, { useState } from "react";
import Login from "./Login";

export default function Register({ onRegister }) {
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [showLogin, setShowLogin] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Registration failed");
      }

      const data = await res.json();
      setShowLogin(true);
      onRegister({ username: credentials.username, token: data.token });
      handleLogin();
    } catch (err) {
      setError(err.message);
    } 
  };

  const handleLogin = () => {
    window.location.href = 'http://localhost:3000';
  };

  if (showLogin) return <Login onLogin={setCredentials} />;

  return (
    <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
      }}
    >
      <div style={{ height: 120, width: "fit-content", background: "#fafbf2", border: "1px solid #ccc", padding: 100 }}>
        <h2 className="text-2xl font-bold mb-6 text-center">Register/Add User</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={credentials.username}
            onChange={handleChange}
            className="w-full border rounded-md p-2"
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={credentials.password}
            onChange={handleChange}
            className="w-full border rounded-md p-2"
            required
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700"
          >
            Register
          </button>
          <div>
            <p className="text-center mt-4"> Already have an account?{" "}
              <button
                onClick={handleLogin}
                className="text-blue-600 hover:underline"
                type="button"
              >log in
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
