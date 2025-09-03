// User messages render with black text.
// Bot messages render with green text.
// Timestamp is shown in local format.

import { render, screen } from "@testing-library/react";
import Message from "../Message";

describe("Message component", () => {
  const baseMsg = {
    User: "Alice",
    Text: "Hello world",
    Timestamp: new Date("2023-01-01T12:00:00Z").toISOString(),
  };

  test("renders user message with black color", () => {
    render(<Message msg={baseMsg} idx={0} />);

    const element = screen.getByText(/\[.*\] Alice: Hello world/);
    expect(element).toBeInTheDocument();
    expect(element).toHaveStyle("color: black");
  });

  test("renders bot message with green color", () => {
    const botMsg = { ...baseMsg, User: "Bot", Text: "Stock quote: $100" };
    render(<Message msg={botMsg} idx={1} />);

    const element = screen.getByText(/\[.*\] Bot: Stock quote: \$100/);
    expect(element).toBeInTheDocument();
    expect(element).toHaveStyle("color: green");
  });

  test("renders timestamp in local time format", () => {
    render(<Message msg={baseMsg} idx={2} />);
    const timestampRegex = /\[\d{1,2}:\d{2}(:\d{2})?\s?(AM|PM)?\]/; // covers locales
    expect(screen.getByText(timestampRegex)).toBeInTheDocument();
  });
});
