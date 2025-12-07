import React, { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { MessageCircle, Send } from "lucide-react";
import { formatRelativeTime } from "./utils";

interface CommentSectionProps {
  postId: number;
  commentCount: number;
}

export function CommentSection({ postId, commentCount }: CommentSectionProps) {
  const { isAuthenticated } = useAuth();
  const [commentContent, setCommentContent] = useState("");

  const { data: comments, refetch: refetchComments } =
    trpc.comment.getByPostId.useQuery({ postId }, { enabled: postId > 0 });

  const commentMutation = trpc.comment.create.useMutation({
    onSuccess: () => {
      setCommentContent("");
      refetchComments();
    },
  });

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim()) return;
    commentMutation.mutate({ postId, content: commentContent });
  };

  return (
    <section id="comments" className="space-y-6 scroll-mt-20">
      <header className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">
          コメント
          {commentCount > 0 && (
            <span className="ml-2 text-muted-foreground font-normal">
              ({commentCount})
            </span>
          )}
        </h2>
      </header>

      {/* Comment Form */}
      {isAuthenticated ? (
        <form onSubmit={handleCommentSubmit} className="relative">
          <input
            type="text"
            value={commentContent}
            onChange={e => setCommentContent(e.target.value)}
            placeholder="コメントを追加..."
            className="w-full pl-4 pr-12 py-3 rounded-xl border border-border/50 bg-muted/30 focus:bg-background focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/60"
            maxLength={500}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!commentContent.trim() || commentMutation.isPending}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg h-8 w-8"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      ) : (
        <div className="text-center py-8 rounded-xl border border-dashed border-border/50 bg-muted/20">
          <p className="text-sm text-muted-foreground mb-3">
            コメントするにはログインが必要です
          </p>
          <Button variant="outline" size="sm">
            ログイン
          </Button>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-1">
        {comments && comments.length > 0 ? (
          comments.map((comment, index) => (
            <div
              key={comment.id}
              className="group flex gap-3 p-4 -mx-4 sm:mx-0 sm:rounded-xl hover:bg-muted/30 transition-colors"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex-shrink-0">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center ring-1 ring-border/50">
                  <span className="text-sm font-semibold text-primary/80">
                    {comment.userDisplayName?.charAt(0).toUpperCase() || "?"}
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">
                    {comment.userDisplayName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeTime(new Date(comment.createdAt))}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-foreground/90">
                  {comment.content}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <MessageCircle className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">
              まだコメントがありません
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              最初のコメントを投稿しましょう
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
