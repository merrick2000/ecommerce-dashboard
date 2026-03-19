"use client";

interface VideoSectionProps {
  url: string;
  title?: string | null;
  dark?: boolean;
}

function getEmbedUrl(url: string): string | null {
  // YouTube
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

  return null;
}

export function VideoSection({ url, title, dark }: VideoSectionProps) {
  const embedUrl = getEmbedUrl(url);
  if (!embedUrl) return null;

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
      <div
        className={`relative rounded-2xl overflow-hidden shadow-lg ${
          dark ? "ring-1 ring-white/10" : "ring-1 ring-gray-200"
        }`}
      >
        <div className="aspect-video">
          <iframe
            src={embedUrl}
            title={title || "Vidéo"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        </div>
      </div>
    </div>
  );
}
