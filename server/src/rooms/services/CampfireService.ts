import { SpireState } from "../schema/SpireState";
import { ECONOMIA_CONFIG, TipoAccionFogata } from "../../../../assets/cliente/compartido/GameTypes";
import { obtenerCartaMejorada } from "../../../../assets/cliente/compartido/Cartas";

export class CampfireService {
    constructor(
        private state: SpireState,
        private onFogataCompletadaCallback: () => void
    ) {}

    public iniciarEventoFogata(): void {
        this.state.jugadores.forEach((j) => {
            j.fogataCompletada = false;
        });
        this.state.faseActual = "CAMPFIRE";
    }

    public procesarAccionFogata(sessionId: string, accion: TipoAccionFogata): void {
        if (this.state.faseActual !== "CAMPFIRE") return;
        const jugador = this.state.jugadores.get(sessionId);
        if (!jugador || jugador.fogataCompletada || !accion) return;

        switch (accion.tipo) {
            case "CURAR_PROPIO": {
                const curacion = Math.max(1, Math.floor(jugador.hpMax * ECONOMIA_CONFIG.PORCENTAJE_CURACION_FOGATA));
                jugador.hp = Math.min(jugador.hpMax, jugador.hp + curacion);
                jugador.fogataCompletada = true;
                break;
            }

            case "CURAR_ALIADO": {
                if (this.state.jugadores.size <= 1) return;
                if (accion.aliadoSessionId === sessionId) return;

                const aliado = this.state.jugadores.get(accion.aliadoSessionId);
                if (!aliado) return;

                const curacionAliado = Math.max(
                    1,
                    Math.floor(aliado.hpMax * ECONOMIA_CONFIG.PORCENTAJE_CURACION_FOGATA)
                );
                aliado.hp = Math.min(aliado.hpMax, aliado.hp + curacionAliado);
                jugador.fogataCompletada = true;
                break;
            }

            case "MEJORAR_CARTA": {
                const idx = accion.indiceMazo;
                if (typeof idx !== "number" || idx < 0 || idx >= jugador.mazoMaestro.length) return;

                const cartaActualId = jugador.mazoMaestro[idx];
                const cartaMejorada = obtenerCartaMejorada(cartaActualId);
                if (!cartaMejorada) return;

                jugador.mazoMaestro[idx] = cartaMejorada.id;
                jugador.fogataCompletada = true;
                break;
            }

            default:
                return;
        }

        this.verificarFinFogata();
    }

    public verificarFinFogata(): void {
        if (this.state.faseActual !== "CAMPFIRE") return;

        let todosTerminaron = true;
        this.state.jugadores.forEach((j) => {
            if (!j.fogataCompletada) todosTerminaron = false;
        });

        if (todosTerminaron) {
            this.onFogataCompletadaCallback();
        }
    }
}