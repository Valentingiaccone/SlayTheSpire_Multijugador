import { SpireState } from "../schema/SpireState";
import { generarOpcionesRecompensa } from "../../../../assets/cliente/compartido/Cartas";
import { obtenerReliquiasRecompensa } from "../../../../assets/cliente/compartido/Reliquias";
import { ECONOMIA_CONFIG } from "../../../../assets/cliente/compartido/GameTypes";

export class RewardService {
    constructor(
        private state: SpireState,
        private onRecompensasCompletadasCallback: () => void
    ) {}

    public prepararRecompensas(): void {
        const oroBase = this.state.esCombateJefe
            ? ECONOMIA_CONFIG.ORO_COMBATE_JEFE
            : this.state.esCombateElite
            ? ECONOMIA_CONFIG.ORO_COMBATE_ELITE
            : ECONOMIA_CONFIG.ORO_COMBATE_NORMAL;

        this.state.jugadores.forEach((jugador) => {
            if (jugador.hp <= 0) {
                jugador.hp = Math.max(1, Math.floor(jugador.hpMax * 0.3));
            }
            jugador.recompensaElegida = false;
            jugador.opcionesRecompensa.clear();
            jugador.reliquiaRecompensa = "";
            jugador.oroRecompensa = oroBase;

            const opciones = generarOpcionesRecompensa(jugador.personajeId, 3);
            opciones.forEach((id) => jugador.opcionesRecompensa.push(id));

            if (this.state.esCombateElite) {
                const reliquias = obtenerReliquiasRecompensa(this.state.jugadores, 1, jugador.personajeId);
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