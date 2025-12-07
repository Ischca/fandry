import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { Heart, Plus, Crown } from "lucide-react";
import { Link, useLocation } from "wouter";
import { PlanFormDialog, PlanListItem } from "./manageplans-components";

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

  const {
    data: plans,
    isLoading,
    refetch,
  } = trpc.subscriptionPlan.getMyPlans.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const createMutation = trpc.subscriptionPlan.create.useMutation({
    onSuccess: () => {
      toast.success("プランを作成しました");
      setDialogOpen(false);
      setFormData(defaultFormData);
      refetch();
    },
    onError: error => {
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
    onError: error => {
      toast.error(`エラー: ${error.message}`);
    },
  });

  const deleteMutation = trpc.subscriptionPlan.delete.useMutation({
    onSuccess: () => {
      toast.success("プランを削除しました");
      setDeleteConfirmId(null);
      refetch();
    },
    onError: error => {
      toast.error(`エラー: ${error.message}`);
    },
  });

  const handleOpenCreate = () => {
    const usedTiers = plans?.map(p => p.tier) || [];
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

    const benefitsJson = JSON.stringify(
      formData.benefits.filter(b => b.trim())
    );

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
            {plans.map(plan => (
              <PlanListItem
                key={plan.id}
                plan={plan}
                onEdit={() => handleOpenEdit(plan)}
                onDelete={() => setDeleteConfirmId(plan.id)}
              />
            ))}
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
      <PlanFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        formData={formData}
        setFormData={setFormData}
        editingPlanId={editingPlanId}
        isPending={createMutation.isPending || updateMutation.isPending}
        onSubmit={handleSubmit}
      />

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
