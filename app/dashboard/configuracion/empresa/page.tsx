import {
  Building2,
  CheckCircle2,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";

export default function EmpresaPage() {
  return (
    <div className="space-y-7">
      <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">
              Configuración general
            </p>

            <h2 className="mt-2 text-3xl font-black text-slate-950">
              Datos de la empresa
            </h2>

            <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-500">
              Registra la información principal que aparecerá en reportes,
              formatos de producción y documentos internos.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">
            <CheckCircle2 className="h-5 w-5" />
            Configuración inicial
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <article className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-black text-slate-700">
                Razón social
              </label>

              <input
                type="text"
                placeholder="Ejemplo: Bulk Tech S.A.C."
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-slate-700">
                Nombre comercial
              </label>

              <input
                type="text"
                placeholder="Ejemplo: BULK TECH"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-slate-700">
                RUC
              </label>

              <input
                type="text"
                maxLength={11}
                placeholder="20123456789"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-black text-slate-700">
                Dirección
              </label>

              <div className="relative">
                <MapPin className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />

                <input
                  type="text"
                  placeholder="Dirección de la planta o sede principal"
                  className="w-full rounded-2xl border border-slate-300 py-3 pl-12 pr-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-slate-700">
                Teléfono
              </label>

              <div className="relative">
                <Phone className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />

                <input
                  type="text"
                  placeholder="987 654 321"
                  className="w-full rounded-2xl border border-slate-300 py-3 pl-12 pr-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-slate-700">
                Correo
              </label>

              <div className="relative">
                <Mail className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />

                <input
                  type="email"
                  placeholder="produccion@empresa.com"
                  className="w-full rounded-2xl border border-slate-300 py-3 pl-12 pr-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-black text-slate-700">
                Estado
              </label>

              <select className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100">
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>
          </div>

          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
            <button
              type="button"
              className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
            >
              Cancelar
            </button>

            <button
              type="button"
              className="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
            >
              Guardar empresa
            </button>
          </div>
        </article>

        <aside className="space-y-6">
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex h-24 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50">
              <Building2 className="h-10 w-10 text-slate-400" />
            </div>

            <h3 className="mt-5 text-lg font-black text-slate-900">
              Logo de la empresa
            </h3>

            <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
              Se utilizará en reportes, encabezados y documentos internos.
            </p>

            <button
              type="button"
              className="mt-5 w-full rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-black text-blue-700 transition hover:bg-blue-100"
            >
              Seleccionar logo
            </button>
          </article>

          <article className="rounded-3xl bg-slate-950 p-6 text-white shadow-xl">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-300">
              Importante
            </p>

            <p className="mt-3 text-sm font-semibold leading-6 text-slate-300">
              Después conectaremos este formulario con Neon para guardar y
              editar la información real de la empresa.
            </p>
          </article>
        </aside>
      </section>
    </div>
  );
}