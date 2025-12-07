import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Palette, Check } from "lucide-react";

interface ThemeEditorProps {
  accentColor: string;
  onAccentColorChange: (color: string) => void;
}

const ACCENT_COLORS = [
  { value: "", label: "デフォルト", color: "#E05A3A" }, // Fandry primary
  { value: "#E05A3A", label: "コーラル", color: "#E05A3A" },
  { value: "#3B82F6", label: "ブルー", color: "#3B82F6" },
  { value: "#8B5CF6", label: "パープル", color: "#8B5CF6" },
  { value: "#10B981", label: "グリーン", color: "#10B981" },
  { value: "#F59E0B", label: "オレンジ", color: "#F59E0B" },
  { value: "#EC4899", label: "ピンク", color: "#EC4899" },
  { value: "#6366F1", label: "インディゴ", color: "#6366F1" },
  { value: "#14B8A6", label: "ティール", color: "#14B8A6" },
  { value: "#F43F5E", label: "ローズ", color: "#F43F5E" },
  { value: "#84CC16", label: "ライム", color: "#84CC16" },
  { value: "#A855F7", label: "バイオレット", color: "#A855F7" },
];

export function ThemeEditor({
  accentColor,
  onAccentColorChange,
}: ThemeEditorProps) {
  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Palette className="h-5 w-5 text-primary" />
        <div>
          <h2 className="font-semibold">テーマカラー</h2>
          <p className="text-sm text-muted-foreground">
            プロフィールのアクセントカラーを選択
          </p>
        </div>
      </div>

      <div className="grid grid-cols-6 gap-3">
        {ACCENT_COLORS.map((option) => {
          const isSelected = accentColor === option.value ||
            (option.value === "" && !accentColor);

          return (
            <button
              key={option.value || "default"}
              type="button"
              onClick={() => onAccentColorChange(option.value)}
              className="group relative flex flex-col items-center gap-1.5"
            >
              <div
                className={`w-10 h-10 rounded-full transition-all duration-200 ${
                  isSelected
                    ? "ring-2 ring-offset-2 ring-offset-background ring-foreground scale-110"
                    : "hover:scale-105"
                }`}
                style={{ backgroundColor: option.color }}
              >
                {isSelected && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Check className="h-5 w-5 text-white drop-shadow-md" />
                  </div>
                )}
              </div>
              <span className="text-[10px] text-muted-foreground group-hover:text-foreground transition-colors">
                {option.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Preview */}
      <div className="pt-4 border-t border-border">
        <Label className="text-xs text-muted-foreground mb-2 block">プレビュー</Label>
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
            style={{ backgroundColor: accentColor || "#E05A3A" }}
          >
            A
          </div>
          <div className="space-y-1">
            <div
              className="h-2 w-24 rounded-full"
              style={{ backgroundColor: accentColor || "#E05A3A" }}
            />
            <div
              className="h-2 w-16 rounded-full opacity-50"
              style={{ backgroundColor: accentColor || "#E05A3A" }}
            />
          </div>
          <button
            type="button"
            className="ml-auto px-4 py-2 rounded-full text-sm font-medium text-white transition-colors"
            style={{ backgroundColor: accentColor || "#E05A3A" }}
          >
            フォロー
          </button>
        </div>
      </div>
    </Card>
  );
}
