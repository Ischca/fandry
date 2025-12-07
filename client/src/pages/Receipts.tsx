import { useState, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Header } from "@/components/Header";
import { trpc } from "@/lib/trpc";
import {
  Receipt,
  Gift,
  ShoppingCart,
  Crown,
  Download,
  Loader2,
  Sparkles,
  FileText,
  Printer,
} from "lucide-react";
import { useLocation } from "wouter";

const TYPE_CONFIG = {
  tip: { label: "チップ", icon: Gift, color: "text-primary bg-primary/10" },
  purchase: { label: "コンテンツ購入", icon: ShoppingCart, color: "text-blue-600 bg-blue-500/10" },
  subscription: { label: "サブスクリプション", icon: Crown, color: "text-purple-600 bg-purple-500/10" },
};

export default function Receipts() {
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedReceipt, setSelectedReceipt] = useState<{
    type: "tip" | "purchase" | "subscription";
    id: number;
  } | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  const { data: purchases, isLoading: loadingPurchases } =
    trpc.receipt.getMyPurchases.useQuery({ limit: 100 }, { enabled: isAuthenticated });

  const { data: receiptData, isLoading: loadingReceipt } = trpc.receipt.getReceipt.useQuery(
    selectedReceipt ? { type: selectedReceipt.type, id: selectedReceipt.id } : { type: "tip", id: 0 },
    { enabled: !!selectedReceipt }
  );

  const handlePrint = () => {
    if (receiptRef.current) {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>領収書 - ${receiptData?.receiptNumber}</title>
            <style>
              body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; }
              .receipt { border: 2px solid #333; padding: 30px; }
              .header { text-align: center; border-bottom: 1px solid #ddd; padding-bottom: 20px; margin-bottom: 20px; }
              .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
              .receipt-number { color: #666; font-size: 14px; }
              .section { margin-bottom: 20px; }
              .label { color: #666; font-size: 12px; margin-bottom: 4px; }
              .value { font-size: 16px; }
              .amount { font-size: 32px; font-weight: bold; text-align: center; margin: 30px 0; }
              .footer { text-align: center; border-top: 1px solid #ddd; padding-top: 20px; margin-top: 20px; font-size: 12px; color: #666; }
              .stamp { display: inline-block; border: 2px solid #333; border-radius: 50%; width: 60px; height: 60px; line-height: 60px; text-align: center; font-weight: bold; margin-top: 20px; }
              @media print { body { padding: 0; } }
            </style>
          </head>
          <body>
            <div class="receipt">
              <div class="header">
                <div class="title">領 収 書</div>
                <div class="receipt-number">No. ${receiptData?.receiptNumber}</div>
              </div>

              <div class="section">
                <div class="label">発行日</div>
                <div class="value">${receiptData?.date}</div>
              </div>

              <div class="section">
                <div class="label">宛名</div>
                <div class="value">${receiptData?.buyerName} 様</div>
              </div>

              <div class="amount">¥${receiptData?.amount?.toLocaleString()}-</div>

              <div class="section">
                <div class="label">但し</div>
                <div class="value">${receiptData?.description}</div>
              </div>

              <div class="section">
                <div class="label">発行者</div>
                <div class="value">${receiptData?.serviceName}</div>
                <div style="font-size: 12px; color: #666;">${receiptData?.serviceUrl}</div>
              </div>

              <div class="footer">
                <p>上記金額正に領収いたしました</p>
                <div class="stamp">済</div>
              </div>
            </div>
          </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
            <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-primary animate-pulse" />
          </div>
          <p className="text-muted-foreground font-medium">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    setLocation("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <Header />

      <main className="container max-w-4xl py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Receipt className="h-8 w-8" />
              領収書
            </h1>
            <p className="text-muted-foreground">購入履歴と領収書の発行</p>
          </div>
        </div>

        {loadingPurchases ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : purchases && purchases.length > 0 ? (
          <div className="space-y-4">
            {purchases.map((item) => {
              const config = TYPE_CONFIG[item.type];
              const Icon = config.icon;
              return (
                <Card
                  key={`${item.type}-${item.id}`}
                  className="p-4 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center ${config.color}`}
                      >
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-bold">¥{item.amount.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(item.date).toLocaleDateString("ja-JP")} | {item.creatorName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground hidden sm:block">
                        {item.receiptNumber}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        onClick={() =>
                          setSelectedReceipt({ type: item.type, id: item.id })
                        }
                      >
                        <FileText className="h-4 w-4" />
                        領収書
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Receipt className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-bold mb-2">購入履歴がありません</h2>
            <p className="text-muted-foreground">
              チップやコンテンツを購入すると、ここに履歴が表示されます
            </p>
          </Card>
        )}
      </main>

      {/* 領収書モーダル */}
      <Dialog open={!!selectedReceipt} onOpenChange={() => setSelectedReceipt(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              領収書
            </DialogTitle>
          </DialogHeader>

          {loadingReceipt ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : receiptData ? (
            <div ref={receiptRef}>
              <div className="border-2 border-foreground/20 rounded-lg p-6 bg-card">
                {/* ヘッダー */}
                <div className="text-center border-b pb-4 mb-4">
                  <h2 className="text-2xl font-bold">領 収 書</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    No. {receiptData.receiptNumber}
                  </p>
                </div>

                {/* 発行日 */}
                <div className="mb-4">
                  <p className="text-xs text-muted-foreground">発行日</p>
                  <p className="font-medium">{receiptData.date}</p>
                </div>

                {/* 宛名 */}
                <div className="mb-6">
                  <p className="text-xs text-muted-foreground">宛名</p>
                  <p className="font-medium">{receiptData.buyerName} 様</p>
                </div>

                {/* 金額 */}
                <div className="text-center py-6 border-y">
                  <p className="text-4xl font-bold">
                    ¥{receiptData.amount.toLocaleString()}-
                  </p>
                </div>

                {/* 但し書き */}
                <div className="my-4">
                  <p className="text-xs text-muted-foreground">但し</p>
                  <p className="font-medium">{receiptData.description}</p>
                </div>

                {/* 発行者 */}
                <div className="border-t pt-4">
                  <p className="text-xs text-muted-foreground">発行者</p>
                  <p className="font-medium">{receiptData.serviceName}</p>
                  <p className="text-sm text-muted-foreground">{receiptData.serviceUrl}</p>
                </div>

                {/* 受領印 */}
                <div className="flex justify-end mt-6">
                  <div className="w-16 h-16 rounded-full border-2 border-foreground/30 flex items-center justify-center">
                    <span className="font-bold text-lg">済</span>
                  </div>
                </div>
              </div>

              {/* アクションボタン */}
              <div className="flex gap-2 mt-4">
                <Button className="flex-1 gap-2" onClick={handlePrint}>
                  <Printer className="h-4 w-4" />
                  印刷
                </Button>
                <Button variant="outline" className="flex-1 gap-2" onClick={handlePrint}>
                  <Download className="h-4 w-4" />
                  PDFで保存
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
