import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Plus, Briefcase, Sparkles } from "lucide-react";

export type CreatorStatus = "available" | "busy" | "closed" | "custom" | "";

interface CreatorIdentityEditorProps {
  creatorTitle: string;
  onTitleChange: (title: string) => void;
  skillTags: string[];
  onSkillTagsChange: (tags: string[]) => void;
  creatorStatus: CreatorStatus;
  onStatusChange: (status: CreatorStatus) => void;
  statusMessage: string;
  onStatusMessageChange: (message: string) => void;
}

const STATUS_OPTIONS: Array<{
  value: string;
  label: string;
  color?: string;
}> = [
  { value: "none", label: "なし" },
  { value: "available", label: "依頼受付中", color: "bg-green-500" },
  { value: "busy", label: "制作中", color: "bg-yellow-500" },
  { value: "closed", label: "依頼停止中", color: "bg-red-500" },
  { value: "custom", label: "カスタム", color: "bg-blue-500" },
];

const SUGGESTED_TAGS = [
  "イラスト",
  "漫画",
  "Live2D",
  "VTuber",
  "3D",
  "Photoshop",
  "CLIP STUDIO",
  "Blender",
  "ファンタジー",
  "現代",
  "キャラデザ",
  "背景",
  "アニメーション",
  "グッズ",
  "同人",
];

export function CreatorIdentityEditor({
  creatorTitle,
  onTitleChange,
  skillTags,
  onSkillTagsChange,
  creatorStatus,
  onStatusChange,
  statusMessage,
  onStatusMessageChange,
}: CreatorIdentityEditorProps) {
  const [newTag, setNewTag] = useState("");

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !skillTags.includes(trimmed) && skillTags.length < 10) {
      onSkillTagsChange([...skillTags, trimmed]);
    }
    setNewTag("");
  };

  const removeTag = (tagToRemove: string) => {
    onSkillTagsChange(skillTags.filter(tag => tag !== tagToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag(newTag);
    }
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Briefcase className="h-5 w-5 text-primary" />
        <h2 className="font-semibold">クリエイター情報</h2>
      </div>

      {/* Creator Title */}
      <div className="space-y-2">
        <Label htmlFor="creatorTitle">肩書き</Label>
        <Input
          id="creatorTitle"
          value={creatorTitle}
          onChange={e => onTitleChange(e.target.value)}
          placeholder="イラストレーター、VTuber、同人作家など"
          maxLength={64}
        />
        <p className="text-xs text-muted-foreground">
          プロフィールに表示される肩書き
        </p>
      </div>

      {/* Skill Tags */}
      <div className="space-y-3">
        <Label>スキル・ジャンル</Label>

        {/* Current tags */}
        {skillTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {skillTags.map(tag => (
              <Badge
                key={tag}
                variant="secondary"
                className="gap-1 pr-1"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Add new tag */}
        <div className="flex gap-2">
          <Input
            value={newTag}
            onChange={e => setNewTag(e.target.value)}
            onKeyDown={handleTagKeyDown}
            placeholder="タグを追加..."
            maxLength={32}
            disabled={skillTags.length >= 10}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => addTag(newTag)}
            disabled={!newTag.trim() || skillTags.length >= 10}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Suggested tags */}
        {skillTags.length < 10 && (
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">おすすめ:</p>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_TAGS.filter(tag => !skillTags.includes(tag))
                .slice(0, 8)
                .map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => addTag(tag)}
                    className="px-2 py-0.5 text-xs rounded-full bg-muted hover:bg-muted/80 transition-colors"
                  >
                    + {tag}
                  </button>
                ))}
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          最大10個まで（{skillTags.length}/10）
        </p>
      </div>

      {/* Status */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <Label>ステータス</Label>
        </div>

        <Select
          value={creatorStatus || "none"}
          onValueChange={value => onStatusChange(value === "none" ? "" : value as CreatorStatus)}
        >
          <SelectTrigger>
            <SelectValue placeholder="ステータスを選択">
              {(() => {
                const currentValue = creatorStatus || "none";
                const option = STATUS_OPTIONS.find(s => s.value === currentValue);
                return (
                  <div className="flex items-center gap-2">
                    {option?.color && (
                      <div className={`w-2 h-2 rounded-full ${option.color}`} />
                    )}
                    <span>{option?.label || "なし"}</span>
                  </div>
                );
              })()}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map(option => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center gap-2">
                  {option.color && (
                    <div className={`w-2 h-2 rounded-full ${option.color}`} />
                  )}
                  <span>{option.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Custom status message */}
        {creatorStatus === "custom" && (
          <div className="space-y-2">
            <Label htmlFor="statusMessage">カスタムメッセージ</Label>
            <Input
              id="statusMessage"
              value={statusMessage}
              onChange={e => onStatusMessageChange(e.target.value)}
              placeholder="コミケ準備中！、新作制作中など"
              maxLength={100}
            />
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          プロフィールに現在の活動状況を表示
        </p>
      </div>
    </Card>
  );
}
