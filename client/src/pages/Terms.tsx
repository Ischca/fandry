import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl py-12">
        <Link href="/">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="h-4 w-4 mr-2" />
            トップに戻る
          </Button>
        </Link>

        <h1 className="text-3xl font-bold mb-8">利用規約</h1>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <p className="text-muted-foreground">最終更新日: 2024年12月1日</p>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">第1条（適用）</h2>
            <p>
              本規約は、Fandry（以下「本サービス」）の利用に関する条件を定めるものです。
              ユーザーは本規約に同意の上、本サービスを利用するものとします。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">第2条（利用資格）</h2>
            <p>本サービスは、以下の条件を満たす方のみ利用できます。</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>18歳以上であること</li>
              <li>本規約に同意すること</li>
              <li>過去に本サービスの利用を停止されていないこと</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">第3条（アカウント）</h2>
            <p>
              ユーザーは、自己の責任においてアカウントを管理するものとします。
              アカウントの不正使用により生じた損害について、当社は一切の責任を負いません。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">第4条（禁止事項）</h2>
            <p>ユーザーは、以下の行為を行ってはなりません。</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>法令または公序良俗に違反する行為</li>
              <li>犯罪行為に関連する行為</li>
              <li>児童ポルノ、児童虐待に関するコンテンツの投稿</li>
              <li>非合意のコンテンツ（リベンジポルノ等）の投稿</li>
              <li>他者の権利（著作権、肖像権等）を侵害する行為</li>
              <li>本サービスの運営を妨害する行為</li>
              <li>不正アクセス、ハッキング行為</li>
              <li>他のユーザーへの嫌がらせ、脅迫行為</li>
              <li>虚偽の情報を登録する行為</li>
              <li>マネーロンダリングに関連する行為</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">第5条（コンテンツ）</h2>
            <p>
              本サービスでは成人向けコンテンツの投稿が許可されています。
              ただし、以下のコンテンツは厳禁です。
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>18歳未満の人物が関与するコンテンツ</li>
              <li>非合意のコンテンツ</li>
              <li>違法なコンテンツ</li>
              <li>著作権を侵害するコンテンツ</li>
            </ul>
            <p className="mt-4">
              クリエイターは、投稿するコンテンツに関するすべての権利を有していることを保証するものとします。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">第6条（決済・返金）</h2>
            <p>
              本サービスの決済はSegpayを通じて処理されます。
              決済に関する詳細はSegpayの利用規約に準じます。
            </p>
            <p className="mt-4">
              デジタルコンテンツの性質上、購入後の返金は原則として行いません。
              ただし、技術的な問題によりコンテンツにアクセスできない場合は、
              サポートまでお問い合わせください。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">第7条（手数料）</h2>
            <p>クリエイターの収益から以下の手数料が差し引かれます。</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>投げ銭: 8%</li>
              <li>有料コンテンツ販売: 10%</li>
              <li>メンバーシップ: 10%</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">第8条（免責事項）</h2>
            <p>
              当社は、本サービスの完全性、正確性、確実性、有用性等について、
              いかなる保証も行いません。ユーザー間のトラブルについて、
              当社は一切の責任を負いません。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">第9条（サービスの変更・終了）</h2>
            <p>
              当社は、ユーザーへの事前通知なく、本サービスの内容を変更、
              または提供を終了することができます。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">第10条（規約の変更）</h2>
            <p>
              当社は、必要に応じて本規約を変更することができます。
              変更後の規約は、本サービス上に掲載した時点で効力を生じるものとします。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">第11条（準拠法・管轄）</h2>
            <p>
              本規約の解釈は日本法に準拠し、本サービスに関する紛争については、
              東京地方裁判所を第一審の専属的合意管轄裁判所とします。
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
