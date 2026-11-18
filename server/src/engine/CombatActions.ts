import { SpireState, PlayerState, EnemyState } from "../rooms/schema/SpireState";
import { EstadoId, FuenteDanio } from "../../../assets/cliente/compartido/CondicionesYEfectos";
import { CalculadoraCombate } from "../../../assets/cliente/compartido/CalculadoraCombate";
import { CONFIG_MAPA } from "../../../assets/cliente/compartido/Mapa";
import { ActionQueue, IAccionCombate } from "./ActionQueue";
import { CombatEventBus, EntidadCombate } from "./CombatEventBus";

export function obtenerIdEntidad(entidad: EntidadCombate): string {
    return entidad instanceof PlayerState ? entidad.sessionId : entidad.uid;
}

export interface IOpcionesExtraDanio {
    oroPorGolpeAlHp?: number;
    oroSiMata?: number;
    multiplicadorFuerza?: number;
}

export class AccionModificarOro implements IAccionCombate {
    constructor(private jugador: PlayerState, private delta: number) {}

    ejecutar(_state: SpireState, cola: ActionQueue): void {
        if (this.delta === 0) return;
        const antes = this.jugador.oro;
        this.jugador.oro = Math.max(0, this.jugador.oro + this.delta);
        const cambioReal = this.jugador.oro - antes;

        if (cambioReal !== 0) {
            cola.emitirVisual({
                tipo: "ORO_CAMBIADO",
                jugadorId: this.jugador.sessionId,
                delta: cambioReal,
                oroTotal: this.jugador.oro
            });
        }
    }
}

export class AccionPerderHp implements IAccionCombate {
    constructor(
        private objetivo: EntidadCombate,
        private cantidad: number,
        private autor?: EntidadCombate
    ) {}

    ejecutar(_state: SpireState, cola: ActionQueue): void {
        if (this.objetivo.hp <= 0 || this.cantidad <= 0) return;

        const antes = this.objetivo.hp;
        this.objetivo.hp = Math.max(0, this.objetivo.hp - this.cantidad);
        const perdidoReal = antes - this.objetivo.hp;

        cola.emitirVisual({
            tipo: "IMPACTO_DANIO",
            objetivoId: obtenerIdEntidad(this.objetivo),
            atacanteId: this.autor ? obtenerIdEntidad(this.autor) : undefined,
            danioAlHp: perdidoReal,
            danioBloqueado: 0,
            hpRestante: this.objetivo.hp,
            bloqueoRestante: this.objetivo.bloqueo,
            fuente: "EFECTO_DIRECTO"
        });

        if (this.objetivo instanceof PlayerState && perdidoReal > 0) {
            this.objetivo.hpPerdidoCombate += perdidoReal;

            const avaricia = this.objetivo.estados.get("AVARICIA") || 0;
            if (avaricia > 0) {
                cola.encolarAlInicio(new AccionModificarOro(this.objetivo, perdidoReal * avaricia));
            }
        }

        if (this.objetivo.hp <= 0) {
            cola.encolarAlInicio(new AccionProcesarMuerte(this.objetivo, this.autor));
        }
    }
}

export class AccionAplicarDanio implements IAccionCombate {
    constructor(
        private atacante: EntidadCombate | undefined,
        private defensor: EntidadCombate,
        private danioBase: number,
        private fuente: FuenteDanio = "ATAQUE_CARTA",
        private extra: IOpcionesExtraDanio = {}
    ) {}

