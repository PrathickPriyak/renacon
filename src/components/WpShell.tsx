import { FloatingSideMenu } from "@/components/FloatingSideMenu";
import { FormBridge } from "@/components/FormBridge";
import { InvolveMeEmbeds } from "@/components/InvolveMeEmbeds";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteOffcanvas } from "@/components/SiteOffcanvas";
import { WpInteractions } from "@/components/WpInteractions";

export function WpShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="renacon-mirror">
      <SiteOffcanvas />
      <SiteHeader />
      {children}
      <SiteFooter />
      <FloatingSideMenu />
      <WpInteractions />
      <InvolveMeEmbeds />
      <FormBridge />
    </div>
  );
}

export function WpMain({ html }: { html: string }) {
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
