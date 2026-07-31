"use client";

import {
  Activity,
  Droplets,
  Gauge,
  RotateCcw,
  Settings2,
  Thermometer,
  Timer,
  Waves,
} from "lucide-react";
import { useState } from "react";

export type DatosControlProceso = {
  extrusoraAZona1: string;
  extrusoraAZona2: string;
  extrusoraAZona3: string;
  extrusoraAZona4: string;
  extrusoraAZona5: string;

  extrusoraBZona1: string;
  extrusoraBZona2: string;
  extrusoraBZona3: string;
  extrusoraBZona4: string;
  extrusoraBZona5: string;

  acumuladorZona1: string;
  acumuladorZona2: string;
  acumuladorZona3: string;
  acumuladorZona4: string;
  acumuladorZona5: string;
  acumuladorZona6: string;

  presionAirePrincipal: string;
  presionSoplo: string;
  presionPresoplo: string;

  temperaturaAgua: string;
  temperaturaChiller: string;
  temperaturaMolde: string;

  presionHidraulica: string;
  velocidadTornilloA: string;
  velocidadTornilloB: string;
  espesorParison: string;
  pesoEnvase: string;
  tiempoCicloSegundos: string;

  observaciones: string;
};

const datosIniciales: DatosControlProceso = {
  extrusoraAZona1: "",
  extrusoraAZona2: "",
  extrusoraAZona3: "",
  extrusoraAZona4: "",
  extrusoraAZona5: "",

  extrusoraBZona1: "",
  extrusoraBZona2: "",
  extrusoraBZona3: "",
  extrusoraBZona4: "",
  extrusoraBZona5: "",

  acumuladorZona1: "",
  acumuladorZona2: "",
  acumuladorZona3: "",
  acumuladorZona4: "",
  acumuladorZona5: "",
  acumuladorZona6: "",

  presionAirePrincipal: "",
  presionSoplo: "",
  presionPresoplo: "",

  temperaturaAgua: "",
  temperaturaChiller: "",
  temperaturaMolde: "",

  presionHidraulica: "",
  velocidadTornilloA: "",
  velocidadTornilloB: "",
  espesorParison: "",
  pesoEnvase: "",
  tiempoCicloSegundos: "",

  observaciones: "",
};

type ControlProcesoFormProps = {
  onChange?: (datos: DatosControlProceso) => void;
};

