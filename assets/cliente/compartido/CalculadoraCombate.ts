import { EstadoId, DescriptorEfecto, EncantamientoId } from "./CondicionesYEfectos";

export interface IMapaEstadosLectura {
    get?(clave: string): number | undefined;
}

export interface IContextoCalculoCarta {
    bloqueoLanzador?: number;
    ataquesEnMano?: number;
    hpPerdidoCombate?: number;
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

    public static calcularCostoCarta(
        costoBase: number,
        reduccionPorHpPerdido?: boolean,
        hpPerdidoCombate: number = 0,
        encantamiento?: EncantamientoId,
        gratisEsteTurno: boolean = false
    ): number {
        if (encantamiento === "GRATIS" || gratisEsteTurno) return 0;
        if (!reduccionPorHpPerdido) return costoBase;
        return Math.max(0, costoBase - Math.max(0, hpPerdidoCombate));
    }

    public static calcularDanioAtaque(
        danioBase: number,
        estadosAtacante?: IMapaEstadosLectura,
        estadosDefensor?: IMapaEstadosLectura,
        multiplicadorFuerza: number = 1
    ): number {
        const fuerza = this.leerEstado(estadosAtacante, "FUERZA") * multiplicadorFuerza;
        let monto = danioBase + fuerza;

        if (this.leerEstado(estadosAtacante, "DEBIL") > 0) {
            monto = Math.floor(monto * 0.75);
        }

        if (this.leerEstado(estadosDefensor, "VULNERABLE") > 0) {
            monto = Math.floor(monto * 1.5);
        }

        return Math.max(0, monto);
    }

    public static calcularBloqueo(
        bloqueoBase: number,
        estadosLanzador?: IMapaEstadosLectura
    ): number {
        const destreza = this.leerEstado(estadosLanzador, "DESTREZA");
        return Math.max(0, bloqueoBase + destreza);
    }

    public static formatearDescripcionCarta(
        descripcionBase: string,
        efectos: DescriptorEfecto[],
        estadosLanzador?: IMapaEstadosLectura,
        estadosObjetivoApuntado?: IMapaEstadosLectura,
        contextoExtra?: IContextoCalculoCarta
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
            let base = efectoDanio.danioIgualABloqueo
                ? contextoExtra?.bloqueoLanzador ?? 0
                : efectoDanio.valor;

            if (efectoDanio.danioExtraPorAtaqueEnMano && contextoExtra?.ataquesEnMano !== undefined) {
                base += contextoExtra.ataquesEnMano * efectoDanio.danioExtraPorAtaqueEnMano;
            }

            const multFuerza = efectoDanio.multiplicadorFuerza ?? 1;
            const calculado =
                efectoDanio.fuente === "RELIQUIA"
                    ? base
                    : this.calcularDanioAtaque(
                          base,
                          estadosLanzador,
                          estadosObjetivoApuntado,
                          multFuerza
                      );

            const referenciaOriginal = efectoDanio.danioIgualABloqueo ? 0 : efectoDanio.valor;
            if (calculado > referenciaOriginal) estadoDanio = "AUMENTADO";
            else if (calculado < referenciaOriginal) estadoDanio = "REDUCIDO";

            const sufijo =
                calculado > referenciaOriginal ? "▲" : calculado < referenciaOriginal ? "▼" : "";
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