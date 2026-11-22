"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalculadoraCombate = void 0;
class CalculadoraCombate {
    static leerEstado(estados, clave) {
        if (!estados)
            return 0;
        if (typeof estados.get === "function")
            return estados.get(clave) || 0;
        const val = estados[clave];
        return typeof val === "number" ? val : 0;
    }
    static calcularCostoCarta(costoBase, reduccionPorHpPerdido, hpPerdidoCombate = 0, encantamiento, gratisEsteTurno = false) {
        if (encantamiento === "GRATIS" || gratisEsteTurno)
            return 0;
        if (!reduccionPorHpPerdido)
            return costoBase;
        return Math.max(0, costoBase - Math.max(0, hpPerdidoCombate));
    }
    static calcularDanioAtaque(danioBase, estadosAtacante, estadosDefensor, multiplicadorFuerza = 1) {
        const fuerza = this.leerEstado(estadosAtacante, "FUERZA") * multiplicadorFuerza;
        let monto = danioBase + fuerza;
        if (this.leerEstado(estadosAtacante, "DEBIL") > 0)
            monto = Math.floor(monto * 0.75);
        if (this.leerEstado(estadosDefensor, "VULNERABLE") > 0)
            monto = Math.floor(monto * 1.5);
        return Math.max(0, monto);
    }
    static calcularBloqueo(bloqueoBase, estadosLanzador, estadosObjetivo) {
        const destreza = this.leerEstado(estadosLanzador, "DESTREZA");
        let total = Math.max(0, bloqueoBase + destreza);
        const estadosParaDebuff = estadosObjetivo || estadosLanzador;
        if (this.leerEstado(estadosParaDebuff, "FRAGIL") > 0)
            total = Math.floor(total * 0.75);
        return total;
    }
    // Traduce un IValorDinamico para visuales (tooltip)
    static simularValorDinamicoUI(valor, estadosLanzador, estadosObjetivoApuntado) {
        if (typeof valor === "number")
            return valor;
        if (valor.tipo === "LEER_ESTADO") {
            const estadoLeido = this.leerEstado(valor.objetivo === "PROPIO" ? estadosLanzador : estadosObjetivoApuntado, valor.estadoId);
            return Math.floor(estadoLeido * valor.multiplicador);
        }
        return 0;
    }
    static formatearDescripcionCarta(descripcionBase, efectos, estadosLanzador, estadosObjetivoApuntado, contextoExtra) {
        const efectoDanio = efectos.find((e) => e.tipo === "DANIO");
        const efectoBloqueo = efectos.find((e) => e.tipo === "BLOQUEO");
        let estadoDanio = "NORMAL";
        let estadoBloqueo = "NORMAL";
        let texto = descripcionBase;
        if (efectoDanio) {
            let base = efectoDanio.danioIgualABloqueo ? (contextoExtra?.bloqueoLanzador ?? 0) : this.simularValorDinamicoUI(efectoDanio.valor, estadosLanzador, estadosObjetivoApuntado);
            if (efectoDanio.danioExtraPorAtaqueEnMano && contextoExtra?.ataquesEnMano !== undefined)
                base += contextoExtra.ataquesEnMano * efectoDanio.danioExtraPorAtaqueEnMano;
            const multFuerza = efectoDanio.multiplicadorFuerza ?? 1;
            const calculado = efectoDanio.fuente === "RELIQUIA" ? base : this.calcularDanioAtaque(base, estadosLanzador, estadosObjetivoApuntado, multFuerza);
            const referenciaOriginal = efectoDanio.danioIgualABloqueo ? 0 : this.simularValorDinamicoUI(efectoDanio.valor, estadosLanzador, estadosObjetivoApuntado);
            if (calculado > referenciaOriginal)
                estadoDanio = "AUMENTADO";
            else if (calculado < referenciaOriginal)
                estadoDanio = "REDUCIDO";
            const sufijo = calculado > referenciaOriginal ? "▲" : calculado < referenciaOriginal ? "▼" : "";
            texto = texto.replace(/\{D\}/g, `${calculado}${sufijo}`);
        }
        if (efectoBloqueo) {
            const base = this.simularValorDinamicoUI(efectoBloqueo.valor, estadosLanzador, estadosObjetivoApuntado);
            const calculado = this.calcularBloqueo(base, estadosLanzador, estadosObjetivoApuntado);
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
