import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Trash2,
  GripVertical,
  Twitter,
  Instagram,
  Youtube,
  Globe,
  Link as LinkIcon,
  Music,
  ShoppingBag,
  MessageCircle,
  Mail,
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
} from "lucide-react";

export interface ProfileLink {
  id: string;
  title: string;
  url: string;
  icon: string;
  color?: string;
}

interface CustomLinksEditorProps {
  links: ProfileLink[];
  onChange: (links: ProfileLink[]) => void;
}

const ICON_OPTIONS = [
  { value: "link", label: "リンク", icon: LinkIcon },
  { value: "twitter", label: "Twitter/X", icon: Twitter },
  { value: "instagram", label: "Instagram", icon: Instagram },
  { value: "youtube", label: "YouTube", icon: Youtube },
  { value: "website", label: "ウェブサイト", icon: Globe },
  { value: "music", label: "音楽", icon: Music },
  { value: "shop", label: "ショップ", icon: ShoppingBag },
  { value: "discord", label: "Discord", icon: MessageCircle },
  { value: "email", label: "メール", icon: Mail },
  { value: "blog", label: "ブログ", icon: FileText },
  { value: "video", label: "動画", icon: Video },
  { value: "podcast", label: "ポッドキャスト", icon: Headphones },
  { value: "photo", label: "写真", icon: Camera },
  { value: "art", label: "アート", icon: Palette },
  { value: "code", label: "コード", icon: Code },
  { value: "game", label: "ゲーム", icon: Gamepad2 },
  { value: "book", label: "本", icon: Book },
  { value: "mic", label: "音声", icon: Mic },
  { value: "fanbox", label: "Fanbox", icon: Heart },
];

const COLOR_OPTIONS = [
  { value: "", label: "デフォルト" },
  { value: "#E05A3A", label: "コーラル" },
  { value: "#3B82F6", label: "ブルー" },
  { value: "#8B5CF6", label: "パープル" },
  { value: "#10B981", label: "グリーン" },
  { value: "#F59E0B", label: "オレンジ" },
  { value: "#EC4899", label: "ピンク" },
  { value: "#6366F1", label: "インディゴ" },
];

export function CustomLinksEditor({ links, onChange }: CustomLinksEditorProps) {
  const addLink = () => {
    const newLink: ProfileLink = {
      id: `link-${Date.now()}`,
      title: "",
      url: "",
      icon: "link",
    };
    onChange([...links, newLink]);
  };

  const updateLink = (id: string, field: keyof ProfileLink, value: string) => {
    onChange(
      links.map(link =>
        link.id === id ? { ...link, [field]: value } : link
      )
    );
  };

  const removeLink = (id: string) => {
    onChange(links.filter(link => link.id !== id));
  };

  const moveLink = (index: number, direction: "up" | "down") => {
    const newLinks = [...links];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= links.length) return;
    [newLinks[index], newLinks[targetIndex]] = [
      newLinks[targetIndex],
      newLinks[index],
    ];
    onChange(newLinks);
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold">カスタムリンク</h2>
          <p className="text-sm text-muted-foreground">
            プロフィールに表示するリンクを追加
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addLink}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          追加
        </Button>
      </div>

      {links.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <LinkIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">リンクがありません</p>
          <p className="text-xs">「追加」をクリックしてリンクを作成</p>
        </div>
      ) : (
        <div className="space-y-4">
          {links.map((link, index) => {
            const IconComponent =
              ICON_OPTIONS.find(opt => opt.value === link.icon)?.icon ||
              LinkIcon;

            return (
              <div
                key={link.id}
                className="relative p-4 rounded-lg border border-border/50 bg-muted/30 space-y-3"
              >
                {/* Header with drag handle and delete */}
                <div className="flex items-center gap-2">
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => moveLink(index, "up")}
                      disabled={index === 0}
                      className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                    >
                      <GripVertical className="h-4 w-4" />
                    </button>
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">
                    #{index + 1}
                  </span>
                  <div className="flex-1" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeLink(link.id)}
                    className="h-8 w-8 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Title input */}
                <div className="space-y-2">
                  <Label className="text-xs">タイトル</Label>
                  <Input
                    value={link.title}
                    onChange={e => updateLink(link.id, "title", e.target.value)}
                    placeholder="リンクのタイトル"
                    maxLength={50}
                  />
                </div>

                {/* URL input */}
                <div className="space-y-2">
                  <Label className="text-xs">URL</Label>
                  <Input
                    value={link.url}
                    onChange={e => updateLink(link.id, "url", e.target.value)}
                    placeholder="https://..."
                    type="url"
                  />
                </div>

                {/* Icon and Color selectors */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs">アイコン</Label>
                    <Select
                      value={link.icon}
                      onValueChange={value => updateLink(link.id, "icon", value)}
                    >
                      <SelectTrigger>
                        <SelectValue>
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-4 w-4" />
                            <span>
                              {ICON_OPTIONS.find(opt => opt.value === link.icon)
                                ?.label || "リンク"}
                            </span>
                          </div>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {ICON_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <option.icon className="h-4 w-4" />
                              <span>{option.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">カラー</Label>
                    <Select
                      value={link.color || ""}
                      onValueChange={value =>
                        updateLink(link.id, "color", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue>
                          <div className="flex items-center gap-2">
                            {link.color && (
                              <div
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: link.color }}
                              />
                            )}
                            <span>
                              {COLOR_OPTIONS.find(
                                opt => opt.value === (link.color || "")
                              )?.label || "デフォルト"}
                            </span>
                          </div>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {COLOR_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              {option.value && (
                                <div
                                  className="w-4 h-4 rounded-full"
                                  style={{ backgroundColor: option.value }}
                                />
                              )}
                              <span>{option.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {links.length > 0 && links.length < 10 && (
        <Button
          type="button"
          variant="outline"
          onClick={addLink}
          className="w-full gap-2"
        >
          <Plus className="h-4 w-4" />
          リンクを追加
        </Button>
      )}

      {links.length >= 10 && (
        <p className="text-xs text-muted-foreground text-center">
          リンクは最大10個まで追加できます
        </p>
      )}
    </Card>
  );
}
