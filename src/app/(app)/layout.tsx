import Nav from "@/components/Nav";
import MobileNav from "@/components/MobileNav";
import MobileHeader from "@/components/MobileHeader";
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
        <div className="flex-1 min-w-0 flex flex-col">
          <MobileHeader />
          <main className="flex-1 min-w-0 pb-20 md:pb-0">{children}</main>
        </div>
        <CallOverlay />
        <DispositionModal />
        <PowerDialerFromPicker />
        <PowerDialerBanner />
        <QuickCallFAB />
        <MobileNav />
      </div>
    </TelnyxProvider>
  );
}
