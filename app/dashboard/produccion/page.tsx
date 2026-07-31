"use client";
import ParadasMaquinaForm, {
  FilaParadaMaquinaCalculada,
} from "@/components/produccion/paradas-maquina-form";
import ConsumoMateriaPrimaForm, {
  FilaConsumoMateriaPrimaCalculada,
  MaterialConsumoOpcion,
} from "@/components/produccion/consumo-materia-prima-form";
import ControlMoliendaForm, {
  DatosControlMolienda,
} from "@/components/produccion/control-molienda-form";
import {
  CheckCircle2,
  ClipboardList,
  LoaderCircle,
  RotateCcw,
  Settings2,
  Save,
} from "lucide-react";
import ControlProduccionForm, {
  DatosControlProduccion,
} from "@/components/produccion/control-produccion-form";
import {
  ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import ControlProcesoForm, {
  DatosControlProceso,
} from "@/components/produccion/control-proceso-form";

type Planta = {
  id: string;
  codigo: string;
  nombre: string;
};

type Turno = {
  id: string;
  codigo: string;
  nombre: string;
  horaInicio: string;
  horaSalida: string;
  cruzaMedianoche: boolean;
};

type Linea = {
  id: string;
  plantaId: string;
  codigo: string;
  nombre: string;
  tipo: string;
  descripcion: string | null;
};

type Maquina = {
  id: string;
  plantaId: string;
  lineaProduccionId: string | null;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  marca: string | null;
  modelo: string | null;
  capacidadNominal: string | null;
  unidadCapacidad: string | null;
  estado: string;
};

type Operador = {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
};

type ColorProduccion = {
  id: string;
  codigo: string;
  nombre: string;
  codigoHex: string | null;
  permiteOtro: boolean;
};

type Producto = {
  id: string;
  codigo: string;
  codigoSap: string | null;
  nombre: string;
  descripcion: string | null;
  familia: string | null;
  pesoUnitario?: string | null;
  capacidad?: string | null;
  unidadCapacidad?: string | null;
};

type Material = Producto & {
  stockActual: string;
  unidadMedida: {
    id: string;
    codigo: string;
    nombre: string;
    simbolo: string;
  } | null;
};

type RespuestaConfiguracion = {
  ok: boolean;
  mensaje?: string;
  plantas: Planta[];
  turnos: Turno[];
  lineas: Linea[];
  maquinas: Maquina[];
  operadores: Operador[];
  colores: ColorProduccion[];
  productosProceso: Producto[];
  productosTerminados: Producto[];
  materialesVirgenes: Material[];
  materialesMolidos: Material[];
};


const nombresMeses = [
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

const claseCampo =
  "w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

const claseAutomatico =
  "w-full rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-sm font-bold text-slate-800 outline-none";

function obtenerFechaActual() {
  const fecha = new Date();

  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");

  return `${anio}-${mes}-${dia}`;
}

function crearFechaLocal(fechaTexto: string) {
  const partes = fechaTexto.split("-").map(Number);

  if (partes.length !== 3) {
    return null;
  }

  const [anio, mes, dia] = partes;

  if (!anio || !mes || !dia) {
    return null;
  }

  const fecha = new Date(anio, mes - 1, dia, 12, 0, 0);

  if (
    fecha.getFullYear() !== anio ||
    fecha.getMonth() !== mes - 1 ||
    fecha.getDate() !== dia
  ) {
    return null;
  }

  return fecha;
}

function obtenerNumeroSemanaISO(fecha: Date) {
  const fechaUtc = new Date(
    Date.UTC(
      fecha.getFullYear(),
      fecha.getMonth(),
      fecha.getDate(),
    ),
  );

  const diaSemana = fechaUtc.getUTCDay() || 7;

  fechaUtc.setUTCDate(
    fechaUtc.getUTCDate() + 4 - diaSemana,
  );

  const inicioAnio = new Date(
    Date.UTC(fechaUtc.getUTCFullYear(), 0, 1),
  );

  return Math.ceil(
    ((fechaUtc.getTime() - inicioAnio.getTime()) /
      86_400_000 +
      1) /
      7,
  );
}

function formatearFecha(fecha: Date) {
  const dia = String(fecha.getDate()).padStart(2, "0");
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const anio = fecha.getFullYear();

  return `${dia}/${mes}/${anio}`;
}

function generarLote(
  fecha: Date,
  codigoLinea: string,
  codigoTurno: string,
) {
  const dia = String(fecha.getDate()).padStart(2, "0");
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const anio = String(fecha.getFullYear()).slice(-2);

  return `${dia}${mes}${anio}-${codigoLinea}-${codigoTurno}`;
}

export default function ProduccionPage() {
  const [controlMolienda, setControlMolienda] =
    useState<DatosControlMolienda | null>(null);
  const [consumosMateriaPrima, setConsumosMateriaPrima] =
    useState<FilaConsumoMateriaPrimaCalculada[]>([]);
  const [paradasMaquina, setParadasMaquina] =
    useState<FilaParadaMaquinaCalculada[]>([]);
  const [controlProduccion, setControlProduccion] =
    useState<DatosControlProduccion | null>(null);
  const [plantas, setPlantas] = useState<Planta[]>([]);
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [lineas, setLineas] = useState<Linea[]>([]);
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);
  const [operadores, setOperadores] = useState<Operador[]>([]);
  const [colores, setColores] = useState<ColorProduccion[]>([]);
  const [productosProceso, setProductosProceso] = useState<
    Producto[]
  >([]);
  const [productosTerminados, setProductosTerminados] =
    useState<Producto[]>([]);
  const [materialesVirgenes, setMaterialesVirgenes] =
    useState<Material[]>([]);
  const [materialesMolidos, setMaterialesMolidos] =
    useState<Material[]>([]);
  const [controlProceso, setControlProceso] =
    useState<DatosControlProceso | null>(null);

  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [formulariosKey, setFormulariosKey] = useState(0);
  const [fecha, setFecha] = useState(obtenerFechaActual());
  const [plantaId, setPlantaId] = useState("");
  const [turnoId, setTurnoId] = useState("");
  const [lineaId, setLineaId] = useState("");
  const [maquinaId, setMaquinaId] = useState("");
  const [operadorId, setOperadorId] = useState("");
  const [ordenProduccion, setOrdenProduccion] = useState("");
  const [productoProcesoId, setProductoProcesoId] = useState("");
  const [productoTerminadoId, setProductoTerminadoId] =
    useState("");
  const [materialVirgenId, setMaterialVirgenId] = useState("");
  const [materialMolidoId, setMaterialMolidoId] = useState("");
  const [colorId, setColorId] = useState("");
  const [colorOtro, setColorOtro] = useState("");

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function cargarConfiguracion() {
      try {
        setCargando(true);
        setError("");

        const respuesta = await fetch(
          "/api/produccion/configuracion",
          {
            cache: "no-store",
          },
        );

        const datos =
          (await respuesta.json()) as RespuestaConfiguracion;

        if (!respuesta.ok || !datos.ok) {
          throw new Error(
            datos.mensaje ??
              "No se pudo cargar la configuración.",
          );
        }

        setPlantas(datos.plantas);
        setTurnos(datos.turnos);
        setLineas(datos.lineas);
        setMaquinas(datos.maquinas);
        setOperadores(datos.operadores);
        setColores(datos.colores);
        setProductosProceso(datos.productosProceso);
        setProductosTerminados(datos.productosTerminados);
        setMaterialesVirgenes(datos.materialesVirgenes);
        setMaterialesMolidos(datos.materialesMolidos);

        setPlantaId(datos.plantas[0]?.id ?? "");
        setTurnoId(datos.turnos[0]?.id ?? "");
        setProductoProcesoId(
          datos.productosProceso[0]?.id ?? "",
        );
        setMaterialVirgenId(
          datos.materialesVirgenes[0]?.id ?? "",
        );
      } catch (errorDesconocido) {
        setError(
          errorDesconocido instanceof Error
            ? errorDesconocido.message
            : "No se pudo cargar la configuración.",
        );
      } finally {
        setCargando(false);
      }
    }

    void cargarConfiguracion();
  }, []);

  const fechaCalculada = useMemo(() => {
    const fechaProduccion = crearFechaLocal(fecha);

    if (!fechaProduccion) {
      return null;
    }

    return {
      fecha: fechaProduccion,
      fechaFormateada: formatearFecha(fechaProduccion),
      numeroSemana: obtenerNumeroSemanaISO(fechaProduccion),
      semana: `SEM${String(
        obtenerNumeroSemanaISO(fechaProduccion),
      ).padStart(2, "0")}`,
      mes: nombresMeses[fechaProduccion.getMonth()],
    };
  }, [fecha]);

  const lineasFiltradas = useMemo(() => {
    if (!plantaId) {
      return [];
    }

    return lineas.filter(
      (linea) => linea.plantaId === plantaId,
    );
  }, [lineas, plantaId]);



  const plantaSeleccionada = plantas.find(
    (planta) => planta.id === plantaId,
  );

  const turnoSeleccionado = turnos.find(
    (turno) => turno.id === turnoId,
  );

  const lineaSeleccionada = lineas.find(
    (linea) => linea.id === lineaId,
  );

  const maquinaSeleccionada = maquinas.find(
    (maquina) => maquina.id === maquinaId,
  );

  const operadorSeleccionado = operadores.find(
    (operador) => operador.id === operadorId,
  );

  const productoProcesoSeleccionado = productosProceso.find(
    (producto) => producto.id === productoProcesoId,
  );

  const productoTerminadoSeleccionado =
    productosTerminados.find(
      (producto) => producto.id === productoTerminadoId,
    );

  const materialVirgenSeleccionado = materialesVirgenes.find(
    (material) => material.id === materialVirgenId,
  );

  const materialMolidoSeleccionado = materialesMolidos.find(
    (material) => material.id === materialMolidoId,
  );

  const materialesDisponibles = useMemo<
    MaterialConsumoOpcion[]
  >(() => {
    const mapa = new Map<string, MaterialConsumoOpcion>();

    for (const material of [
      ...materialesVirgenes,
      ...materialesMolidos,
    ]) {
      mapa.set(material.id, {
        id: material.id,
        codigo: material.codigo,
        codigoSap: material.codigoSap,
        nombre: material.nombre,
        unidadMedida: material.unidadMedida
          ? {
              simbolo: material.unidadMedida.simbolo,
            }
          : null,
      });
    }

    return Array.from(mapa.values());
  }, [materialesVirgenes, materialesMolidos]);

  const productosBuenos = useMemo(() => {
    if (!controlProduccion) {
      return 0;
    }

    const valor = Number(
      String(controlProduccion.buenos ?? "").replace(
        ",",
        ".",
      ),
    );

    return Number.isFinite(valor)
      ? Math.max(0, Math.trunc(valor))
      : 0;
  }, [controlProduccion]);

  const pesoEnvaseKg = useMemo(() => {
    if (!controlProceso) {
      return 0;
    }

    const valor = Number(
      String(controlProceso.pesoEnvase ?? "").replace(
        ",",
        ".",
      ),
    );

    return Number.isFinite(valor)
      ? Math.max(0, valor)
      : 0;
  }, [controlProceso]);

  const colorSeleccionado = colores.find(
    (color) => color.id === colorId,
  );

  const loteAutomatico =
    fechaCalculada &&
    turnoSeleccionado &&
    lineaSeleccionada
      ? generarLote(
          fechaCalculada.fecha,
          lineaSeleccionada.codigo,
          turnoSeleccionado.codigo,
        )
      : "";

  const requiereColorOtro =
    colorSeleccionado?.permiteOtro === true;

  function limpiarResultado() {
    setError("");
    setMensaje("");
  }

  function cambiarPlanta(nuevaPlantaId: string) {
    setPlantaId(nuevaPlantaId);
    setLineaId("");
    setMaquinaId("");
    limpiarResultado();
  }

  function cambiarLinea(nuevaLineaId: string) {
    setLineaId(nuevaLineaId);
    limpiarResultado();

    const maquinasDeLaLinea = maquinas.filter(
      (maquina) =>
        maquina.lineaProduccionId === nuevaLineaId,
    );

    if (maquinasDeLaLinea.length === 1) {
      setMaquinaId(maquinasDeLaLinea[0].id);
    } else {
      setMaquinaId("");
    }
  }

  function cambiarColor(nuevoColorId: string) {
    setColorId(nuevoColorId);
    setColorOtro("");
    limpiarResultado();
  }

  async function guardarProduccion() {
    try {
      setGuardando(true);
      setError("");
      setMensaje("");

      if (!fechaCalculada) {
      setError("Debe ingresar una fecha válida.");
      return;
    }

    if (!plantaSeleccionada) {
      setError("Debe seleccionar una planta.");
      return;
    }

    if (!turnoSeleccionado) {
      setError("Debe seleccionar un turno.");
      return;
    }

    if (!lineaSeleccionada) {
      setError("Debe seleccionar una línea.");
      return;
    }

    if (!maquinaSeleccionada) {
      setError(
        "La línea seleccionada no tiene una máquina válida.",
      );
      return;
    }

    if (!operadorSeleccionado) {
      setError("Debe seleccionar un operador.");
      return;
    }

    if (!ordenProduccion.trim()) {
      setError("Debe digitar la orden de producción.");
      return;
    }

    if (!productoProcesoSeleccionado) {
      setError("Debe seleccionar el producto en proceso.");
      return;
    }

    if (!productoTerminadoSeleccionado) {
      setError("Debe seleccionar el producto terminado.");
      return;
    }

    if (!materialVirgenSeleccionado) {
      setError("Debe seleccionar el material virgen.");
      return;
    }

    if (!colorSeleccionado) {
      setError("Debe seleccionar el color.");
      return;
    }

    if (requiereColorOtro && !colorOtro.trim()) {
      setError("Debe especificar el otro color.");
      return;
    }

    const respuesta = await fetch(
      "/api/produccion/registros",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fechaProduccion: fecha,
          plantaId: plantaSeleccionada.id,
          turnoId: turnoSeleccionado.id,
          lineaProduccionId: lineaSeleccionada.id,
          maquinaId: maquinaSeleccionada.id,
          operadorId: operadorSeleccionado.id,
          

          productoProcesoId:
            productoProcesoSeleccionado.id,
          productoTerminadoId:
            productoTerminadoSeleccionado.id,

          materialVirgenId:
            materialVirgenSeleccionado.id,

          materialMolidoId:
            materialMolidoSeleccionado?.id ?? null,

          colorProduccionId:
            colorSeleccionado.id,

          ordenProduccion:
            ordenProduccion.trim().toUpperCase(),

          lote: loteAutomatico,

          colorOtro: requiereColorOtro
            ? colorOtro.trim()
            : null,

          observaciones: null,

          controlProceso,
          controlProduccion,
          controlMolienda,

          consumosMateriaPrima: consumosMateriaPrima
            .filter((fila) => fila.productoId)
            .map((fila) => ({
              productoId: fila.productoId,
              cantidadInicial: fila.cantidadInicial,
              cantidadConsumida: fila.cantidadConsumida,
              consumoEstandarEnvase:
                fila.consumoEstandarEnvase,
              observaciones: fila.observaciones,
            })),

          paradasMaquina: paradasMaquina
            .filter(
              (parada) =>
                parada.horaInicio ||
                parada.horaFin ||
                parada.tipo ||
                parada.motivo.trim(),
            )
            .map((parada) => ({
              horaInicio: parada.horaInicio,
              horaFin: parada.horaFin,
              tipo: parada.tipo,
              motivo: parada.motivo.trim(),
              observaciones:
                parada.observaciones.trim(),
            })),
        }),
      },
    );

    const datos = await respuesta.json();

    if (!respuesta.ok || !datos.ok) {
      throw new Error(
        datos.mensaje ??
          "No se pudo guardar la producción.",
      );
    }

    setMensaje(datos.mensaje);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
    } catch (errorDesconocido) {
      setError(
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "No se pudo guardar la producción.",
      );
    } finally {
      setGuardando(false);
    }
  }

  function limpiarFormulario() {
    setFecha(obtenerFechaActual());
    setPlantaId(plantas[0]?.id ?? "");
    setTurnoId(turnos[0]?.id ?? "");
    setLineaId("");
    setMaquinaId("");
    setOperadorId("");
    setOrdenProduccion("");
    setProductoProcesoId(productosProceso[0]?.id ?? "");
    setProductoTerminadoId("");
    setMaterialVirgenId(materialesVirgenes[0]?.id ?? "");
    setMaterialMolidoId("");
    setColorId("");
    setColorOtro("");
    setControlProceso(null);
    setControlProduccion(null);
    setError("");
    setMensaje("");
    setFormulariosKey((actual) => actual + 1);
    setControlMolienda(null);
    setConsumosMateriaPrima([]);
    setParadasMaquina([]);
  }

  if (cargando) {
    return (
      <div className="flex min-h-[500px] items-center justify-center rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="text-center">
          <LoaderCircle className="mx-auto h-10 w-10 animate-spin text-blue-600" />

          <p className="mt-4 text-sm font-black text-slate-600">
            Cargando configuración de producción...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-blue-950 to-blue-700 p-7 text-white shadow-xl md:p-9">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-200">
          Extrusión por soplado
        </p>

        <h2 className="mt-3 text-3xl font-black md:text-4xl">
          Control de Producción de Envases IBC
        </h2>

        <p className="mt-3 max-w-4xl text-sm font-medium leading-7 text-slate-200 md:text-base">
          Registre los datos generales de la producción. La
          semana, el mes, la máquina y el lote se completan
          automáticamente.
        </p>
      </section>

      <form
        onSubmit={(evento) => {
          evento.preventDefault();
          void guardarProduccion();
        }}
        className="space-y-7"
      >
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="flex items-center gap-3 border-b border-slate-200 pb-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50">
            <ClipboardList className="h-6 w-6 text-blue-600" />
          </div>

          <div>
            <h3 className="text-xl font-black text-slate-950">
              Datos generales de la producción
            </h3>

            <p className="mt-1 text-sm font-medium text-slate-500">
              Complete los campos obligatorios para continuar.
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {error}
          </div>
        )}

        {mensaje && (
          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            {mensaje}
          </div>
        )}

        <div className="mt-7 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <Campo titulo="Fecha de producción" obligatorio>
            <input
              type="date"
              value={fecha}
              onChange={(evento) => {
                setFecha(evento.target.value);
                limpiarResultado();
              }}
              required
              className={claseCampo}
            />
          </Campo>

          <Campo titulo="Semana automática">
            <input
              value={fechaCalculada?.semana ?? ""}
              readOnly
              className={claseAutomatico}
            />
          </Campo>

          <Campo titulo="Mes automático">
            <input
              value={fechaCalculada?.mes ?? ""}
              readOnly
              className={claseAutomatico}
            />
          </Campo>

          <Campo titulo="Planta" obligatorio>
            <select
              value={plantaId}
              onChange={(evento) =>
                cambiarPlanta(evento.target.value)
              }
              required
              className={claseCampo}
            >
              <option value="">Seleccione una planta</option>

              {plantas.map((planta) => (
                <option key={planta.id} value={planta.id}>
                  {planta.codigo} - {planta.nombre}
                </option>
              ))}
            </select>
          </Campo>

          <Campo titulo="Turno" obligatorio>
            <select
              value={turnoId}
              onChange={(evento) => {
                setTurnoId(evento.target.value);
                limpiarResultado();
              }}
              required
              className={claseCampo}
            >
              <option value="">Seleccione un turno</option>

              {turnos.map((turno) => (
                <option key={turno.id} value={turno.id}>
                  {turno.codigo} - {turno.nombre} (
                  {turno.horaInicio} a {turno.horaSalida})
                </option>
              ))}
            </select>
          </Campo>

          <Campo titulo="Línea" obligatorio>
            <select
              value={lineaId}
              onChange={(evento) =>
                cambiarLinea(evento.target.value)
              }
              required
              className={claseCampo}
            >
              <option value="">Seleccione una línea</option>

              {lineasFiltradas.map((linea) => (
                <option key={linea.id} value={linea.id}>
                  {linea.codigo} - {linea.nombre}
                </option>
              ))}
            </select>
          </Campo>

          <Campo titulo="Máquina automática">
            <input
              value={
                maquinaSeleccionada
                  ? `${maquinaSeleccionada.codigo} - ${maquinaSeleccionada.nombre}`
                  : ""
              }
              readOnly
              placeholder="Seleccione la línea"
              className={claseAutomatico}
            />
          </Campo>

          <Campo titulo="Lote automático">
            <input
              value={loteAutomatico}
              readOnly
              placeholder="Fecha + línea + turno"
              className={claseAutomatico}
            />
          </Campo>

          <Campo titulo="Operador" obligatorio>
            <select
              value={operadorId}
              onChange={(evento) => {
                setOperadorId(evento.target.value);
                limpiarResultado();
              }}
              required
              className={claseCampo}
            >
              <option value="">Seleccione un operador</option>

              {operadores.map((operador) => (
                <option key={operador.id} value={operador.id}>
                  {operador.codigo} - {operador.nombre}
                </option>
              ))}
            </select>
          </Campo>

          <Campo titulo="Orden de producción" obligatorio>
            <input
              value={ordenProduccion}
              onChange={(evento) => {
                setOrdenProduccion(
                  evento.target.value.toUpperCase(),
                );
                limpiarResultado();
              }}
              placeholder="Ejemplo: OP-000125"
              required
              className={claseCampo}
            />
          </Campo>

          <Campo titulo="Producto en proceso" obligatorio>
            <select
              value={productoProcesoId}
              onChange={(evento) => {
                setProductoProcesoId(evento.target.value);
                limpiarResultado();
              }}
              required
              className={claseCampo}
            >
              <option value="">Seleccione un producto</option>

              {productosProceso.map((producto) => (
                <option key={producto.id} value={producto.id}>
                  {producto.codigoSap ?? producto.codigo} -{" "}
                  {producto.nombre}
                </option>
              ))}
            </select>
          </Campo>

          <Campo titulo="Producto terminado" obligatorio>
            <select
              value={productoTerminadoId}
              onChange={(evento) => {
                setProductoTerminadoId(
                  evento.target.value,
                );
                limpiarResultado();
              }}
              required
              className={claseCampo}
            >
              <option value="">
                Seleccione un producto terminado
              </option>

              {productosTerminados.map((producto) => (
                <option key={producto.id} value={producto.id}>
                  {producto.codigoSap ?? producto.codigo} -{" "}
                  {producto.nombre}
                </option>
              ))}
            </select>
          </Campo>

          <Campo titulo="Material virgen" obligatorio>
            <select
              value={materialVirgenId}
              onChange={(evento) => {
                setMaterialVirgenId(evento.target.value);
                limpiarResultado();
              }}
              required
              className={claseCampo}
            >
              <option value="">
                Seleccione el material virgen
              </option>

              {materialesVirgenes.map((material) => (
                <option key={material.id} value={material.id}>
                  {material.codigoSap ?? material.codigo} -{" "}
                  {material.nombre}
                </option>
              ))}
            </select>
          </Campo>

          <Campo titulo="Material molido">
            <select
              value={materialMolidoId}
              onChange={(evento) => {
                setMaterialMolidoId(evento.target.value);
                limpiarResultado();
              }}
              className={claseCampo}
            >
              <option value="">Sin material molido</option>

              {materialesMolidos.map((material) => (
                <option key={material.id} value={material.id}>
                  {material.codigoSap ?? material.codigo} -{" "}
                  {material.nombre}
                </option>
              ))}
            </select>
          </Campo>

          <Campo titulo="Color" obligatorio>
            <select
              value={colorId}
              onChange={(evento) =>
                cambiarColor(evento.target.value)
              }
              required
              className={claseCampo}
            >
              <option value="">Seleccione un color</option>

              {colores.map((color) => (
                <option key={color.id} value={color.id}>
                  {color.nombre}
                </option>
              ))}
            </select>
          </Campo>

          {requiereColorOtro && (
            <Campo titulo="Especifique el color" obligatorio>
              <input
                value={colorOtro}
                onChange={(evento) => {
                  setColorOtro(evento.target.value);
                  limpiarResultado();
                }}
                placeholder="Escriba el color"
                required
                className={claseCampo}
              />
            </Campo>
          )}
        </div>

        {maquinaSeleccionada && (
          <div className="mt-7 rounded-3xl border border-blue-100 bg-blue-50/60 p-5">
            <div className="flex items-start gap-4">
              <Settings2 className="mt-1 h-6 w-6 shrink-0 text-blue-600" />

              <div>
                <p className="font-black text-slate-900">
                  {maquinaSeleccionada.nombre}
                </p>

                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                  {maquinaSeleccionada.descripcion ??
                    "Sin descripción registrada."}
                </p>
              </div>
            </div>
          </div>
        )}

        </section>

        <ControlProcesoForm
          key={`control-proceso-${formulariosKey}`}
          onChange={(datos) => {
            setControlProceso(datos);
            setMensaje("");
          }}
        />
        <ControlProduccionForm
          key={`control-produccion-${formulariosKey}`}
          onChange={(datos) => {
            setControlProduccion(datos);
            setMensaje("");
          }}
        />
        <ControlMoliendaForm
          key={`control-molienda-${formulariosKey}`}
          onChange={(datos) => {
            setControlMolienda(datos);
            setMensaje("");
          }}
        />

        <ConsumoMateriaPrimaForm
          key={`consumo-materia-prima-${formulariosKey}`}
          materiales={materialesDisponibles}
          productosBuenos={productosBuenos}
          pesoEnvaseKg={pesoEnvaseKg}
          onChange={(filas) => {
            setConsumosMateriaPrima(filas);
            setMensaje("");
          }}
        />

        <ParadasMaquinaForm
          key={`paradas-maquina-${formulariosKey}`}
          onChange={(paradas) => {
            setParadasMaquina(paradas);
            setMensaje("");
          }}
        />

        <div className="sticky bottom-4 z-20 flex flex-col-reverse gap-3 rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={limpiarFormulario}
            className="flex items-center justify-center gap-2 rounded-2xl border border-slate-300 px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
          >
            <RotateCcw className="h-5 w-5" />
            Limpiar
          </button>

          <button
            type="submit"
            disabled={guardando}
            className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-7 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {guardando ? (
              <LoaderCircle className="h-5 w-5 animate-spin" />
            ) : (
              <Save className="h-5 w-5" />
            )}

            {guardando
              ? "Guardando producción..."
              : "Guardar producción"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Campo({
  titulo,
  obligatorio = false,
  children,
}: {
  titulo: string;
  obligatorio?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-black text-slate-700">
        {titulo}

        {obligatorio && (
          <span className="ml-1 text-red-500">*</span>
        )}
      </label>

      {children}
    </div>
  );
}