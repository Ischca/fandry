import { useState, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { SignInButton } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { Header } from "@/components/Header";
import {
  User,
  Camera,
  Save,
  ArrowLeft,
  Twitter,
  Instagram,
  Youtube,
  Globe,
  Loader2,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { CREATOR_CATEGORIES } from "@shared/const";
import {
  CustomLinksEditor,
  type ProfileLink,
  CreatorIdentityEditor,
  type CreatorStatus,
  FeaturedPostsEditor,
  ThemeEditor,
} from "./settings-components";

// Validate URL to only allow http/https protocols
function isValidUrl(url: string): boolean {
  if (!url.trim()) return true; // Empty is OK
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export default function SettingsProfile() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();

  // Get current user's creator profile
  const { data: creator, isLoading: creatorLoading } = trpc.creator.getMe.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Form state
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [category, setCategory] = useState("");
  const [socialLinks, setSocialLinks] = useState({
    twitter: "",
    instagram: "",
    youtube: "",
    website: "",
  });
  const [profileLinks, setProfileLinks] = useState<ProfileLink[]>([]);
  const [showStats, setShowStats] = useState(true);
  const [showPosts, setShowPosts] = useState(true);
  // Creator identity
  const [creatorTitle, setCreatorTitle] = useState("");
  const [skillTags, setSkillTags] = useState<string[]>([]);
  const [creatorStatus, setCreatorStatus] = useState<CreatorStatus>("");
  const [statusMessage, setStatusMessage] = useState("");
  const [featuredPostIds, setFeaturedPostIds] = useState<number[]>([]);
  const [accentColor, setAccentColor] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize form with creator data
  if (creator && !isInitialized) {
    setDisplayName(creator.displayName || "");
    setBio(creator.bio || "");
    setCategory(creator.category || "");
    try {
      const links = creator.socialLinks ? JSON.parse(creator.socialLinks) : {};
      setSocialLinks({
        twitter: links.twitter || "",
        instagram: links.instagram || "",
        youtube: links.youtube || "",
        website: links.website || "",
      });
    } catch {
      // Invalid JSON, ignore
    }
    try {
      const customLinks = creator.profileLinks ? JSON.parse(creator.profileLinks) : [];
      setProfileLinks(customLinks);
    } catch {
      // Invalid JSON, ignore
    }
    setShowStats(creator.showStats !== 0);
    setShowPosts(creator.showPosts !== 0);
    // Creator identity
    setCreatorTitle(creator.creatorTitle || "");
    try {
      const tags = creator.skillTags ? JSON.parse(creator.skillTags) : [];
      setSkillTags(tags);
    } catch {
      // Invalid JSON, ignore
    }
    setCreatorStatus((creator.creatorStatus as CreatorStatus) || "");
    setStatusMessage(creator.statusMessage || "");
    try {
      const ids = creator.featuredPostIds ? JSON.parse(creator.featuredPostIds) : [];
      setFeaturedPostIds(ids);
    } catch {
      // Invalid JSON, ignore
    }
    setAccentColor(creator.accentColor || "");
    setIsInitialized(true);
  }

  // Upload mutation
  const uploadMutation = trpc.upload.getPresignedUrl.useMutation();

  // Update mutation
  const updateMutation = trpc.creator.update.useMutation({
    onSuccess: () => {
      toast.success("プロフィールを更新しました");
      utils.creator.getMe.invalidate();
      if (creator) {
        utils.creator.getByUsername.invalidate({ username: creator.username });
      }
    },
    onError: (error) => {
      toast.error(`エラー: ${error.message}`);
    },
  });

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setCoverPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadFile = async (file: File, type: "avatar" | "cover"): Promise<string | null> => {
    try {
      // Add folder prefix to filename
      const folder = type === "avatar" ? "avatars" : "covers";
      const fileName = `${folder}/${Date.now()}-${file.name}`;

      const { url, key } = await uploadMutation.mutateAsync({
        fileName,
        contentType: file.type,
        fileSize: file.size,
      });

      // Upload to S3/R2
      await fetch(url, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      // Return public URL
      return `${import.meta.env.VITE_CDN_URL || ""}/${key}`;
    } catch (error) {
      console.error("Upload failed:", error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate social links
    for (const [key, value] of Object.entries(socialLinks)) {
      if (value.trim() && !isValidUrl(value)) {
        toast.error(`${key}のURLが無効です。http://またはhttps://で始まるURLを入力してください`);
        return;
      }
    }

    let avatarUrl = creator?.avatarUrl;
    let coverUrl = creator?.coverUrl;

    // Upload avatar if changed
    if (avatarInputRef.current?.files?.[0]) {
      const uploaded = await uploadFile(avatarInputRef.current.files[0], "avatar");
      if (uploaded) avatarUrl = uploaded;
    }

    // Upload cover if changed
    if (coverInputRef.current?.files?.[0]) {
      const uploaded = await uploadFile(coverInputRef.current.files[0], "cover");
      if (uploaded) coverUrl = uploaded;
    }

    // Filter out empty social links
    const filteredSocialLinks: Record<string, string> = {};
    Object.entries(socialLinks).forEach(([key, value]) => {
      if (value.trim()) {
        filteredSocialLinks[key] = value.trim();
      }
    });

    // Validate profile links
    for (const link of profileLinks) {
      if (link.url.trim() && !isValidUrl(link.url)) {
        toast.error(`リンク「${link.title || "無題"}」のURLが無効です`);
        return;
      }
    }

    // Filter profile links with valid URLs
    const validProfileLinks = profileLinks.filter(
      link => link.title.trim() && link.url.trim()
    );

    updateMutation.mutate({
      displayName: displayName.trim() || undefined,
      bio: bio.trim() || undefined,
      category: category.trim() || undefined,
      avatarUrl: avatarUrl || undefined,
      coverUrl: coverUrl || undefined,
      socialLinks: Object.keys(filteredSocialLinks).length > 0
        ? JSON.stringify(filteredSocialLinks)
        : null,
      profileLinks: validProfileLinks.length > 0
        ? JSON.stringify(validProfileLinks)
        : null,
      showStats: showStats ? 1 : 0,
      showPosts: showPosts ? 1 : 0,
      // Creator identity
      creatorTitle: creatorTitle.trim() || null,
      skillTags: skillTags.length > 0 ? JSON.stringify(skillTags) : null,
      creatorStatus: creatorStatus || null,
      statusMessage: creatorStatus === "custom" ? statusMessage.trim() : null,
      featuredPostIds: featuredPostIds.length > 0 ? JSON.stringify(featuredPostIds) : null,
      accentColor: accentColor || null,
    });
  };

  if (authLoading || creatorLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <User className="h-16 w-16 text-muted-foreground" />
        <h1 className="text-2xl font-bold">ログインが必要です</h1>
        <SignInButton mode="modal">
          <Button>ログイン</Button>
        </SignInButton>
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <User className="h-16 w-16 text-muted-foreground" />
        <h1 className="text-2xl font-bold">クリエイター登録が必要です</h1>
        <p className="text-muted-foreground">
          プロフィールを編集するには、まずクリエイター登録をしてください
        </p>
        <Link href="/become-creator">
          <Button>クリエイター登録</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container max-w-2xl py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/creator/${creator.username}`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">プロフィール編集</h1>
            <p className="text-muted-foreground">公開プロフィール情報を変更</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Cover Image */}
          <Card className="overflow-hidden">
            <div className="relative h-40 bg-muted">
              {(coverPreview || creator.coverUrl) ? (
                <img
                  src={coverPreview || creator.coverUrl || ""}
                  alt="Cover"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/30 via-primary/10 to-[oklch(0.85_0.16_85)]/20" />
              )}
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="absolute bottom-4 right-4 gap-2"
                onClick={() => coverInputRef.current?.click()}
              >
                <Camera className="h-4 w-4" />
                カバー画像を変更
              </Button>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCoverChange}
              />
            </div>

            {/* Avatar */}
            <div className="relative px-6 pb-6">
              <div className="absolute -top-12 left-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-xl border-4 border-background bg-card shadow-lg overflow-hidden">
                    {(avatarPreview || creator.avatarUrl) ? (
                      <img
                        src={avatarPreview || creator.avatarUrl || ""}
                        alt={creator.displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                        <User className="h-10 w-10 text-primary" />
                      </div>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full shadow-md"
                    onClick={() => avatarInputRef.current?.click()}
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>
              </div>

              <div className="pt-16 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">表示名</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="表示名を入力"
                    maxLength={128}
                  />
                </div>

                <div className="space-y-2">
                  <Label>ユーザー名</Label>
                  <Input
                    value={`@${creator.username}`}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    ユーザー名は変更できません
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Bio */}
          <Card className="p-6 space-y-4">
            <h2 className="font-semibold">プロフィール</h2>

            <div className="space-y-2">
              <Label htmlFor="bio">自己紹介</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="自己紹介を入力"
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right">
                {bio.length}/500
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">カテゴリ</Label>
              <div className="flex flex-wrap gap-2">
                {CREATOR_CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      category === cat.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Creator Identity */}
          <CreatorIdentityEditor
            creatorTitle={creatorTitle}
            onTitleChange={setCreatorTitle}
            skillTags={skillTags}
            onSkillTagsChange={setSkillTags}
            creatorStatus={creatorStatus}
            onStatusChange={setCreatorStatus}
            statusMessage={statusMessage}
            onStatusMessageChange={setStatusMessage}
          />

          {/* Featured Posts */}
          <FeaturedPostsEditor
            featuredPostIds={featuredPostIds}
            onChange={setFeaturedPostIds}
          />

          {/* Social Links */}
          <Card className="p-6 space-y-4">
            <h2 className="font-semibold">SNSリンク</h2>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <Twitter className="h-5 w-5 text-muted-foreground" />
                </div>
                <Input
                  value={socialLinks.twitter}
                  onChange={(e) => setSocialLinks({ ...socialLinks, twitter: e.target.value })}
                  placeholder="https://twitter.com/username"
                />
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <Instagram className="h-5 w-5 text-muted-foreground" />
                </div>
                <Input
                  value={socialLinks.instagram}
                  onChange={(e) => setSocialLinks({ ...socialLinks, instagram: e.target.value })}
                  placeholder="https://instagram.com/username"
                />
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <Youtube className="h-5 w-5 text-muted-foreground" />
                </div>
                <Input
                  value={socialLinks.youtube}
                  onChange={(e) => setSocialLinks({ ...socialLinks, youtube: e.target.value })}
                  placeholder="https://youtube.com/@channel"
                />
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <Globe className="h-5 w-5 text-muted-foreground" />
                </div>
                <Input
                  value={socialLinks.website}
                  onChange={(e) => setSocialLinks({ ...socialLinks, website: e.target.value })}
                  placeholder="https://example.com"
                />
              </div>
            </div>
          </Card>

          {/* Custom Links (litlink-style) */}
          <CustomLinksEditor
            links={profileLinks}
            onChange={setProfileLinks}
          />

          {/* Display Options */}
          <Card className="p-6 space-y-4">
            <h2 className="font-semibold">表示設定</h2>
            <p className="text-sm text-muted-foreground">
              プロフィールページに表示する情報を選択
            </p>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="showStats">統計情報を表示</Label>
                  <p className="text-xs text-muted-foreground">
                    フォロワー数やサポート金額を表示
                  </p>
                </div>
                <Switch
                  id="showStats"
                  checked={showStats}
                  onCheckedChange={setShowStats}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="showPosts">投稿を表示</Label>
                  <p className="text-xs text-muted-foreground">
                    プロフィールに作品ギャラリーを表示
                  </p>
                </div>
                <Switch
                  id="showPosts"
                  checked={showPosts}
                  onCheckedChange={setShowPosts}
                />
              </div>
            </div>
          </Card>

          {/* Theme */}
          <ThemeEditor
            accentColor={accentColor}
            onAccentColorChange={setAccentColor}
          />

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => navigate(`/creator/${creator.username}`)}
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              className="flex-1 gap-2"
              disabled={updateMutation.isPending || uploadMutation.isPending}
            >
              {(updateMutation.isPending || uploadMutation.isPending) ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              保存
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
