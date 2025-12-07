import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, X } from "lucide-react";

interface PlanFormData {
  name: string;
  description: string;
  price: number;
  tier: number;
  benefits: string[];
}

interface PlanFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: PlanFormData;
  setFormData: React.Dispatch<React.SetStateAction<PlanFormData>>;
  editingPlanId: number | null;
  isPending: boolean;
  onSubmit: () => void;
}

export function PlanFormDialog({
  open,
  onOpenChange,
  formData,
  setFormData,
  editingPlanId,
  isPending,
  onSubmit,
}: PlanFormDialogProps) {
  const addBenefit = () => {
    setFormData(prev => ({
      ...prev,
      benefits: [...prev.benefits, ""],
    }));
  };

  const removeBenefit = (index: number) => {
    setFormData(prev => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index),
    }));
  };

  const updateBenefit = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      benefits: prev.benefits.map((b, i) => (i === index ? value : b)),
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editingPlanId ? "プランを編集" : "新しいプランを作成"}
          </DialogTitle>
          <DialogDescription>
            {editingPlanId
              ? "プランの内容を編集します"
              : "ファンが加入できる月額支援プランを作成します"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">プラン名 *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={e =>
                setFormData(prev => ({ ...prev, name: e.target.value }))
              }
              placeholder="例: ライトサポーター"
              maxLength={128}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">月額料金 (円) *</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    price: parseInt(e.target.value) || 0,
                  }))
                }
                min={100}
                max={100000}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tier">ティアレベル *</Label>
              <Input
                id="tier"
                type="number"
                value={formData.tier}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    tier: parseInt(e.target.value) || 1,
                  }))
                }
                min={1}
                max={10}
                disabled={!!editingPlanId}
              />
              {!editingPlanId && (
                <p className="text-xs text-muted-foreground">
                  高いティアは上位プランとして表示されます
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">説明</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={e =>
                setFormData(prev => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="プランの説明を入力..."
              maxLength={1000}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>特典</Label>
            <div className="space-y-2">
              {formData.benefits.map((benefit, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={benefit}
                    onChange={e => updateBenefit(index, e.target.value)}
                    placeholder={`特典 ${index + 1}`}
                  />
                  {formData.benefits.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeBenefit(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addBenefit}
              className="gap-1"
            >
              <Plus className="h-3 w-3" />
              特典を追加
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button onClick={onSubmit} disabled={isPending}>
            {isPending ? "保存中..." : editingPlanId ? "更新" : "作成"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
