"use client";

import {
  CalendarDays,
  ClipboardList,
  Eye,
  Factory,
  Filter,
  Gauge,
  LoaderCircle,
  PackageCheck,
  Pencil,
  RefreshCcw,
  Search,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type RegistroProduccion = {
  id: string;
  fechaProduccion: string;
  semana: number;
  mes: number;
  anio: number;
  lote: string;
  ordenProduccion: string;
  estado: "BORRADOR" | "FINALIZADO" | "ANULADO";
  creadoEn: string;
  planta: {
    id: string;
    codigo: string;
    nombre: string;
  };
  turno: {
    id: string;
    codigo: string;
    nombre: string;
  };
  lineaProduccion: {
    id: string;
    codigo: string;
    nombre: string;
  };
  maquina: {
    id: string;
    codigo: string;
    nombre: string;
  };
  operador: {
    id: string;
    codigo: string;
    nombre: string;
  };
  productoProceso: {
    id: string;
    codigo: string;
    codigoSap: string | null;
    nombre: string;
  };
  productoTerminado: {
    id: string;
    codigo: string;
    codigoSap: string | null;
    nombre: string;
  };
  materialVirgen: {
    id: string;
    codigo: string;
    codigoSap: string | null;
    nombre: string;
  } | null;
  materialMolido: {
    id: string;
    codigo: string;
    codigoSap: string | null;
    nombre: string;
  } | null;
  colorProduccion: {
    id: string;
    codigo: string;
    nombre: string;
  } | null;
  controlProceso: {
    pesoEnvase?: string | null;
    tiempoCicloSegundos?: string | null;
  } | null;
  controlProduccion: {
    programado: number;
    producido: number;
    buenos: number;
    rechazados: number;
    eficiencia: string | number | null;
    porcentajeRechazo: string | number | null;
    cumplimientoPrograma: string | number | null;
    produccionPorHora: string | number | null;
  } | null;
  controlMolienda: {
    pesoRecuperable: string | number;
    pesoNoRecuperable: string | number;
    pesoBarrido: string | number;
    pesoTotal: string | number;
  } | null;
  consumosMateriaPrima: Array<{
    id: string;
    cantidadInicial: string | number;
    cantidadConsumida: string | number;
    cantidadFinal: string | number;
    consumoEstandarEnvase: string | number | null;
    consumoRealEnvase: string | number | null;
    diferenciaConsumo: string | number | null;
    rendimiento: string | number | null;
    producto: {
      id: string;
      codigo: string;
      codigoSap: string | null;
      nombre: string;
      tipoMateriaPrima: string | null;
      unidadMedida: {
        codigo: string;
        nombre: string;
        simbolo: string;
      } | null;
    };
  }>;
  paradasMaquina: Array<{
    id: string;
    horaInicio: string;
    horaFin: string;
    minutos: number;
    tipo: string;
    motivo: string;
    observaciones: string | null;
  }>;
};

type RespuestaRegistros = {
  ok: boolean;
  mensaje?: string;
  registros: RegistroProduccion[];
};

const nombresMeses = [
  "",
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

function numero(valor: unknown) {
  const convertido = Number(valor ?? 0);
  return Number.isFinite(convertido) ? convertido : 0;
}

function porcentaje(valor: unknown) {
  return `${numero(valor).toFixed(2)}%`;
}

function fechaPeru(fechaTexto: string) {
  const [anio, mes, dia] = fechaTexto.split("-");
  return `${dia}/${mes}/${anio}`;
}

function nombreTipoParada(tipo: string) {
  const mapa: Record<string, string> = {
    MECANICA: "Mecánica",
    ELECTRICA: "Eléctrica",
    CALIDAD: "Calidad",
    FALTA_MATERIAL: "Falta de material",
    CAMBIO_MOLDE: "Cambio de molde",
    AJUSTE_PROCESO: "Ajuste del proceso",
    OTRA: "Otra",
  };

  return mapa[tipo] ?? tipo;
}

export default function HistorialProduccionPage() {
  const router = useRouter();

  const [registros, setRegistros] = useState<
    RegistroProduccion[]
  >([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [busqueda, setBusqueda] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [turnoId, setTurnoId] = useState("");
  const [lineaId, setLineaId] = useState("");
  const [estado, setEstado] = useState("");

  const [seleccionado, setSeleccionado] =
    useState<RegistroProduccion | null>(null);

  async function cargarRegistros() {
    try {
      setCargando(true);
      setError("");

      const respuesta = await fetch(
        "/api/produccion/registros",
        {
          cache: "no-store",
        },
      );

      const datos =
        (await respuesta.json()) as RespuestaRegistros;

      if (!respuesta.ok || !datos.ok) {
        throw new Error(
          datos.mensaje ??
            "No se pudo cargar el historial.",
        );
      }

      setRegistros(datos.registros);
    } catch (errorDesconocido) {
      setError(
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "No se pudo cargar el historial.",
      );
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    void cargarRegistros();
  }, []);

  const turnos = useMemo(() => {
    const mapa = new Map<
      string,
      RegistroProduccion["turno"]
    >();

    for (const registro of registros) {
      mapa.set(registro.turno.id, registro.turno);
    }

    return Array.from(mapa.values());
  }, [registros]);

  const lineas = useMemo(() => {
    const mapa = new Map<
      string,
      RegistroProduccion["lineaProduccion"]
    >();

    for (const registro of registros) {
      mapa.set(
        registro.lineaProduccion.id,
        registro.lineaProduccion,
      );
    }

    return Array.from(mapa.values());
  }, [registros]);

  const filtrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return registros.filter((registro) => {
      const coincideTexto =
        !texto ||
        registro.lote.toLowerCase().includes(texto) ||
        registro.ordenProduccion
          .toLowerCase()
          .includes(texto) ||
        registro.maquina.nombre
          .toLowerCase()
          .includes(texto) ||
        registro.operador.nombre
          .toLowerCase()
          .includes(texto) ||
        registro.productoTerminado.nombre
          .toLowerCase()
          .includes(texto);

      const coincideDesde =
        !fechaDesde ||
        registro.fechaProduccion >= fechaDesde;

      const coincideHasta =
        !fechaHasta ||
        registro.fechaProduccion <= fechaHasta;

      const coincideTurno =
        !turnoId || registro.turno.id === turnoId;

      const coincideLinea =
        !lineaId ||
        registro.lineaProduccion.id === lineaId;

      const coincideEstado =
        !estado || registro.estado === estado;

      return (
        coincideTexto &&
        coincideDesde &&
        coincideHasta &&
        coincideTurno &&
        coincideLinea &&
        coincideEstado
      );
    });
  }, [
    registros,
    busqueda,
    fechaDesde,
    fechaHasta,
    turnoId,
    lineaId,
    estado,
  ]);

  const resumen = useMemo(() => {
    return filtrados.reduce(
      (acumulado, registro) => {
        acumulado.registros += 1;
        acumulado.producido +=
          registro.controlProduccion?.producido ?? 0;
        acumulado.buenos +=
          registro.controlProduccion?.buenos ?? 0;
        acumulado.rechazados +=
          registro.controlProduccion?.rechazados ?? 0;
        acumulado.minutosParada +=
          registro.paradasMaquina.reduce(
            (total, parada) =>
              total + parada.minutos,
            0,
          );

        return acumulado;
      },
      {
        registros: 0,
        producido: 0,
        buenos: 0,
        rechazados: 0,
        minutosParada: 0,
      },
    );
  }, [filtrados]);

  function limpiarFiltros() {
    setBusqueda("");
    setFechaDesde("");
    setFechaHasta("");
    setTurnoId("");
    setLineaId("");
    setEstado("");
  }

  if (cargando) {
    return (
      <div className="flex min-h-[500px] items-center justify-center rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="text-center">
          <LoaderCircle className="mx-auto h-10 w-10 animate-spin text-blue-600" />

          <p className="mt-4 text-sm font-black text-slate-600">
            Cargando historial de producción...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-blue-950 to-blue-700 p-7 text-white shadow-xl md:p-9">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-200">
          Producción IBC
        </p>

        <h1 className="mt-3 text-3xl font-black md:text-4xl">
          Historial de producción
        </h1>

        <p className="mt-3 max-w-3xl text-sm font-medium leading-7 text-slate-200 md:text-base">
          Consulte los registros por fecha, turno, línea,
          lote, orden de producción y estado.
        </p>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50">
              <Filter className="h-5 w-5 text-blue-600" />
            </div>

            <div>
              <h2 className="font-black text-slate-950">
                Filtros
              </h2>

              <p className="text-sm font-medium text-slate-500">
                Refine los resultados del historial.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={limpiarFiltros}
              className="flex items-center justify-center gap-2 rounded-2xl border border-slate-300 px-4 py-2.5 text-sm font-black text-slate-700 transition hover:bg-slate-50"
            >
              <X className="h-4 w-4" />
              Limpiar filtros
            </button>

            <button
              type="button"
              onClick={() => void cargarRegistros()}
              className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-black text-white transition hover:bg-blue-700"
            >
              <RefreshCcw className="h-4 w-4" />
              Actualizar
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <div className="relative xl:col-span-2">
            <Search className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-slate-400" />

            <input
              value={busqueda}
              onChange={(evento) =>
                setBusqueda(evento.target.value)
              }
              placeholder="Lote, orden, máquina, operador..."
              className="w-full rounded-2xl border border-slate-300 py-3 pl-12 pr-4 text-sm font-semibold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <input
            type="date"
            value={fechaDesde}
            onChange={(evento) =>
              setFechaDesde(evento.target.value)
            }
            className={claseCampo}
          />

          <input
            type="date"
            value={fechaHasta}
            onChange={(evento) =>
              setFechaHasta(evento.target.value)
            }
            className={claseCampo}
          />

          <select
            value={turnoId}
            onChange={(evento) =>
              setTurnoId(evento.target.value)
            }
            className={claseCampo}
          >
            <option value="">Todos los turnos</option>

            {turnos.map((turno) => (
              <option key={turno.id} value={turno.id}>
                {turno.codigo} - {turno.nombre}
              </option>
            ))}
          </select>

          <select
            value={lineaId}
            onChange={(evento) =>
              setLineaId(evento.target.value)
            }
            className={claseCampo}
          >
            <option value="">Todas las líneas</option>

            {lineas.map((linea) => (
              <option key={linea.id} value={linea.id}>
                {linea.codigo} - {linea.nombre}
              </option>
            ))}
          </select>

          <select
            value={estado}
            onChange={(evento) =>
              setEstado(evento.target.value)
            }
            className={claseCampo}
          >
            <option value="">Todos los estados</option>
            <option value="BORRADOR">Borrador</option>
            <option value="FINALIZADO">Finalizado</option>
            <option value="ANULADO">Anulado</option>
          </select>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <TarjetaResumen
          titulo="Registros"
          valor={`${resumen.registros}`}
          icono={<ClipboardList className="h-5 w-5" />}
        />

        <TarjetaResumen
          titulo="Producido"
          valor={`${resumen.producido}`}
          icono={<Factory className="h-5 w-5" />}
        />

        <TarjetaResumen
          titulo="Buenos"
          valor={`${resumen.buenos}`}
          icono={<PackageCheck className="h-5 w-5" />}
        />

        <TarjetaResumen
          titulo="Rechazados"
          valor={`${resumen.rechazados}`}
          icono={<Gauge className="h-5 w-5" />}
        />

        <TarjetaResumen
          titulo="Minutos detenidos"
          valor={`${resumen.minutosParada}`}
          icono={<CalendarDays className="h-5 w-5" />}
        />
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[1200px] w-full">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-black uppercase tracking-wide text-slate-500">
                <th className="px-5 py-4">Fecha</th>
                <th className="px-5 py-4">Lote</th>
                <th className="px-5 py-4">Orden</th>
                <th className="px-5 py-4">Turno</th>
                <th className="px-5 py-4">Línea / máquina</th>
                <th className="px-5 py-4">Operador</th>
                <th className="px-5 py-4">Producido</th>
                <th className="px-5 py-4">Buenos</th>
                <th className="px-5 py-4">Rechazados</th>
                <th className="px-5 py-4">Eficiencia</th>
                <th className="px-5 py-4">Estado</th>
                <th className="px-5 py-4 text-right">Acción</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {filtrados.map((registro) => (
                <tr
                  key={registro.id}
                  className="text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <td className="px-5 py-4">
                    {fechaPeru(
                      registro.fechaProduccion,
                    )}
                  </td>

                  <td className="px-5 py-4 font-black text-slate-950">
                    {registro.lote}
                  </td>

                  <td className="px-5 py-4">
                    {registro.ordenProduccion}
                  </td>

                  <td className="px-5 py-4">
                    {registro.turno.nombre}
                  </td>

                  <td className="px-5 py-4">
                    <p className="font-black text-slate-900">
                      {registro.lineaProduccion.nombre}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {registro.maquina.nombre}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    {registro.operador.nombre}
                  </td>

                  <td className="px-5 py-4">
                    {registro.controlProduccion?.producido ??
                      0}
                  </td>

                  <td className="px-5 py-4 text-emerald-700">
                    {registro.controlProduccion?.buenos ??
                      0}
                  </td>

                  <td className="px-5 py-4 text-red-600">
                    {registro.controlProduccion?.rechazados ??
                      0}
                  </td>

                  <td className="px-5 py-4">
                    {porcentaje(
                      registro.controlProduccion
                        ?.eficiencia,
                    )}
                  </td>

                  <td className="px-5 py-4">
                    <Estado estado={registro.estado} />
                  </td>

                  <td className="px-5 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {registro.estado === "BORRADOR" && (
                        <button
                          type="button"
                          onClick={() =>
                            router.push(
                              `/dashboard/produccion/editar/${registro.id}`,
                            )
                          }
                          className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-black text-amber-700 transition hover:bg-amber-100"
                        >
                          <Pencil className="h-4 w-4" />
                          Editar
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          setSeleccionado(registro)
                        }
                        className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-black text-blue-700 transition hover:bg-blue-100"
                      >
                        <Eye className="h-4 w-4" />
                        Ver detalle
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filtrados.length === 0 && (
                <tr>
                  <td
                    colSpan={12}
                    className="px-6 py-14 text-center text-sm font-bold text-slate-500"
                  >
                    No se encontraron registros con los
                    filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {seleccionado && (
        <DetalleModal
          registro={seleccionado}
          cerrar={() => setSeleccionado(null)}
        />
      )}
    </div>
  );
}

const claseCampo =
  "w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

function TarjetaResumen({
  titulo,
  valor,
  icono,
}: {
  titulo: string;
  valor: string;
  icono: React.ReactNode;
}) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
        {icono}
      </div>

      <p className="mt-4 text-xs font-black uppercase tracking-wide text-slate-500">
        {titulo}
      </p>

      <p className="mt-2 text-2xl font-black text-slate-950">
        {valor}
      </p>
    </article>
  );
}

function Estado({
  estado,
}: {
  estado: RegistroProduccion["estado"];
}) {
  const clases = {
    BORRADOR:
      "border-amber-200 bg-amber-50 text-amber-700",
    FINALIZADO:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
    ANULADO:
      "border-red-200 bg-red-50 text-red-700",
  };

  const etiquetas = {
    BORRADOR: "Borrador",
    FINALIZADO: "Finalizado",
    ANULADO: "Anulado",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${clases[estado]}`}
    >
      {etiquetas[estado]}
    </span>
  );
}

function DetalleModal({
  registro,
  cerrar,
}: {
  registro: RegistroProduccion;
  cerrar: () => void;
}) {
  const totalParadas =
    registro.paradasMaquina.reduce(
      (total, parada) => total + parada.minutos,
      0,
    );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-blue-600">
              Detalle de producción
            </p>

            <h2 className="mt-1 text-2xl font-black text-slate-950">
              {registro.lote}
            </h2>
          </div>

          <button
            type="button"
            onClick={cerrar}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-300 text-slate-600 transition hover:bg-slate-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-7 p-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Dato
              titulo="Fecha"
              valor={fechaPeru(
                registro.fechaProduccion,
              )}
            />
            <Dato
              titulo="Semana / Mes"
              valor={`SEM${String(
                registro.semana,
              ).padStart(2, "0")} · ${
                nombresMeses[registro.mes]
              }`}
            />
            <Dato
              titulo="Turno"
              valor={registro.turno.nombre}
            />
            <Dato
              titulo="Orden"
              valor={registro.ordenProduccion}
            />
            <Dato
              titulo="Línea"
              valor={registro.lineaProduccion.nombre}
            />
            <Dato
              titulo="Máquina"
              valor={registro.maquina.nombre}
            />
            <Dato
              titulo="Operador"
              valor={registro.operador.nombre}
            />
            <Dato
              titulo="Producto terminado"
              valor={registro.productoTerminado.nombre}
            />
          </div>

          <Bloque titulo="Control de producción">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <Dato
                titulo="Programado"
                valor={`${
                  registro.controlProduccion?.programado ??
                  0
                }`}
              />
              <Dato
                titulo="Producido"
                valor={`${
                  registro.controlProduccion?.producido ??
                  0
                }`}
              />
              <Dato
                titulo="Buenos"
                valor={`${
                  registro.controlProduccion?.buenos ?? 0
                }`}
              />
              <Dato
                titulo="Rechazados"
                valor={`${
                  registro.controlProduccion?.rechazados ??
                  0
                }`}
              />
              <Dato
                titulo="Eficiencia"
                valor={porcentaje(
                  registro.controlProduccion?.eficiencia,
                )}
              />
            </div>
          </Bloque>

          <Bloque titulo="Consumo de materia prima">
            {registro.consumosMateriaPrima.length ===
            0 ? (
              <p className="text-sm font-semibold text-slate-500">
                Sin consumos registrados.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[850px] w-full">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-xs font-black uppercase tracking-wide text-slate-500">
                      <th className="px-3 py-3">
                        Material
                      </th>
                      <th className="px-3 py-3">
                        Inicial
                      </th>
                      <th className="px-3 py-3">
                        Consumido
                      </th>
                      <th className="px-3 py-3">
                        Final
                      </th>
                      <th className="px-3 py-3">
                        Real/envase
                      </th>
                      <th className="px-3 py-3">
                        Rendimiento
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200">
                    {registro.consumosMateriaPrima.map(
                      (consumo) => (
                        <tr
                          key={consumo.id}
                          className="text-sm font-semibold text-slate-700"
                        >
                          <td className="px-3 py-3">
                            {consumo.producto.nombre}
                          </td>
                          <td className="px-3 py-3">
                            {numero(
                              consumo.cantidadInicial,
                            ).toFixed(3)}
                          </td>
                          <td className="px-3 py-3">
                            {numero(
                              consumo.cantidadConsumida,
                            ).toFixed(3)}
                          </td>
                          <td className="px-3 py-3">
                            {numero(
                              consumo.cantidadFinal,
                            ).toFixed(3)}
                          </td>
                          <td className="px-3 py-3">
                            {numero(
                              consumo.consumoRealEnvase,
                            ).toFixed(4)}
                          </td>
                          <td className="px-3 py-3">
                            {porcentaje(
                              consumo.rendimiento,
                            )}
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </Bloque>

          <Bloque titulo="Paradas de máquina">
            <div className="mb-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-black text-amber-800">
              Tiempo detenido total: {totalParadas} minutos
            </div>

            {registro.paradasMaquina.length === 0 ? (
              <p className="text-sm font-semibold text-slate-500">
                Sin paradas registradas.
              </p>
            ) : (
              <div className="space-y-3">
                {registro.paradasMaquina.map(
                  (parada) => (
                    <article
                      key={parada.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="grid gap-3 md:grid-cols-4">
                        <Dato
                          titulo="Horario"
                          valor={`${parada.horaInicio} - ${parada.horaFin}`}
                        />
                        <Dato
                          titulo="Duración"
                          valor={`${parada.minutos} min`}
                        />
                        <Dato
                          titulo="Tipo"
                          valor={nombreTipoParada(
                            parada.tipo,
                          )}
                        />
                        <Dato
                          titulo="Motivo"
                          valor={parada.motivo}
                        />
                      </div>
                    </article>
                  ),
                )}
              </div>
            )}
          </Bloque>
        </div>
      </div>
    </div>
  );
}

function Bloque({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5">
      <h3 className="mb-5 text-lg font-black text-slate-950">
        {titulo}
      </h3>

      {children}
    </section>
  );
}

function Dato({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-wide text-slate-500">
        {titulo}
      </p>

      <p className="mt-2 break-words text-sm font-black text-slate-950">
        {valor}
      </p>
    </div>
  );
}