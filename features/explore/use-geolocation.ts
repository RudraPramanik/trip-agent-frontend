"use client";

import { useCallback, useState } from "react";

export type GeoOrigin = {
  lat: number;
  lng: number;
};

export type GeoLocationState =
  | { status: "idle" }
  | { status: "pending" }
  | { status: "granted"; origin: GeoOrigin }
  | { status: "denied" }
  | { status: "unavailable" };

export function useGeolocation() {
  const [state, setState] = useState<GeoLocationState>({ status: "idle" });

  const request = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setState({ status: "unavailable" });
      return;
    }

    setState({ status: "pending" });
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          status: "granted",
          origin: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
        });
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setState({ status: "denied" });
          return;
        }
        setState({ status: "unavailable" });
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 },
    );
  }, []);

  return { state, request };
}
