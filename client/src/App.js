import React, { useState } from "react";
import Login from "./Login";
import Chat from "./Chat";
import RoomsList from "./RoomsList";
// import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Register from "./Register";

function App() {
  const [credentials, setCredentials] = useState({ username: "", token: "" });
  const [room, setRoom] = useState("general");
  const [joined, setJoined] = useState(false);
  const [page, setPage] = useState("login"); // "login" | "register" | "chat"

  const joinChat = () => {
    if (credentials.username.trim() && room.trim()) {
      setJoined(true);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
  };

  const renderLoginOrRegister = () => {
    return page === "login" ? (
      <Login onLogin={setCredentials} onSwitch={() => setPage("register")} />
    ) : (
      <Register onRegister={setCredentials} onSwitch={() => setPage("login")} />
    );
  };

  const renderChatInput = () => (
    <div style={{ height: 120, overflowY: "scroll", background: "#fdfcf7", border: "1px solid #ccc", padding: 10 }}>
      <h2 className="text-lg font-semibold mb-2">Chat Rooms</h2>
      <input 
        name="username" 
        placeholder="Enter username" 
        value={credentials.username} 
        onChange={handleChange} 
        onKeyPress={e => e.key === "Enter" && joinChat()} 
      />
      <input 
        placeholder="Room name" 
        value={room} 
        onChange={e => setRoom(e.target.value)} 
      />
      <button onClick={joinChat}>Join Chat</button>
    </div>
  );

  return (
    <div style={{ paddingLeft: "10%",  paddingRight: "5%" }}>
      {!credentials.username && !credentials.token ? renderLoginOrRegister() : (
        <>
          {!joined ? renderChatInput() : 
          <Chat username={credentials.username} token={credentials.token} room={room} />}
          <div className="mt-6">
            <RoomsList onSelectRoom={setRoom} />
          </div>
        </>
      )}
    </div>
  );
}

export default App;
