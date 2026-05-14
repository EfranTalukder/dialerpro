import Nav from "@/components/Nav";
import { TelnyxProvider } from "@/components/TelnyxProvider";
import CallOverlay from "@/components/CallOverlay";
import DispositionModal from "@/components/DispositionModal";
import PowerDialerBanner from "@/components/PowerDialerBanner";
import PowerDialerFromPicker from "@/components/PowerDialerFromPicker";
import QuickCallFAB from "@/components/QuickCallFAB";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <TelnyxProvider>
      <div className="min-h-screen flex">
        <Nav />
        <main className="flex-1 min-w-0">{children}</main>
        <CallOverlay />
        <DispositionModal />
        <PowerDialerFromPicker />
        <PowerDialerBanner />
        <QuickCallFAB />
      </div>
    </TelnyxProvider>
  );
}
