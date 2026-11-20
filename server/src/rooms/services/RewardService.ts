import { SpireState } from "../schema/SpireState";
import {
    generarOpcionesRecompensa,
    ContextoGeneracionCartas
} from "../../../../assets/cliente/compartido/Cartas";
import {
    ContextoGeneracionReliquias,
    obtenerReliquiasRecompensa
} from "../../../../assets/cliente/compartido/Reliquias";
import { ECONOMIA_CONFIG } from "../../../../assets/cliente/compartido/GameTypes";
import { RelicEngine } from "../../engine/RelicEngine";
import { PlayerStatsHelper } from "../../engine/PlayerStatsHelper";

export class RewardService {
    constructor(
        private state: SpireState,
        private onRecompensasCompletadasCallback: () => void
    ) {}

    public prepararRecompensas(): void {
        const contextoCartas: ContextoGeneracionCartas = this.state.esCombateJefe
            ? "JEFE"
            : this.state.esCombateElite
            ? "ELITE"
            : "COMBATE";

        const contextoReliquia: ContextoGeneracionReliquias = this.state.esCombateJefe
            ? "JEFE"
            : "ELITE";

        const oroBase = this.state.esCombateJefe
            ? ECONOMIA_CONFIG.ORO_COMBATE_JEFE
            : this.state.esCombateElite
            ? ECONOMIA_CONFIG.ORO_COMBATE_ELITE
            : ECONOMIA_CONFIG.ORO_COMBATE_NORMAL;

        const cantJugadores = Math.max(1, this.state.jugadores.size);

        this.state.jugadores.forEach((jugador) => {
            if (jugador.hp <= 0) {
                jugador.hp = Math.max(1, Math.floor(jugador.hpMax * 0.3));
            }
            jugador.recompensaElegida = false;
            jugador.opcionesRecompensa.clear();
            jugador.reliquiaRecompensa = "";
            jugador.oroRecompensa = oroBase;

            const cantOpciones = 3 + RelicEngine.obtenerCartasExtraRecompensa(jugador);
            const opciones = generarOpcionesRecompensa(
                jugador.personajeId,
                cantOpciones,
                contextoCartas,
                cantJugadores
            );
            opciones.forEach((id) => jugador.opcionesRecompensa.push(id));

            if (this.state.esCombateElite || this.state.esCombateJefe) {
                const reliquias = obtenerReliquiasRecompensa(
                    this.state.jugadores,
                    1,
                    jugador.personajeId,
                    contextoReliquia
                );
                jugador.reliquiaRecompensa = reliquias[0] || "";
            }
        });
    }

    public elegirRecompensa(
        sessionId: string,
        cartaId: string | null,
        tomarReliquia: boolean = false,
        tomarOro: boolean = false
    ): void {
        if (this.state.faseActual !== "REWARD") return;
        const jugador = this.state.jugadores.get(sessionId);
        if (!jugador || jugador.recompensaElegida) return;

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
            PlayerStatsHelper.modificarOro(jugador, oroDisponible);
        }

        if (tomarReliquia && reliquiaDisponible) {
            RelicEngine.otorgarReliquia(this.state, jugador, reliquiaDisponible, true);
        }

        this.verificarFinRecompensas();
    }

    public verificarFinRecompensas(): void {
        if (this.state.faseActual !== "REWARD") return;
        let todosEligieron = true;
        this.state.jugadores.forEach((j) => {
            if (!j.recompensaElegida) todosEligieron = false;
        });

        if (todosEligieron) {
            this.onRecompensasCompletadasCallback();
        }
    }
}