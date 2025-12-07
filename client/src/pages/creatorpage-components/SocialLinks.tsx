import { Twitter, Instagram, Youtube, Globe } from "lucide-react";
import { isSafeUrl } from "./utils";

interface SocialLinksProps {
  socialLinksJson: string | null;
}

export function SocialLinks({ socialLinksJson }: SocialLinksProps) {
  if (!socialLinksJson) return null;

  try {
    const links = JSON.parse(socialLinksJson);
    if (Object.keys(links).length === 0) return null;

    return (
      <div className="flex items-center gap-2">
        {links.twitter && isSafeUrl(links.twitter) && (
          <a
            href={links.twitter}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
          >
            <Twitter className="h-5 w-5" />
          </a>
        )}
        {links.instagram && isSafeUrl(links.instagram) && (
          <a
            href={links.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
          >
            <Instagram className="h-5 w-5" />
          </a>
        )}
        {links.youtube && isSafeUrl(links.youtube) && (
          <a
            href={links.youtube}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
          >
            <Youtube className="h-5 w-5" />
          </a>
        )}
        {links.website && isSafeUrl(links.website) && (
          <a
            href={links.website}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
          >
            <Globe className="h-5 w-5" />
          </a>
        )}
      </div>
    );
  } catch {
    return null;
  }
}
