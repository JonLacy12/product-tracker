import { useAuthStore } from "@/store/useAuthStore";
import { useSessionStore } from "@/store/useSessionStore";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthScreen } from "@/components/AuthScreen";
import { LockScreen } from "@/components/LockScreen";
import { Toasts } from "@/components/Toasts";
import Tracker from "@/components/Tracker";

function AppShell() {
  const session = useAuthStore((s) => s.session);
  const authLoading = useAuthStore((s) => s.loading);
  const locked = useSessionStore((s) => s.locked);
  useSessionTimeout();

  if (authLoading) return null;
  if (!session) return <AuthScreen />;
  if (locked) return <LockScreen />;
  return <Tracker />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppShell />
      <Toasts />
    </ErrorBoundary>
  );
}
