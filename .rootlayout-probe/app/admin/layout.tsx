export const metadata = { robots: { index: false, follow: false } };
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
