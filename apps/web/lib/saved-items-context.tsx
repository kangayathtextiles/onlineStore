"use client";

import * as React from "react";
import type { PublicProductSummary } from "@/types/api";

interface SavedItemsContextValue {
  savedItems: PublicProductSummary[];
  savedCount: number;
  isSaved: (productId: string) => boolean;
  toggleSave: (product: PublicProductSummary) => void;
  removeSaved: (productId: string) => void;
  clearSaved: () => void;
}

const SavedItemsContext = React.createContext<SavedItemsContextValue | null>(null);

const STORAGE_KEY = "kangayath_saved_products_v1";

export function SavedItemsProvider({ children }: { children: React.ReactNode }) {
  const [savedItems, setSavedItems] = React.useState<PublicProductSummary[]>([]);
  const [isHydrated, setIsHydrated] = React.useState(false);

  // Load from localStorage on client mount
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSavedItems(JSON.parse(stored));
      }
    } catch {
      // Ignored
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Save to localStorage on change
  React.useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedItems));
    } catch {
      // Ignored
    }
  }, [savedItems, isHydrated]);

  const isSaved = React.useCallback(
    (productId: string) => {
      return savedItems.some((item) => item.id === productId);
    },
    [savedItems]
  );

  const toggleSave = React.useCallback((product: PublicProductSummary) => {
    setSavedItems((prev) => {
      const exists = prev.some((item) => item.id === product.id);
      if (exists) {
        return prev.filter((item) => item.id !== product.id);
      } else {
        return [product, ...prev];
      }
    });
  }, []);

  const removeSaved = React.useCallback((productId: string) => {
    setSavedItems((prev) => prev.filter((item) => item.id !== productId));
  }, []);

  const clearSaved = React.useCallback(() => {
    setSavedItems([]);
  }, []);

  return (
    <SavedItemsContext.Provider
      value={{
        savedItems,
        savedCount: savedItems.length,
        isSaved,
        toggleSave,
        removeSaved,
        clearSaved,
      }}
    >
      {children}
    </SavedItemsContext.Provider>
  );
}

export function useSavedItems() {
  const context = React.useContext(SavedItemsContext);
  if (!context) {
    throw new Error("useSavedItems must be used within a SavedItemsProvider");
  }
  return context;
}
