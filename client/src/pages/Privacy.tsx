import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl py-12">
        <Link href="/">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="h-4 w-4 mr-2" />
            トップに戻る
          </Button>
        </Link>

        <h1 className="text-3xl font-bold mb-8">プライバシーポリシー</h1>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <p className="text-muted-foreground">最終更新日: 2024年12月1日</p>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">1. はじめに</h2>
            <p>
              Fandry（以下「本サービス」）は、ユーザーのプライバシーを尊重し、
              個人情報の保護に努めます。本ポリシーは、当社が収集する情報、
              その使用方法、およびユーザーの権利について説明します。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">2. 収集する情報</h2>

            <h3 className="text-lg font-medium mt-6 mb-3">2.1 アカウント情報</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>メールアドレス</li>
              <li>ユーザー名・表示名</li>
              <li>プロフィール画像</li>
              <li>認証情報（Clerk経由）</li>
            </ul>

            <h3 className="text-lg font-medium mt-6 mb-3">2.2 決済情報</h3>
            <p>
              決済情報（クレジットカード番号等）は、決済代行会社Segpayが
              直接管理します。当社はこれらの情報を保持しません。
            </p>

            <h3 className="text-lg font-medium mt-6 mb-3">2.3 利用データ</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>アクセスログ（IPアドレス、ブラウザ情報）</li>
              <li>利用履歴（閲覧、購入、投稿等）</li>
              <li>デバイス情報</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">3. 情報の利用目的</h2>
            <p>収集した情報は以下の目的で利用します。</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>本サービスの提供・運営</li>
              <li>ユーザー認証・アカウント管理</li>
              <li>決済処理</li>
              <li>カスタマーサポート</li>
              <li>サービス改善・新機能開発</li>
              <li>不正利用の防止</li>
              <li>法令遵守</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">4. 情報の共有</h2>
            <p>以下の場合を除き、ユーザーの個人情報を第三者に提供しません。</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>ユーザーの同意がある場合</li>
              <li>サービス提供に必要な業務委託先（決済代行等）</li>
              <li>法令に基づく開示請求があった場合</li>
              <li>ユーザーまたは第三者の生命・財産を保護するために必要な場合</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">5. データの保管</h2>
            <p>
              ユーザーデータは、サービス提供に必要な期間保管されます。
              アカウント削除後、一定期間（通常30日）経過後にデータを削除します。
              ただし、法令で保管が義務付けられている情報は、
              その期間保管を継続します。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">6. セキュリティ</h2>
            <p>当社は、適切な技術的・組織的措置を講じて個人情報を保護します。</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>SSL/TLSによる通信の暗号化</li>
              <li>データベースの暗号化</li>
              <li>アクセス制御</li>
              <li>定期的なセキュリティ監査</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">7. Cookie</h2>
            <p>
              本サービスでは、ユーザー体験向上のためにCookieを使用します。
              Cookieは、認証状態の維持、利用分析等に使用されます。
              ブラウザの設定でCookieを無効にすることができますが、
              一部の機能が利用できなくなる場合があります。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">8. ユーザーの権利</h2>
            <p>ユーザーは以下の権利を有します。</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>個人情報へのアクセス権</li>
              <li>個人情報の訂正・削除を求める権利</li>
              <li>個人情報の利用停止を求める権利</li>
              <li>データポータビリティの権利</li>
            </ul>
            <p className="mt-4">
              これらの権利を行使する場合は、サポートまでお問い合わせください。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">9. 未成年者のプライバシー</h2>
            <p>
              本サービスは18歳以上の方を対象としています。
              18歳未満の方の個人情報を意図的に収集することはありません。
              18歳未満の方の情報が含まれていることが判明した場合、
              速やかに削除します。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">10. ポリシーの変更</h2>
            <p>
              本ポリシーは、法令の変更やサービスの変更に伴い、
              予告なく変更される場合があります。重要な変更がある場合は、
              本サービス上で通知します。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">11. お問い合わせ</h2>
            <p>
              本ポリシーに関するお問い合わせは、以下までご連絡ください。
            </p>
            <p className="mt-2">
              メール: support@fndry.app
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
