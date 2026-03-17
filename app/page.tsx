import BloombergDashboard from "@/components/terminal/BloombergDashboard";
import { getAvailableProviders } from "@/lib/aiConfig";

export default function Home() {
  const availableProviders = getAvailableProviders();
  return <BloombergDashboard availableProviders={availableProviders} />;
}
