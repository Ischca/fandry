export function Head() {
  return (
    <>
      {/* 基本SEO */}
      <meta name="keywords" content="クリエイター支援,投げ銭,パトロン,ファンサイト,有料コンテンツ,月額支援,メンバーシップ,応援,サブスクリプション" />
      <meta name="author" content="Fandry" />
      <meta name="robots" content="index, follow" />

      {/* OGP (Open Graph Protocol) */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Fandry" />
      <meta property="og:locale" content="ja_JP" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@fandry_app" />

      {/* Favicon */}
      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="manifest" href="/site.webmanifest" />
      <meta name="theme-color" content="#E05A3A" />

      {/* 追加のメタ情報 */}
      <meta name="format-detection" content="telephone=no" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="Fandry" />

      {/* 構造化データ (JSON-LD) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "Fandry",
            "description": "クリエイターとファンをつなぐパトロン型支援プラットフォーム",
            "url": "https://fndry.app",
            "applicationCategory": "SocialNetworkingApplication",
            "operatingSystem": "Web",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "JPY"
            },
            "author": {
              "@type": "Organization",
              "name": "Fandry"
            }
          })
        }}
      />
    </>
  );
}
