"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalculadoraCombate = void 0;
class CalculadoraCombate {
    static leerEstado(estados, clave) {
        if (!estados)
            return 0;
        if (typeof estados.get === "function") {
            return estados.get(clave) || 0;
        }
        const val = estados[clave];
        return typeof val === "number" ? val : 0;
    }
    /**
     * Calcula el daño real de un ataque considerando FUERZA y DEBIL del atacante,
     * más VULNERABLE del defensor (si se está apuntando a un objetivo o si el enemigo nos ataca).
     */
    static calcularDanioAtaque(danioBase, estadosAtacante, estadosDefensor) {
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
    static calcularBloqueo(bloqueoBase, _estadosLanzador) {
        return Math.max(0, bloqueoBase);
    }
    /**
     * Reemplaza los marcadores {D} y {B} de la descripción de una carta con los valores en tiempo real.
     */
    static formatearDescripcionCarta(descripcionBase, efectos, estadosLanzador, estadosObjetivoApuntado) {
        const efectoDanio = efectos.find((e) => e.tipo === "DANIO");
        const efectoBloqueo = efectos.find((e) => e.tipo === "BLOQUEO");
        let estadoDanio = "NORMAL";
        let estadoBloqueo = "NORMAL";
        let texto = descripcionBase;
        if (efectoDanio) {
            const base = efectoDanio.valor;
            const calculado = efectoDanio.fuente === "RELIQUIA"
                ? base
                : this.calcularDanioAtaque(base, estadosLanzador, estadosObjetivoApuntado);
            if (calculado > base)
                estadoDanio = "AUMENTADO";
            else if (calculado < base)
                estadoDanio = "REDUCIDO";
            const sufijo = calculado > base ? "▲" : calculado < base ? "▼" : "";
            texto = texto.replace(/\{D\}/g, `${calculado}${sufijo}`);
        }
        if (efectoBloqueo) {
            const base = efectoBloqueo.valor;
            const calculado = this.calcularBloqueo(base, estadosLanzador);
            if (calculado > base)
                estadoBloqueo = "AUMENTADO";
            else if (calculado < base)
                estadoBloqueo = "REDUCIDO";
            const sufijo = calculado > base ? "▲" : calculado < base ? "▼" : "";
            texto = texto.replace(/\{B\}/g, `${calculado}${sufijo}`);
        }
        return { texto, estadoDanio, estadoBloqueo };
    }
}
exports.CalculadoraCombate = CalculadoraCombate;
