import React, { useState, useEffect } from "react";

interface ClientOnlySectionProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ClientOnlySection({
  children,
  fallback,
}: ClientOnlySectionProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
