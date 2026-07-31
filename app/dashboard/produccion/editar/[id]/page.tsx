"use client";

import {
  ArrowLeft,
  CheckCircle2,
  LoaderCircle,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

type Opcion = {
  id: string;
  codigo: string;
  nombre: string;
  plantaId?: string;
  lineaProduccionId?: string | null;
  permiteOtro?: boolean;
};

type Configuracion = {
  ok: boolean;
  plantas: Opcion[];
  turnos: Opcion[];
  lineas: Opcion[];
  maquinas: Opcion[];
  operadores: Opcion[];
  colores: Opcion[];
  productosProceso: Opcion[];
  productosTerminados: Opcion[];
  materialesVirgenes: Opcion[];
  materialesMolidos: Opcion[];
};

type FilaConsumo = {
  filaId: string;
  productoId: string;
  cantidadInicial: string;
  cantidadConsumida: string;
  consumoEstandarEnvase: string;
  observaciones: string;
};

type FilaParada = {
  filaId: string;
  horaInicio: string;
  horaFin: string;
  minutos: string;
  tipo: string;
  motivo: string;
  observaciones: string;
};

type Formulario = {
  fechaProduccion: string;
  plantaId: string;
  turnoId: string;
  lineaProduccionId: string;
  maquinaId: string;
  operadorId: string;
  productoProcesoId: string;
  productoTerminadoId: string;
  materialVirgenId: string;
  materialMolidoId: string;
  colorProduccionId: string;
  ordenProduccion: string;
  colorOtro: string;
  observaciones: string;
  controlProceso: Record<string, string>;
  controlProduccion: Record<string, string>;
  controlMolienda: Record<string, string>;
  consumosMateriaPrima: FilaConsumo[];
  paradasMaquina: FilaParada[];
};

const camposProceso = [
  ["extrusoraAZona1", "Extrusora A - Zona 1"],
  ["extrusoraAZona2", "Extrusora A - Zona 2"],
  ["extrusoraAZona3", "Extrusora A - Zona 3"],
  ["extrusoraAZona4", "Extrusora A - Zona 4"],
  ["extrusoraAZona5", "Extrusora A - Zona 5"],
  ["extrusoraBZona1", "Extrusora B - Zona 1"],
  ["extrusoraBZona2", "Extrusora B - Zona 2"],
  ["extrusoraBZona3", "Extrusora B - Zona 3"],
  ["extrusoraBZona4", "Extrusora B - Zona 4"],
  ["extrusoraBZona5", "Extrusora B - Zona 5"],
  ["acumuladorZona1", "Acumulador - Zona 1"],
  ["acumuladorZona2", "Acumulador - Zona 2"],
  ["acumuladorZona3", "Acumulador - Zona 3"],
  ["acumuladorZona4", "Acumulador - Zona 4"],
  ["acumuladorZona5", "Acumulador - Zona 5"],
  ["acumuladorZona6", "Acumulador - Zona 6"],
  ["presionAirePrincipal", "Presión de aire principal"],
  ["presionSoplo", "Presión de soplo"],
  ["presionPresoplo", "Presión de presoplo"],
  ["temperaturaAgua", "Temperatura de agua"],
  ["temperaturaChiller", "Temperatura de chiller"],
  ["temperaturaMolde", "Temperatura de molde"],
  ["presionHidraulica", "Presión hidráulica"],
  ["velocidadTornilloA", "Velocidad tornillo A"],
  ["velocidadTornilloB", "Velocidad tornillo B"],
  ["espesorParison", "Espesor de parison"],
  ["pesoEnvase", "Peso del envase"],
  ["tiempoCicloSegundos", "Tiempo de ciclo (segundos)"],
] as const;

const campo =
  "w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

function nuevaFilaConsumo(): FilaConsumo {
  return {
    filaId: crypto.randomUUID(),
    productoId: "",
    cantidadInicial: "",
    cantidadConsumida: "",
    consumoEstandarEnvase: "",
    observaciones: "",
  };
}

function nuevaFilaParada(): FilaParada {
  return {
    filaId: crypto.randomUUID(),
    horaInicio: "",
    horaFin: "",
    minutos: "0",
    tipo: "",
    motivo: "",
    observaciones: "",
  };
}

function minutos(
  inicio: string,
  fin: string,
) {
  if (!inicio || !fin) return 0;

  const [hi, mi] = inicio.split(":").map(Number);
  const [hf, mf] = fin.split(":").map(Number);
  const a = hi * 60 + mi;
  const b = hf * 60 + mf;

  return b >= a ? b - a : 1440 - a + b;
}

export default function EditarProduccionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [id, setId] = useState("");
  const [configuracion, setConfiguracion] =
    useState<Configuracion | null>(null);
  const [formulario, setFormulario] =
    useState<Formulario | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    async function cargar() {
      try {
        setCargando(true);
        setError("");

        const { id: registroId } = await params;
        setId(registroId);

        const [respuestaConfiguracion, respuestaRegistro] =
          await Promise.all([
            fetch("/api/produccion/configuracion", {
              cache: "no-store",
            }),
            fetch(
              `/api/produccion/registros/${registroId}`,
              {
                cache: "no-store",
              },
            ),
          ]);

        const config =
          (await respuestaConfiguracion.json()) as Configuracion;
        const datos = await respuestaRegistro.json();

        if (
          !respuestaConfiguracion.ok ||
          !config.ok
        ) {
          throw new Error(
            "No se pudo cargar la configuración.",
          );
        }

        if (
          !respuestaRegistro.ok ||
          !datos.ok
        ) {
          throw new Error(
            datos.mensaje ??
              "No se pudo cargar el borrador.",
          );
        }

        const registro = datos.registro;

        if (registro.estado !== "BORRADOR") {
          throw new Error(
            "Este registro ya no está en borrador.",
          );
        }

        setConfiguracion(config);
        setFormulario({
          fechaProduccion:
            registro.fechaProduccion,
          plantaId: registro.plantaId,
          turnoId: registro.turnoId,
          lineaProduccionId:
            registro.lineaProduccionId,
          maquinaId: registro.maquinaId,
          operadorId: registro.operadorId,
          productoProcesoId:
            registro.productoProcesoId,
          productoTerminadoId:
            registro.productoTerminadoId,
          materialVirgenId:
            registro.materialVirgenId ?? "",
          materialMolidoId:
            registro.materialMolidoId ?? "",
          colorProduccionId:
            registro.colorProduccionId ?? "",
          ordenProduccion:
            registro.ordenProduccion,
          colorOtro: registro.colorOtro ?? "",
          observaciones:
            registro.observaciones ?? "",
          controlProceso: Object.fromEntries(
            camposProceso.map(([clave]) => [
              clave,
              String(
                registro.controlProceso?.[clave] ??
                  "",
              ),
            ]),
          ),
          controlProduccion: {
            programado: String(
              registro.controlProduccion
                ?.programado ?? "",
            ),
            producido: String(
              registro.controlProduccion
                ?.producido ?? "",
            ),
            buenos: String(
              registro.controlProduccion?.buenos ??
                "",
            ),
            horasProduccion: String(
              registro.controlProduccion
                ?.horasProduccion ?? "",
            ),
            observaciones:
              registro.controlProduccion
                ?.observaciones ?? "",
          },
          controlMolienda: {
            pesoRecuperable: String(
              registro.controlMolienda
                ?.pesoRecuperable ?? "",
            ),
            pesoNoRecuperable: String(
              registro.controlMolienda
                ?.pesoNoRecuperable ?? "",
            ),
            pesoBarrido: String(
              registro.controlMolienda
                ?.pesoBarrido ?? "",
            ),
            observaciones:
              registro.controlMolienda
                ?.observaciones ?? "",
          },
          consumosMateriaPrima:
            registro.consumosMateriaPrima.length > 0
              ? registro.consumosMateriaPrima.map(
                  (fila: Record<string, unknown>) => ({
                    filaId: crypto.randomUUID(),
                    productoId: String(
                      fila.productoId ?? "",
                    ),
                    cantidadInicial: String(
                      fila.cantidadInicial ?? "",
                    ),
                    cantidadConsumida: String(
                      fila.cantidadConsumida ?? "",
                    ),
                    consumoEstandarEnvase: String(
                      fila.consumoEstandarEnvase ??
                        "",
                    ),
                    observaciones: String(
                      fila.observaciones ?? "",
                    ),
                  }),
                )
              : [nuevaFilaConsumo()],
          paradasMaquina:
            registro.paradasMaquina.length > 0
              ? registro.paradasMaquina.map(
                  (fila: Record<string, unknown>) => ({
                    filaId: crypto.randomUUID(),
                    horaInicio: String(
                      fila.horaInicio ?? "",
                    ),
                    horaFin: String(
                      fila.horaFin ?? "",
                    ),
                    minutos: String(
                      fila.minutos ?? "0",
                    ),
                    tipo: String(
                      fila.tipo ?? "",
                    ),
                    motivo: String(
                      fila.motivo ?? "",
                    ),
                    observaciones: String(
                      fila.observaciones ?? "",
                    ),
                  }),
                )
              : [nuevaFilaParada()],
        });
      } catch (errorDesconocido) {
        setError(
          errorDesconocido instanceof Error
            ? errorDesconocido.message
            : "No se pudo cargar el borrador.",
        );
      } finally {
        setCargando(false);
      }
    }

    void cargar();
  }, [params]);

  const lineas = useMemo(
    () =>
      configuracion?.lineas.filter(
        (linea) =>
          linea.plantaId ===
          formulario?.plantaId,
      ) ?? [],
    [configuracion, formulario?.plantaId],
  );

  const maquinas = useMemo(
    () =>
      configuracion?.maquinas.filter(
        (maquina) =>
          maquina.lineaProduccionId ===
          formulario?.lineaProduccionId,
      ) ?? [],
    [
      configuracion,
      formulario?.lineaProduccionId,
    ],
  );

  async function guardar(evento: FormEvent) {
    evento.preventDefault();

    if (!formulario) return;

    try {
      setGuardando(true);
      setError("");
      setMensaje("");

      const respuesta = await fetch(
        `/api/produccion/registros/${id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formulario),
        },
      );

      const datos = await respuesta.json();

      if (!respuesta.ok || !datos.ok) {
        throw new Error(
          datos.mensaje ??
            "No se pudieron guardar los cambios.",
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
          : "No se pudieron guardar los cambios.",
      );
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <LoaderCircle className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!formulario || !configuracion) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6 font-bold text-red-700">
        {error || "No se pudo cargar el registro."}
      </div>
    );
  }

  return (
    <form
      onSubmit={guardar}
      className="space-y-7"
    >
      <section className="rounded-3xl bg-gradient-to-r from-amber-700 via-orange-700 to-red-700 p-7 text-white shadow-xl">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-3 py-2 text-sm font-black"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al historial
        </button>

        <p className="mt-6 text-xs font-black uppercase tracking-[0.2em] text-amber-100">
          Edición de borrador
        </p>

        <h1 className="mt-2 text-3xl font-black">
          Continuar registro de producción
        </h1>

        <p className="mt-2 text-sm font-semibold text-amber-50">
          Los cambios actualizarán el mismo registro. No
          se creará una copia.
        </p>
      </section>

      {mensaje && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 font-bold text-emerald-700">
          <CheckCircle2 className="h-5 w-5" />
          {mensaje}
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 font-bold text-red-700">
          {error}
        </div>
      )}

      <Seccion titulo="Datos generales">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Campo etiqueta="Fecha">
            <input
              type="date"
              value={formulario.fechaProduccion}
              onChange={(e) =>
                setFormulario({
                  ...formulario,
                  fechaProduccion: e.target.value,
                })
              }
              className={campo}
              required
            />
          </Campo>

          <Selector
            etiqueta="Planta"
            valor={formulario.plantaId}
            opciones={configuracion.plantas}
            cambiar={(valor) =>
              setFormulario({
                ...formulario,
                plantaId: valor,
                lineaProduccionId: "",
                maquinaId: "",
              })
            }
          />

          <Selector
            etiqueta="Turno"
            valor={formulario.turnoId}
            opciones={configuracion.turnos}
            cambiar={(valor) =>
              setFormulario({
                ...formulario,
                turnoId: valor,
              })
            }
          />

          <Selector
            etiqueta="Línea"
            valor={formulario.lineaProduccionId}
            opciones={lineas}
            cambiar={(valor) =>
              setFormulario({
                ...formulario,
                lineaProduccionId: valor,
                maquinaId: "",
              })
            }
          />

          <Selector
            etiqueta="Máquina"
            valor={formulario.maquinaId}
            opciones={maquinas}
            cambiar={(valor) =>
              setFormulario({
                ...formulario,
                maquinaId: valor,
              })
            }
          />

          <Selector
            etiqueta="Operador"
            valor={formulario.operadorId}
            opciones={configuracion.operadores}
            cambiar={(valor) =>
              setFormulario({
                ...formulario,
                operadorId: valor,
              })
            }
          />

          <Selector
            etiqueta="Producto en proceso"
            valor={formulario.productoProcesoId}
            opciones={
              configuracion.productosProceso
            }
            cambiar={(valor) =>
              setFormulario({
                ...formulario,
                productoProcesoId: valor,
              })
            }
          />

          <Selector
            etiqueta="Producto terminado"
            valor={
              formulario.productoTerminadoId
            }
            opciones={
              configuracion.productosTerminados
            }
            cambiar={(valor) =>
              setFormulario({
                ...formulario,
                productoTerminadoId: valor,
              })
            }
          />

          <Selector
            etiqueta="Material virgen"
            valor={formulario.materialVirgenId}
            opciones={
              configuracion.materialesVirgenes
            }
            cambiar={(valor) =>
              setFormulario({
                ...formulario,
                materialVirgenId: valor,
              })
            }
          />

          <Selector
            etiqueta="Material molido"
            valor={formulario.materialMolidoId}
            opciones={
              configuracion.materialesMolidos
            }
            cambiar={(valor) =>
              setFormulario({
                ...formulario,
                materialMolidoId: valor,
              })
            }
            opcional
          />

          <Selector
            etiqueta="Color"
            valor={formulario.colorProduccionId}
            opciones={configuracion.colores}
            cambiar={(valor) =>
              setFormulario({
                ...formulario,
                colorProduccionId: valor,
              })
            }
          />

          <Campo etiqueta="Orden de producción">
            <input
              value={formulario.ordenProduccion}
              onChange={(e) =>
                setFormulario({
                  ...formulario,
                  ordenProduccion: e.target.value,
                })
              }
              className={campo}
              required
            />
          </Campo>
        </div>
      </Seccion>

      <Seccion titulo="Control de producción">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ["programado", "Programado"],
            ["producido", "Producido"],
            ["buenos", "Buenos"],
            ["horasProduccion", "Horas de producción"],
          ].map(([clave, etiqueta]) => (
            <Campo key={clave} etiqueta={etiqueta}>
              <input
                type="number"
                min="0"
                step={
                  clave === "horasProduccion"
                    ? "0.001"
                    : "1"
                }
                value={
                  formulario.controlProduccion[
                    clave
                  ] ?? ""
                }
                onChange={(e) =>
                  setFormulario({
                    ...formulario,
                    controlProduccion: {
                      ...formulario.controlProduccion,
                      [clave]: e.target.value,
                    },
                  })
                }
                className={campo}
              />
            </Campo>
          ))}
        </div>
      </Seccion>

      <Seccion titulo="Control del proceso">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {camposProceso.map(
            ([clave, etiqueta]) => (
              <Campo key={clave} etiqueta={etiqueta}>
                <input
                  type="number"
                  min="0"
                  step="0.001"
                  value={
                    formulario.controlProceso[
                      clave
                    ] ?? ""
                  }
                  onChange={(e) =>
                    setFormulario({
                      ...formulario,
                      controlProceso: {
                        ...formulario.controlProceso,
                        [clave]: e.target.value,
                      },
                    })
                  }
                  className={campo}
                />
              </Campo>
            ),
          )}
        </div>
      </Seccion>

      <Seccion titulo="Control de molienda">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["pesoRecuperable", "Peso recuperable"],
            [
              "pesoNoRecuperable",
              "Peso no recuperable",
            ],
            ["pesoBarrido", "Peso de barrido"],
          ].map(([clave, etiqueta]) => (
            <Campo key={clave} etiqueta={etiqueta}>
              <input
                type="number"
                min="0"
                step="0.001"
                value={
                  formulario.controlMolienda[
                    clave
                  ] ?? ""
                }
                onChange={(e) =>
                  setFormulario({
                    ...formulario,
                    controlMolienda: {
                      ...formulario.controlMolienda,
                      [clave]: e.target.value,
                    },
                  })
                }
                className={campo}
              />
            </Campo>
          ))}
        </div>
      </Seccion>

      <Seccion titulo="Consumo de materia prima">
        <div className="space-y-4">
          {formulario.consumosMateriaPrima.map(
            (fila, indice) => (
              <div
                key={fila.filaId}
                className="grid gap-3 rounded-2xl border border-slate-200 p-4 md:grid-cols-6"
              >
                <select
                  value={fila.productoId}
                  onChange={(e) => {
                    const filas = [
                      ...formulario.consumosMateriaPrima,
                    ];
                    filas[indice] = {
                      ...fila,
                      productoId: e.target.value,
                    };
                    setFormulario({
                      ...formulario,
                      consumosMateriaPrima: filas,
                    });
                  }}
                  className={campo}
                >
                  <option value="">
                    Seleccione material
                  </option>
                  {[
                    ...configuracion.materialesVirgenes,
                    ...configuracion.materialesMolidos,
                  ].map((opcion) => (
                    <option
                      key={opcion.id}
                      value={opcion.id}
                    >
                      {opcion.codigo} - {opcion.nombre}
                    </option>
                  ))}
                </select>

                {[
                  [
                    "cantidadInicial",
                    "Cantidad inicial",
                  ],
                  [
                    "cantidadConsumida",
                    "Cantidad consumida",
                  ],
                  [
                    "consumoEstandarEnvase",
                    "Estándar/envase",
                  ],
                ].map(([clave, placeholder]) => (
                  <input
                    key={clave}
                    type="number"
                    min="0"
                    step="0.001"
                    placeholder={placeholder}
                    value={
                      fila[
                        clave as keyof FilaConsumo
                      ]
                    }
                    onChange={(e) => {
                      const filas = [
                        ...formulario.consumosMateriaPrima,
                      ];
                      filas[indice] = {
                        ...fila,
                        [clave]: e.target.value,
                      };
                      setFormulario({
                        ...formulario,
                        consumosMateriaPrima: filas,
                      });
                    }}
                    className={campo}
                  />
                ))}

                <input
                  placeholder="Observaciones"
                  value={fila.observaciones}
                  onChange={(e) => {
                    const filas = [
                      ...formulario.consumosMateriaPrima,
                    ];
                    filas[indice] = {
                      ...fila,
                      observaciones: e.target.value,
                    };
                    setFormulario({
                      ...formulario,
                      consumosMateriaPrima: filas,
                    });
                  }}
                  className={campo}
                />

                <button
                  type="button"
                  onClick={() =>
                    setFormulario({
                      ...formulario,
                      consumosMateriaPrima:
                        formulario.consumosMateriaPrima.filter(
                          (item) =>
                            item.filaId !==
                            fila.filaId,
                        ),
                    })
                  }
                  className="flex items-center justify-center rounded-2xl border border-red-200 text-red-600"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            ),
          )}

          <button
            type="button"
            onClick={() =>
              setFormulario({
                ...formulario,
                consumosMateriaPrima: [
                  ...formulario.consumosMateriaPrima,
                  nuevaFilaConsumo(),
                ],
              })
            }
            className="inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-black text-blue-700"
          >
            <Plus className="h-4 w-4" />
            Agregar material
          </button>
        </div>
      </Seccion>

      <Seccion titulo="Paradas de máquina">
        <div className="space-y-4">
          {formulario.paradasMaquina.map(
            (fila, indice) => (
              <div
                key={fila.filaId}
                className="grid gap-3 rounded-2xl border border-slate-200 p-4 md:grid-cols-7"
              >
                <input
                  type="time"
                  value={fila.horaInicio}
                  onChange={(e) => {
                    const filas = [
                      ...formulario.paradasMaquina,
                    ];
                    filas[indice] = {
                      ...fila,
                      horaInicio: e.target.value,
                      minutos: String(
                        minutos(
                          e.target.value,
                          fila.horaFin,
                        ),
                      ),
                    };
                    setFormulario({
                      ...formulario,
                      paradasMaquina: filas,
                    });
                  }}
                  className={campo}
                />

                <input
                  type="time"
                  value={fila.horaFin}
                  onChange={(e) => {
                    const filas = [
                      ...formulario.paradasMaquina,
                    ];
                    filas[indice] = {
                      ...fila,
                      horaFin: e.target.value,
                      minutos: String(
                        minutos(
                          fila.horaInicio,
                          e.target.value,
                        ),
                      ),
                    };
                    setFormulario({
                      ...formulario,
                      paradasMaquina: filas,
                    });
                  }}
                  className={campo}
                />

                <input
                  value={`${fila.minutos} min`}
                  readOnly
                  className={campo}
                />

                <select
                  value={fila.tipo}
                  onChange={(e) => {
                    const filas = [
                      ...formulario.paradasMaquina,
                    ];
                    filas[indice] = {
                      ...fila,
                      tipo: e.target.value,
                    };
                    setFormulario({
                      ...formulario,
                      paradasMaquina: filas,
                    });
                  }}
                  className={campo}
                >
                  <option value="">Tipo</option>
                  {[
                    "MECANICA",
                    "ELECTRICA",
                    "CALIDAD",
                    "FALTA_MATERIAL",
                    "CAMBIO_MOLDE",
                    "AJUSTE_PROCESO",
                    "OTRA",
                  ].map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {tipo.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>

                <input
                  placeholder="Motivo"
                  value={fila.motivo}
                  onChange={(e) => {
                    const filas = [
                      ...formulario.paradasMaquina,
                    ];
                    filas[indice] = {
                      ...fila,
                      motivo: e.target.value,
                    };
                    setFormulario({
                      ...formulario,
                      paradasMaquina: filas,
                    });
                  }}
                  className={campo}
                />

                <input
                  placeholder="Observaciones"
                  value={fila.observaciones}
                  onChange={(e) => {
                    const filas = [
                      ...formulario.paradasMaquina,
                    ];
                    filas[indice] = {
                      ...fila,
                      observaciones: e.target.value,
                    };
                    setFormulario({
                      ...formulario,
                      paradasMaquina: filas,
                    });
                  }}
                  className={campo}
                />

                <button
                  type="button"
                  onClick={() =>
                    setFormulario({
                      ...formulario,
                      paradasMaquina:
                        formulario.paradasMaquina.filter(
                          (item) =>
                            item.filaId !==
                            fila.filaId,
                        ),
                    })
                  }
                  className="flex items-center justify-center rounded-2xl border border-red-200 text-red-600"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            ),
          )}

          <button
            type="button"
            onClick={() =>
              setFormulario({
                ...formulario,
                paradasMaquina: [
                  ...formulario.paradasMaquina,
                  nuevaFilaParada(),
                ],
              })
            }
            className="inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-black text-blue-700"
          >
            <Plus className="h-4 w-4" />
            Agregar parada
          </button>
        </div>
      </Seccion>

      <div className="sticky bottom-4 z-20 flex justify-end rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur">
        <button
          type="submit"
          disabled={guardando}
          className="flex items-center gap-2 rounded-2xl bg-amber-600 px-7 py-3 text-sm font-black text-white disabled:opacity-60"
        >
          {guardando ? (
            <LoaderCircle className="h-5 w-5 animate-spin" />
          ) : (
            <Save className="h-5 w-5" />
          )}
          {guardando
            ? "Guardando cambios..."
            : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}

function Seccion({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-5 text-xl font-black text-slate-950">
        {titulo}
      </h2>
      {children}
    </section>
  );
}

function Campo({
  etiqueta,
  children,
}: {
  etiqueta: string;
  children: React.ReactNode;
}) {
  return (
    <label className="text-sm font-black text-slate-700">
      {etiqueta}
      <div className="mt-2">{children}</div>
    </label>
  );
}

function Selector({
  etiqueta,
  valor,
  opciones,
  cambiar,
  opcional = false,
}: {
  etiqueta: string;
  valor: string;
  opciones: Opcion[];
  cambiar: (valor: string) => void;
  opcional?: boolean;
}) {
  return (
    <Campo etiqueta={etiqueta}>
      <select
        value={valor}
        onChange={(e) => cambiar(e.target.value)}
        className={campo}
        required={!opcional}
      >
        <option value="">
          {opcional
            ? "Sin selección"
            : "Seleccione una opción"}
        </option>

        {opciones.map((opcion) => (
          <option
            key={opcion.id}
            value={opcion.id}
          >
            {opcion.codigo} - {opcion.nombre}
          </option>
        ))}
      </select>
    </Campo>
  );
}
