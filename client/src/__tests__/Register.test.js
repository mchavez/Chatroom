// Renders form correctly
// Handles input changes
// On success → calls onRegister with username + token and redirects
// On failure → displays error message
// Log in button → redirects without calling API

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Register from "../Register";

// Mock Login component
jest.mock("../Login", () => ({ onLogin }) => (
  <div>
    <span>Login Component</span>
    <button onClick={() => onLogin({ username: "Alice", password: "pw" })}>
      Mock Login
    </button>
  </div>
));

beforeEach(() => {
  global.fetch = jest.fn();
  delete window.location;
  window.location = { href: "" }; // stub redirect
});

afterEach(() => {
  jest.clearAllMocks();
});

describe("Register component", () => {
  test("renders registration form", () => {
    render(<Register onRegister={jest.fn()} />);
    expect(screen.getByText(/Register\/Add User/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Username")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
  });

  test("updates username and password inputs", () => {
    render(<Register onRegister={jest.fn()} />);
    const userInput = screen.getByPlaceholderText("Username");
    const passInput = screen.getByPlaceholderText("Password");

    fireEvent.change(userInput, { target: { value: "Alice" } });
    fireEvent.change(passInput, { target: { value: "secret" } });

    expect(userInput.value).toBe("Alice");
    expect(passInput.value).toBe("secret");
  });

  test("successful registration calls onRegister and redirects", async () => {
    const mockOnRegister = jest.fn();
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: "fake-token" }),
    });

    render(<Register onRegister={mockOnRegister} />);

    fireEvent.change(screen.getByPlaceholderText("Username"), {
      target: { value: "Alice" },
    });
    fireEvent.change(screen.getByPlaceholderText("Password"), {
      target: { value: "pw" },
    });

    fireEvent.click(screen.getByText("Register"));

    await waitFor(() =>
      expect(mockOnRegister).toHaveBeenCalledWith({
        username: "Alice",
        token: "fake-token",
      })
    );

    expect(window.location.href).toBe("http://localhost:3000");
  });

  test("failed registration shows error", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      text: async () => "Username already exists",
    });

    render(<Register onRegister={jest.fn()} />);

    fireEvent.change(screen.getByPlaceholderText("Username"), {
      target: { value: "Alice" },
    });
    fireEvent.change(screen.getByPlaceholderText("Password"), {
      target: { value: "pw" },
    });

    fireEvent.click(screen.getByText("Register"));

    expect(await screen.findByText(/Username already exists/)).toBeInTheDocument();
  });

  test("clicking log in button redirects immediately", () => {
    render(<Register onRegister={jest.fn()} />);
    fireEvent.click(screen.getByText("log in"));
    expect(window.location.href).toBe("http://localhost:3000");
  });
});
