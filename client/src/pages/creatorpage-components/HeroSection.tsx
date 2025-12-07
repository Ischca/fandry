import { User } from "lucide-react";

interface HeroSectionProps {
  displayName: string;
  username: string;
  avatarUrl: string | null;
  coverUrl: string | null;
  category: string | null;
}

export function HeroSection({
  displayName,
  username,
  avatarUrl,
  coverUrl,
  category,
}: HeroSectionProps) {
  return (
    <section className="relative h-[85vh] min-h-[600px] max-h-[900px] overflow-hidden">
      {/* Background Layer */}
      <div className="absolute inset-0">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt=""
            className="w-full h-full object-cover scale-105 animate-in fade-in zoom-in-95 duration-1000"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900" />
        )}
        {/* Cinematic overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />
        {/* Film grain texture */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Content Layer */}
      <div className="relative h-full flex flex-col justify-end pb-16 md:pb-24">
        <div className="container max-w-6xl">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-8">
            {/* Avatar */}
            <div
              className="relative animate-in slide-in-from-left-8 fade-in duration-700"
              style={{ animationDelay: "200ms", animationFillMode: "both" }}
            >
              <div className="w-32 h-32 md:w-44 md:h-44 rounded-2xl overflow-hidden ring-2 ring-white/10 shadow-2xl">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-neutral-800">
                    <User className="h-16 w-16 text-neutral-500" />
                  </div>
                )}
              </div>
              {/* Decorative accent */}
              <div className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full bg-primary ring-4 ring-black" />
            </div>

            {/* Identity */}
            <div
              className="flex-1 space-y-4 animate-in slide-in-from-bottom-8 fade-in duration-700"
              style={{ animationDelay: "400ms", animationFillMode: "both" }}
            >
              {/* Category tag */}
              {category && (
                <span className="inline-block px-3 py-1 text-xs font-medium tracking-widest uppercase text-white/60 border border-white/20 rounded-full">
                  {category}
                </span>
              )}

              {/* Name with dramatic typography */}
              <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl font-bold text-white tracking-tight leading-[0.9]">
                {displayName}
              </h1>

              {/* Username */}
              <p className="text-lg md:text-xl text-white/50 font-light tracking-wide">
                @{username}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-in fade-in duration-1000"
        style={{ animationDelay: "1000ms", animationFillMode: "both" }}
      >
        <div className="flex flex-col items-center gap-2 text-white/40">
          <span className="text-xs tracking-widest uppercase">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-white/40 to-transparent animate-pulse" />
        </div>
      </div>
    </section>
  );
}
