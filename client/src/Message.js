export default function Message({ msg, idx }) {
  return (
    <div key={idx} style={{ color: msg.User === "Bot" ? "green" : "black" }}>
      [{new Date(msg.Timestamp).toLocaleTimeString()}] {msg.User}: {msg.Text}
    </div>
  );
}
