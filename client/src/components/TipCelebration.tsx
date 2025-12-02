import { useEffect, useState } from "react";
import { Heart, Sparkles, Star } from "lucide-react";

interface TipCelebrationProps {
  amount: number;
  creatorName: string;
  onComplete?: () => void;
}

// 金額に応じた演出レベルを決定
function getEffectLevel(amount: number): "small" | "medium" | "large" | "mega" {
  if (amount >= 5000) return "mega";
  if (amount >= 3000) return "large";
  if (amount >= 1000) return "medium";
  return "small";
}

// パーティクルの設定
function getParticleConfig(level: "small" | "medium" | "large" | "mega") {
  switch (level) {
    case "mega":
      return { count: 40, duration: 4000, message: "Mega Tip!" };
    case "large":
      return { count: 25, duration: 3500, message: "Super Tip!" };
    case "medium":
      return { count: 15, duration: 3000, message: "Nice Tip!" };
    default:
      return { count: 8, duration: 2500, message: "Thanks!" };
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
  type: "heart" | "star" | "sparkle";
}

export function TipCelebration({ amount, creatorName, onComplete }: TipCelebrationProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isVisible, setIsVisible] = useState(true);

  const level = getEffectLevel(amount);
  const config = getParticleConfig(level);

  useEffect(() => {
    // パーティクルを生成
    const colors = [
      "text-pink-500",
      "text-red-500",
      "text-purple-500",
      "text-yellow-500",
      "text-orange-500",
    ];

    const types: ("heart" | "star" | "sparkle")[] = ["heart", "star", "sparkle"];

    const newParticles: Particle[] = Array.from({ length: config.count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: level === "mega" ? 16 + Math.random() * 24 : 12 + Math.random() * 16,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 500,
      duration: 1500 + Math.random() * 1000,
      type: types[Math.floor(Math.random() * types.length)],
    }));

    setParticles(newParticles);

    // アニメーション終了後にクリーンアップ
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, config.duration);

    return () => clearTimeout(timer);
  }, [config.count, config.duration, level, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden">
      {/* 背景オーバーレイ */}
      <div
        className="absolute inset-0 bg-black/30 animate-fade-out"
        style={{ animationDuration: `${config.duration}ms` }}
      />

      {/* 中央メッセージ */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center animate-bounce-in">
          <div className="relative">
            <Heart
              className={`mx-auto mb-4 fill-primary text-primary animate-pulse ${
                level === "mega" ? "h-24 w-24" :
                level === "large" ? "h-20 w-20" :
                level === "medium" ? "h-16 w-16" : "h-12 w-12"
              }`}
            />
            {level === "mega" && (
              <Sparkles className="absolute -top-2 -right-2 h-8 w-8 text-yellow-400 animate-spin" />
            )}
          </div>
          <p className={`font-bold text-white drop-shadow-lg ${
            level === "mega" ? "text-4xl" :
            level === "large" ? "text-3xl" :
            level === "medium" ? "text-2xl" : "text-xl"
          }`}>
            {config.message}
          </p>
          <p className="text-white/90 mt-2 text-lg drop-shadow">
            ¥{amount.toLocaleString()}
          </p>
          <p className="text-white/80 mt-1 drop-shadow">
            {creatorName}さんへ
          </p>
        </div>
      </div>

      {/* パーティクル */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className={`absolute ${particle.color} animate-float-up`}
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            animationDelay: `${particle.delay}ms`,
            animationDuration: `${particle.duration}ms`,
          }}
        >
          {particle.type === "heart" ? (
            <Heart style={{ width: particle.size, height: particle.size }} className="fill-current" />
          ) : particle.type === "star" ? (
            <Star style={{ width: particle.size, height: particle.size }} className="fill-current" />
          ) : (
            <Sparkles style={{ width: particle.size, height: particle.size }} />
          )}
        </div>
      ))}

      <style>{`
        @keyframes bounce-in {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          50% {
            transform: scale(1.1);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes float-up {
          0% {
            opacity: 1;
            transform: translateY(0) rotate(0deg) scale(0);
          }
          20% {
            opacity: 1;
            transform: translateY(-20vh) rotate(90deg) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-100vh) rotate(360deg) scale(0.5);
          }
        }

        @keyframes fade-out {
          0% {
            opacity: 1;
          }
          70% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }

        .animate-bounce-in {
          animation: bounce-in 0.6s ease-out forwards;
        }

        .animate-float-up {
          animation: float-up 2s ease-out forwards;
        }

        .animate-fade-out {
          animation: fade-out forwards;
        }
      `}</style>
    </div>
  );
}

// Hook for managing tip celebration state
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
