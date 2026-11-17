import { SpireState, PlayerState, EnemyState } from "../rooms/schema/SpireState";
import { CATALOGO_CARTAS } from "../../../assets/cliente/compartido/Cartas";
import {
    DescriptorEfecto,
    EstadoId,
    FuenteDanio,
    TipoObjetivo
} from "../../../assets/cliente/compartido/CondicionesYEfectos";
import { ENEMIGOS_INFO } from "../../../assets/cliente/compartido/Enemigos";
import { EventoVisualCombate } from "../../../assets/cliente/compartido/GameTypes";
import { ActionQueue } from "./ActionQueue";
import { CombatEventBus, EntidadCombate } from "./CombatEventBus";
import {
    AccionAplicarDanio,
    AccionAplicarEstado,
    AccionCurarHp,
    AccionGanarBloqueo,
    AccionGanarEnergia,
    AccionRobarCartas,
    AccionVerificarFinCombate
} from "./CombatActions";
import { RelicEngine } from "./RelicEngine";

export class CombatEngine {
    private static colaActiva: ActionQueue = new ActionQueue();
    private static busEventos: CombatEventBus = CombatEngine.crearBusConSistemas();
    private static bufferVisualSala: EventoVisualCombate[] = [];

    private static crearBusConSistemas(): CombatEventBus {
        const bus = new CombatEventBus();

        bus.suscribir("AL_INICIAR_COMBATE", ({ state, cola }) => {
            RelicEngine.dispararParaTodos("AL_INICIAR_COMBATE", state, {}, cola);
        });

        bus.suscribir("AL_INICIAR_TURNO", ({ state, cola, jugador }) => {
            RelicEngine.dispararParaJugador("AL_INICIAR_TURNO", state, jugador, {}, cola);
        });

        bus.suscribir("AL_TERMINAR_TURNO", ({ state, cola, jugador }) => {
            RelicEngine.dispararParaJugador("AL_TERMINAR_TURNO", state, jugador, {}, cola);
        });

        bus.suscribir("AL_JUGAR_CARTA", ({ state, cola, jugador, objetivoId }) => {
            RelicEngine.dispararParaJugador("AL_JUGAR_CARTA", state, jugador, { objetivoId }, cola);
        });

        bus.suscribir("AL_INFLIGIR_DANIO", ({ state, cola, atacante, defensor, danioInfligido }) => {
            RelicEngine.dispararParaJugador(
                "AL_INFLIGIR_DANIO",
                state,
                atacante,
                { objetivoId: defensor.uid, danioInfligido },
                cola
            );
        });

        bus.suscribir("AL_RECIBIR_DANIO", ({ state, cola, defensor, atacante, danioRecibido }) => {
            RelicEngine.dispararParaJugador(
                "AL_RECIBIR_DANIO",
                state,
                defensor,
                {
                    atacante,
                    objetivoId: atacante instanceof EnemyState ? atacante.uid : undefined,
                    danioRecibido
                },
                cola
            );
        });

        bus.suscribir("AL_MORIR_ENTIDAD", ({ state, cola, entidadMuerta, autorMuerte }) => {
            if (entidadMuerta instanceof EnemyState && autorMuerte instanceof PlayerState) {
                RelicEngine.dispararParaJugador(
                    "AL_MORIR_ENEMIGO",
                    state,
                    autorMuerte,
                    { objetivoId: entidadMuerta.uid },
                    cola
                );
            }
        });

        bus.suscribir("AL_FINALIZAR_COMBATE", ({ state, cola }) => {
            RelicEngine.dispararParaTodos("AL_FINALIZAR_COMBATE", state, {}, cola);
        });

        return bus;
    }

    public static obtenerColaActiva(): ActionQueue {
        return this.colaActiva;
    }

    public static obtenerBusEventos(): CombatEventBus {
        return this.busEventos;
    }

    public static procesarColaPendiente(state: SpireState): EventoVisualCombate[] {
        const nuevos = this.colaActiva.procesarTodo(state, this.busEventos);
        if (nuevos.length > 0) {
            this.bufferVisualSala.push(...nuevos);
        }
        return nuevos;
    }

    /** Devuelve y limpia todos los eventos visuales acumulados para emitirlos a los clientes */
    public static consumirEventosVisuales(): EventoVisualCombate[] {
        const copia = [...this.bufferVisualSala];
        this.bufferVisualSala = [];
        return copia;
    }

