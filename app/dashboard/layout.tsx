import MobileDashboardNav from "@/components/dashboard/mobile-dashboard-nav";
import Sidebar from "@/components/dashboard/sidebar";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-slate-100">
      <Sidebar />

      <main className="min-h-screen lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-5 sm:py-4 md:px-8">
          <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <MobileDashboardNav />

              <div className="min-w-0">
                <p className="truncate text-[10px] font-black uppercase tracking-[0.16em] text-blue-600 sm:text-xs sm:tracking-[0.18em]">
                  Sistema industrial
                </p>

                <h1 className="mt-0.5 truncate text-base font-black text-slate-900 sm:mt-1 sm:text-xl">
                  Gestión de Producción IBC
                </h1>
              </div>
            </div>

            <div className="hidden shrink-0 text-right sm:block">
              <p className="text-sm font-black text-slate-900">
                Planta principal
              </p>

              <p className="text-xs font-semibold text-slate-500">
                Operación activa
              </p>
            </div>

            <div className="shrink-0 sm:hidden">
              <span className="inline-flex h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]" />
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1600px] p-3 sm:p-5 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}