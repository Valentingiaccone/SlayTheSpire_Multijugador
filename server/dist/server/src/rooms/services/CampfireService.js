"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CampfireService = void 0;
const GameTypes_1 = require("../../../../assets/cliente/compartido/GameTypes");
const Cartas_1 = require("../../../../assets/cliente/compartido/Cartas");
const RelicEngine_1 = require("../../engine/RelicEngine");
class CampfireService {
    constructor(state, onFogataCompletadaCallback) {
        this.state = state;
        this.onFogataCompletadaCallback = onFogataCompletadaCallback;
    }
    iniciarEventoFogata() {
        this.state.jugadores.forEach((j) => {
            j.fogataCompletada = false;
        });
        RelicEngine_1.RelicEngine.dispararAlIngresarFogata(this.state);
        this.state.faseActual = "CAMPFIRE";
    }
    procesarAccionFogata(sessionId, accion) {
        if (this.state.faseActual !== "CAMPFIRE")
            return;
        const jugador = this.state.jugadores.get(sessionId);
        if (!jugador || jugador.fogataCompletada || !accion)
            return;
        switch (accion.tipo) {
            case "CURAR_PROPIO": {
                const curacion = Math.max(1, Math.floor(jugador.hpMax * GameTypes_1.ECONOMIA_CONFIG.PORCENTAJE_CURACION_FOGATA));
                jugador.hp = Math.min(jugador.hpMax, jugador.hp + curacion);
                jugador.fogataCompletada = true;
                break;
            }
            case "CURAR_ALIADO": {
                if (this.state.jugadores.size <= 1)
                    return;
                if (accion.aliadoSessionId === sessionId)
                    return;
                const aliado = this.state.jugadores.get(accion.aliadoSessionId);
                if (!aliado)
                    return;
                const curacionAliado = Math.max(1, Math.floor(aliado.hpMax * GameTypes_1.ECONOMIA_CONFIG.PORCENTAJE_CURACION_FOGATA));
                aliado.hp = Math.min(aliado.hpMax, aliado.hp + curacionAliado);
                jugador.fogataCompletada = true;
                break;
            }
            case "MEJORAR_CARTA": {
                const idx = accion.indiceMazo;
                if (typeof idx !== "number" || idx < 0 || idx >= jugador.mazoMaestro.length)
                    return;
                const cartaActualId = jugador.mazoMaestro[idx];
                const cartaMejoradaId = (0, Cartas_1.obtenerIdCartaMejoradaPreservandoExtras)(cartaActualId);
                if (!cartaMejoradaId)
                    return;
                jugador.mazoMaestro[idx] = cartaMejoradaId;
                jugador.fogataCompletada = true;
                break;
            }
            default:
                return;
        }
        this.verificarFinFogata();
    }
    verificarFinFogata() {
        if (this.state.faseActual !== "CAMPFIRE")
            return;
        let todosTerminaron = true;
        this.state.jugadores.forEach((j) => {
            if (!j.fogataCompletada)
                todosTerminaron = false;
        });
        if (todosTerminaron) {
            this.onFogataCompletadaCallback();
        }
    }
}
exports.CampfireService = CampfireService;
