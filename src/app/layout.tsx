import type { Metadata } from "next";
import { Playfair_Display, DM_Sans, Bodoni_Moda } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  weight: ["400", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-playfair",
});

const bodoni = Bodoni_Moda({
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-bodoni",
});

const dmSans = DM_Sans({
  weight: ["300", "400", "500"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dm",
});

export const metadata: Metadata = {
  title: "Savio Joseph — Photography",
  description: "An aesthetic photography portfolio — capturing stillness, light, and the beauty of everyday moments.",
  openGraph: {
    title: "Savio Joseph — Photography",
    description: "Aesthetic minimalist photography portfolio.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${bodoni.variable} ${dmSans.variable}`}>
      <head>
        <link rel="preconnect" href="https://use.typekit.net" crossOrigin="anonymous" />
      </head>
      <body className={dmSans.className}>{children}</body>
    </html>
  );
}