    ejecutar(state: SpireState, cola: ActionQueue, bus: CombatEventBus): void {
        if (this.defensor.hp <= 0 || state.faseActual !== "COMBAT") return;
        if (
            (this.fuente === "ATAQUE_CARTA" || this.fuente === "ATAQUE_ENEMIGO") &&
            this.atacante &&
            this.atacante.hp <= 0
        ) {
            return;
        }

        const multFuerza = this.extra.multiplicadorFuerza ?? 1;
        const monto =
            this.fuente === "ATAQUE_CARTA" || this.fuente === "ATAQUE_ENEMIGO"
                ? CalculadoraCombate.calcularDanioAtaque(
                      this.danioBase,
                      this.atacante?.estados,
                      this.defensor.estados,
                      multFuerza
                  )
                : Math.max(0, this.danioBase);

        const ignoraBloqueo = this.fuente === "VENENO";
        const danioBloqueado = ignoraBloqueo ? 0 : Math.min(this.defensor.bloqueo, monto);
        const danioAlHp = Math.max(0, monto - danioBloqueado);

        const hpAntes = this.defensor.hp;
        this.defensor.bloqueo = Math.max(0, this.defensor.bloqueo - danioBloqueado);
        this.defensor.hp = Math.max(0, this.defensor.hp - danioAlHp);
        const hpPerdidoReal = hpAntes - this.defensor.hp;

        cola.emitirVisual({
            tipo: "IMPACTO_DANIO",
            objetivoId: obtenerIdEntidad(this.defensor),
            atacanteId: this.atacante ? obtenerIdEntidad(this.atacante) : undefined,
            danioAlHp,
            danioBloqueado,
            hpRestante: this.defensor.hp,
            bloqueoRestante: this.defensor.bloqueo,
            fuente: this.fuente
        });

        if (this.defensor instanceof PlayerState && hpPerdidoReal > 0) {
            this.defensor.hpPerdidoCombate += hpPerdidoReal;

            const avaricia = this.defensor.estados.get("AVARICIA") || 0;
            if (avaricia > 0) {
                cola.encolarAlInicio(
                    new AccionModificarOro(this.defensor, hpPerdidoReal * avaricia)
                );
            }
        }

        if (this.atacante instanceof PlayerState && this.defensor instanceof EnemyState) {
            if (hpPerdidoReal > 0 && this.extra.oroPorGolpeAlHp && this.extra.oroPorGolpeAlHp > 0) {
                cola.encolarAlInicio(
                    new AccionModificarOro(this.atacante, this.extra.oroPorGolpeAlHp)
                );
            }

            if (this.defensor.hp <= 0 && this.extra.oroSiMata && this.extra.oroSiMata > 0) {
                cola.encolarAlInicio(
                    new AccionModificarOro(this.atacante, this.extra.oroSiMata)
                );
            }
        }

        if (
            this.defensor instanceof PlayerState &&
            this.atacante instanceof EnemyState &&
            this.fuente === "ATAQUE_ENEMIGO"
        ) {
            if (danioAlHp > 0) {
                bus.emitir("AL_RECIBIR_DANIO", {
                    state,
                    cola,
                    defensor: this.defensor,
                    atacante: this.atacante,
                    danioRecibido: danioAlHp,
                    fuente: this.fuente
                });
            }

            const espinas = this.defensor.estados.get("ESPINAS") || 0;
            if (espinas > 0 && this.atacante.hp > 0) {
                cola.encolarAlInicio(
                    new AccionAplicarDanio(this.defensor, this.atacante, espinas, "ESPINAS")
                );
            }
        }

        if (
            this.atacante instanceof PlayerState &&
            this.defensor instanceof EnemyState &&
            this.fuente === "ATAQUE_CARTA"
        ) {
            if (danioAlHp > 0 && this.defensor.hp > 0) {
                bus.emitir("AL_INFLIGIR_DANIO", {
                    state,
                    cola,
                    atacante: this.atacante,
                    defensor: this.defensor,
                    danioInfligido: danioAlHp,
                    fuente: this.fuente
                });
            }

            // Si el enemigo atacado tiene ESPINAS (ej: Cactus, Espíritu de fuego/eléctrico), devuelve daño al jugador
            const espinasEnemigo = this.defensor.estados.get("ESPINAS") || 0;
            if (espinasEnemigo > 0 && this.atacante.hp > 0) {
                cola.encolarAlInicio(
                    new AccionAplicarDanio(this.defensor, this.atacante, espinasEnemigo, "ESPINAS")
                );
            }
        }

        if (this.defensor.hp <= 0) {
            cola.encolarAlInicio(new AccionProcesarMuerte(this.defensor, this.atacante));
        }
    }
}

export class AccionGanarBloqueo implements IAccionCombate {
    constructor(private objetivo: EntidadCombate, private valor: number) {}

    ejecutar(_state: SpireState, cola: ActionQueue): void {
        if (this.objetivo.hp <= 0 || this.valor <= 0) return;
        this.objetivo.bloqueo += this.valor;

        cola.emitirVisual({
            tipo: "BLOQUEO_GANADO",
            entidadId: obtenerIdEntidad(this.objetivo),
            cantidad: this.valor,
            bloqueoTotal: this.objetivo.bloqueo
        });
    }
}

export class AccionAplicarEstado implements IAccionCombate {
    constructor(
        private objetivo: EntidadCombate,
        private estadoId: EstadoId,
        private valor: number
    ) {}

