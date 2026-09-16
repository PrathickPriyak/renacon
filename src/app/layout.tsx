import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import "./globals.css";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: {
    default: "Renacon | AAC Blocks & Green Building Materials",
    template: "%s | Renacon",
  },
  description:
    "Renacon (Renaatus Procon Private Limited) is South India’s leading manufacturer of AAC blocks, Renabond, Renaplast, Renafix adhesives and Rapid Wall panels.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${sans.variable} min-h-screen bg-[#f6fbf8] antialiased`}>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
