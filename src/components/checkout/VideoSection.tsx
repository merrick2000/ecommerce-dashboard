"use client";

import { useEffect, useRef, useState } from "react";

interface VideoSectionProps {
  url: string;
  title?: string | null;
  dark?: boolean;
}

function getEmbedUrl(url: string): { type: "iframe"; src: string } | { type: "tiktok"; videoId: string } | null {
  // YouTube
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch) return { type: "iframe", src: `https://www.youtube.com/embed/${ytMatch[1]}` };

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return { type: "iframe", src: `https://player.vimeo.com/video/${vimeoMatch[1]}` };

  // TikTok
  const tiktokMatch = url.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/) || url.match(/tiktok\.com\/.*[?&]v=(\d+)/) || url.match(/vm\.tiktok\.com\/([a-zA-Z0-9]+)/);
  if (tiktokMatch) return { type: "tiktok", videoId: tiktokMatch[1] };

  // Facebook video
  if (url.includes("facebook.com") && (url.includes("/videos/") || url.includes("/watch/"))) {
    return { type: "iframe", src: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false` };
  }

  return null;
}

function TikTokEmbed({ videoId, dark }: { videoId: string; dark?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Load TikTok embed script
    if (!document.getElementById("tiktok-embed-script")) {
      const script = document.createElement("script");
      script.id = "tiktok-embed-script";
      script.src = "https://www.tiktok.com/embed.js";
      script.async = true;
      script.onload = () => setLoaded(true);
      document.body.appendChild(script);
    } else {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    // Re-process embeds when script loads or videoId changes
    if (loaded && (window as any).tiktokEmbed?.lib) {
      (window as any).tiktokEmbed.lib.render();
    }
  }, [loaded, videoId]);

  return (
    <div ref={containerRef} className="flex justify-center">
      <blockquote
        className="tiktok-embed"
        cite={`https://www.tiktok.com/video/${videoId}`}
        data-video-id={videoId}
        style={{ maxWidth: "605px", minWidth: "325px" }}
      >
        <section>
          <p className={`text-sm ${dark ? "text-gray-400" : "text-gray-500"}`}>
            Chargement de la vidéo...
          </p>
        </section>
      </blockquote>
    </div>
  );
}

export function VideoSection({ url, title, dark }: VideoSectionProps) {
  const embed = getEmbedUrl(url);
  if (!embed) return null;

  return (
    <div className="space-y-3">
      {title && (
        <h2
          className={`text-xl font-bold ${
            dark ? "text-white" : "text-gray-900"
          }`}
        >
          {title}
        </h2>
      )}

      {embed.type === "iframe" ? (
        <div
          className={`relative rounded-2xl overflow-hidden shadow-lg ${
            dark ? "ring-1 ring-white/10" : "ring-1 ring-gray-200"
          }`}
        >
          <div className="aspect-video">
            <iframe
              src={embed.src}
              title={title || "Vidéo"}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          </div>
        </div>
      ) : (
        <TikTokEmbed videoId={embed.videoId} dark={dark} />
      )}
    </div>
  );
}
