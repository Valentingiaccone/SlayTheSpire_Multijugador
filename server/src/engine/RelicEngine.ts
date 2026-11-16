import { SpireState, PlayerState, EnemyState } from "../rooms/schema/SpireState";
import {
    CATALOGO_RELIQUIAS,
    TriggerReliquia,
    IReliquiaContexto
} from "../../../assets/cliente/compartido/Reliquias";
import { ICartaData } from "../../../assets/cliente/compartido/Cartas";
import { CombatEngine } from "./CombatEngine";

export interface IExtraContextoReliquia {
    cartaJugada?: ICartaData;
    objetivoId?: string;
    danioRecibido?: number;
    atacante?: EnemyState;
}

export class RelicEngine {
    /** Dispara las reliquias de un jugador específico para el trigger indicado */
    public static dispararParaJugador(
        trigger: TriggerReliquia,
        state: SpireState,
        portador: PlayerState,
        extra: IExtraContextoReliquia = {}
    ) {
        if (!portador.reliquias || portador.reliquias.length === 0) return;
        if (portador.hp <= 0 && trigger !== "AL_FINALIZAR_COMBATE") return;

        const contexto: IReliquiaContexto = {
            state,
            portador,
            turnoNumero: state.turnoNumero,
            pisoActual: state.pisoActual,
            esElite: state.esCombateElite,
            esJefe: state.esCombateJefe,
            cartaJugada: extra.cartaJugada,
            objetivoId: extra.objetivoId,
            cartasJugadasTurno: portador.cartasJugadasTurno,
            ataquesJugadosTurno: portador.ataquesJugadosTurno,
            cartasJugadasCombate: portador.cartasJugadasCombate,
            danioRecibido: extra.danioRecibido,
            atacante: extra.atacante
        };

        portador.reliquias.forEach((reliquiaId: string) => {
            const data = CATALOGO_RELIQUIAS[reliquiaId];
            if (!data || data.trigger !== trigger) return;

            if (data.condicion && !data.condicion(contexto)) {
                return;
            }

            for (const efecto of data.efectos) {
                CombatEngine.ejecutarEfecto(state, portador, efecto, extra.objetivoId);
            }
        });
    }

    /** Dispara un trigger para todos los jugadores de la sala (ej. AL_INICIAR_COMBATE) */
    public static dispararParaTodos(
        trigger: TriggerReliquia,
        state: SpireState,
        extra: IExtraContextoReliquia = {}
    ) {
        state.jugadores.forEach((jugador) => {
            this.dispararParaJugador(trigger, state, jugador, extra);
        });
    }
}