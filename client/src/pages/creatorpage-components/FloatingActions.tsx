import { Heart, UserPlus, UserCheck, Share2, MoreHorizontal, Flag, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FloatingActionsProps {
  isAuthenticated: boolean;
  isOwnProfile: boolean;
  isFollowing: boolean;
  isBlocked: boolean;
  isPending: boolean;
  onFollow: () => void;
  onTip: () => void;
  onShare: () => void;
  onBlock: () => void;
  onReport: () => void;
}

export function FloatingActions({
  isAuthenticated,
  isOwnProfile,
  isFollowing,
  isBlocked,
  isPending,
  onFollow,
  onTip,
  onShare,
  onBlock,
  onReport,
}: FloatingActionsProps) {
  if (isOwnProfile) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pointer-events-none">
      <div className="container max-w-6xl">
        <div
          className="flex items-center justify-center gap-2 animate-in slide-in-from-bottom-4 fade-in duration-500"
          style={{ animationDelay: "800ms", animationFillMode: "both" }}
        >
          <div className="inline-flex items-center gap-2 p-2 rounded-full bg-card/95 backdrop-blur-xl border border-border/50 shadow-2xl pointer-events-auto">
            {/* Share */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onShare}
              className="rounded-full h-11 w-11 text-muted-foreground hover:text-foreground"
            >
              <Share2 className="h-5 w-5" />
            </Button>

            {/* Divider */}
            <div className="w-px h-6 bg-border" />

            {isAuthenticated ? (
              <>
                {/* Follow */}
                <Button
                  variant={isFollowing ? "secondary" : "ghost"}
                  onClick={onFollow}
                  disabled={isPending}
                  className={`rounded-full h-11 px-5 gap-2 font-medium ${
                    isFollowing ? "" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <UserCheck className="h-4 w-4" />
                      <span className="hidden sm:inline">Following</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      <span className="hidden sm:inline">Follow</span>
                    </>
                  )}
                </Button>

                {/* Tip button - primary action */}
                <Button
                  onClick={onTip}
                  className="rounded-full h-11 px-6 gap-2 font-semibold shadow-lg"
                >
                  <Heart className="h-4 w-4" />
                  <span>Support</span>
                </Button>

                {/* More menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full h-11 w-11 text-muted-foreground hover:text-foreground"
                    >
                      <MoreHorizontal className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={onBlock} disabled={isPending}>
                      <Ban className="h-4 w-4 mr-2" />
                      {isBlocked ? "Unblock" : "Block"}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={onReport}
                      className="text-destructive focus:text-destructive"
                    >
                      <Flag className="h-4 w-4 mr-2" />
                      Report
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button
                onClick={onTip}
                className="rounded-full h-11 px-6 gap-2 font-semibold shadow-lg"
              >
                <Heart className="h-4 w-4" />
                <span>Support</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
