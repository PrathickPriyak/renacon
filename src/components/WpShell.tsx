import { FloatingSideMenu } from "@/components/FloatingSideMenu";
import { FormBridge } from "@/components/FormBridge";
import { WpInteractions } from "@/components/WpInteractions";
import { readPartial } from "@/lib/wpPages";

export function WpShell({ children }: { children: React.ReactNode }) {
  const header = readPartial("_header.html");
  const footer = readPartial("_footer.html");
  const offcanvas = readPartial("_offcanvas.html");

  return (
    <div className="renacon-mirror">
      <div dangerouslySetInnerHTML={{ __html: offcanvas }} />
      <div dangerouslySetInnerHTML={{ __html: header }} />
      {children}
      <div dangerouslySetInnerHTML={{ __html: footer }} />
      <FloatingSideMenu />
      <WpInteractions />
      <FormBridge />
    </div>
  );
}

export function WpMain({ html }: { html: string }) {
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
