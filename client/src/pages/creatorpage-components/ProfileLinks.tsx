import {
  Twitter,
  Instagram,
  Youtube,
  Globe,
  Link as LinkIcon,
  Music,
  ShoppingBag,
  MessageCircle,
  Mail,
  MapPin,
  FileText,
  Video,
  Headphones,
  Camera,
  Palette,
  Code,
  Gamepad2,
  Book,
  Mic,
  Heart,
  ExternalLink,
} from "lucide-react";

// Icon mapping
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  twitter: Twitter,
  instagram: Instagram,
  youtube: Youtube,
  website: Globe,
  link: LinkIcon,
  music: Music,
  shop: ShoppingBag,
  discord: MessageCircle,
  email: Mail,
  location: MapPin,
  blog: FileText,
  video: Video,
  podcast: Headphones,
  photo: Camera,
  art: Palette,
  code: Code,
  game: Gamepad2,
  book: Book,
  mic: Mic,
  fanbox: Heart,
};

interface ProfileLink {
  id: string;
  title: string;
  url: string;
  icon?: string;
  color?: string;
}

interface ProfileLinksProps {
  linksJson: string | null;
  socialLinksJson: string | null;
}

function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function ProfileLinks({ linksJson, socialLinksJson }: ProfileLinksProps) {
  // Parse custom links
  let customLinks: ProfileLink[] = [];
  try {
    customLinks = linksJson ? JSON.parse(linksJson) : [];
  } catch {
    customLinks = [];
  }

  // Parse social links (convert to ProfileLink format)
  let socialLinks: ProfileLink[] = [];
  try {
    const social = socialLinksJson ? JSON.parse(socialLinksJson) : {};
    if (social.twitter && isSafeUrl(social.twitter)) {
      socialLinks.push({
        id: "social-twitter",
        title: "Twitter",
        url: social.twitter,
        icon: "twitter",
      });
    }
    if (social.instagram && isSafeUrl(social.instagram)) {
      socialLinks.push({
        id: "social-instagram",
        title: "Instagram",
        url: social.instagram,
        icon: "instagram",
      });
    }
    if (social.youtube && isSafeUrl(social.youtube)) {
      socialLinks.push({
        id: "social-youtube",
        title: "YouTube",
        url: social.youtube,
        icon: "youtube",
      });
    }
    if (social.website && isSafeUrl(social.website)) {
      socialLinks.push({
        id: "social-website",
        title: "Website",
        url: social.website,
        icon: "website",
      });
    }
  } catch {
    socialLinks = [];
  }

  const allLinks = [...socialLinks, ...customLinks.filter(l => isSafeUrl(l.url))];

  if (allLinks.length === 0) return null;

  return (
    <section className="py-6">
      <div className="container max-w-2xl">
        <div className="space-y-3">
          {allLinks.map((link, index) => {
            const IconComponent = ICON_MAP[link.icon || "link"] || LinkIcon;

            return (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group block animate-in fade-in slide-in-from-bottom-2 duration-300"
                style={{
                  animationDelay: `${index * 50}ms`,
                  animationFillMode: "both",
                }}
              >
                <div
                  className="relative flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card hover:border-border transition-all duration-200 hover:shadow-md"
                  style={
                    link.color
                      ? {
                          borderColor: `${link.color}30`,
                          background: `linear-gradient(135deg, ${link.color}05 0%, transparent 50%)`,
                        }
                      : undefined
                  }
                >
                  {/* Icon */}
                  <div
                    className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center bg-secondary"
                    style={
                      link.color
                        ? { backgroundColor: `${link.color}15`, color: link.color }
                        : undefined
                    }
                  >
                    <IconComponent className="h-5 w-5" />
                  </div>

                  {/* Title */}
                  <span className="flex-1 font-medium truncate">{link.title}</span>

                  {/* External link indicator */}
                  <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
