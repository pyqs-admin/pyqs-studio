import { HeaderProvider } from "@/components/layout/header-context";
import { StudioShell } from "@/components/layout/studio-shell";

export default function StudioLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <HeaderProvider>
      <StudioShell>{children}</StudioShell>
    </HeaderProvider>
  );
}
