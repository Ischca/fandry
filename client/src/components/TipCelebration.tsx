import { useEffect, useState, useMemo } from "react";
import { Heart, Sparkles, Star } from "lucide-react";

interface TipCelebrationProps {
  amount: number;
  creatorName: string;
  onComplete?: () => void;
}

function getEffectLevel(amount: number): "small" | "medium" | "large" | "mega" {
  if (amount >= 5000) return "mega";
  if (amount >= 3000) return "large";
  if (amount >= 1000) return "medium";
  return "small";
}

function getParticleConfig(level: "small" | "medium" | "large" | "mega") {
  switch (level) {
    case "mega":
      return { count: 50, duration: 4500, message: "Mega Support!", emoji: "🎉" };
    case "large":
      return { count: 35, duration: 4000, message: "Super Support!", emoji: "✨" };
    case "medium":
      return { count: 20, duration: 3500, message: "Nice Support!", emoji: "💖" };
    default:
      return { count: 12, duration: 3000, message: "Thank you!", emoji: "❤️" };
  }
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  delay: number;
  duration: number;
  type: "heart" | "star" | "sparkle" | "circle";
  rotation: number;
}

// Warm celebration color palette
const CELEBRATION_COLORS = [
  "oklch(0.62 0.19 25)",    // Coral
  "oklch(0.72 0.18 25)",    // Light coral
  "oklch(0.85 0.16 85)",    // Gold
  "oklch(0.78 0.14 85)",    // Warm gold
  "oklch(0.65 0.15 350)",   // Pink
  "oklch(0.55 0.12 250)",   // Navy accent
];