export default function ControlProcesoForm({
  onChange,
}: ControlProcesoFormProps) {
  const [datos, setDatos] =
    useState<DatosControlProceso>(datosIniciales);

  function actualizarCampo(
    campo: keyof DatosControlProceso,
    valor: string,
  ) {
    const nuevosDatos = {
      ...datos,
      [campo]: valor,
    };

    setDatos(nuevosDatos);
    onChange?.(nuevosDatos);
  }

  function limpiar() {
    setDatos(datosIniciales);
    onChange?.(datosIniciales);
  }

  return (
    <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50">
            <Settings2 className="h-6 w-6 text-orange-600" />
          </div>

          <div>
            <h3 className="text-xl font-black text-slate-950">
              Control del proceso
            </h3>

            <p className="mt-1 text-sm font-medium text-slate-500">
              Registre temperaturas, presiones y parámetros de
              extrusión por soplado.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={limpiar}
          className="flex items-center justify-center gap-2 rounded-2xl border border-slate-300 px-4 py-2.5 text-sm font-black text-slate-700 transition hover:bg-slate-50"
        >
          <RotateCcw className="h-4 w-4" />
          Limpiar proceso
        </button>
      </div>

      <BloqueTemperatura
        titulo="Extrusora A"
        descripcion="Cinco zonas de temperatura"
        valores={[
          datos.extrusoraAZona1,
          datos.extrusoraAZona2,
          datos.extrusoraAZona3,
          datos.extrusoraAZona4,
          datos.extrusoraAZona5,
        ]}
        campos={[
          "extrusoraAZona1",
          "extrusoraAZona2",
          "extrusoraAZona3",
          "extrusoraAZona4",
          "extrusoraAZona5",
        ]}
        actualizarCampo={actualizarCampo}
      />

      <BloqueTemperatura
        titulo="Extrusora B"
        descripcion="Cinco zonas de temperatura"
        valores={[
          datos.extrusoraBZona1,
          datos.extrusoraBZona2,
          datos.extrusoraBZona3,
          datos.extrusoraBZona4,
          datos.extrusoraBZona5,
        ]}
        campos={[
          "extrusoraBZona1",
          "extrusoraBZona2",
          "extrusoraBZona3",
          "extrusoraBZona4",
          "extrusoraBZona5",
        ]}
        actualizarCampo={actualizarCampo}
      />

      <BloqueTemperatura
        titulo="Acumulador"
        descripcion="Seis zonas de temperatura"
        valores={[
          datos.acumuladorZona1,
          datos.acumuladorZona2,
          datos.acumuladorZona3,
          datos.acumuladorZona4,
          datos.acumuladorZona5,
          datos.acumuladorZona6,
        ]}
        campos={[
          "acumuladorZona1",
          "acumuladorZona2",
          "acumuladorZona3",
          "acumuladorZona4",
          "acumuladorZona5",
          "acumuladorZona6",
        ]}
        actualizarCampo={actualizarCampo}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <TarjetaSeccion
          titulo="Presiones de aire"
          descripcion="Presiones utilizadas durante el soplado"
          icono={<Gauge className="h-6 w-6" />}
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <CampoNumerico
              titulo="Aire principal"
              unidad="bar"
              valor={datos.presionAirePrincipal}
              onChange={(valor) =>
                actualizarCampo("presionAirePrincipal", valor)
              }
            />

            <CampoNumerico
              titulo="Presión de soplo"
              unidad="bar"
              valor={datos.presionSoplo}
              onChange={(valor) =>
                actualizarCampo("presionSoplo", valor)
              }
            />

            <CampoNumerico
              titulo="Presoplo"
              unidad="bar"
              valor={datos.presionPresoplo}
              onChange={(valor) =>
                actualizarCampo("presionPresoplo", valor)
              }
            />
          </div>
        </TarjetaSeccion>

        <TarjetaSeccion
          titulo="Temperaturas auxiliares"
          descripcion="Agua, chiller y molde"
          icono={<Droplets className="h-6 w-6" />}
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <CampoNumerico
              titulo="Agua"
              unidad="°C"
              valor={datos.temperaturaAgua}
              onChange={(valor) =>
                actualizarCampo("temperaturaAgua", valor)
              }
            />

            <CampoNumerico
              titulo="Chiller"
              unidad="°C"
              valor={datos.temperaturaChiller}
              onChange={(valor) =>
                actualizarCampo("temperaturaChiller", valor)
              }
            />

            <CampoNumerico
              titulo="Molde"
              unidad="°C"
              valor={datos.temperaturaMolde}
              onChange={(valor) =>
                actualizarCampo("temperaturaMolde", valor)
              }
            />
          </div>
        </TarjetaSeccion>
      </div>

      <TarjetaSeccion
        titulo="Parámetros mecánicos e hidráulicos"
        descripcion="Configuración operativa de la máquina"
        icono={<Activity className="h-6 w-6" />}
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <CampoNumerico
            titulo="Presión hidráulica"
            unidad="bar"
            valor={datos.presionHidraulica}
            onChange={(valor) =>
              actualizarCampo("presionHidraulica", valor)
            }
          />

          <CampoNumerico
            titulo="Velocidad tornillo A"
            unidad="rpm"
            valor={datos.velocidadTornilloA}
            onChange={(valor) =>
              actualizarCampo("velocidadTornilloA", valor)
            }
          />

          <CampoNumerico
            titulo="Velocidad tornillo B"
            unidad="rpm"
            valor={datos.velocidadTornilloB}
            onChange={(valor) =>
              actualizarCampo("velocidadTornilloB", valor)
            }
          />

          <CampoNumerico
            titulo="Espesor del parison"
            unidad="mm"
            valor={datos.espesorParison}
            onChange={(valor) =>
              actualizarCampo("espesorParison", valor)
            }
          />

          <CampoNumerico
            titulo="Peso del envase"
            unidad="kg"
            valor={datos.pesoEnvase}
            onChange={(valor) =>
              actualizarCampo("pesoEnvase", valor)
            }
          />

          <CampoNumerico
            titulo="Tiempo de ciclo"
            unidad="seg"
            valor={datos.tiempoCicloSegundos}
            onChange={(valor) =>
              actualizarCampo("tiempoCicloSegundos", valor)
            }
          />
        </div>
      </TarjetaSeccion>

      <div>
        <label className="mb-2 block text-sm font-black text-slate-700">
          Observaciones del proceso
        </label>

        <textarea
          value={datos.observaciones}
          onChange={(evento) =>
            actualizarCampo(
              "observaciones",
              evento.target.value,
            )
          }
          rows={4}
          placeholder="Registre ajustes, variaciones o incidencias observadas durante el proceso..."
          className="w-full resize-none rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
        />
      </div>
    </section>
  );
}

function BloqueTemperatura({
  titulo,
  descripcion,
  valores,
  campos,
  actualizarCampo,
}: {
  titulo: string;
  descripcion: string;
  valores: string[];
  campos: (keyof DatosControlProceso)[];
  actualizarCampo: (
    campo: keyof DatosControlProceso,
    valor: string,
  ) => void;
}) {
  return (
    <TarjetaSeccion
      titulo={titulo}
      descripcion={descripcion}
      icono={<Thermometer className="h-6 w-6" />}
    >
      <div
        className={[
          "grid gap-4 sm:grid-cols-2",
          valores.length === 5
            ? "xl:grid-cols-5"
            : "xl:grid-cols-6",
        ].join(" ")}
      >
        {valores.map((valor, indice) => (
          <CampoNumerico
            key={campos[indice]}
            titulo={`Zona ${indice + 1}`}
            unidad="°C"
            valor={valor}
            onChange={(nuevoValor) =>
              actualizarCampo(campos[indice], nuevoValor)
            }
          />
        ))}
      </div>
    </TarjetaSeccion>
  );
}

function TarjetaSeccion({
  titulo,
  descripcion,
  icono,
  children,
}: {
  titulo: string;
  descripcion: string;
  icono: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-slate-50/60 p-5">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-orange-600 shadow-sm">
          {icono}
        </div>

        <div>
          <h4 className="font-black text-slate-900">
            {titulo}
          </h4>

          <p className="mt-1 text-xs font-semibold text-slate-500">
            {descripcion}
          </p>
        </div>
      </div>

      {children}
    </article>
  );
}

function CampoNumerico({
  titulo,
  unidad,
  valor,
  onChange,
}: {
  titulo: string;
  unidad: string;
  valor: string;
  onChange: (valor: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-black text-slate-600">
        {titulo}
      </label>

      <div className="relative">
        <input
          type="number"
          min="0"
          step="0.01"
          value={valor}
          onChange={(evento) =>
            onChange(evento.target.value)
          }
          placeholder="0.00"
          className="w-full rounded-2xl border border-slate-300 py-3 pl-4 pr-14 text-sm font-bold text-slate-900 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
        />

        <span className="pointer-events-none absolute right-4 top-3.5 text-xs font-black text-slate-400">
          {unidad}
        </span>
      </div>
    </div>
  );
}