    public static resolverObjetivos(
        state: SpireState,
        lanzador: PlayerState,
        tipo: TipoObjetivo,
        objetivoId?: string,
        atacanteContexto?: EntidadCombate
    ): EntidadCombate[] {
        switch (tipo) {
            case "PROPIO":
                return lanzador.hp > 0 ? [lanzador] : [];
            case "ATACANTE":
                return atacanteContexto && atacanteContexto.hp > 0 ? [atacanteContexto] : [];
            case "ENEMIGO": {
                const enemigo = state.enemigos.find((e) => e.uid === objetivoId && e.hp > 0);
                return enemigo ? [enemigo] : [];
            }
            case "ENEMIGO_ALEATORIO": {
                const vivos = state.enemigos.filter((e) => e.hp > 0);
                if (vivos.length === 0) return [];
                const indiceAleatorio = Math.floor(Math.random() * vivos.length);
                return [vivos[indiceAleatorio]];
            }
            case "TODOS_ENEMIGOS":
                return state.enemigos.filter((e) => e.hp > 0);
            case "ALIADO": {
                const aliado = objetivoId ? state.jugadores.get(objetivoId) : undefined;
                return aliado && aliado.hp > 0 ? [aliado] : [];
            }
            case "TODOS_ALIADOS": {
                const vivos: PlayerState[] = [];
                state.jugadores.forEach((j) => {
                    if (j.hp > 0) vivos.push(j);
                });
                return vivos;
            }
            default:
                return [];
        }
    }

    public static encolarEfectos(
        state: SpireState,
        cola: ActionQueue,
        lanzador: PlayerState,
        efectos: DescriptorEfecto[],
        objetivoId?: string,
        atacanteContexto?: EntidadCombate,
        fuentePorDefecto: FuenteDanio = "ATAQUE_CARTA"
    ): void {
        for (const efecto of efectos) {
            switch (efecto.tipo) {
                case "DANIO": {
                    const golpes = Math.max(1, efecto.repeticiones || 1);
                    const fuente = efecto.fuente || fuentePorDefecto;

                    for (let hit = 1; hit <= golpes; hit++) {
                        // Resolvemos el objetivo dentro de una acción diferida para que ENEMIGO_ALEATORIO
                        // elija un nuevo enemigo vivo en cada impacto del boomerang
                        cola.encolarAlFinal({
                            ejecutar: (st, q) => {
                                const objetivos = this.resolverObjetivos(
                                    st,
                                    lanzador,
                                    efecto.objetivo,
                                    objetivoId,
                                    atacanteContexto
                                );
                                for (const obj of objetivos) {
                                    const objId = obj instanceof PlayerState ? obj.sessionId : obj.uid;
                                    q.emitirVisual({
                                        tipo: "ATAQUE_EJECUTADO",
                                        atacanteId: lanzador.sessionId,
                                        objetivoId: objId,
                                        indiceGolpe: hit,
                                        totalGolpes: golpes
                                    });
                                    q.encolarAlInicio(new AccionAplicarDanio(lanzador, obj, efecto.valor, fuente));
                                }
                            }
                        });
                    }
                    break;
                }
                case "BLOQUEO": {
                    const objetivos = this.resolverObjetivos(state, lanzador, efecto.objetivo, objetivoId, atacanteContexto);
                    for (const obj of objetivos) {
                        cola.encolarAlFinal(new AccionGanarBloqueo(obj, efecto.valor));
                    }
                    break;
                }
                case "APLICAR_ESTADO": {
                    const objetivos = this.resolverObjetivos(state, lanzador, efecto.objetivo, objetivoId, atacanteContexto);
                    for (const obj of objetivos) {
                        cola.encolarAlFinal(new AccionAplicarEstado(obj, efecto.estadoId, efecto.valor));
                    }
                    break;
                }
                case "ROBAR_CARTA": {
                    const objetivos = this.resolverObjetivos(state, lanzador, efecto.objetivo, objetivoId, atacanteContexto);
                    for (const obj of objetivos) {
                        if (obj instanceof PlayerState) {
                            cola.encolarAlFinal(
                                new AccionRobarCartas(
                                    obj,
                                    efecto.valor,
                                    (arr) => this.mezclarArray(arr),
                                    (j) => this.actualizarContadoresMazo(j)
                                )
                            );
                        }
                    }
                    break;
                }
                case "GANAR_ENERGIA": {
                    const objetivos = this.resolverObjetivos(state, lanzador, efecto.objetivo, objetivoId, atacanteContexto);
                    for (const obj of objetivos) {
                        if (obj instanceof PlayerState) {
                            cola.encolarAlFinal(new AccionGanarEnergia(obj, efecto.valor));
                        }
                    }
                    break;
                }
                case "CURAR_HP": {
                    const objetivos = this.resolverObjetivos(state, lanzador, efecto.objetivo, objetivoId, atacanteContexto);
                    for (const obj of objetivos) {
                        cola.encolarAlFinal(new AccionCurarHp(obj, efecto.valor));
                    }
                    break;
                }
                case "CONDICIONAL": {
                    const cumple = RelicEngine.evaluarCondicion(efecto.condicion, state, lanzador, {
                        objetivoId,
                        atacante: atacanteContexto
                    });
                    const rama = cumple ? efecto.efectosSiCumple : (efecto.efectosSiNoCumple || []);
                    this.encolarEfectos(state, cola, lanzador, rama, objetivoId, atacanteContexto, fuentePorDefecto);
                    break;
                }
            }
        }
    }

