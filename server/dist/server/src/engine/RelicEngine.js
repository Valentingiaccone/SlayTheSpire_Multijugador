"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelicEngine = void 0;
const SpireState_1 = require("../rooms/schema/SpireState");
const Reliquias_1 = require("../../../assets/cliente/compartido/Reliquias");
const CombatEngine_1 = require("./CombatEngine");
class RelicEngine {
    static evaluarCondicion(condicion, state, portador, params) {
        switch (condicion.tipo) {
            case "TURNO_MULTIPLO":
                return state.turnoNumero > 0 && state.turnoNumero % condicion.divisor === 0;
            case "TURNO_EXACTO":
                return state.turnoNumero === condicion.turno;
            case "TURNO_PARIDAD":
                return (state.turnoNumero % 2 === 0) === condicion.esPar;
            case "CARTAS_TURNO_MULTIPLO":
                return portador.cartasJugadasTurno > 0 && portador.cartasJugadasTurno % condicion.divisor === 0;
            case "ATAQUES_TURNO_IGUAL":
                return portador.ataquesJugadosTurno === condicion.cantidad;
            case "DANIO_RECIBIDO_MAYOR_A":
                return (params.danioRecibido || 0) > condicion.minimo;
            case "TIENE_ESTADO": {
                const objetivos = CombatEngine_1.CombatEngine.resolverObjetivos(state, portador, condicion.objetivo, params.objetivoId, params.atacante);
                const min = condicion.minimo ?? 1;
                return objetivos.some((obj) => (obj.estados.get(condicion.estadoId) || 0) >= min);
            }
            default:
                return true;
        }
    }
    static dispararParaJugador(trigger, state, portador, params = {}, colaActiva) {
        if (!portador.reliquias || portador.reliquias.length === 0)
            return;
        if (portador.hp <= 0 && trigger !== "AL_FINALIZAR_COMBATE")
            return;
        const cola = colaActiva || CombatEngine_1.CombatEngine.obtenerColaActiva();
        // Si el trigger viene de recibir daño y hay un enemigo atacante, permitimos apuntarle por defecto
        const objetivoPorDefecto = params.objetivoId ||
            (params.atacante instanceof SpireState_1.EnemyState ? params.atacante.uid : undefined);
        portador.reliquias.forEach((reliquiaId) => {
            const data = Reliquias_1.CATALOGO_RELIQUIAS[reliquiaId];
            if (!data || data.trigger !== trigger)
                return;
            if (data.condicion && !this.evaluarCondicion(data.condicion, state, portador, params)) {
                return;
            }
            cola.emitirVisual({
                tipo: "RELIQUIA_ACTIVADA",
                jugadorId: portador.sessionId,
                reliquiaId: data.id
            });
            CombatEngine_1.CombatEngine.encolarEfectos(state, cola, portador, data.efectos, objetivoPorDefecto, params.atacante, "RELIQUIA");
        });
        if (!colaActiva) {
            CombatEngine_1.CombatEngine.procesarColaPendiente(state);
        }
    }
    static dispararParaTodos(trigger, state, params = {}, colaActiva) {
        const cola = colaActiva || CombatEngine_1.CombatEngine.obtenerColaActiva();
        state.jugadores.forEach((jugador) => {
            this.dispararParaJugador(trigger, state, jugador, params, cola);
        });
        if (!colaActiva) {
            CombatEngine_1.CombatEngine.procesarColaPendiente(state);
        }
    }
}
exports.RelicEngine = RelicEngine;
