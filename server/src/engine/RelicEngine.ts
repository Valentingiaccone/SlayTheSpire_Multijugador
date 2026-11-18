import { SpireState, PlayerState, EnemyState } from "../rooms/schema/SpireState";
import { CATALOGO_RELIQUIAS, TriggerReliquia } from "../../../assets/cliente/compartido/Reliquias";
import { DescriptorCondicion } from "../../../assets/cliente/compartido/CondicionesYEfectos";
import { CombatEngine } from "./CombatEngine";
import { ActionQueue } from "./ActionQueue";
import { EntidadCombate } from "./CombatEventBus";

export interface IParametrosDisparoReliquia {
    objetivoId?: string;
    atacante?: EntidadCombate;
    danioRecibido?: number;
    danioInfligido?: number;
}

export class RelicEngine {
    public static evaluarCondicion(
        condicion: DescriptorCondicion,
        state: SpireState,
        portador: PlayerState,
        params: IParametrosDisparoReliquia
    ): boolean {
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
            case "ORO_MINIMO":
                return portador.oro >= condicion.minimo;
            case "TIENE_ESTADO": {
                const min = condicion.minimo ?? 1;
                if (condicion.objetivo === "ENEMIGO" && params.objetivoId) {
                    const enemigoDirecto = state.enemigos.find((e) => e.uid === params.objetivoId);
                    return Boolean(
                        enemigoDirecto &&
                            (enemigoDirecto.estados.get(condicion.estadoId) || 0) >= min
                    );
                }
                const objetivos = CombatEngine.resolverObjetivos(
                    state,
                    portador,
                    condicion.objetivo,
                    params.objetivoId,
                    params.atacante
                );
                return objetivos.some((obj) => (obj.estados.get(condicion.estadoId) || 0) >= min);
            }
            default:
                return true;
        }
    }

    public static dispararParaJugador(
        trigger: TriggerReliquia,
        state: SpireState,
        portador: PlayerState,
        params: IParametrosDisparoReliquia = {},
        colaActiva?: ActionQueue
    ): void {
        if (!portador.reliquias || portador.reliquias.length === 0) return;
        if (portador.hp <= 0 && trigger !== "AL_FINALIZAR_COMBATE") return;

        const cola = colaActiva || CombatEngine.obtenerColaActiva();

        const objetivoPorDefecto =
            params.objetivoId ||
            (params.atacante instanceof EnemyState ? params.atacante.uid : undefined);

        portador.reliquias.forEach((reliquiaId: string) => {
            const data = CATALOGO_RELIQUIAS[reliquiaId];
            if (!data || data.trigger !== trigger) return;

            if (data.condicion && !this.evaluarCondicion(data.condicion, state, portador, params)) {
                return;
            }

            cola.emitirVisual({
                tipo: "RELIQUIA_ACTIVADA",
                jugadorId: portador.sessionId,
                reliquiaId: data.id
            });

            CombatEngine.encolarEfectos(
                state,
                cola,
                portador,
                data.efectos,
                objetivoPorDefecto,
                params.atacante,
                "RELIQUIA"
            );
        });

        if (!colaActiva) {
            CombatEngine.procesarColaPendiente(state);
        }
    }

    public static dispararParaTodos(
        trigger: TriggerReliquia,
        state: SpireState,
        params: IParametrosDisparoReliquia = {},
        colaActiva?: ActionQueue
    ): void {
        const cola = colaActiva || CombatEngine.obtenerColaActiva();
        state.jugadores.forEach((jugador) => {
            this.dispararParaJugador(trigger, state, jugador, params, cola);
        });

        if (!colaActiva) {
            CombatEngine.procesarColaPendiente(state);
        }
    }
}