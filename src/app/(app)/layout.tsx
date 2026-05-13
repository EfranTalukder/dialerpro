import Nav from "@/components/Nav";
import { TelnyxProvider } from "@/components/TelnyxProvider";
import CallOverlay from "@/components/CallOverlay";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <TelnyxProvider>
      <div className="min-h-screen flex">
        <Nav />
        <main className="flex-1 min-w-0">{children}</main>
        <CallOverlay />
      </div>
    </TelnyxProvider>
  );
}
