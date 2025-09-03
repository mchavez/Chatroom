//  Default render shows login form
//  Input state updates correctly
//  Successful login triggers onLogin with username + token
//  Failed login displays error message
//  Loading state appears while waiting for fetch
//  Clicking sign up shows the Register component

import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import Login from "../Login";

// Mock Register component
jest.mock("../Register", () => ({ onRegister }) => (
  <div>
    <span>Register Component</span>
    <button onClick={() => onRegister({ username: "newUser", password: "pw" })}>
      Mock Register
    </button>
  </div>
));

// Mock fetch globally
beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.clearAllMocks();
});

describe("Login component", () => {
  test("renders login form by default", () => {
    render(<Login onLogin={jest.fn()} />);
    expect(screen.getByText("Login")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Username")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
  });

  test("updates username and password inputs", () => {
    render(<Login onLogin={jest.fn()} />);
    const userInput = screen.getByPlaceholderText("Username");
    const passInput = screen.getByPlaceholderText("Password");

    fireEvent.change(userInput, { target: { value: "Alice" } });
    fireEvent.change(passInput, { target: { value: "secret" } });

    expect(userInput.value).toBe("Alice");
    expect(passInput.value).toBe("secret");
  });

  test("successful login calls onLogin", async () => {
    const mockOnLogin = jest.fn();
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: "fake-token" }),
    });

    await act(async () => {
      render(<Login onLogin={mockOnLogin} />);
    });
        
    act(() => {
      fireEvent.change(screen.getByPlaceholderText("Username"), {
        target: { value: "Alice" },
      });
    });

    act(() => {
      fireEvent.change(screen.getByPlaceholderText("Password"), {
        target: { value: "pw" },
      });
    });

    act(() => {
      fireEvent.click(screen.getByText("Login"));
    });

    await waitFor(() =>
      expect(mockOnLogin).toHaveBeenCalledWith({
        username: "Alice",
        token: "fake-token",
      })
    );
  });

  test("failed login shows error message", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      text: async () => "Invalid credentials",
    });

    render(<Login onLogin={jest.fn()} />);

    fireEvent.change(screen.getByPlaceholderText("Username"), {
      target: { value: "Alice" },
    });

    fireEvent.change(screen.getByPlaceholderText("Password"), {
      target: { value: "wrong" },
    });

    fireEvent.click(screen.getByText("Login"));

    expect(await screen.findByText(/Invalid credentials/)).toBeInTheDocument();
  });

  test("can switch to register view", () => {
    render(<Login onLogin={jest.fn()} />);
    fireEvent.click(screen.getByText("sign up"));
    expect(screen.getByText("Register Component")).toBeInTheDocument();
  });
});
