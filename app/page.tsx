"use client";

import { useEffect, useState } from "react";
import HomePage from "./components/HomePage";
import LoadingScreen from "./components/LoadingScreen";

export default function Page() {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const hasLoaded = sessionStorage.getItem("homepage-loaded");

    if (!hasLoaded) {
      setLoading(true);

      const timer = setTimeout(() => {
        setLoading(false);
        sessionStorage.setItem("homepage-loaded", "true");
      }, 5200);

      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <>
      {loading ? (
        <LoadingScreen onFinish={() => setLoading(false)} />
      ) : (
        <HomePage />
      )}
    </>
  );
}