import "../src/index.css";

// vike-react handles <html> and <body> automatically
// Layout should only contain content that goes inside the body
export function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
