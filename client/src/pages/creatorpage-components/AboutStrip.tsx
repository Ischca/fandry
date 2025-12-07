import { Users, Heart, Sparkles } from "lucide-react";
import { SocialLinks } from "./SocialLinks";

interface AboutStripProps {
  bio: string | null;
  followerCount: number;
  totalSupport: number;
  socialLinks: string | null;
}

export function AboutStrip({
  bio,
  followerCount,
  totalSupport,
  socialLinks,
}: AboutStripProps) {
  return (
    <section className="relative py-16 md:py-24 bg-background border-b border-border/30">
      {/* Subtle pattern */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: "32px 32px",
        }}
      />

      <div className="container max-w-6xl relative">
        <div className="grid md:grid-cols-[1fr,auto] gap-12 md:gap-16 items-start">
          {/* Bio */}
          <div
            className="space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-500"
            style={{ animationDelay: "100ms", animationFillMode: "both" }}
          >
            <h2 className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground">
              About
            </h2>
            {bio ? (
              <p className="text-xl md:text-2xl leading-relaxed text-foreground/90 font-light max-w-2xl">
                {bio}
              </p>
            ) : (
              <p className="text-lg text-muted-foreground italic">
                このクリエイターはまだ自己紹介を追加していません
              </p>
            )}
            <SocialLinks socialLinksJson={socialLinks} />
          </div>

          {/* Stats */}
          <div
            className="flex flex-row md:flex-col gap-8 md:gap-6 md:text-right animate-in slide-in-from-right-4 fade-in duration-500"
            style={{ animationDelay: "200ms", animationFillMode: "both" }}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2 md:justify-end text-muted-foreground">
                <Users className="h-4 w-4" />
                <span className="text-xs tracking-widest uppercase">
                  Followers
                </span>
              </div>
              <p className="text-3xl md:text-4xl font-serif font-bold tabular-nums">
                {followerCount.toLocaleString()}
              </p>
            </div>

            {totalSupport > 0 && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 md:justify-end text-muted-foreground">
                  <Heart className="h-4 w-4" />
                  <span className="text-xs tracking-widest uppercase">
                    Total Support
                  </span>
                </div>
                <p className="text-3xl md:text-4xl font-serif font-bold tabular-nums">
                  <span className="text-lg font-normal text-muted-foreground">
                    ¥
                  </span>
                  {totalSupport.toLocaleString()}
                </p>
              </div>
            )}

            <div className="hidden md:block space-y-1">
              <div className="flex items-center gap-2 justify-end text-primary">
                <Sparkles className="h-4 w-4" />
                <span className="text-xs tracking-widest uppercase">
                  Creator
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Verified Artist
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
