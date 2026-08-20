import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import HomePage from "@/app/page";

describe("Frontend Foundation Smoke Test", () => {
  it("renders the foundation landing heading", () => {
    render(<HomePage />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("KANGAYATH WEB");
  });

  it("displays the Phase 01 status badge", () => {
    render(<HomePage />);
    expect(screen.getByText(/PHASE 01 — FOUNDATION ESTABLISHED/i)).toBeInTheDocument();
  });
});
