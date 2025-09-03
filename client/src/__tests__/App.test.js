import { render, screen, fireEvent } from "@testing-library/react";
import App from "../App";

// Mock child components
jest.mock("../Login", () => ({ onLogin, onSwitch }) => (
  <div>
    <span>Login Component</span>
    <button onClick={() => onLogin({ username: "Alice", token: "123" })}>
      Mock Login
    </button>
    <button onClick={onSwitch}>Go to Register</button>
  </div>
));

jest.mock("../Register", () => ({ onRegister, onSwitch }) => (
  <div>
    <span>Register Component</span>
    <button onClick={() => onRegister({ username: "Bob", token: "456" })}>
      Mock Register
    </button>
    <button onClick={onSwitch}>Go to Login</button>
  </div>
));

jest.mock("../Chat", () => ({ username, token, room }) => (
  <div>
    <span>Chat Component</span>
    <span>{`User: ${username}, Room: ${room}`}</span>
  </div>
));

jest.mock("../RoomsList", () => ({ onSelectRoom }) => (
  <div>
    <span>RoomsList Component</span>
    <button onClick={() => onSelectRoom("sports")}>Switch to Sports</button>
  </div>
));

describe("App component", () => {
  test("renders login by default", () => {
    render(<App />);
    expect(screen.getByText(/Login Component/)).toBeInTheDocument();
  });

  test("can switch from login to register", () => {
    render(<App />);
    fireEvent.click(screen.getByText("Go to Register"));
    expect(screen.getByText(/Register Component/)).toBeInTheDocument();
  });

  test("logs in and shows chat input before joining", () => {
    render(<App />);
    fireEvent.click(screen.getByText("Mock Login"));
    expect(screen.getByPlaceholderText("Enter username")).toBeInTheDocument();
    expect(screen.getByText("RoomsList Component")).toBeInTheDocument();
  });

  test("joins chat after entering username and clicking Join Chat", () => {
    render(<App />);
    fireEvent.click(screen.getByText("Mock Login"));

    fireEvent.change(screen.getByPlaceholderText("Enter username"), {
      target: { value: "Alice" },
    });

    fireEvent.click(screen.getByText("Join Chat"));

    expect(screen.getByText(/Chat Component/)).toBeInTheDocument();
    expect(screen.getByText(/User: Alice/)).toBeInTheDocument();
  });

  test("can switch room via RoomsList", () => {
    render(<App />);
    fireEvent.click(screen.getByText("Mock Login"));
    fireEvent.click(screen.getByText("Join Chat"));

    fireEvent.click(screen.getByText("Switch to Sports"));

    expect(screen.getByText(/Room: sports/)).toBeInTheDocument();
  });
});
