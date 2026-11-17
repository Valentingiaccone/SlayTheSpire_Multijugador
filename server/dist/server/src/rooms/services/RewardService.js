"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RewardService = void 0;
const Cartas_1 = require("../../../../assets/cliente/compartido/Cartas");
const Reliquias_1 = require("../../../../assets/cliente/compartido/Reliquias");
const GameTypes_1 = require("../../../../assets/cliente/compartido/GameTypes");
class RewardService {
    constructor(state, onRecompensasCompletadasCallback) {
        this.state = state;
        this.onRecompensasCompletadasCallback = onRecompensasCompletadasCallback;
    }
    prepararRecompensas() {
        const oroBase = this.state.esCombateJefe
            ? GameTypes_1.ECONOMIA_CONFIG.ORO_COMBATE_JEFE
            : this.state.esCombateElite
                ? GameTypes_1.ECONOMIA_CONFIG.ORO_COMBATE_ELITE
                : GameTypes_1.ECONOMIA_CONFIG.ORO_COMBATE_NORMAL;
        this.state.jugadores.forEach((jugador) => {
            if (jugador.hp <= 0) {
                jugador.hp = Math.max(1, Math.floor(jugador.hpMax * 0.3));
            }
            jugador.recompensaElegida = false;
            jugador.opcionesRecompensa.clear();
            jugador.reliquiaRecompensa = "";
            jugador.oroRecompensa = oroBase;
            const opciones = (0, Cartas_1.generarOpcionesRecompensa)(jugador.personajeId, 3);
            opciones.forEach((id) => jugador.opcionesRecompensa.push(id));
            if (this.state.esCombateElite) {
                const reliquias = (0, Reliquias_1.obtenerReliquiasRecompensa)(this.state.jugadores, 1, jugador.personajeId);
                jugador.reliquiaRecompensa = reliquias[0] || "";
            }
        });
    }
    elegirRecompensa(sessionId, cartaId, tomarReliquia = false, tomarOro = false) {
        if (this.state.faseActual !== "REWARD")
            return;
        const jugador = this.state.jugadores.get(sessionId);
        if (!jugador || jugador.recompensaElegida)
            return;
        if (cartaId && jugador.opcionesRecompensa.includes(cartaId)) {
            jugador.mazoMaestro.push(cartaId);
        }
        if (tomarReliquia && jugador.reliquiaRecompensa) {
            jugador.reliquias.push(jugador.reliquiaRecompensa);
        }
        if (tomarOro && jugador.oroRecompensa > 0) {
            jugador.oro += jugador.oroRecompensa;
        }
        jugador.recompensaElegida = true;
        jugador.opcionesRecompensa.clear();
        jugador.reliquiaRecompensa = "";
        jugador.oroRecompensa = 0;
        this.verificarFinRecompensas();
    }
    verificarFinRecompensas() {
        if (this.state.faseActual !== "REWARD")
            return;
        let todosEligieron = true;
        this.state.jugadores.forEach((j) => {
            if (!j.recompensaElegida)
                todosEligieron = false;
        });
        if (todosEligieron) {
            this.onRecompensasCompletadasCallback();
        }
    }
}
exports.RewardService = RewardService;
