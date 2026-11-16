import { SpireState, PlayerState, EnemyState } from "../rooms/schema/SpireState";
import { CATALOGO_CARTAS, IEfecto, TipoEfecto, EstadoId } from "../../../assets/cliente/compartido/Cartas";
import { ENEMIGOS_INFO } from "../../../assets/cliente/compartido/Enemigos";
import { CONFIG_MAPA } from "../../../assets/cliente/compartido/Mapa";
import { RelicEngine } from "./RelicEngine";

type EntidadCombate = PlayerState | EnemyState;
type EfectoHandler = (state: SpireState, lanzador: PlayerState, efecto: IEfecto, objetivoId?: string) => void;

const EFECTO_HANDLERS: Record<TipoEfecto, EfectoHandler> = {
    DANIO: (state, lanzador, efecto, objetivoId) => {
        const objetivos = resolverObjetivos(state, lanzador, efecto.objetivo, objetivoId);
        for (const obj of objetivos) {
            CombatEngine.aplicarDanio(state, lanzador, obj, efecto.valor);
        }
    },
    BLOQUEO: (state, lanzador, efecto, objetivoId) => {
        const objetivos = resolverObjetivos(state, lanzador, efecto.objetivo, objetivoId);
        for (const obj of objetivos) {
            obj.bloqueo += efecto.valor;
        }
    },
    APLICAR_ESTADO: (state, lanzador, efecto, objetivoId) => {
        if (!efecto.estadoId) return;
        const objetivos = resolverObjetivos(state, lanzador, efecto.objetivo, objetivoId);
        for (const obj of objetivos) {
            const actual = obj.estados.get(efecto.estadoId) || 0;
            obj.estados.set(efecto.estadoId, actual + efecto.valor);
        }
    },
    ROBAR_CARTA: (_state, lanzador, efecto) => {
        CombatEngine.robarCartas(lanzador, efecto.valor);
    },
    GANAR_ENERGIA: (_state, lanzador, efecto) => {
        lanzador.energia += efecto.valor;
    },
    CURAR_HP: (state, lanzador, efecto, objetivoId) => {
        const objetivos = resolverObjetivos(state, lanzador, efecto.objetivo, objetivoId);
        for (const obj of objetivos) {
            if (obj.hp > 0) {
                obj.hp = Math.min(obj.hpMax, obj.hp + efecto.valor);
            }
        }
    }
};

function resolverObjetivos(state: SpireState, lanzador: PlayerState, tipo: string, objetivoId?: string): EntidadCombate[] {
    switch (tipo) {
        case "PROPIO":
            return [lanzador];
        case "ENEMIGO": {
            const enemigo = state.enemigos.find((e) => e.uid === objetivoId && e.hp > 0);
            return enemigo ? [enemigo] : [];
        }
        case "TODOS_ENEMIGOS":
            return state.enemigos.filter((e) => e.hp > 0);
        case "ALIADO": {
            const aliado = objetivoId ? state.jugadores.get(objetivoId) : undefined;
            return aliado && aliado.hp > 0 ? [aliado] : [];
        }
        case "TODOS_ALIADOS": {
            const vivos: PlayerState[] = [];
            state.jugadores.forEach((j) => { if (j.hp > 0) vivos.push(j); });
            return vivos;
        }
        default:
            return [];
    }
}

export class CombatEngine {
    public static ejecutarEfecto(state: SpireState, lanzador: PlayerState, efecto: IEfecto, objetivoId?: string) {
        const handler = EFECTO_HANDLERS[efecto.tipo];
        if (handler) {
            handler(state, lanzador, efecto, objetivoId);
        }
    }

    static jugarCarta(state: SpireState, jugador: PlayerState, indiceMano: number, objetivoId?: string): boolean {
        if (state.faseActual !== "COMBAT" || jugador.hp <= 0 || jugador.turnoTerminado) return false;
        if (indiceMano < 0 || indiceMano >= jugador.mano.length) return false;

        const cartaId = jugador.mano[indiceMano];
        const cartaData = CATALOGO_CARTAS[cartaId];
        if (!cartaData) return false;
        if (jugador.energia < cartaData.costo) return false;

        if (cartaData.objetivoSeleccion === "ENEMIGO") {
            const existeEnemigoVivo = state.enemigos.some((e) => e.uid === objetivoId && e.hp > 0);
            if (!existeEnemigoVivo) return false;
        } else if (cartaData.objetivoSeleccion === "ALIADO") {
            const aliado = objetivoId ? state.jugadores.get(objetivoId) : undefined;
            if (!aliado || aliado.hp <= 0) return false;
        }

        // 1. Cobrar energía y sacar de la mano
        jugador.energia -= cartaData.costo;
        jugador.mano.splice(indiceMano, 1);

        // 2. Actualizar contadores para reliquias (ej. Sobrecarga, Daga Rítmica)
        jugador.cartasJugadasTurno += 1;
        jugador.cartasJugadasCombate += 1;
        const esCartaDeAtaque =
            (cartaData as any).tipo?.toUpperCase() === "ATAQUE" ||
            cartaData.efectos.some((ef) => ef.tipo === "DANIO");
        if (esCartaDeAtaque) {
            jugador.ataquesJugadosTurno += 1;
        }

        // 3. Ejecutar efectos de la carta
        for (const efecto of cartaData.efectos) {
            this.ejecutarEfecto(state, jugador, efecto, objetivoId);
        }

        // 4. Disparar reliquias AL_JUGAR_CARTA
        RelicEngine.dispararParaJugador("AL_JUGAR_CARTA", state, jugador, {
            cartaJugada: cartaData,
            objetivoId
        });

        // 5. Mandar al descarte y verificar victoria
        jugador.descarteInterno.push(cartaId);
        this.actualizarContadoresMazo(jugador);
        this.verificarVictoriaCombate(state);
        return true;
    }

