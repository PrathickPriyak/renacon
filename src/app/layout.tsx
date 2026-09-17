import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";

const roboto = Roboto({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Renacon",
    template: "%s | Renacon",
  },
  description:
    "Renacon (Renaatus Procon Private Limited) – South India’s leading AAC blocks and green building materials brand.",
  icons: {
    icon: "https://renacon.in/wp-content/uploads/2023/05/logo-green.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Mirrored Blocksy/WordPress styles for visual parity */}
        {/* eslint-disable-next-line @next/next/no-css-tags */}
        <link rel="stylesheet" href="/wp-mirror/css/renacon-all.css" />
        {/* Interactive layer — bg rhythm + product images + gallery/news/contact ix */}
        {/* eslint-disable-next-line @next/next/no-css-tags */}
        <link
          rel="stylesheet"
          href="/wp-mirror/css/site-overrides.css?v=renacon-live-force-20260917093135-x9k2"
        />
      </head>
      <body className={`renacon-mirror ${roboto.className}`}>{children}</body>
    </html>
  );
}
