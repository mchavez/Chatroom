import React, { useState, useEffect, useRef } from "react";
import Message from "./Message";

export default function Chat({ username, token, room }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const wsRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:8080/ws?room=${room}&token=${token}`);
    wsRef.current = ws;

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      setMessages((prev) => [...prev, msg].slice(-50));
    };

    return () => ws.close();
  }, [room, token]);

  // useEffect(() => {
  //   chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  // }, [messages]);

  const sendMessage = () => {
    if (input.trim() && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(input);
      setInput("");
    }
  };

  return (
    <div>
      <div>
        <h3>Room: {room}</h3>
        <h4>User: {username}</h4>
      </div>
      <div style={{ height: 300, overflowY: "scroll", background: "#fdfcf7", border: "1px solid #ccc", padding: 10 }}>
        {messages
          .filter((msg) => msg.RoomName === room)
          .map((msg, idx) => (
            <Message key={idx} msg={msg} />
          ))}
        <div ref={chatEndRef} />
      </div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyPress={(e) => e.key === "Enter" && sendMessage()}
        placeholder="Type message..."
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}
