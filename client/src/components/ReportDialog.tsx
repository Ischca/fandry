import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";

type ReportType = "spam" | "harassment" | "inappropriate_content" | "copyright" | "other";
type TargetType = "post" | "creator" | "comment";

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetType: TargetType;
  targetId: number;
  targetName?: string;
}

const REPORT_TYPES: { value: ReportType; label: string; description: string }[] = [
  { value: "spam", label: "スパム", description: "宣伝目的や無関係な内容" },
  { value: "harassment", label: "嫌がらせ", description: "誹謗中傷や脅迫的な内容" },
  { value: "inappropriate_content", label: "不適切なコンテンツ", description: "規約違反の内容" },
  { value: "copyright", label: "著作権侵害", description: "無断転載や著作権を侵害する内容" },
  { value: "other", label: "その他", description: "上記に該当しない問題" },
];

export function ReportDialog({
  open,
  onOpenChange,
  targetType,
  targetId,
  targetName,
}: ReportDialogProps) {
  const [selectedType, setSelectedType] = useState<ReportType | null>(null);
  const [reason, setReason] = useState("");

  const reportMutation = trpc.report.create.useMutation({
    onSuccess: () => {
      toast.success("通報を送信しました", {
        description: "ご報告ありがとうございます。運営で確認いたします。",
      });
      onOpenChange(false);
      setSelectedType(null);
      setReason("");
    },
    onError: (error) => {
      if (error.message.includes("already reported")) {
        toast.error("既に通報済みです");
      } else {
        toast.error(`送信に失敗しました: ${error.message}`);
      }
    },
  });

  const handleSubmit = () => {
    if (!selectedType) {
      toast.error("通報理由を選択してください");
      return;
    }

    reportMutation.mutate({
      targetType,
      targetId,
      type: selectedType,
      reason: reason || undefined,
    });
  };

  const getTargetLabel = () => {
    switch (targetType) {
      case "post":
        return "この投稿";
      case "creator":
        return targetName ? `@${targetName}` : "このクリエイター";
      case "comment":
        return "このコメント";
      default:
        return "このコンテンツ";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <DialogTitle className="text-center">通報する</DialogTitle>
          <DialogDescription className="text-center">
            {getTargetLabel()}を通報しますか？
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Report type selection */}
          <div className="space-y-2">
            <Label>通報理由 *</Label>
            <div className="space-y-2">
              {REPORT_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setSelectedType(type.value)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedType === type.value
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-primary/50"
                  }`}
                >
                  <p className="font-medium text-sm">{type.label}</p>
                  <p className="text-xs text-muted-foreground">{type.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Additional details */}
          <div className="space-y-2">
            <Label htmlFor="reason">詳細（任意）</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="具体的な状況があれば教えてください..."
              maxLength={1000}
              rows={3}
            />
            <p className="text-xs text-muted-foreground text-right">
              {reason.length}/1000
            </p>
          </div>

          {/* Notice */}
          <p className="text-xs text-muted-foreground">
            通報は匿名で処理されます。虚偽の通報は規約違反となる場合があります。
          </p>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            キャンセル
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={!selectedType || reportMutation.isPending}
            className="w-full sm:w-auto"
          >
            {reportMutation.isPending ? "送信中..." : "通報する"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
