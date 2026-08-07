export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-24 pb-8 min-h-screen">
      {children}
    </main>
  );
}
