import { EstadoId, DescriptorEfecto } from "./CondicionesYEfectos";

export interface IMapaEstadosLectura {
    get?(clave: string): number | undefined;
}

export interface IResultadoDescripcionDinamica {
    texto: string;
    estadoDanio: "NORMAL" | "AUMENTADO" | "REDUCIDO";
    estadoBloqueo: "NORMAL" | "AUMENTADO" | "REDUCIDO";
}

export class CalculadoraCombate {
    public static leerEstado(estados: IMapaEstadosLectura | undefined, clave: EstadoId): number {
        if (!estados) return 0;
        if (typeof estados.get === "function") {
            return estados.get(clave) || 0;
        }
        const val = (estados as Record<string, unknown>)[clave];
        return typeof val === "number" ? val : 0;
    }

    /**
     * Calcula el daño real de un ataque considerando FUERZA y DEBIL del atacante,
     * más VULNERABLE del defensor (si se está apuntando a un objetivo o si el enemigo nos ataca).
     */
    public static calcularDanioAtaque(
        danioBase: number,
        estadosAtacante?: IMapaEstadosLectura,
        estadosDefensor?: IMapaEstadosLectura
    ): number {
        let monto = danioBase + this.leerEstado(estadosAtacante, "FUERZA");

        if (this.leerEstado(estadosAtacante, "DEBIL") > 0) {
            monto = Math.floor(monto * 0.75);
        }

        if (this.leerEstado(estadosDefensor, "VULNERABLE") > 0) {
            monto = Math.floor(monto * 1.5);
        }

        return Math.max(0, monto);
    }

    /**
     * Calcula el bloqueo real de una carta.
     */
    public static calcularBloqueo(
        bloqueoBase: number,
        _estadosLanzador?: IMapaEstadosLectura
    ): number {
        return Math.max(0, bloqueoBase);
    }

    /**
     * Reemplaza los marcadores {D} y {B} de la descripción de una carta con los valores en tiempo real.
     */
    public static formatearDescripcionCarta(
        descripcionBase: string,
        efectos: DescriptorEfecto[],
        estadosLanzador?: IMapaEstadosLectura,
        estadosObjetivoApuntado?: IMapaEstadosLectura
    ): IResultadoDescripcionDinamica {
        const efectoDanio = efectos.find((e) => e.tipo === "DANIO") as
            | Extract<DescriptorEfecto, { tipo: "DANIO" }>
            | undefined;
        const efectoBloqueo = efectos.find((e) => e.tipo === "BLOQUEO") as
            | Extract<DescriptorEfecto, { tipo: "BLOQUEO" }>
            | undefined;

        let estadoDanio: "NORMAL" | "AUMENTADO" | "REDUCIDO" = "NORMAL";
        let estadoBloqueo: "NORMAL" | "AUMENTADO" | "REDUCIDO" = "NORMAL";
        let texto = descripcionBase;

        if (efectoDanio) {
            const base = efectoDanio.valor;
            const calculado =
                efectoDanio.fuente === "RELIQUIA"
                    ? base
                    : this.calcularDanioAtaque(base, estadosLanzador, estadosObjetivoApuntado);

            if (calculado > base) estadoDanio = "AUMENTADO";
            else if (calculado < base) estadoDanio = "REDUCIDO";

            const sufijo = calculado > base ? "▲" : calculado < base ? "▼" : "";
            texto = texto.replace(/\{D\}/g, `${calculado}${sufijo}`);
        }

        if (efectoBloqueo) {
            const base = efectoBloqueo.valor;
            const calculado = this.calcularBloqueo(base, estadosLanzador);

            if (calculado > base) estadoBloqueo = "AUMENTADO";
            else if (calculado < base) estadoBloqueo = "REDUCIDO";

            const sufijo = calculado > base ? "▲" : calculado < base ? "▼" : "";
            texto = texto.replace(/\{B\}/g, `${calculado}${sufijo}`);
        }

        return { texto, estadoDanio, estadoBloqueo };
    }
}