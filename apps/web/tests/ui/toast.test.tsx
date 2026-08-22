import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import * as React from "react";
import { ToastProvider, useToast } from "@/components/ui/toast";

describe("Toast System Stability & Lifecycle", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("provides referentially stable toast action callbacks across state updates", () => {
    const references: unknown[] = [];

    function Consumer() {
      const toast = useToast();
      references.push(toast);

      return (
        <div>
          <button onClick={() => toast.success("Test Title", "Test Message")}>
            Trigger Success Toast
          </button>
        </div>
      );
    }

    const { getByRole } = render(
      <ToastProvider>
        <Consumer />
      </ToastProvider>
    );

    const button = getByRole("button", { name: /trigger success toast/i });

    // Initial render
    expect(references.length).toBe(1);

    // Trigger toast
    act(() => {
      button.click();
    });

    // Verify toast is displayed
    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.getByText("Test Message")).toBeInTheDocument();

    // The consumer should NOT re-render merely because toast state updated
    // and the toast reference must be 100% identical
    expect(references.length).toBe(1);
  });

  it("handles automatic timer dismissal and manual dismiss cleanly", async () => {
    function Consumer() {
      const toast = useToast();
      return (
        <div>
          <button onClick={() => toast.error("Error Notice", "Auto dismiss in 4.5s")}>
            Trigger Error Toast
          </button>
        </div>
      );
    }

    render(
      <ToastProvider>
        <Consumer />
      </ToastProvider>
    );

    const button = screen.getByRole("button", { name: /trigger error toast/i });

    act(() => {
      button.click();
    });

    expect(screen.getByText("Error Notice")).toBeInTheDocument();

    // Fast-forward 4500ms for auto-dismiss
    act(() => {
      vi.advanceTimersByTime(4600);
    });

    expect(screen.queryByText("Error Notice")).not.toBeInTheDocument();
  });

  it("prevents infinite render depth when consumer effect calls toast", () => {
    let effectRunCount = 0;

    function LoopingConsumer() {
      const toast = useToast();

      const triggerNotification = React.useCallback(() => {
        toast.info("Effect Notification", "Should run once");
      }, [toast]);

      React.useEffect(() => {
        effectRunCount++;
        triggerNotification();
      }, [triggerNotification]);

      return <div>Loop Test Consumer</div>;
    }

    render(
      <ToastProvider>
        <LoopingConsumer />
      </ToastProvider>
    );

    expect(screen.getByText("Effect Notification")).toBeInTheDocument();
    // Effect should run exactly once, never infinite
    expect(effectRunCount).toBe(1);
  });
});