    ejecutar(_state: SpireState, cola: ActionQueue): void {
        if (this.objetivo.hp <= 0 || this.valor === 0) return;
        const actual = this.objetivo.estados.get(this.estadoId) || 0;
        const nuevoTotal = actual + this.valor;

        if (nuevoTotal === 0) {
            this.objetivo.estados.delete(this.estadoId);
        } else {
            this.objetivo.estados.set(this.estadoId, nuevoTotal);
        }

        cola.emitirVisual({
            tipo: "ESTADO_APLICADO",
            entidadId: obtenerIdEntidad(this.objetivo),
            estadoId: this.estadoId,
            valorAgregado: this.valor,
            valorTotal: nuevoTotal
        });
    }
}

export class AccionCurarHp implements IAccionCombate {
    constructor(private objetivo: EntidadCombate, private valor: number) {}

    ejecutar(_state: SpireState, cola: ActionQueue): void {
        if (this.objetivo.hp <= 0 || this.valor <= 0) return;
        const antes = this.objetivo.hp;
        this.objetivo.hp = Math.min(this.objetivo.hpMax, this.objetivo.hp + this.valor);
        const curado = this.objetivo.hp - antes;

        if (curado > 0) {
            cola.emitirVisual({
                tipo: "CURACION_RECIBIDA",
                entidadId: obtenerIdEntidad(this.objetivo),
                cantidad: curado,
                hpActual: this.objetivo.hp
            });
        }
    }
}

export class AccionGanarEnergia implements IAccionCombate {
    constructor(private jugador: PlayerState, private valor: number) {}

    ejecutar(): void {
        if (this.jugador.hp <= 0 || this.valor === 0) return;
        this.jugador.energia = Math.max(0, this.jugador.energia + this.valor);
    }
}

export class AccionRobarCartas implements IAccionCombate {
    constructor(
        private jugador: PlayerState,
        private cantidad: number,
        private mezclarCallback: (arr: string[]) => void,
        private actualizarContadoresCallback: (j: PlayerState) => void
    ) {}

    ejecutar(): void {
        if (this.jugador.hp <= 0 || this.cantidad <= 0) return;
        if ((this.jugador.estados.get("SIN_ROBO") || 0) > 0) return;

        for (let i = 0; i < this.cantidad; i++) {
            if (this.jugador.mano.length >= 10) break;

            if (this.jugador.pilaRoboInterna.length === 0) {
                if (this.jugador.descarteInterno.length === 0) break;
                this.jugador.pilaRoboInterna = [...this.jugador.descarteInterno];
                this.jugador.descarteInterno = [];
                this.mezclarCallback(this.jugador.pilaRoboInterna);
            }

            const cartaRobada = this.jugador.pilaRoboInterna.pop();
            if (cartaRobada) {
                this.jugador.mano.push(cartaRobada);
            }
        }
        this.actualizarContadoresCallback(this.jugador);
    }
}

export class AccionProcesarMuerte implements IAccionCombate {
    constructor(
        private entidadMuerta: EntidadCombate,
        private autorMuerte?: EntidadCombate
    ) {}

    ejecutar(state: SpireState, cola: ActionQueue, bus: CombatEventBus): void {
        if (this.entidadMuerta.hp > 0) return;

        this.entidadMuerta.bloqueo = 0;
        if (this.entidadMuerta instanceof PlayerState) {
            this.entidadMuerta.turnoTerminado = true;
        }

        cola.emitirVisual({
            tipo: "ENTIDAD_MURIO",
            entidadId: obtenerIdEntidad(this.entidadMuerta),
            esEnemigo: this.entidadMuerta instanceof EnemyState
        });

        bus.emitir("AL_MORIR_ENTIDAD", {
            state,
            cola,
            entidadMuerta: this.entidadMuerta,
            autorMuerte: this.autorMuerte
        });

        cola.encolarAlFinal(new AccionVerificarFinCombate());
    }
}

export class AccionVerificarFinCombate implements IAccionCombate {
    ejecutar(state: SpireState, cola: ActionQueue, bus: CombatEventBus): void {
        if (state.faseActual !== "COMBAT") return;

        const quedaEnemigoVivo = state.enemigos.some((e) => e.hp > 0);
        if (!quedaEnemigoVivo) {
            bus.emitir("AL_FINALIZAR_COMBATE", { state, cola });
            const esJefeFinalRun =
                state.esCombateJefe && state.mapaActual >= CONFIG_MAPA.TOTAL_MAPAS;
            state.faseActual = esJefeFinalRun ? "VICTORY" : "REWARD";
            return;
        }

        let quedaJugadorVivo = false;
        state.jugadores.forEach((j) => {
            if (j.hp > 0) quedaJugadorVivo = true;
        });

        if (!quedaJugadorVivo) {
            state.faseActual = "DEFEAT";
        }
    }
}