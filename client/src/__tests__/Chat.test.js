import { render, screen, fireEvent } from "@testing-library/react";
import Chat from "../Chat";

// Mock WebSocket
class WebSocketMock {
  constructor() {
    this.readyState = 1;
    this.send = jest.fn();
    this.close = jest.fn();
    this.onmessage = null;
  }
}

global.WebSocket = WebSocketMock;

test("renders chat input and send button", () => {
  render(<Chat username="Alice" room="general" />);
  
  expect(screen.getByPlaceholderText(/type message/i)).toBeInTheDocument();
  expect(screen.getByText(/send/i)).toBeInTheDocument();
});

