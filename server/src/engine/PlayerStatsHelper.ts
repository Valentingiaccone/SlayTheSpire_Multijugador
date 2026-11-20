import { SpireState, PlayerState } from "../rooms/schema/SpireState";
import { CATALOGO_RELIQUIAS } from "../../../assets/cliente/compartido/Reliquias";
import { ActionQueue } from "./ActionQueue";

export class PlayerStatsHelper {
    /**
     * Único punto para sumar o restar oro.
     * Si delta > 0, evalúa automáticamente la reliquia pasiva "Suerte dorada" (5% de duplicar).
     */
    public static modificarOro(
        jugador: PlayerState,
        delta: number,
        cola?: ActionQueue
    ): number {
        if (delta === 0) return 0;

        let deltaFinal = delta;

        if (delta > 0 && jugador.reliquias) {
            jugador.reliquias.forEach((relId: string) => {
                const mod = CATALOGO_RELIQUIAS[relId]?.modificadorPasivo;
                if (mod?.tipo === "PROBABILIDAD_DOBLE_ORO") {
                    if (Math.random() * 100 < mod.probabilidad) {
                        deltaFinal *= 2;
                        cola?.emitirVisual({
                            tipo: "RELIQUIA_ACTIVADA",
                            jugadorId: jugador.sessionId,
                            reliquiaId: relId
                        });
                    }
                }
            });
        }

        const antes = jugador.oro;
        jugador.oro = Math.max(0, jugador.oro + deltaFinal);
        const cambioReal = jugador.oro - antes;

        if (cambioReal !== 0 && cola) {
            cola.emitirVisual({
                tipo: "ORO_CAMBIADO",
                jugadorId: jugador.sessionId,
                delta: cambioReal,
                oroTotal: jugador.oro
            });
        }

        return cambioReal;
    }

    /**
     * Único punto para restar HP a un jugador (en combate o fuera de combate).
     * 1. Aplica "Pay to Win" (gasta 15 de oro por cada 1 HP evitable).
     * 2. Actualiza hpPerdidoCombate si estamos en combate.
     * 3. Dispara ganancia de oro por estado AVARICIA y reliquia "Sangre dorada".
     * Devuelve el HP perdido real tras mitigación de oro.
     */
    public static aplicarPerdidaHpJugador(
        state: SpireState,
        jugador: PlayerState,
        cantidad: number,
        opciones: { permitirMuerte?: boolean; cola?: ActionQueue } = {}
    ): { hpPerdidoReal: number; hpEvitadoPorOro: number } {
        if (cantidad <= 0 || jugador.hp <= 0) {
            return { hpPerdidoReal: 0, hpEvitadoPorOro: 0 };
        }

        const permitirMuerte = opciones.permitirMuerte ?? true;
        const cola = opciones.cola;
        let hpRestanteAPerder = cantidad;
        let hpEvitadoPorOro = 0;

        // 1. Pay to Win: gasta X de oro por cada 1 HP para evitar perderlo
        if (jugador.reliquias) {
            jugador.reliquias.forEach((relId: string) => {
                if (hpRestanteAPerder <= 0) return;
                const mod = CATALOGO_RELIQUIAS[relId]?.modificadorPasivo;
                if (mod?.tipo === "ESCUDO_ORO_AL_PERDER_HP" && mod.oroPorHp > 0) {
                    const maxEvitable = Math.floor(jugador.oro / mod.oroPorHp);
                    const evitado = Math.min(hpRestanteAPerder, maxEvitable);
                    if (evitado > 0) {
                        this.modificarOro(jugador, -(evitado * mod.oroPorHp), cola);
                        hpRestanteAPerder -= evitado;
                        hpEvitadoPorOro += evitado;
                        cola?.emitirVisual({
                            tipo: "RELIQUIA_ACTIVADA",
                            jugadorId: jugador.sessionId,
                            reliquiaId: relId
                        });
                    }
                }
            });
        }

        if (hpRestanteAPerder <= 0) {
            return { hpPerdidoReal: 0, hpEvitadoPorOro };
        }

        const hpMinimo = permitirMuerte ? 0 : 1;
        const antes = jugador.hp;
        jugador.hp = Math.max(hpMinimo, jugador.hp - hpRestanteAPerder);
        const hpPerdidoReal = antes - jugador.hp;

        if (hpPerdidoReal > 0) {
            if (state.faseActual === "COMBAT") {
                jugador.hpPerdidoCombate += hpPerdidoReal;
            }

            // 2. Estado AVARICIA
            const avaricia = jugador.estados.get("AVARICIA") || 0;
            if (avaricia > 0) {
                this.modificarOro(jugador, hpPerdidoReal * avaricia, cola);
            }

            // 3. Reliquia pasiva Sangre dorada (y futuras similares)
            if (jugador.reliquias) {
                jugador.reliquias.forEach((relId: string) => {
                    const mod = CATALOGO_RELIQUIAS[relId]?.modificadorPasivo;
                    if (mod?.tipo === "ORO_POR_HP_PERDIDO" && mod.valor > 0) {
                        cola?.emitirVisual({
                            tipo: "RELIQUIA_ACTIVADA",
                            jugadorId: jugador.sessionId,
                            reliquiaId: relId
                        });
                        this.modificarOro(jugador, hpPerdidoReal * mod.valor, cola);
                    }
                });
            }
        }

        return { hpPerdidoReal, hpEvitadoPorOro };
    }
}