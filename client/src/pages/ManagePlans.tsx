import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Heart, Plus, Edit2, Trash2, Crown, Users, X } from "lucide-react";
import { Link, useLocation } from "wouter";

interface PlanFormData {
  name: string;
  description: string;
  price: number;
  tier: number;
  benefits: string[];
}

const defaultFormData: PlanFormData = {
  name: "",
  description: "",
  price: 500,
  tier: 1,
  benefits: [""],
};

export default function ManagePlans() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<number | null>(null);
  const [formData, setFormData] = useState<PlanFormData>(defaultFormData);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const { data: plans, isLoading, refetch } = trpc.subscriptionPlan.getMyPlans.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const createMutation = trpc.subscriptionPlan.create.useMutation({
    onSuccess: () => {
      toast.success("プランを作成しました");
      setDialogOpen(false);
      setFormData(defaultFormData);
      refetch();
    },
    onError: (error) => {
      if (error.message.includes("tier level already exists")) {
        toast.error("このティアレベルは既に使用されています");
      } else {
        toast.error(`エラー: ${error.message}`);
      }
    },
  });

  const updateMutation = trpc.subscriptionPlan.update.useMutation({
    onSuccess: () => {
      toast.success("プランを更新しました");
      setDialogOpen(false);
      setEditingPlanId(null);
      setFormData(defaultFormData);
      refetch();
    },
    onError: (error) => {
      toast.error(`エラー: ${error.message}`);
    },
  });

  const deleteMutation = trpc.subscriptionPlan.delete.useMutation({
    onSuccess: () => {
      toast.success("プランを削除しました");
      setDeleteConfirmId(null);
      refetch();
    },
    onError: (error) => {
      toast.error(`エラー: ${error.message}`);
    },
  });

  const handleOpenCreate = () => {
    // Find next available tier
    const usedTiers = plans?.map((p) => p.tier) || [];
    let nextTier = 1;
    while (usedTiers.includes(nextTier)) {
      nextTier++;
    }

    setEditingPlanId(null);
    setFormData({
      ...defaultFormData,
      tier: nextTier,
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (plan: NonNullable<typeof plans>[number]) => {
    let benefits: string[] = [""];
    try {
      const parsed = plan.benefits ? JSON.parse(plan.benefits) : [];
      benefits = parsed.length > 0 ? parsed : [""];
    } catch {
      benefits = [""];
    }

    setEditingPlanId(plan.id);
    setFormData({
      name: plan.name,
      description: plan.description || "",
      price: plan.price,
      tier: plan.tier,
      benefits,
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error("プラン名を入力してください");
      return;
    }

    const benefitsJson = JSON.stringify(formData.benefits.filter((b) => b.trim()));

    if (editingPlanId) {
      updateMutation.mutate({
        id: editingPlanId,
        name: formData.name,
        description: formData.description || undefined,
        price: formData.price,
        benefits: benefitsJson,
      });
    } else {
      createMutation.mutate({
        name: formData.name,
        description: formData.description || undefined,
        price: formData.price,
        tier: formData.tier,
        benefits: benefitsJson,
      });
    }
  };

  const addBenefit = () => {
    setFormData((prev) => ({
      ...prev,
      benefits: [...prev.benefits, ""],
    }));
  };

  const removeBenefit = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index),
    }));
  };

  const updateBenefit = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      benefits: prev.benefits.map((b, i) => (i === index ? value : b)),
    }));
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">読み込み中...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    setLocation("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ヘッダー */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-primary fill-primary" />
            <span className="text-xl font-bold">Fandry</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/my">
              <Button variant="ghost">マイページ</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container max-w-4xl py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">月額支援プラン管理</h1>
            <p className="text-muted-foreground">
              ファンが加入できるプランを設定しましょう
            </p>
          </div>
          <Button onClick={handleOpenCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            新しいプラン
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            読み込み中...
          </div>
        ) : plans && plans.length > 0 ? (
          <div className="grid gap-4">
            {plans.map((plan) => {
              let benefits: string[] = [];
              try {
                benefits = plan.benefits ? JSON.parse(plan.benefits) : [];
              } catch {
                benefits = [];
              }

              return (
                <Card key={plan.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                          <Crown className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{plan.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            ティア {plan.tier}
                          </p>
                        </div>
                        <div className="ml-auto text-right">
                          <p className="text-2xl font-bold">
                            ¥{plan.price.toLocaleString()}
                            <span className="text-sm font-normal text-muted-foreground">
                              /月
                            </span>
                          </p>
                        </div>
                      </div>

                      {plan.description && (
                        <p className="text-sm text-muted-foreground mb-3">
                          {plan.description}
                        </p>
                      )}

                      {benefits.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            特典:
                          </p>
                          <ul className="space-y-1">
                            {benefits.map((benefit, i) => (
                              <li
                                key={i}
                                className="text-sm flex items-start gap-2"
                              >
                                <span className="text-primary">✓</span>
                                {benefit}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {plan.subscriberCount}人が加入中
                        </span>
                        {plan.isActive === 0 && (
                          <span className="text-destructive">非公開</span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleOpenEdit(plan)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteConfirmId(plan.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Crown className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              まだプランがありません
            </h3>
            <p className="text-muted-foreground mb-4">
              月額支援プランを作成して、ファンからの継続的なサポートを受けましょう
            </p>
            <Button onClick={handleOpenCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              最初のプランを作成
            </Button>
          </Card>
        )}
      </main>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
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
                  onChange={(e) =>
                    setFormData((prev) => ({
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
                  onChange={(e) =>
                    setFormData((prev) => ({
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
                onChange={(e) =>
                  setFormData((prev) => ({
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
                      onChange={(e) => updateBenefit(index, e.target.value)}
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
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              キャンセル
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending
                ? "保存中..."
                : editingPlanId
                ? "更新"
                : "作成"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmId !== null}
        onOpenChange={() => setDeleteConfirmId(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>プランを削除しますか？</DialogTitle>
            <DialogDescription>
              この操作は取り消せません。現在の加入者がいる場合、サービスに影響する可能性があります。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteConfirmId) {
                  deleteMutation.mutate({ id: deleteConfirmId });
                }
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "削除中..." : "削除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
