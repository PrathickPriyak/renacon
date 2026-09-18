import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";

const roboto = Roboto({
  weight: ["400", "500", "600", "700"],
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
    icon: "/assets/wp-content/uploads/2023/05/logo-green.png",
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
        {/* eslint-disable-next-line @next/next/no-css-tags */}
        <link
          rel="stylesheet"
          href="/wp-mirror/css/design-tokens.css?v=renacon-global-chrome-202609171445"
        />
        {/* Interactive layer — bg rhythm + product images + gallery/news/contact ix */}
        {/* eslint-disable-next-line @next/next/no-css-tags */}
        <link
          rel="stylesheet"
          href="/wp-mirror/css/site-overrides.css?v=renacon-local-media-202609181145"
        />
        {/* eslint-disable-next-line @next/next/no-css-tags */}
        <link
          rel="stylesheet"
          href="/wp-mirror/css/header-blocksy-in.css?v=renacon-final-visual-qa-202609171825"
        />
      </head>
      <body
        className={`renacon-mirror ${roboto.className}`}
        data-header="type-1:sticky"
        data-prefix="single_page"
        data-footer="type-1"
      >
        {children}
      </body>
    </html>
  );
}
