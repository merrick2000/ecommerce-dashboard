"use client";

import { useEffect } from "react";
import { initNoTrack } from "@/lib/notrack";

export function NoTrackInit() {
  useEffect(() => {
    initNoTrack();
  }, []);

  return null;
}
