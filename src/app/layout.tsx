import type { Metadata } from "next";



export const metadata: Metadata = {
  title: "Technam p2002jf Flight Calculator",
  description: "This flight Calculator is used to calculate preflight calculations for Technam p2002jf",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body >
        {children}
      </body>
    </html>
  );
}
