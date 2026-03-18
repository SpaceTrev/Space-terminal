import { AppShell } from "@/components/AppShell";
import { getAvailableProviders } from "@/lib/aiConfig";

export default function Home() {
  const availableProviders = getAvailableProviders();
  return <AppShell availableProviders={availableProviders} />;
}
