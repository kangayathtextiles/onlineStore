"use client";

import * as React from "react";
import { UploadCloud, Image as ImageIcon, X, AlertCircle } from "lucide-react";
import { Button } from "./button";

export interface ImageUploaderProps {
  file: File | null;
  onFileSelect: (file: File | null) => void;
  maxSizeMB?: number;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export function ImageUploader({
  file,
  onFileSelect,
  maxSizeMB = 10,
  error: customError,
  disabled = false,
  className = "",
}: ImageUploaderProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [validationError, setValidationError] = React.useState<string | null>(null);

  // Generate local preview URL when file changes
  React.useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  const validateAndSelectFile = (selectedFile: File) => {
    setValidationError(null);

    // Validate MIME type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg", "image/gif"];
    if (!validTypes.includes(selectedFile.type.toLowerCase())) {
      setValidationError("Please select a valid image file (JPG, PNG, or WebP).");
      return;
    }

    // Validate size limit
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (selectedFile.size > maxBytes) {
      setValidationError(
        `File is too large (${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed size is ${maxSizeMB} MB.`
      );
      return;
    }

    onFileSelect(selectedFile);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      validateAndSelectFile(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      validateAndSelectFile(files[0]);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileSelect(null);
    setValidationError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const activeError = customError || validationError;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Hidden native file input with camera/gallery support */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/jpg,image/gif"
        className="hidden"
        onChange={handleInputChange}
        disabled={disabled}
        aria-label="Upload garment photo from device gallery"
      />

      {file && previewUrl ? (
        /* Selected Image Preview State */
        <div className="relative border border-zinc-200 rounded-xl bg-zinc-50 p-3 overflow-hidden transition-all group shadow-xs">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative w-24 aspect-[4/5] sm:w-28 rounded-lg overflow-hidden bg-white border border-zinc-200 flex-shrink-0">
              <img
                src={previewUrl}
                alt="Selected preview"
                className="w-full h-full object-cover object-center"
              />
            </div>

            <div className="flex-1 min-w-0 text-center sm:text-left space-y-1">
              <p className="text-sm font-semibold text-zinc-900 truncate" title={file.name}>
                {file.name}
              </p>
              <p className="text-xs text-zinc-500 font-mono">
                {formatFileSize(file.size)} • {file.type.split("/")[1]?.toUpperCase() || "IMAGE"}
              </p>
              <div className="pt-2 flex items-center justify-center sm:justify-start gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled}
                  className="text-xs"
                >
                  Change Photo
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={handleRemove}
                  disabled={disabled}
                  className="text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Empty / Dropzone State */
        <div
          onClick={() => !disabled && fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            isDragging
              ? "border-burgundy bg-rose-50/50 scale-[1.01]"
              : activeError
              ? "border-rose-500/50 bg-rose-50 hover:border-rose-500"
              : "border-zinc-300 bg-zinc-50/60 hover:border-burgundy/50 hover:bg-zinc-100/50"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-zinc-500 group-hover:text-zinc-800 transition-colors shadow-xs">
              {isDragging ? (
                <UploadCloud className="w-6 h-6 text-burgundy animate-bounce" />
              ) : (
                <ImageIcon className="w-6 h-6 text-zinc-500" />
              )}
            </div>

            <div className="space-y-1">
              <p className="text-sm font-semibold text-zinc-800">
                {isDragging ? (
                  <span className="text-burgundy">Drop image here...</span>
                ) : (
                  <span>
                    Click to browse <span className="text-burgundy font-bold">Device Gallery</span> or drag photo here
                  </span>
                )}
              </p>
              <p className="text-xs text-zinc-500">
                Supports JPG, PNG, WebP up to {maxSizeMB} MB
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Validation Error Message */}
      {activeError && (
        <div className="flex items-center gap-1.5 text-xs text-rose-600 pt-1">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{activeError}</span>
        </div>
      )}
    </div>
  );
}
