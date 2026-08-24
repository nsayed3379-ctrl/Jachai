let loadPromise: Promise<typeof google> | null = null;

/**
 * Loads the Google Maps JS API (places-free — just core Maps + Geocoding)
 * exactly once, however many map pickers end up on the page. Later callers
 * just get the same in-flight/resolved promise back.
 */
export function loadGoogleMaps(): Promise<typeof google> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps can only load in the browser"));
  }
  if (window.google?.maps?.Map) {
    return Promise.resolve(window.google);
  }
  if (loadPromise) {
    return loadPromise;
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return Promise.reject(new Error("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set"));
  }

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    // No `loading=async` query param on purpose: that flag switches Google's
    // bootstrap to the newer importLibrary()-based lazy loading, where
    // google.maps.Map isn't a constructor yet the instant the script's own
    // onload fires — exactly the failure mode we want to avoid here. Plain
    // loading gives the classic, immediately-usable google.maps.* classes.
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.onload = () => {
      if (window.google?.maps?.Map) resolve(window.google);
      else reject(new Error("Google Maps failed to initialize"));
    };
    script.onerror = () => reject(new Error("Failed to load the Google Maps script"));
    document.head.appendChild(script);
  });

  return loadPromise;
}

declare global {
  interface Window {
    google?: typeof google;
  }
}
