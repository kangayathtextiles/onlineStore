import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ImageUploader } from "@/components/ui/image-uploader";

// Mock URL.createObjectURL and revokeObjectURL
beforeEach(() => {
  global.URL.createObjectURL = vi.fn(() => "blob:http://localhost:3000/mock-image-blob");
  global.URL.revokeObjectURL = vi.fn();
});

describe("ImageUploader UI Component", () => {
  it("renders empty dropzone with device gallery prompt", () => {
    const handleFileSelect = vi.fn();
    render(<ImageUploader file={null} onFileSelect={handleFileSelect} />);

    expect(screen.getByText(/Device Gallery/i)).toBeInTheDocument();
    expect(screen.getByText(/Supports JPG, PNG, WebP up to 10 MB/i)).toBeInTheDocument();
  });

  it("selects a valid file and triggers onFileSelect", async () => {
    const handleFileSelect = vi.fn();
    render(<ImageUploader file={null} onFileSelect={handleFileSelect} />);

    const fileInput = screen.getByLabelText(/Upload garment photo from device gallery/i);
    const validFile = new File(["dummy-content"], "garment-photo.png", { type: "image/png" });

    fireEvent.change(fileInput, { target: { files: [validFile] } });

    expect(handleFileSelect).toHaveBeenCalledWith(validFile);
  });

  it("shows error for invalid file type", async () => {
    const handleFileSelect = vi.fn();
    render(<ImageUploader file={null} onFileSelect={handleFileSelect} />);

    const fileInput = screen.getByLabelText(/Upload garment photo from device gallery/i);
    const invalidFile = new File(["dummy-content"], "script.exe", { type: "application/x-msdownload" });

    fireEvent.change(fileInput, { target: { files: [invalidFile] } });

    expect(handleFileSelect).not.toHaveBeenCalled();
    expect(
      screen.getByText(/Please select a valid image file \(JPG, PNG, or WebP\)/i)
    ).toBeInTheDocument();
  });

  it("shows error for oversized file (>10MB)", async () => {
    const handleFileSelect = vi.fn();
    render(<ImageUploader file={null} onFileSelect={handleFileSelect} maxSizeMB={10} />);

    const fileInput = screen.getByLabelText(/Upload garment photo from device gallery/i);
    // Create an 11MB file
    const oversizedFile = new File([new ArrayBuffer(11 * 1024 * 1024)], "heavy-image.jpg", {
      type: "image/jpeg",
    });

    fireEvent.change(fileInput, { target: { files: [oversizedFile] } });

    expect(handleFileSelect).not.toHaveBeenCalled();
    expect(screen.getByText(/File is too large/i)).toBeInTheDocument();
  });

  it("displays preview and details when file is selected", () => {
    const handleFileSelect = vi.fn();
    const activeFile = new File(["sample"], "festive-kurta.webp", { type: "image/webp" });

    render(<ImageUploader file={activeFile} onFileSelect={handleFileSelect} />);

    expect(screen.getByText("festive-kurta.webp")).toBeInTheDocument();
    expect(screen.getByText(/6 B • WEBP/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Remove/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Change Photo/i })).toBeInTheDocument();
  });

  it("clears file when Remove is clicked", () => {
    const handleFileSelect = vi.fn();
    const activeFile = new File(["sample"], "festive-kurta.webp", { type: "image/webp" });

    render(<ImageUploader file={activeFile} onFileSelect={handleFileSelect} />);

    const removeBtn = screen.getByRole("button", { name: /Remove/i });
    fireEvent.click(removeBtn);

    expect(handleFileSelect).toHaveBeenCalledWith(null);
  });
});