    public static ejecutarEfecto(
        state: SpireState,
        lanzador: PlayerState,
        efecto: DescriptorEfecto,
        objetivoId?: string
    ): void {
        this.encolarEfectos(state, this.colaActiva, lanzador, [efecto], objetivoId);
        this.procesarColaPendiente(state);
    }

    public static jugarCarta(
        state: SpireState,
        jugador: PlayerState,
        indiceMano: number,
        objetivoId?: string
    ): boolean {
        if (state.faseActual !== "COMBAT" || jugador.hp <= 0 || jugador.turnoTerminado) return false;
        if (indiceMano < 0 || indiceMano >= jugador.mano.length) return false;

        const cartaId = jugador.mano[indiceMano];
        const cartaData = CATALOGO_CARTAS[cartaId];
        if (!cartaData || jugador.energia < cartaData.costo) return false;

        if (cartaData.objetivoSeleccion === "ENEMIGO") {
            const existeEnemigoVivo = state.enemigos.some((e) => e.uid === objetivoId && e.hp > 0);
            if (!existeEnemigoVivo) return false;
        } else if (cartaData.objetivoSeleccion === "ALIADO") {
            const aliado = objetivoId ? state.jugadores.get(objetivoId) : undefined;
            if (!aliado || aliado.hp <= 0) return false;
        }

        // 1. Cobrar energía y retirar de la mano
        jugador.energia -= cartaData.costo;
        jugador.mano.splice(indiceMano, 1);

        // 2. Actualizar contadores de turno/combate
        jugador.cartasJugadasTurno += 1;
        jugador.cartasJugadasCombate += 1;
        if (cartaData.tipo === "ATAQUE") {
            jugador.ataquesJugadosTurno += 1;
        }

        this.colaActiva.emitirVisual({
            tipo: "CARTA_JUGADA",
            jugadorId: jugador.sessionId,
            cartaId: cartaData.id,
            objetivoId
        });

        // 3. Encolar los efectos de la carta
        this.encolarEfectos(state, this.colaActiva, jugador, cartaData.efectos, objetivoId, undefined, "ATAQUE_CARTA");

        // 4. Emitir evento AL_JUGAR_CARTA al bus
        this.busEventos.emitir("AL_JUGAR_CARTA", {
            state,
            cola: this.colaActiva,
            jugador,
            carta: cartaData,
            objetivoId
        });

        // 5. Mandar al descarte y procesar toda la cola de reacciones
        jugador.descarteInterno.push(cartaId);
        this.actualizarContadoresMazo(jugador);
        this.colaActiva.encolarAlFinal(new AccionVerificarFinCombate());
        this.procesarColaPendiente(state);

        return true;
    }

    public static aplicarDanio(
        state: SpireState,
        atacante: EntidadCombate,
        defensor: EntidadCombate,
        danioBase: number,
        fuente: FuenteDanio = "ATAQUE_CARTA"
    ): void {
        this.colaActiva.encolarAlFinal(new AccionAplicarDanio(atacante, defensor, danioBase, fuente));
        this.procesarColaPendiente(state);
    }

