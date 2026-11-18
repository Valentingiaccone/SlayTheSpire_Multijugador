import { SpireState, PlayerState, EnemyState } from "../rooms/schema/SpireState";
import {
    CATALOGO_CARTAS,
    obtenerCartaMejorada,
    puedeMejorarseCarta
} from "../../../assets/cliente/compartido/Cartas";
import {
    DescriptorEfecto,
    EstadoId,
    FuenteDanio,
    TipoObjetivo
} from "../../../assets/cliente/compartido/CondicionesYEfectos";
import { CalculadoraCombate } from "../../../assets/cliente/compartido/CalculadoraCombate";
import {
    CONFIG_ENEMIGOS,
    ENEMIGOS_INFO,
    escalarVidaEnemigo,
    IEnemigoInfo,
    resolverIntencionPatron,
    sortearRangoEntero
} from "../../../assets/cliente/compartido/Enemigos";
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

    /** Crea un EnemyState con vida sorteada, escalada al mapa actual y multiplicada por jugadores */
    public static crearInstanciaEnemigo(
        enemigoId: string,
        state: SpireState,
        uid: string
    ): EnemyState | null {
        const info = ENEMIGOS_INFO[enemigoId];
        if (!info) return null;

        const cantidadJugadores = Math.max(1, state.jugadores.size);
        const numeroMapa = state.mapaActual || 1;

        const hpBaseSorteado = sortearRangoEntero(info.hpMin, info.hpMax);
        const hpEscaladoMapa = escalarVidaEnemigo(hpBaseSorteado, numeroMapa);

        const enemigo = new EnemyState();
        enemigo.uid = uid;
        enemigo.enemigoId = info.id;
        enemigo.nombre = info.nombre;
        enemigo.hpMax = hpEscaladoMapa * cantidadJugadores;
        enemigo.hp = enemigo.hpMax;
        enemigo.indicePatron = 0;

        this.asignarIntencionSorteada(enemigo, info, 0, numeroMapa);
        return enemigo;
    }

    public static asignarIntencionSorteada(
        enemigo: EnemyState,
        info: IEnemigoInfo,
        indicePatron: number,
        numeroMapa: number
    ): void {
        const resuelta = resolverIntencionPatron(info, indicePatron, numeroMapa);
        enemigo.intencionTipo = resuelta.tipo;
        enemigo.intencionValor = resuelta.valor;
        enemigo.intencionGolpes = resuelta.golpes;
        enemigo.intencionInvocarId = resuelta.invocarEnemigoId;
    }

    public static invocarEnemigosEnCombate(
        state: SpireState,
        enemigoIdAInvocar: string,
        cantidad: number
    ): void {
        let vivosActuales = 0;
        state.enemigos.forEach((e) => {
            if (e.hp > 0) vivosActuales++;
        });

        for (let i = 0; i < cantidad; i++) {
            if (vivosActuales >= CONFIG_ENEMIGOS.MAX_ENEMIGOS_SIMULTANEOS_EN_PANTALLA) {
                break;
            }
            const uid = `inv_${enemigoIdAInvocar}_${Date.now()}_${Math.floor(Math.random() * 10000)}_${i}`;
            const nuevo = this.crearInstanciaEnemigo(enemigoIdAInvocar, state, uid);
            if (nuevo) {
                state.enemigos.push(nuevo);
                vivosActuales++;
            }
        }
    }

    public static contarAtaquesEnMano(jugador: PlayerState): number {
        let cant = 0;
        for (let i = 0; i < jugador.mano.length; i++) {
            const c = CATALOGO_CARTAS[jugador.mano[i]];
            if (c?.tipo === "ATAQUE") cant++;
        }
        return cant;
    }

    public static manoTieneSoloAtaques(jugador: PlayerState): boolean {
        for (let i = 0; i < jugador.mano.length; i++) {
            const c = CATALOGO_CARTAS[jugador.mano[i]];
            if (!c || c.tipo !== "ATAQUE") return false;
        }
        return jugador.mano.length > 0;
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

                                let valorBase = efecto.danioIgualABloqueo
                                    ? lanzador.bloqueo
                                    : efecto.valor;

                                if (efecto.danioExtraPorAtaqueEnMano) {
                                    valorBase +=
                                        this.contarAtaquesEnMano(lanzador) *
                                        efecto.danioExtraPorAtaqueEnMano;
                                }

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
                                        new AccionAplicarDanio(lanzador, obj, valorBase, fuente, {
                                            oroPorGolpeAlHp: efecto.oroPorGolpeAlHp,
                                            oroSiMata: efecto.oroSiMata,
                                            multiplicadorFuerza: efecto.multiplicadorFuerza
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
                case "COPIAR_CARTA_A_DESCARTE": {
                    cola.encolarAlFinal({
                        ejecutar: () => {
                            const copias = Math.max(1, efecto.cantidad || 1);
                            for (let i = 0; i < copias; i++) {
                                lanzador.descarteInterno.push(efecto.cartaId);
                            }
                            this.actualizarContadoresMazo(lanzador);
                        }
                    });
                    break;
                }
                case "MEJORAR_CARTAS_MANO": {
                    cola.encolarAlFinal({
                        ejecutar: () => {
                            const indicesMejorables: number[] = [];
                            for (let i = 0; i < lanzador.mano.length; i++) {
                                if (puedeMejorarseCarta(lanzador.mano[i])) {
                                    indicesMejorables.push(i);
                                }
                            }
                            if (indicesMejorables.length === 0) return;

                            const manoTemp = [...lanzador.mano];
                            if (efecto.cantidad === "TODAS") {
                                for (const idx of indicesMejorables) {
                                    const mejorada = obtenerCartaMejorada(manoTemp[idx]);
                                    if (mejorada) manoTemp[idx] = mejorada.id;
                                }
                            } else {
                                this.mezclarIndices(indicesMejorables);
                                const limite = Math.min(efecto.cantidad, indicesMejorables.length);
                                for (let i = 0; i < limite; i++) {
                                    const idx = indicesMejorables[i];
                                    const mejorada = obtenerCartaMejorada(manoTemp[idx]);
                                    if (mejorada) manoTemp[idx] = mejorada.id;
                                }
                            }
                            this.sincronizarArraySchema(lanzador.mano, manoTemp);
                        }
                    });
                    break;
                }
                case "AGOTAR_CARTA_MANO_AZAR": {
                    cola.encolarAlFinal({
                        ejecutar: () => {
                            const manoTemp = [...lanzador.mano];
                            for (let i = 0; i < efecto.cantidad; i++) {
                                if (manoTemp.length === 0) break;
                                const idxAzar = Math.floor(Math.random() * manoTemp.length);
                                const agotada = manoTemp.splice(idxAzar, 1)[0];
                                if (agotada) {
                                    lanzador.agotadasInterno.push(agotada);
                                }
                            }
                            this.sincronizarArraySchema(lanzador.mano, manoTemp);
                            this.actualizarContadoresMazo(lanzador);
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

        if (cartaData.requiereManoSoloAtaques && !this.manoTieneSoloAtaques(jugador)) {
            return false;
        }

        const costoRealEnergia = CalculadoraCombate.calcularCostoCarta(
            cartaData.costo,
            cartaData.reduccionCostoPorHpPerdido,
            jugador.hpPerdidoCombate
        );

        if (jugador.energia < costoRealEnergia) return false;
        if (cartaData.costoOro && jugador.oro < cartaData.costoOro) return false;

        if (cartaData.objetivoSeleccion === "ENEMIGO") {
            const existeEnemigoVivo = state.enemigos.some((e) => e.uid === objetivoId && e.hp > 0);
            if (!existeEnemigoVivo) return false;
        } else if (cartaData.objetivoSeleccion === "ALIADO") {
            if (!objetivoId || objetivoId === jugador.sessionId) return false;
            const aliado = state.jugadores.get(objetivoId);
            if (!aliado || aliado.hp <= 0) return false;
        }

        jugador.energia -= costoRealEnergia;
        const nuevaMano = [...jugador.mano];
        nuevaMano.splice(indiceMano, 1);
        this.sincronizarArraySchema(jugador.mano, nuevaMano);

        if (cartaData.costoOro && cartaData.costoOro > 0) {
            this.colaActiva.encolarAlFinal(new AccionModificarOro(jugador, -cartaData.costoOro));
        }

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

        this.encolarEfectos(state, this.colaActiva, jugador, cartaData.efectos, objetivoId, undefined, "ATAQUE_CARTA");

        this.busEventos.emitir("AL_JUGAR_CARTA", {
            state,
            cola: this.colaActiva,
            jugador,
            carta: cartaData,
            objetivoId
        });

        if (cartaData.tipo === "PODER") {
            // Los poderes se consumen al jugarse
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
        this.sincronizarArraySchema(jugador.mano, []);
        jugador.bloqueo = 0;
        jugador.hpPerdidoCombate = 0;
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

            const danioCombustion = jugador.estados.get("COMBUSTION") || 0;
            if (danioCombustion > 0 && jugador.hp > 0) {
                this.colaActiva.encolarAlFinal(new AccionPerderHp(jugador, 1, jugador));
                state.enemigos.forEach((enemigo) => {
                    if (enemigo.hp > 0) {
                        this.colaActiva.encolarAlFinal(
                            new AccionAplicarDanio(
                                jugador,
                                enemigo,
                                danioCombustion,
                                "EFECTO_DIRECTO"
                            )
                        );
                    }
                });
            }

            const fuerzaTemp = jugador.estados.get("FUERZA_TEMPORAL") || 0;
            if (fuerzaTemp > 0) {
                jugador.estados.delete("FUERZA_TEMPORAL");
                this.colaActiva.encolarAlFinal(
                    new AccionAplicarEstado(jugador, "FUERZA", -fuerzaTemp)
                );
            }

            if (jugador.estados.has("SIN_ROBO")) {
                jugador.estados.delete("SIN_ROBO");
            }

            this.procesarColaPendiente(state);
        }

        const cartasActuales = [...jugador.mano];
        const retenidasEnMano: string[] = [];

        for (const carta of cartasActuales) {
            if (!carta) continue;
            const data = CATALOGO_CARTAS[carta];
            if (data?.eterea) {
                jugador.agotadasInterno.push(carta);
            } else if (data?.eterno) {
                retenidasEnMano.push(carta);
            } else {
                jugador.descarteInterno.push(carta);
            }
        }

        this.sincronizarArraySchema(jugador.mano, retenidasEnMano);
        this.actualizarContadoresMazo(jugador);
    }

    public static reducirEstadosPorTurno(entidad: EntidadCombate): void {
        // En jugadores, VULNERABLE se reduce al final del ataque enemigo para que dure la fase de ataque enemiga
        const estadosAReducir: EstadoId[] =
            entidad instanceof PlayerState ? ["DEBIL"] : ["VULNERABLE", "DEBIL"];

        estadosAReducir.forEach((estado) => {
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

        if (entidad.hp <= 0) return;

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
        // Guardamos qué jugadores ya estaban vulnerables antes de que los enemigos actúen
        const jugadoresConVulnerablePrevio = new Set<string>();
        state.jugadores.forEach((j) => {
            if (j.hp > 0 && (j.estados.get("VULNERABLE") || 0) > 0) {
                jugadoresConVulnerablePrevio.add(j.sessionId);
            }
        });

        // Los enemigos invocados durante este turno actuarán recién en el turno siguiente
        const enemigosActuantes: EnemyState[] = [];
        state.enemigos.forEach((e) => {
            if (e.hp > 0) enemigosActuantes.push(e);
        });

        for (const enemigo of enemigosActuantes) {
            if (enemigo.hp <= 0 || state.faseActual !== "COMBAT") continue;

            enemigo.bloqueo = 0;
            this.procesarInicioTurno(enemigo, state);

            if (enemigo.hp <= 0 || state.faseActual !== "COMBAT") continue;

            switch (enemigo.intencionTipo) {
                case "ATACAR": {
                    const golpes = Math.max(1, enemigo.intencionGolpes || 1);
                    for (let hit = 1; hit <= golpes; hit++) {
                        state.jugadores.forEach((jugador) => {
                            if (enemigo.hp > 0 && jugador.hp > 0 && state.faseActual === "COMBAT") {
                                this.colaActiva.emitirVisual({
                                    tipo: "ATAQUE_EJECUTADO",
                                    atacanteId: enemigo.uid,
                                    objetivoId: jugador.sessionId,
                                    indiceGolpe: hit,
                                    totalGolpes: golpes
                                });
                                this.colaActiva.encolarAlFinal(
                                    new AccionAplicarDanio(
                                        enemigo,
                                        jugador,
                                        enemigo.intencionValor,
                                        "ATAQUE_ENEMIGO"
                                    )
                                );
                                this.procesarColaPendiente(state);
                            }
                        });
                    }
                    break;
                }
                case "BLOQUEAR": {
                    this.colaActiva.encolarAlFinal(
                        new AccionGanarBloqueo(enemigo, enemigo.intencionValor)
                    );
                    this.procesarColaPendiente(state);
                    break;
                }
                case "ATACAR_Y_BLOQUEAR": {
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
                                new AccionAplicarDanio(
                                    enemigo,
                                    jugador,
                                    enemigo.intencionValor,
                                    "ATAQUE_ENEMIGO"
                                )
                            );
                            this.procesarColaPendiente(state);
                        }
                    });
                    if (enemigo.hp > 0 && state.faseActual === "COMBAT") {
                        this.colaActiva.encolarAlFinal(
                            new AccionGanarBloqueo(enemigo, enemigo.intencionValor)
                        );
                        this.procesarColaPendiente(state);
                    }
                    break;
                }
                case "GANAR_FUERZA": {
                    this.colaActiva.encolarAlFinal(
                        new AccionAplicarEstado(enemigo, "FUERZA", enemigo.intencionValor)
                    );
                    this.procesarColaPendiente(state);
                    break;
                }
                case "GANAR_ESPINAS": {
                    this.colaActiva.encolarAlFinal(
                        new AccionAplicarEstado(enemigo, "ESPINAS", enemigo.intencionValor)
                    );
                    this.procesarColaPendiente(state);
                    break;
                }
                case "APLICAR_VULNERABLE": {
                    state.jugadores.forEach((jugador) => {
                        if (jugador.hp > 0) {
                            this.colaActiva.encolarAlFinal(
                                new AccionAplicarEstado(jugador, "VULNERABLE", enemigo.intencionValor)
                            );
                        }
                    });
                    this.procesarColaPendiente(state);
                    break;
                }
                case "APLICAR_DEBIL": {
                    state.jugadores.forEach((jugador) => {
                        if (jugador.hp > 0) {
                            this.colaActiva.encolarAlFinal(
                                new AccionAplicarEstado(jugador, "DEBIL", enemigo.intencionValor)
                            );
                        }
                    });
                    this.procesarColaPendiente(state);
                    break;
                }
                case "CURAR_ALIADOS": {
                    state.enemigos.forEach((aliadoEnemigo) => {
                        if (aliadoEnemigo.hp > 0) {
                            this.colaActiva.encolarAlFinal(
                                new AccionCurarHp(aliadoEnemigo, enemigo.intencionValor)
                            );
                        }
                    });
                    this.procesarColaPendiente(state);
                    break;
                }
                case "INVOCAR": {
                    if (enemigo.intencionInvocarId) {
                        this.invocarEnemigosEnCombate(
                            state,
                            enemigo.intencionInvocarId,
                            enemigo.intencionValor
                        );
                    }
                    break;
                }
            }

            if (enemigo.hp <= 0 || state.faseActual !== "COMBAT") continue;

            this.reducirEstadosPorTurno(enemigo);

            const info = ENEMIGOS_INFO[enemigo.enemigoId];
            if (info && info.patron.length > 0) {
                enemigo.indicePatron = (enemigo.indicePatron + 1) % info.patron.length;
                this.asignarIntencionSorteada(
                    enemigo,
                    info,
                    enemigo.indicePatron,
                    state.mapaActual || 1
                );
            }
        }

        // Reducir VULNERABLE en los jugadores que ya lo tenían antes de esta fase enemiga
        state.jugadores.forEach((j) => {
            if (j.hp > 0 && jugadoresConVulnerablePrevio.has(j.sessionId)) {
                const val = j.estados.get("VULNERABLE") || 0;
                if (val > 1) j.estados.set("VULNERABLE", val - 1);
                else if (val === 1) j.estados.delete("VULNERABLE");
            }
        });

        this.verificarVictoriaCombate(state);
    }

    public static verificarVictoriaCombate(state: SpireState): void {
        this.colaActiva.encolarAlFinal(new AccionVerificarFinCombate());
        this.procesarColaPendiente(state);
    }

    public static sincronizarArraySchema(schemaArr: any, nuevoContenido: string[]): void {
        while (schemaArr.length > nuevoContenido.length) {
            schemaArr.pop();
        }
        for (let i = 0; i < nuevoContenido.length; i++) {
            if (i < schemaArr.length) {
                if (schemaArr[i] !== nuevoContenido[i]) {
                    schemaArr[i] = nuevoContenido[i];
                }
            } else {
                schemaArr.push(nuevoContenido[i]);
            }
        }
    }

    private static actualizarContadoresMazo(jugador: PlayerState): void {
        jugador.cantPilaRobo = jugador.pilaRoboInterna.length;
        jugador.cantDescarte = jugador.descarteInterno.length;
        jugador.cantAgotadas = jugador.agotadasInterno.length;

        this.sincronizarArraySchema(jugador.pilaRobo, jugador.pilaRoboInterna);
        this.sincronizarArraySchema(jugador.descarte, jugador.descarteInterno);
        this.sincronizarArraySchema(jugador.agotadas, jugador.agotadasInterno);
    }

    private static mezclarArray(arr: string[]): void {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }

    private static mezclarIndices(arr: number[]): void {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }
}