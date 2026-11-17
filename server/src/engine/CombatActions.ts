import { SpireState, PlayerState, EnemyState } from "../rooms/schema/SpireState";
import { EstadoId, FuenteDanio } from "../../../assets/cliente/compartido/CondicionesYEfectos";
import { CONFIG_MAPA } from "../../../assets/cliente/compartido/Mapa";
import { ActionQueue, IAccionCombate } from "./ActionQueue";
import { CombatEventBus, EntidadCombate } from "./CombatEventBus";

export function obtenerIdEntidad(entidad: EntidadCombate): string {
    return entidad instanceof PlayerState ? entidad.sessionId : entidad.uid;
}

/**
 * Cálculo y aplicación de daño centralizados en un único lugar del servidor.
 */
export class AccionAplicarDanio implements IAccionCombate {
    constructor(
        private atacante: EntidadCombate | undefined,
        private defensor: EntidadCombate,
        private danioBase: number,
        private fuente: FuenteDanio = "ATAQUE_CARTA"
    ) {}

    ejecutar(state: SpireState, cola: ActionQueue, bus: CombatEventBus): void {
        if (this.defensor.hp <= 0 || state.faseActual !== "COMBAT") return;
        if (
            (this.fuente === "ATAQUE_CARTA" || this.fuente === "ATAQUE_ENEMIGO") &&
            this.atacante &&
            this.atacante.hp <= 0
        ) {
            // Evita el bug de "Enemigos Zombi": si el atacante murió por Espinas en el golpe previo, su siguiente golpe se cancela
            return;
        }

        let monto = this.danioBase;

        // Solo los ataques de cartas o enemigos escalan con FUERZA, DEBIL y VULNERABLE
        if (this.fuente === "ATAQUE_CARTA" || this.fuente === "ATAQUE_ENEMIGO") {
            if (this.atacante) {
                monto += this.atacante.estados.get("FUERZA") || 0;
                if ((this.atacante.estados.get("DEBIL") || 0) > 0) {
                    monto = Math.floor(monto * 0.75);
                }
            }
            if ((this.defensor.estados.get("VULNERABLE") || 0) > 0) {
                monto = Math.floor(monto * 1.5);
            }
        }

        monto = Math.max(0, monto);

        // El veneno ignora bloqueo; el resto de fuentes impacta primero contra el bloqueo
        const ignoraBloqueo = this.fuente === "VENENO";
        const danioBloqueado = ignoraBloqueo ? 0 : Math.min(this.defensor.bloqueo, monto);
        const danioAlHp = Math.max(0, monto - danioBloqueado);

        this.defensor.bloqueo = Math.max(0, this.defensor.bloqueo - danioBloqueado);
        this.defensor.hp = Math.max(0, this.defensor.hp - danioAlHp);

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

        // 1. Reacciones de ESPINAS y AL_RECIBIR_DANIO cuando un enemigo ataca a un jugador
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

        // 2. Reacciones AL_INFLIGIR_DANIO (solo en ataques de carta para no disparar bucles con reliquias)
        if (
            this.atacante instanceof PlayerState &&
            this.defensor instanceof EnemyState &&
            this.fuente === "ATAQUE_CARTA" &&
            danioAlHp > 0 &&
            this.defensor.hp > 0
        ) {
            bus.emitir("AL_INFLIGIR_DANIO", {
                state,
                cola,
                atacante: this.atacante,
                defensor: this.defensor,
                danioInfligido: danioAlHp,
                fuente: this.fuente
            });
        }

        // 3. Si la entidad cayó a 0 HP, procesar su muerte inmediatamente al tope de la cola
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
        this.objetivo.estados.set(this.estadoId, nuevoTotal);

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

        // 1. ¿Quedan enemigos vivos?
        const quedaEnemigoVivo = state.enemigos.some((e) => e.hp > 0);
        if (!quedaEnemigoVivo) {
            bus.emitir("AL_FINALIZAR_COMBATE", { state, cola });
            state.faseActual = state.pisoActual >= CONFIG_MAPA.CANTIDAD_PISOS ? "VICTORY" : "REWARD";
            return;
        }

        // 2. ¿Quedan jugadores vivos? (Previene el soft-lock si todos mueren por veneno al iniciar turno)
        let quedaJugadorVivo = false;
        state.jugadores.forEach((j) => {
            if (j.hp > 0) quedaJugadorVivo = true;
        });

        if (!quedaJugadorVivo) {
            state.faseActual = "DEFEAT";
        }
    }
}