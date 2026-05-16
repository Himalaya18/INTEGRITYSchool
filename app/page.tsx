"use client";

import { useEffect, useState } from "react";
import HomePage from "./components/HomePage";
import LoadingScreen from "./components/LoadingScreen";

export default function Page() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 5200);

    return () => clearTimeout(timer);
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