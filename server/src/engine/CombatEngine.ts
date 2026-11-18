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
    AccionModificarOro,
    AccionPerderHp,
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
                // Solo permite apuntar a OTRO aliado distinto al lanzador
                if (!objetivoId || objetivoId === lanzador.sessionId) return [];
                const aliado = state.jugadores.get(objetivoId);
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
                                    if (fuente === "ATAQUE_CARTA") {
                                        q.emitirVisual({
                                            tipo: "ATAQUE_EJECUTADO",
                                            atacanteId: lanzador.sessionId,
                                            objetivoId: objId,
                                            indiceGolpe: hit,
                                            totalGolpes: golpes
                                        });
                                    }
                                    q.encolarAlInicio(
                                        new AccionAplicarDanio(lanzador, obj, efecto.valor, fuente, {
                                            oroPorGolpeAlHp: efecto.oroPorGolpeAlHp,
                                            oroSiMata: efecto.oroSiMata
                                        })
                                    );
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
                case "PERDER_HP": {
                    const objetivos = this.resolverObjetivos(state, lanzador, efecto.objetivo, objetivoId, atacanteContexto);
                    for (const obj of objetivos) {
                        cola.encolarAlFinal(new AccionPerderHp(obj, efecto.valor, lanzador));
                    }
                    break;
                }
                case "GANAR_ORO": {
                    cola.encolarAlFinal(new AccionModificarOro(lanzador, efecto.valor));
                    break;
                }
                case "APUESTA_ORO": {
                    cola.encolarAlFinal({
                        ejecutar: (_st, q) => {
                            const gano = Math.random() * 100 < efecto.probabilidadExito;
                            const delta = gano ? efecto.oroGanado : -efecto.oroPerdido;
                            q.encolarAlInicio(new AccionModificarOro(lanzador, delta));
                        }
                    });
                    break;
                }
                case "REPARTIR_ORO_ALIADOS": {
                    cola.encolarAlFinal({
                        ejecutar: (st, q) => {
                            const otrosAliados: PlayerState[] = [];
                            st.jugadores.forEach((j) => {
                                if (j.sessionId !== lanzador.sessionId && j.hp > 0) {
                                    otrosAliados.push(j);
                                }
                            });
                            if (otrosAliados.length === 0 || lanzador.oro <= 0) return;

                            const oroARepartir = Math.floor(lanzador.oro * efecto.porcentaje);
                            if (oroARepartir <= 0) return;

                            const porAliado = Math.floor(oroARepartir / otrosAliados.length);
                            const gastoTotal = porAliado * otrosAliados.length;
                            if (gastoTotal <= 0) return;

                            q.encolarAlInicio(new AccionModificarOro(lanzador, -gastoTotal));
                            for (const aliado of otrosAliados) {
                                q.encolarAlInicio(new AccionModificarOro(aliado, porAliado));
                            }
                        }
                    });
                    break;
                }
                case "ORO_IGUAL_A_BLOQUEO": {
                    cola.encolarAlFinal({
                        ejecutar: (_st, q) => {
                            if (lanzador.bloqueo > 0) {
                                q.encolarAlInicio(new AccionModificarOro(lanzador, lanzador.bloqueo));
                            }
                        }
                    });
                    break;
                }
                case "FUERZA_POR_CADA_ORO": {
                    cola.encolarAlFinal({
                        ejecutar: (_st, q) => {
                            if (efecto.cadaCuantoOro <= 0) return;
                            const tramos = Math.floor(lanzador.oro / efecto.cadaCuantoOro);
                            const fuerzaTotal = tramos * efecto.fuerzaGanada;
                            if (fuerzaTotal > 0) {
                                q.encolarAlInicio(
                                    new AccionAplicarEstado(lanzador, "FUERZA", fuerzaTotal)
                                );
                            }
                        }
                    });
                    break;
                }
                case "ORO_POR_HP_FALTANTE_ENEMIGO": {
                    cola.encolarAlFinal({
                        ejecutar: (st, q) => {
                            const enemigo = st.enemigos.find((e) => e.uid === objetivoId);
                            if (!enemigo) return;
                            const hpFaltante = Math.max(0, enemigo.hpMax - enemigo.hp);
                            const oroGanado = Math.min(
                                efecto.maximoOro,
                                hpFaltante * efecto.oroPorHp
                            );
                            if (oroGanado > 0) {
                                q.encolarAlInicio(new AccionModificarOro(lanzador, oroGanado));
                            }
                        }
                    });
                    break;
                }
                case "INTERES_ORO": {
                    cola.encolarAlFinal({
                        ejecutar: (_st, q) => {
                            if (efecto.cadaCuantoOro <= 0) return;
                            const tramos = Math.floor(lanzador.oro / efecto.cadaCuantoOro);
                            const ganancia = tramos * efecto.oroGanado;
                            if (ganancia > 0) {
                                q.encolarAlInicio(new AccionModificarOro(lanzador, ganancia));
                            }
                        }
                    });
                    break;
                }
                case "DUPLICAR_ORO": {
                    cola.encolarAlFinal({
                        ejecutar: (_st, q) => {
                            if (lanzador.oro > 0) {
                                q.encolarAlInicio(new AccionModificarOro(lanzador, lanzador.oro));
                            }
                        }
                    });
                    break;
                }
                case "BLOQUEO_POR_ORO_GASTADO": {
                    cola.encolarAlFinal({
                        ejecutar: (_st, q) => {
                            const oroAGastar = Math.min(efecto.maximoOro, lanzador.oro);
                            if (oroAGastar <= 0) return;
                            q.encolarAlInicio(new AccionGanarBloqueo(lanzador, oroAGastar));
                            q.encolarAlInicio(new AccionModificarOro(lanzador, -oroAGastar));
                        }
                    });
                    break;
                }
                case "CONDICIONAL": {
                    cola.encolarAlFinal({
                        ejecutar: (st, q) => {
                            const cumple = RelicEngine.evaluarCondicion(
                                efecto.condicion,
                                st,
                                lanzador,
                                { objetivoId, atacante: atacanteContexto }
                            );
                            const rama = cumple
                                ? efecto.efectosSiCumple
                                : efecto.efectosSiNoCumple || [];
                            if (rama.length > 0) {
                                this.encolarEfectos(
                                    st,
                                    q,
                                    lanzador,
                                    rama,
                                    objetivoId,
                                    atacanteContexto,
                                    fuentePorDefecto
                                );
                            }
                        }
                    });
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
        if (!cartaData || cartaData.injugable) return false;
        if (jugador.energia < cartaData.costo) return false;
        if (cartaData.costoOro && jugador.oro < cartaData.costoOro) return false;

        if (cartaData.objetivoSeleccion === "ENEMIGO") {
            const existeEnemigoVivo = state.enemigos.some((e) => e.uid === objetivoId && e.hp > 0);
            if (!existeEnemigoVivo) return false;
        } else if (cartaData.objetivoSeleccion === "ALIADO") {
            // Regla estricta: una carta "A un aliado" NO puede jugarse sobre uno mismo
            if (!objetivoId || objetivoId === jugador.sessionId) return false;
            const aliado = state.jugadores.get(objetivoId);
            if (!aliado || aliado.hp <= 0) return false;
        }

        // 1. Cobrar energía, cobrar costo de oro (si tiene) y sacar de la mano
        jugador.energia -= cartaData.costo;
        jugador.mano.splice(indiceMano, 1);

        if (cartaData.costoOro && cartaData.costoOro > 0) {
            this.colaActiva.encolarAlFinal(new AccionModificarOro(jugador, -cartaData.costoOro));
        }

        // 2. Actualizar contadores
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

        // 3. Encolar efectos de la carta
        this.encolarEfectos(state, this.colaActiva, jugador, cartaData.efectos, objetivoId, undefined, "ATAQUE_CARTA");

        // 4. Emitir evento AL_JUGAR_CARTA
        this.busEventos.emitir("AL_JUGAR_CARTA", {
            state,
            cola: this.colaActiva,
            jugador,
            carta: cartaData,
            objetivoId
        });

        // 5. Destino de la carta jugada: PODER se consume, agotar/etérea va a agotadas, el resto va a descarte
        if (cartaData.tipo === "PODER") {
            // Los poderes quedan activos como estado en la entidad y no van al descarte ni a agotadas
        } else if (cartaData.agotar || cartaData.eterea) {
            jugador.agotadasInterno.push(cartaId);
        } else {
            jugador.descarteInterno.push(cartaId);
        }

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
        jugador.agotadasInterno = [];
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

    public static descartarMano(jugador: PlayerState, state?: SpireState): void {
        if (state && jugador.hp > 0) {
            for (let i = 0; i < jugador.mano.length; i++) {
                const cartaId = jugador.mano[i];
                const data = CATALOGO_CARTAS[cartaId];
                if (data?.efectosFinTurnoEnMano && data.efectosFinTurnoEnMano.length > 0) {
                    this.encolarEfectos(
                        state,
                        this.colaActiva,
                        jugador,
                        data.efectosFinTurnoEnMano,
                        undefined,
                        undefined,
                        "EFECTO_DIRECTO"
                    );
                }
            }
            this.procesarColaPendiente(state);
        }

        while (jugador.mano.length > 0) {
            const carta = jugador.mano.pop();
            if (!carta) continue;
            const data = CATALOGO_CARTAS[carta];
            if (data?.eterea) {
                jugador.agotadasInterno.push(carta);
            } else {
                jugador.descarteInterno.push(carta);
            }
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

        // 1. Veneno
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

        if (entidad.hp <= 0) return;

        // 2. Poder "El que no arriesga, no gana" (ARRIESGAR_GANAR)
        if (entidad instanceof PlayerState && state) {
            const oroPorTramo = entidad.estados.get("ARRIESGAR_GANAR") || 0;
            if (oroPorTramo > 0) {
                const tramosDeVeinte = Math.floor(entidad.oro / 20);
                const oroGanado = tramosDeVeinte * oroPorTramo;

                this.colaActiva.encolarAlFinal(new AccionPerderHp(entidad, 3, entidad));
                if (oroGanado > 0) {
                    this.colaActiva.encolarAlFinal(new AccionModificarOro(entidad, oroGanado));
                }
                this.procesarColaPendiente(state);
            }
        }
    }

    public static ejecutarTurnoEnemigos(state: SpireState): void {
        state.enemigos.forEach((enemigo) => {
            if (enemigo.hp <= 0 || state.faseActual !== "COMBAT") return;

            enemigo.bloqueo = 0;
            this.procesarInicioTurno(enemigo, state);

            if (enemigo.hp <= 0 || state.faseActual !== "COMBAT") return;

            if (enemigo.intencionTipo === "ATACAR") {
                state.jugadores.forEach((jugador) => {
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
        jugador.cantAgotadas = jugador.agotadasInterno.length;

        jugador.pilaRobo.clear();
        jugador.pilaRoboInterna.forEach((id) => jugador.pilaRobo.push(id));

        jugador.descarte.clear();
        jugador.descarteInterno.forEach((id) => jugador.descarte.push(id));

        jugador.agotadas.clear();
        jugador.agotadasInterno.forEach((id) => jugador.agotadas.push(id));
    }

    private static mezclarArray(arr: string[]): void {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }
}