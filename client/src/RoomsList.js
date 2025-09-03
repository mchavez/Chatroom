import { useEffect, useState } from "react";

export default function RoomsList({ onSelectRoom }) {
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        // const response = await fetch("http://localhost:8080/rooms");
        const response = await fetch("/api/rooms");
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        const sortedRooms = data.sort((a, b) => a.localeCompare(b));
        setRooms(sortedRooms);
      } catch (error) {
        console.error("Failed to fetch rooms:", error);
      }
    };

    fetchRooms();
    const interval = setInterval(fetchRooms, 5000);
    return () => clearInterval(interval);
  }, []);

  const MyLink = ({ url, children }) => (
    <a href={url} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );

  return (
    <div className="p-4 border rounded-lg bg-gray-100">
      <h3 className="text-lg font-semibold mb-2">Active Rooms</h3>
      {rooms.length === 0 ? (
        <li>No rooms active yet</li>
      ) : (
        <ul className="space-y-2">
          {rooms.map((room) => (
            <li key={room}>
              <p>{room}</p>
            </li>
          ))}
        </ul>
      )}
      {rooms.length > 0 && <MyLink url="http://localhost:3000/">Open New Chat</MyLink>}
    </div>
  );
}
