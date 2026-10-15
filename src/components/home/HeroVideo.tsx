"use client";

import { useEffect, useRef, useState } from "react";

type NavigatorWithMemory = Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };

function canPlayHeroVideo() {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  const nav = navigator as NavigatorWithMemory;
  if (nav.connection?.saveData) return false;
  if (nav.deviceMemory && nav.deviceMemory <= 2) return false;
  return true;
}

/**
 * Cinematic ride clip on top of the LCP poster. No WebGL tunnel — open motion that sells the day.
 * Poster stays painted until the video can play; reduced-motion / weak devices keep the photo.
 */
export function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!canPlayHeroVideo()) return;
    const video = videoRef.current;
    if (!video) return;

    const markReady = () => setReady(true);
    video.addEventListener("canplay", markReady, { once: true });
    video.addEventListener("loadeddata", markReady, { once: true });

    const play = () => {
      void video.play().then(markReady).catch(() => undefined);
    };
    play();

    return () => {
      video.removeEventListener("canplay", markReady);
      video.removeEventListener("loadeddata", markReady);
    };
  }, []);

  return (
    <div data-hero-media={ready ? "video" : "poster"} className="hero-scene absolute inset-0" aria-hidden="true">
      <video
        ref={videoRef}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`}
        poster="/hero/bike-skid-poster.webp"
        muted
        playsInline
        loop
        preload="metadata"
        disablePictureInPicture
        tabIndex={-1}
      >
        <source src="/hero/bike-skid-mobile.mp4" type="video/mp4" media="(max-width: 767px)" />
        <source src="/hero/bike-skid-desktop.mp4" type="video/mp4" />
      </video>
    </div>
  );
}
