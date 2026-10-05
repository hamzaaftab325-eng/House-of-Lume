import { StoreExperienceProvider } from "@/components/providers/store-experience-provider";
import { StoreFooter, StoreHeader } from "@/components/store/store-shell";

export default function StoreLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <StoreExperienceProvider>
      <StoreHeader />
      {children}
      <StoreFooter />
    </StoreExperienceProvider>
  );
}
