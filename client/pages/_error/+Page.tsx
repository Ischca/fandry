import { usePageContext } from "vike-react/usePageContext";

export default function ErrorPage() {
  const { abortReason, abortStatusCode, is404 } = usePageContext();

  if (is404) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
        <p className="mt-4 text-xl text-muted-foreground">
          ページが見つかりませんでした
        </p>
        <a
          href="/"
          className="mt-8 rounded-md bg-primary px-6 py-3 text-primary-foreground hover:bg-primary/90"
        >
          ホームに戻る
        </a>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-6xl font-bold text-muted-foreground">
        {abortStatusCode || "Error"}
      </h1>
      <p className="mt-4 text-xl text-muted-foreground">
        {typeof abortReason === "string"
          ? abortReason
          : "エラーが発生しました"}
      </p>
      <a
        href="/"
        className="mt-8 rounded-md bg-primary px-6 py-3 text-primary-foreground hover:bg-primary/90"
      >
        ホームに戻る
      </a>
    </div>
  );
}
