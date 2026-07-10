import type { Metadata, Viewport } from "next";
import { Fredoka } from "next/font/google";
import "./globals.css";
import { Providers } from "@/providers/providers";
import { getOrigin } from "@/lib/url";

const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const viewport: Viewport = {
  themeColor: "#0ea5e9",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  interactiveWidget: "resizes-content",
};

export const generateMetadata = async (): Promise<Metadata> => {
  const origin = await getOrigin();

  return {
    metadataBase: new URL(origin || "http://localhost:3000"),
    title: {
      default: "Guess My Mess | Free Multiplayer Drawing & Guessing Game",
      template: "%s | Guess My Mess",
    },
    description:
      "Ready, set, draw! Join the ultimate drawing party with your friends. Sketch hilarious prompts, guess crazy doodles, and see who takes the crown!",
    keywords: [
      "draw",
      "guess",
      "multiplayer",
      "game",
      "pictionary",
      "real-time",
      "online game",
      "party game",
      "drawing",
    ],
    authors: [{ name: "PRAS Samin", url: "https://pras.me" }],
    creator: "PRAS Samin",
    publisher: "PRAS Samin",
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: "/",
      title: "Guess My Mess | Free Multiplayer Drawing & Guessing Game",
      description:
        "Ready, set, draw! Join the ultimate drawing party with your friends. Sketch hilarious prompts, guess crazy doodles, and see who takes the crown!",
      siteName: "Guess My Mess",
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: "Guess My Mess Preview",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Guess My Mess | Free Multiplayer Drawing & Guessing Game",
      description:
        "Ready, set, draw! Join the ultimate drawing party with your friends. Sketch hilarious prompts, guess crazy doodles, and see who takes the crown!",
      images: ["/og-image.png"],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const origin = await getOrigin();

  return (
    <html lang="en" className="scrollbar-hidden">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.url = new URL("${origin}");`,
          }}
        />
      </head>
      <body
        className={`${fredoka.className} bg-linear-to-b from-[#0ea5e9] via-[#38bdf8] to-[#bae6fd] text-slate-800 min-h-dvh scrollbar-hidden`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
