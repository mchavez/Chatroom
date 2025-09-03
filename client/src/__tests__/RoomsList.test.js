//  Shows “No rooms active yet” when API returns empty
//  Renders rooms sorted alphabetically
//  Shows error in console if fetch fails
//  Confirms repeated polling every 5s
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import RoomsList from "../RoomsList";

beforeEach(() => {
  jest.useFakeTimers();
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
  jest.clearAllMocks();
});

describe("RoomsList component", () => {
  test("renders fallback when no rooms are returned", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    await act(async () => {
      render(<RoomsList onSelectRoom={jest.fn()} />);
    });

    const fallbackItem = await screen.findByRole("listitem");
    expect(fallbackItem).toHaveTextContent("No rooms active yet");
  });

  test("renders sorted list of rooms", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ["zeta", "alpha", "beta"],
    });

    await act(async () => {
      render(<RoomsList onSelectRoom={jest.fn()} />);
    });

    const rooms = await screen.findAllByRole("listitem");
    const roomTexts = rooms.map((li) => li.textContent);

    expect(roomTexts).toEqual(["alpha", "beta", "zeta"]);
    expect(screen.getByText("Open New Chat")).toBeInTheDocument();
  });

  test("logs error if fetch fails", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => [],
    });

    await act(async () => {
      render(<RoomsList onSelectRoom={jest.fn()} />);
    });

    await waitFor(() =>
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to fetch rooms:",
        expect.any(Error)
      )
    );

    consoleSpy.mockRestore();
  });

  test("fetches rooms repeatedly using interval", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ["general"],
    });

    await act(async () => {
      render(<RoomsList onSelectRoom={jest.fn()} />);
    });

    expect(await screen.findByText("general")).toBeInTheDocument();

    await act(async () => {
      jest.advanceTimersByTime(5000);
    });
    
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));
  });
});
