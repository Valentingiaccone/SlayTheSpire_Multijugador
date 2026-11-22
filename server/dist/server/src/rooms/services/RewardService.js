"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RewardService = void 0;
const Cartas_1 = require("../../../../assets/cliente/compartido/Cartas");
const Reliquias_1 = require("../../../../assets/cliente/compartido/Reliquias");
const GameTypes_1 = require("../../../../assets/cliente/compartido/GameTypes");
const RelicEngine_1 = require("../../engine/RelicEngine");
const PlayerStatsHelper_1 = require("../../engine/PlayerStatsHelper");
class RewardService {
    constructor(state, onRecompensasCompletadasCallback) {
        this.state = state;
        this.onRecompensasCompletadasCallback = onRecompensasCompletadasCallback;
    }
    prepararRecompensas() {
        const contextoCartas = this.state.esCombateJefe
            ? "JEFE"
            : this.state.esCombateElite
                ? "ELITE"
                : "COMBATE";
        const contextoReliquia = this.state.esCombateJefe
            ? "JEFE"
            : "ELITE";
        const oroBase = this.state.esCombateJefe
            ? GameTypes_1.ECONOMIA_CONFIG.ORO_COMBATE_JEFE
            : this.state.esCombateElite
                ? GameTypes_1.ECONOMIA_CONFIG.ORO_COMBATE_ELITE
                : GameTypes_1.ECONOMIA_CONFIG.ORO_COMBATE_NORMAL;
        const cantJugadores = Math.max(1, this.state.jugadores.size);
        this.state.jugadores.forEach((jugador) => {
            if (jugador.hp <= 0) {
                jugador.hp = Math.max(1, Math.floor(jugador.hpMax * 0.3));
            }
            jugador.recompensaElegida = false;
            jugador.opcionesRecompensa.clear();
            jugador.reliquiaRecompensa = "";
            jugador.oroRecompensa = oroBase;
            const cantOpciones = 3 + RelicEngine_1.RelicEngine.obtenerCartasExtraRecompensa(jugador);
            const opciones = (0, Cartas_1.generarOpcionesRecompensa)(jugador.personajeId, cantOpciones, contextoCartas, cantJugadores);
            opciones.forEach((id) => jugador.opcionesRecompensa.push(id));
            if (this.state.esCombateElite || this.state.esCombateJefe) {
                const reliquias = (0, Reliquias_1.obtenerReliquiasRecompensa)(this.state.jugadores, 1, jugador.personajeId, contextoReliquia);
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
        const reliquiaDisponible = jugador.reliquiaRecompensa;
        const oroDisponible = jugador.oroRecompensa;
        if (cartaId && jugador.opcionesRecompensa.includes(cartaId)) {
            jugador.mazoMaestro.push(cartaId);
        }
        jugador.recompensaElegida = true;
        jugador.opcionesRecompensa.clear();
        jugador.reliquiaRecompensa = "";
        jugador.oroRecompensa = 0;
        if (tomarOro && oroDisponible > 0) {
            PlayerStatsHelper_1.PlayerStatsHelper.modificarOro(jugador, oroDisponible);
        }
        if (tomarReliquia && reliquiaDisponible) {
            RelicEngine_1.RelicEngine.otorgarReliquia(this.state, jugador, reliquiaDisponible, true);
        }
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
