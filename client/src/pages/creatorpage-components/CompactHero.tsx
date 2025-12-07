import { User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CompactHeroProps {
  displayName: string;
  username: string;
  avatarUrl: string | null;
  coverUrl: string | null;
  bio: string | null;
  category: string | null;
  creatorTitle: string | null;
  skillTags: string | null;
  creatorStatus: string | null;
  statusMessage: string | null;
  accentColor: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  available: { label: "依頼受付中", color: "bg-green-500" },
  busy: { label: "制作中", color: "bg-yellow-500" },
  closed: { label: "依頼停止中", color: "bg-red-500" },
  custom: { label: "", color: "bg-blue-500" },
};

export function CompactHero({
  displayName,
  username,
  avatarUrl,
  coverUrl,
  bio,
  category,
  creatorTitle,
  skillTags,
  creatorStatus,
  statusMessage,
  accentColor,
}: CompactHeroProps) {
  // Parse skill tags
  let parsedSkillTags: string[] = [];
  try {
    parsedSkillTags = skillTags ? JSON.parse(skillTags) : [];
  } catch {
    // Invalid JSON
  }

  // Get status display
  const statusConfig = creatorStatus ? STATUS_CONFIG[creatorStatus] : null;
  const statusLabel =
    creatorStatus === "custom" ? statusMessage : statusConfig?.label;

  return (
    <section className="relative">
      {/* Cover - smaller height */}
      <div className="relative h-32 md:h-40 overflow-hidden">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/10 to-muted" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      </div>

      {/* Profile content */}
      <div className="container max-w-2xl relative -mt-16 pb-6">
        <div className="flex flex-col items-center text-center">
          {/* Avatar */}
          <div
            className="relative mb-4 animate-in fade-in slide-in-from-bottom-4 duration-500"
            style={{ animationFillMode: "both" }}
          >
            <div
              className="w-28 h-28 rounded-full bg-card shadow-xl overflow-hidden"
              style={{ boxShadow: `0 0 0 4px ${accentColor}30` }}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${accentColor}20, ${accentColor}05)`,
                  }}
                >
                  <User className="h-12 w-12" style={{ color: accentColor }} />
                </div>
              )}
            </div>
            {/* Status indicator on avatar */}
            {statusConfig && (
              <div
                className={`absolute bottom-1 right-1 w-5 h-5 rounded-full ${statusConfig.color} ring-2 ring-background`}
                title={statusLabel || undefined}
              />
            )}
          </div>

          {/* Identity */}
          <div
            className="space-y-1 animate-in fade-in slide-in-from-bottom-4 duration-500"
            style={{ animationDelay: "100ms", animationFillMode: "both" }}
          >
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              {displayName}
            </h1>
            {/* Creator title */}
            {creatorTitle && (
              <p className="text-sm font-medium" style={{ color: accentColor }}>
                {creatorTitle}
              </p>
            )}
            <p className="text-muted-foreground text-sm">@{username}</p>
          </div>

          {/* Status badge */}
          {statusLabel && (
            <div
              className="mt-3 animate-in fade-in duration-500"
              style={{ animationDelay: "150ms", animationFillMode: "both" }}
            >
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full text-white ${statusConfig?.color || "bg-blue-500"}`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse" />
                {statusLabel}
              </span>
            </div>
          )}

          {/* Category badge */}
          {category && (
            <div
              className="mt-2 animate-in fade-in duration-500"
              style={{ animationDelay: "200ms", animationFillMode: "both" }}
            >
              <span className="inline-block px-3 py-1 text-xs font-medium bg-secondary text-secondary-foreground rounded-full">
                {category}
              </span>
            </div>
          )}

          {/* Skill tags */}
          {parsedSkillTags.length > 0 && (
            <div
              className="mt-3 flex flex-wrap justify-center gap-1.5 max-w-md animate-in fade-in duration-500"
              style={{ animationDelay: "250ms", animationFillMode: "both" }}
            >
              {parsedSkillTags.slice(0, 6).map((tag, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="text-xs font-normal"
                >
                  {tag}
                </Badge>
              ))}
              {parsedSkillTags.length > 6 && (
                <Badge variant="outline" className="text-xs font-normal">
                  +{parsedSkillTags.length - 6}
                </Badge>
              )}
            </div>
          )}

          {/* Bio */}
          {bio && (
            <p
              className="mt-4 text-muted-foreground max-w-md leading-relaxed animate-in fade-in duration-500"
              style={{ animationDelay: "300ms", animationFillMode: "both" }}
            >
              {bio}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
