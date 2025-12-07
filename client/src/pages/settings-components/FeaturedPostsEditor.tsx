import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Pin, X, ImageIcon, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";

interface FeaturedPostsEditorProps {
  featuredPostIds: number[];
  onChange: (ids: number[]) => void;
}

export function FeaturedPostsEditor({
  featuredPostIds,
  onChange,
}: FeaturedPostsEditorProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  // Get current user's posts
  const { data: myCreator } = trpc.creator.getMe.useQuery();
  const { data: posts } = trpc.post.getByCreatorUsername.useQuery(
    { username: myCreator?.username || "", limit: 50 },
    { enabled: !!myCreator?.username }
  );

  // Get featured posts details
  const featuredPosts = posts?.filter(post => featuredPostIds.includes(post.id)) || [];

  const addFeaturedPost = (postId: number) => {
    if (!featuredPostIds.includes(postId) && featuredPostIds.length < 3) {
      onChange([...featuredPostIds, postId]);
    }
    setDialogOpen(false);
  };

  const removeFeaturedPost = (postId: number) => {
    onChange(featuredPostIds.filter(id => id !== postId));
  };

  const availablePosts = posts?.filter(
    post => !featuredPostIds.includes(post.id)
  ) || [];

  // Parse media URLs helper
  const getFirstMedia = (mediaUrls: string | null): string | null => {
    if (!mediaUrls) return null;
    try {
      const urls = JSON.parse(mediaUrls);
      return Array.isArray(urls) && urls.length > 0 ? urls[0] : null;
    } catch {
      return null;
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Pin className="h-5 w-5 text-primary" />
        <div>
          <h2 className="font-semibold">ピン留め投稿</h2>
          <p className="text-sm text-muted-foreground">
            プロフィールトップに表示する代表作（最大3つ）
          </p>
        </div>
      </div>

      {/* Featured posts grid */}
      <div className="grid grid-cols-3 gap-3">
        {/* Existing featured posts */}
        {featuredPosts.map(post => {
          const mediaUrl = getFirstMedia(post.mediaUrls);
          return (
            <div
              key={post.id}
              className="relative aspect-square rounded-lg border border-border overflow-hidden group"
            >
              {mediaUrl ? (
                <img
                  src={mediaUrl}
                  alt={post.title || "投稿"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              {/* Overlay with title */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-0 left-0 right-0 p-2">
                  <p className="text-white text-xs truncate">
                    {post.title || "無題"}
                  </p>
                </div>
              </div>
              {/* Remove button */}
              <button
                type="button"
                onClick={() => removeFeaturedPost(post.id)}
                className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
              >
                <X className="h-4 w-4" />
              </button>
              {/* Pin indicator */}
              <div className="absolute top-1 left-1 p-1 bg-primary/90 rounded-full">
                <Pin className="h-3 w-3 text-primary-foreground" />
              </div>
            </div>
          );
        })}

        {/* Add button (if less than 3) */}
        {featuredPostIds.length < 3 && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <button
                type="button"
                className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Plus className="h-6 w-6" />
                <span className="text-xs">追加</span>
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>ピン留めする投稿を選択</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-3 mt-4">
                {availablePosts.length === 0 ? (
                  <p className="col-span-2 text-center text-muted-foreground py-8">
                    選択可能な投稿がありません
                  </p>
                ) : (
                  availablePosts.map(post => {
                    const mediaUrl = getFirstMedia(post.mediaUrls);
                    return (
                      <button
                        key={post.id}
                        type="button"
                        onClick={() => addFeaturedPost(post.id)}
                        className="relative aspect-square rounded-lg border border-border overflow-hidden hover:border-primary transition-colors group"
                      >
                        {mediaUrl ? (
                          <img
                            src={mediaUrl}
                            alt={post.title || "投稿"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <ImageIcon className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent">
                          <div className="absolute bottom-0 left-0 right-0 p-2">
                            <p className="text-white text-xs truncate">
                              {post.title || "無題"}
                            </p>
                          </div>
                        </div>
                        <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Pin className="h-8 w-8 text-white drop-shadow-lg" />
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Empty slots */}
        {Array.from({ length: Math.max(0, 2 - featuredPostIds.length) }).map(
          (_, i) => (
            <div
              key={`empty-${i}`}
              className="aspect-square rounded-lg border border-dashed border-border/50 flex items-center justify-center"
            >
              <ImageIcon className="h-6 w-6 text-muted-foreground/30" />
            </div>
          )
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {featuredPostIds.length}/3 選択中
      </p>
    </Card>
  );
}