export function TipCelebration({ amount, creatorName, onComplete }: TipCelebrationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [showContent, setShowContent] = useState(false);

  const level = getEffectLevel(amount);
  const config = getParticleConfig(level);

  const particles = useMemo(() => {
    const types: ("heart" | "star" | "sparkle" | "circle")[] = ["heart", "star", "sparkle", "circle"];

    return Array.from({ length: config.count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: 100 + Math.random() * 20,
      size: level === "mega" ? 18 + Math.random() * 28 : 14 + Math.random() * 18,
      color: CELEBRATION_COLORS[Math.floor(Math.random() * CELEBRATION_COLORS.length)],
      delay: Math.random() * 800,
      duration: 2000 + Math.random() * 1500,
      type: types[Math.floor(Math.random() * types.length)],
      rotation: Math.random() * 360,
    }));
  }, [config.count, level]);

  useEffect(() => {
    const contentTimer = setTimeout(() => setShowContent(true), 200);
    const endTimer = setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, config.duration);

    return () => {
      clearTimeout(contentTimer);
      clearTimeout(endTimer);
    };
  }, [config.duration, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden">
      {/* Background overlay with gradient */}
      <div
        className="absolute inset-0 animate-fade-in"
        style={{
          background: `
            radial-gradient(circle at 50% 50%, oklch(0.62 0.19 25 / 0.15) 0%, transparent 50%),
            oklch(0 0 0 / 0.5)
          `,
          animation: `fade-overlay ${config.duration}ms ease-out forwards`,
        }}
      />

      {/* Central celebration content */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className={`text-center transition-all duration-500 ${
            showContent ? "opacity-100 scale-100" : "opacity-0 scale-75"
          }`}
          style={{ animation: showContent ? "celebrate-bounce 0.8s ease-out" : "none" }}
        >
          {/* Glowing heart */}
          <div className="relative inline-block mb-6">
            <div
              className="absolute inset-0 rounded-full blur-2xl"
              style={{
                background: "oklch(0.62 0.19 25 / 0.5)",
                animation: "glow-pulse 1.5s ease-in-out infinite",
              }}
            />
            <div className="relative">
              <Heart
                className={`mx-auto fill-[oklch(0.62_0.19_25)] text-[oklch(0.72_0.18_25)] ${
                  level === "mega" ? "h-28 w-28" :
                  level === "large" ? "h-24 w-24" :
                  level === "medium" ? "h-20 w-20" : "h-16 w-16"
                }`}
                style={{ animation: "heart-beat 0.6s ease-in-out infinite" }}
              />
              {(level === "mega" || level === "large") && (
                <Sparkles
                  className="absolute -top-3 -right-3 h-10 w-10 text-[oklch(0.85_0.16_85)]"
                  style={{ animation: "sparkle-spin 2s linear infinite" }}
                />
              )}
            </div>
          </div>

          {/* Emoji burst for mega tips */}
          {level === "mega" && (
            <div className="text-5xl mb-4" style={{ animation: "bounce 0.5s ease-out" }}>
              {config.emoji}
            </div>
          )}

          {/* Message */}
          <p
            className={`font-bold text-white drop-shadow-2xl mb-3 ${
              level === "mega" ? "text-5xl" :
              level === "large" ? "text-4xl" :
              level === "medium" ? "text-3xl" : "text-2xl"
            }`}
            style={{ textShadow: "0 4px 20px oklch(0 0 0 / 0.5)" }}
          >
            {config.message}
          </p>

          {/* Amount */}
          <div
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full mb-4"
            style={{
              background: "oklch(1 0 0 / 0.15)",
              backdropFilter: "blur(12px)",
              border: "1px solid oklch(1 0 0 / 0.2)",
            }}
          >
            <span
              className={`font-bold text-white ${
                level === "mega" ? "text-4xl" : level === "large" ? "text-3xl" : "text-2xl"
              }`}
            >
              ¥{amount.toLocaleString()}
            </span>
          </div>

          {/* Creator name */}
          <p className="text-white/80 text-lg font-medium">
            {creatorName}さんへ
          </p>
        </div>
      </div>

      {/* Particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            color: particle.color,
            animationDelay: `${particle.delay}ms`,
            animation: `particle-rise ${particle.duration}ms cubic-bezier(0.22, 1, 0.36, 1) forwards`,
          }}
        >
          {particle.type === "heart" ? (
            <Heart
              style={{
                width: particle.size,
                height: particle.size,
                transform: `rotate(${particle.rotation}deg)`,
              }}
              className="fill-current"
            />
          ) : particle.type === "star" ? (
            <Star
              style={{
                width: particle.size,
                height: particle.size,
                transform: `rotate(${particle.rotation}deg)`,
              }}
              className="fill-current"
            />
          ) : particle.type === "sparkle" ? (
            <Sparkles
              style={{
                width: particle.size,
                height: particle.size,
                transform: `rotate(${particle.rotation}deg)`,
              }}
            />
          ) : (
            <div
              className="rounded-full"
              style={{
                width: particle.size * 0.6,
                height: particle.size * 0.6,
                backgroundColor: "currentColor",
              }}
            />
          )}
        </div>
      ))}

      <style>{`
        @keyframes fade-overlay {
          0% { opacity: 0; }
          10% { opacity: 1; }
          80% { opacity: 1; }
          100% { opacity: 0; }
        }

        @keyframes celebrate-bounce {
          0% {
            opacity: 0;
            transform: scale(0.3) translateY(50px);
          }
          50% {
            transform: scale(1.1) translateY(-10px);
          }
          70% {
            transform: scale(0.95) translateY(5px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes heart-beat {
          0%, 100% { transform: scale(1); }
          25% { transform: scale(1.15); }
          50% { transform: scale(1); }
          75% { transform: scale(1.1); }
        }

        @keyframes glow-pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.5;
          }
          50% {
            transform: scale(1.3);
            opacity: 0.8;
          }
        }

        @keyframes sparkle-spin {
          0% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(180deg) scale(1.2); }
          100% { transform: rotate(360deg) scale(1); }
        }

        @keyframes particle-rise {
          0% {
            opacity: 0;
            transform: translateY(0) rotate(0deg) scale(0);
          }
          15% {
            opacity: 1;
            transform: translateY(-15vh) rotate(60deg) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-100vh) rotate(360deg) scale(0.3);
          }
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }

        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

export function useTipCelebration() {
  const [celebration, setCelebration] = useState<{
    amount: number;
    creatorName: string;
  } | null>(null);

  const showCelebration = (amount: number, creatorName: string) => {
    setCelebration({ amount, creatorName });
  };

  const hideCelebration = () => {
    setCelebration(null);
  };

  return {
    celebration,
    showCelebration,
    hideCelebration,
    CelebrationComponent: celebration ? (
      <TipCelebration
        amount={celebration.amount}
        creatorName={celebration.creatorName}
        onComplete={hideCelebration}
      />
    ) : null,
  };
}