    public static prepararMazoCombate(jugador: PlayerState): void {
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

    public static robarCartas(jugador: PlayerState, cantidad: number): void {
        const accion = new AccionRobarCartas(
            jugador,
            cantidad,
            (arr) => this.mezclarArray(arr),
            (j) => this.actualizarContadoresMazo(j)
        );
        accion.ejecutar();
    }

    public static descartarMano(jugador: PlayerState): void {
        while (jugador.mano.length > 0) {
            const carta = jugador.mano.pop();
            if (carta) jugador.descarteInterno.push(carta);
        }
        this.actualizarContadoresMazo(jugador);
    }

    public static reducirEstadosPorTurno(entidad: EntidadCombate): void {
        (["VULNERABLE", "DEBIL"] as EstadoId[]).forEach((estado) => {
            const val = entidad.estados.get(estado) || 0;
            if (val > 1) entidad.estados.set(estado, val - 1);
            else if (val === 1) entidad.estados.delete(estado);
        });
    }

    public static procesarInicioTurno(entidad: EntidadCombate, state?: SpireState): void {
        if (entidad.hp <= 0) return;

        const veneno = entidad.estados.get("VENENO") || 0;
        if (veneno > 0) {
            if (veneno > 1) {
                entidad.estados.set("VENENO", veneno - 1);
            } else {
                entidad.estados.delete("VENENO");
            }

            if (state) {
                this.colaActiva.encolarAlFinal(new AccionAplicarDanio(undefined, entidad, veneno, "VENENO"));
                this.procesarColaPendiente(state);
            } else {
                entidad.hp = Math.max(0, entidad.hp - veneno);
            }
        }
    }

    public static ejecutarTurnoEnemigos(state: SpireState): void {
        state.enemigos.forEach((enemigo) => {
            if (enemigo.hp <= 0 || state.faseActual !== "COMBAT") return;

            enemigo.bloqueo = 0;
            this.procesarInicioTurno(enemigo, state);

            // Si murió por veneno al empezar su turno, no actúa
            if (enemigo.hp <= 0 || state.faseActual !== "COMBAT") return;

            if (enemigo.intencionTipo === "ATACAR") {
                state.jugadores.forEach((jugador) => {
                    // Verificamos enemigo.hp > 0 en cada paso por si murió con las ESPINAS del jugador anterior
                    if (enemigo.hp > 0 && jugador.hp > 0 && state.faseActual === "COMBAT") {
                        this.colaActiva.emitirVisual({
                            tipo: "ATAQUE_EJECUTADO",
                            atacanteId: enemigo.uid,
                            objetivoId: jugador.sessionId,
                            indiceGolpe: 1,
                            totalGolpes: 1
                        });
                        this.colaActiva.encolarAlFinal(
                            new AccionAplicarDanio(enemigo, jugador, enemigo.intencionValor, "ATAQUE_ENEMIGO")
                        );
                        this.procesarColaPendiente(state);
                    }
                });
            } else if (enemigo.intencionTipo === "BLOQUEAR") {
                this.colaActiva.encolarAlFinal(new AccionGanarBloqueo(enemigo, enemigo.intencionValor));
                this.procesarColaPendiente(state);
            }

            if (enemigo.hp <= 0 || state.faseActual !== "COMBAT") return;

            this.reducirEstadosPorTurno(enemigo);

            const info = ENEMIGOS_INFO[enemigo.enemigoId];
            if (info && info.patron.length > 0) {
                enemigo.indicePatron = (enemigo.indicePatron + 1) % info.patron.length;
                enemigo.intencionTipo = info.patron[enemigo.indicePatron].tipo;
                enemigo.intencionValor = info.patron[enemigo.indicePatron].valor;
            }
        });

        this.verificarVictoriaCombate(state);
    }

    public static verificarVictoriaCombate(state: SpireState): void {
        this.colaActiva.encolarAlFinal(new AccionVerificarFinCombate());
        this.procesarColaPendiente(state);
    }

    private static actualizarContadoresMazo(jugador: PlayerState): void {
        jugador.cantPilaRobo = jugador.pilaRoboInterna.length;
        jugador.cantDescarte = jugador.descarteInterno.length;
    }

    private static mezclarArray(arr: string[]): void {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }
}