    static aplicarDanio(state: SpireState, atacante: EntidadCombate, defensor: EntidadCombate, danioBase: number) {
        if (defensor.hp <= 0) return;

        let monto = danioBase + (atacante.estados.get("FUERZA") || 0);
        if ((atacante.estados.get("DEBIL") || 0) > 0) {
            monto = Math.floor(monto * 0.75);
        }
        if ((defensor.estados.get("VULNERABLE") || 0) > 0) {
            monto = Math.floor(monto * 1.5);
        }
        monto = Math.max(0, monto);

        const danioTrasBloqueo = Math.max(0, monto - defensor.bloqueo);
        defensor.bloqueo = Math.max(0, defensor.bloqueo - monto);
        defensor.hp = Math.max(0, defensor.hp - danioTrasBloqueo);

        // Si el defensor es un jugador siendo atacado por un enemigo:
        if (defensor instanceof PlayerState && atacante instanceof EnemyState) {
            // 1. Estado ESPINAS: devuelve daño directo al enemigo que lo atacó
            const espinas = defensor.estados.get("ESPINAS") || 0;
            if (espinas > 0 && atacante.hp > 0) {
                atacante.hp = Math.max(0, atacante.hp - espinas);
            }

            // 2. Reliquias AL_RECIBIR_DANIO (cuando pierde HP real)
            if (danioTrasBloqueo > 0) {
                RelicEngine.dispararParaJugador("AL_RECIBIR_DANIO", state, defensor, {
                    danioRecibido: danioTrasBloqueo,
                    atacante
                });
            }
        }
    }

    static prepararMazoCombate(jugador: PlayerState) {
        jugador.estados.clear();
        jugador.mano.clear();
        jugador.bloqueo = 0;
        jugador.descarteInterno = [];
        jugador.pilaRoboInterna = [...jugador.mazoMaestro];
        jugador.cartasJugadasTurno = 0;
        jugador.ataquesJugadosTurno = 0;
        jugador.cartasJugadasCombate = 0;
        this.mezclarArray(jugador.pilaRoboInterna);
        this.actualizarContadoresMazo(jugador);
    }

    static robarCartas(jugador: PlayerState, cantidad: number) {
        for (let i = 0; i < cantidad; i++) {
            if (jugador.mano.length >= 10) break;

            if (jugador.pilaRoboInterna.length === 0) {
                if (jugador.descarteInterno.length === 0) break;
                jugador.pilaRoboInterna = [...jugador.descarteInterno];
                jugador.descarteInterno = [];
                this.mezclarArray(jugador.pilaRoboInterna);
            }

            const cartaRobada = jugador.pilaRoboInterna.pop();
            if (cartaRobada) {
                jugador.mano.push(cartaRobada);
            }
        }
        this.actualizarContadoresMazo(jugador);
    }

    static descartarMano(jugador: PlayerState) {
        while (jugador.mano.length > 0) {
            const carta = jugador.mano.pop();
            if (carta) jugador.descarteInterno.push(carta);
        }
        this.actualizarContadoresMazo(jugador);
    }

    static reducirEstadosPorTurno(entidad: EntidadCombate) {
        // FUERZA y ESPINAS no están en esta lista, por lo que duran todo el combate
        (["VULNERABLE", "DEBIL"] as EstadoId[]).forEach((estado) => {
            const val = entidad.estados.get(estado) || 0;
            if (val > 1) entidad.estados.set(estado, val - 1);
            else if (val === 1) entidad.estados.delete(estado);
        });
    }

    static ejecutarTurnoEnemigos(state: SpireState) {
        state.enemigos.forEach((enemigo) => {
            if (enemigo.hp <= 0) return;
            enemigo.bloqueo = 0;

            if (enemigo.intencionTipo === "ATACAR") {
                state.jugadores.forEach((jugador) => {
                    if (jugador.hp > 0) {
                        this.aplicarDanio(state, enemigo, jugador, enemigo.intencionValor);
                    }
                });
            } else if (enemigo.intencionTipo === "BLOQUEAR") {
                enemigo.bloqueo += enemigo.intencionValor;
            }

            this.reducirEstadosPorTurno(enemigo);

            const info = ENEMIGOS_INFO[enemigo.enemigoId];
            if (info && info.patron.length > 0) {
                enemigo.indicePatron = (enemigo.indicePatron + 1) % info.patron.length;
                enemigo.intencionTipo = info.patron[enemigo.indicePatron].tipo;
                enemigo.intencionValor = info.patron[enemigo.indicePatron].valor;
            }
        });

        // Por si algún enemigo murió golpeando a un jugador con ESPINAS
        this.verificarVictoriaCombate(state);
    }

    public static verificarVictoriaCombate(state: SpireState) {
        if (state.faseActual !== "COMBAT") return;
        const quedaEnemigoVivo = state.enemigos.some((e) => e.hp > 0);
        if (!quedaEnemigoVivo) {
            RelicEngine.dispararParaTodos("AL_FINALIZAR_COMBATE", state);

            state.faseActual = state.pisoActual >= CONFIG_MAPA.CANTIDAD_PISOS ? "VICTORY" : "REWARD";
            console.log(`¡Combate ganado! Nueva fase: ${state.faseActual}`);
        }
    }

    private static actualizarContadoresMazo(jugador: PlayerState) {
        jugador.cantPilaRobo = jugador.pilaRoboInterna.length;
        jugador.cantDescarte = jugador.descarteInterno.length;
    }

    private static mezclarArray(arr: string[]) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }
}