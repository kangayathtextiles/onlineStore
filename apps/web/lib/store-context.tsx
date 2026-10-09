"use client";

import * as React from "react";
import useSWR from "swr";
import { publicApi } from "@/lib/api";
import type { StoreStatusResponse, StoreProfile } from "@/types/api";

interface StoreContextValue {
  status: StoreStatusResponse | null;
  profile: StoreProfile | null;
  isStatusLoading: boolean;
  isProfileLoading: boolean;
  statusError: Error | null;
  profileError: Error | null;
  refreshStatus: () => Promise<StoreStatusResponse | undefined>;
  refreshProfile: () => Promise<StoreProfile | undefined>;
}

const StoreContext = React.createContext<StoreContextValue | null>(null);

const SWR_STATUS_KEY = "public-store-status";
const SWR_PROFILE_KEY = "public-store-profile";

function useStoreStatusDirect() {
  const { data, error, isLoading, mutate } = useSWR<StoreStatusResponse>(
    SWR_STATUS_KEY,
    () => publicApi.store.getStatus(),
    {
      revalidateOnFocus: true,
      dedupingInterval: 30000,
      refreshInterval: 60000,
      keepPreviousData: true,
    }
  );

  return {
    status: data ?? null,
    isLoading: isLoading && !data,
    error: error ? (error as Error) : null,
    refreshStatus: mutate,
  };
}

function useStoreProfileDirect() {
  const { data, error, isLoading, mutate } = useSWR<StoreProfile>(
    SWR_PROFILE_KEY,
    () => publicApi.store.getProfile(),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
      keepPreviousData: true,
    }
  );

  return {
    profile: data ?? null,
    isLoading: isLoading && !data,
    error: error ? (error as Error) : null,
    refreshProfile: mutate,
  };
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const statusData = useStoreStatusDirect();
  const profileData = useStoreProfileDirect();

  const value = React.useMemo<StoreContextValue>(
    () => ({
      status: statusData.status,
      profile: profileData.profile,
      isStatusLoading: statusData.isLoading,
      isProfileLoading: profileData.isLoading,
      statusError: statusData.error,
      profileError: profileData.error,
      refreshStatus: statusData.refreshStatus,
      refreshProfile: profileData.refreshProfile,
    }),
    [
      statusData.status,
      statusData.isLoading,
      statusData.error,
      statusData.refreshStatus,
      profileData.profile,
      profileData.isLoading,
      profileData.error,
      profileData.refreshProfile,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

/**
 * Unified store hook. If inside StoreProvider, uses the shared context.
 * If used outside StoreProvider (e.g. in isolated unit tests), falls back safely to direct SWR hooks.
 */
export function useStore() {
  const context = React.useContext(StoreContext);
  const statusDirect = useStoreStatusDirect();
  const profileDirect = useStoreProfileDirect();

  if (context) {
    return context;
  }

  return {
    status: statusDirect.status,
    profile: profileDirect.profile,
    isStatusLoading: statusDirect.isLoading,
    isProfileLoading: profileDirect.isLoading,
    statusError: statusDirect.error,
    profileError: profileDirect.error,
    refreshStatus: statusDirect.refreshStatus,
    refreshProfile: profileDirect.refreshProfile,
  };
}

export function useStoreStatus() {
  const store = useStore();
  return {
    status: store.status,
    isLoading: store.isStatusLoading,
    error: store.statusError,
    refreshStatus: store.refreshStatus,
  };
}

export function useStoreProfile() {
  const store = useStore();
  return {
    profile: store.profile,
    isLoading: store.isProfileLoading,
    error: store.profileError,
    refreshProfile: store.refreshProfile,
  };
}
