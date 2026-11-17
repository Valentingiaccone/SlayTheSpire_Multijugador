"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CombatEngine = void 0;
const SpireState_1 = require("../rooms/schema/SpireState");
const Cartas_1 = require("../../../assets/cliente/compartido/Cartas");
const Enemigos_1 = require("../../../assets/cliente/compartido/Enemigos");
const ActionQueue_1 = require("./ActionQueue");
const CombatEventBus_1 = require("./CombatEventBus");
const CombatActions_1 = require("./CombatActions");
const RelicEngine_1 = require("./RelicEngine");
class CombatEngine {
    static { this.colaActiva = new ActionQueue_1.ActionQueue(); }
    static { this.busEventos = CombatEngine.crearBusConSistemas(); }
    static { this.bufferVisualSala = []; }
    static crearBusConSistemas() {
        const bus = new CombatEventBus_1.CombatEventBus();
        bus.suscribir("AL_INICIAR_COMBATE", ({ state, cola }) => {
            RelicEngine_1.RelicEngine.dispararParaTodos("AL_INICIAR_COMBATE", state, {}, cola);
        });
        bus.suscribir("AL_INICIAR_TURNO", ({ state, cola, jugador }) => {
            RelicEngine_1.RelicEngine.dispararParaJugador("AL_INICIAR_TURNO", state, jugador, {}, cola);
        });
        bus.suscribir("AL_TERMINAR_TURNO", ({ state, cola, jugador }) => {
            RelicEngine_1.RelicEngine.dispararParaJugador("AL_TERMINAR_TURNO", state, jugador, {}, cola);
        });
        bus.suscribir("AL_JUGAR_CARTA", ({ state, cola, jugador, objetivoId }) => {
            RelicEngine_1.RelicEngine.dispararParaJugador("AL_JUGAR_CARTA", state, jugador, { objetivoId }, cola);
        });
        bus.suscribir("AL_INFLIGIR_DANIO", ({ state, cola, atacante, defensor, danioInfligido }) => {
            RelicEngine_1.RelicEngine.dispararParaJugador("AL_INFLIGIR_DANIO", state, atacante, { objetivoId: defensor.uid, danioInfligido }, cola);
        });
        bus.suscribir("AL_RECIBIR_DANIO", ({ state, cola, defensor, atacante, danioRecibido }) => {
            RelicEngine_1.RelicEngine.dispararParaJugador("AL_RECIBIR_DANIO", state, defensor, {
                atacante,
                objetivoId: atacante instanceof SpireState_1.EnemyState ? atacante.uid : undefined,
                danioRecibido
            }, cola);
        });
        bus.suscribir("AL_MORIR_ENTIDAD", ({ state, cola, entidadMuerta, autorMuerte }) => {
            if (entidadMuerta instanceof SpireState_1.EnemyState && autorMuerte instanceof SpireState_1.PlayerState) {
                RelicEngine_1.RelicEngine.dispararParaJugador("AL_MORIR_ENEMIGO", state, autorMuerte, { objetivoId: entidadMuerta.uid }, cola);
            }
        });
        bus.suscribir("AL_FINALIZAR_COMBATE", ({ state, cola }) => {
            RelicEngine_1.RelicEngine.dispararParaTodos("AL_FINALIZAR_COMBATE", state, {}, cola);
        });
        return bus;
    }
    static obtenerColaActiva() {
        return this.colaActiva;
    }
    static obtenerBusEventos() {
        return this.busEventos;
    }
    static procesarColaPendiente(state) {
        const nuevos = this.colaActiva.procesarTodo(state, this.busEventos);
        if (nuevos.length > 0) {
            this.bufferVisualSala.push(...nuevos);
        }
        return nuevos;
    }
    /** Devuelve y limpia todos los eventos visuales acumulados para emitirlos a los clientes */
    static consumirEventosVisuales() {
        const copia = [...this.bufferVisualSala];
        this.bufferVisualSala = [];
        return copia;
    }
    static resolverObjetivos(state, lanzador, tipo, objetivoId, atacanteContexto) {
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
                if (vivos.length === 0)
                    return [];
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
                const vivos = [];
                state.jugadores.forEach((j) => {
                    if (j.hp > 0)
                        vivos.push(j);
                });
                return vivos;
            }
            default:
                return [];
        }
    }
    static encolarEfectos(state, cola, lanzador, efectos, objetivoId, atacanteContexto, fuentePorDefecto = "ATAQUE_CARTA") {
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
                                const objetivos = this.resolverObjetivos(st, lanzador, efecto.objetivo, objetivoId, atacanteContexto);
                                for (const obj of objetivos) {
                                    const objId = obj instanceof SpireState_1.PlayerState ? obj.sessionId : obj.uid;
                                    q.emitirVisual({
                                        tipo: "ATAQUE_EJECUTADO",
                                        atacanteId: lanzador.sessionId,
                                        objetivoId: objId,
                                        indiceGolpe: hit,
                                        totalGolpes: golpes
                                    });
                                    q.encolarAlInicio(new CombatActions_1.AccionAplicarDanio(lanzador, obj, efecto.valor, fuente));
                                }
                            }
                        });
                    }
                    break;
                }
                case "BLOQUEO": {
                    const objetivos = this.resolverObjetivos(state, lanzador, efecto.objetivo, objetivoId, atacanteContexto);
                    for (const obj of objetivos) {
                        cola.encolarAlFinal(new CombatActions_1.AccionGanarBloqueo(obj, efecto.valor));
                    }
                    break;
                }
                case "APLICAR_ESTADO": {
                    const objetivos = this.resolverObjetivos(state, lanzador, efecto.objetivo, objetivoId, atacanteContexto);
                    for (const obj of objetivos) {
                        cola.encolarAlFinal(new CombatActions_1.AccionAplicarEstado(obj, efecto.estadoId, efecto.valor));
                    }
                    break;
                }
                case "ROBAR_CARTA": {
                    const objetivos = this.resolverObjetivos(state, lanzador, efecto.objetivo, objetivoId, atacanteContexto);
                    for (const obj of objetivos) {
                        if (obj instanceof SpireState_1.PlayerState) {
                            cola.encolarAlFinal(new CombatActions_1.AccionRobarCartas(obj, efecto.valor, (arr) => this.mezclarArray(arr), (j) => this.actualizarContadoresMazo(j)));
                        }
                    }
                    break;
                }
                case "GANAR_ENERGIA": {
                    const objetivos = this.resolverObjetivos(state, lanzador, efecto.objetivo, objetivoId, atacanteContexto);
                    for (const obj of objetivos) {
                        if (obj instanceof SpireState_1.PlayerState) {
                            cola.encolarAlFinal(new CombatActions_1.AccionGanarEnergia(obj, efecto.valor));
                        }
                    }
                    break;
                }
                case "CURAR_HP": {
                    const objetivos = this.resolverObjetivos(state, lanzador, efecto.objetivo, objetivoId, atacanteContexto);
                    for (const obj of objetivos) {
                        cola.encolarAlFinal(new CombatActions_1.AccionCurarHp(obj, efecto.valor));
                    }
                    break;
                }
                case "CONDICIONAL": {
                    const cumple = RelicEngine_1.RelicEngine.evaluarCondicion(efecto.condicion, state, lanzador, {
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
    static ejecutarEfecto(state, lanzador, efecto, objetivoId) {
        this.encolarEfectos(state, this.colaActiva, lanzador, [efecto], objetivoId);
        this.procesarColaPendiente(state);
    }
    static jugarCarta(state, jugador, indiceMano, objetivoId) {
        if (state.faseActual !== "COMBAT" || jugador.hp <= 0 || jugador.turnoTerminado)
            return false;
        if (indiceMano < 0 || indiceMano >= jugador.mano.length)
            return false;
        const cartaId = jugador.mano[indiceMano];
        const cartaData = Cartas_1.CATALOGO_CARTAS[cartaId];
        if (!cartaData || jugador.energia < cartaData.costo)
            return false;
        if (cartaData.objetivoSeleccion === "ENEMIGO") {
            const existeEnemigoVivo = state.enemigos.some((e) => e.uid === objetivoId && e.hp > 0);
            if (!existeEnemigoVivo)
                return false;
        }
        else if (cartaData.objetivoSeleccion === "ALIADO") {
            const aliado = objetivoId ? state.jugadores.get(objetivoId) : undefined;
            if (!aliado || aliado.hp <= 0)
                return false;
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
        this.colaActiva.encolarAlFinal(new CombatActions_1.AccionVerificarFinCombate());
        this.procesarColaPendiente(state);
        return true;
    }
    static aplicarDanio(state, atacante, defensor, danioBase, fuente = "ATAQUE_CARTA") {
        this.colaActiva.encolarAlFinal(new CombatActions_1.AccionAplicarDanio(atacante, defensor, danioBase, fuente));
        this.procesarColaPendiente(state);
    }
    static prepararMazoCombate(jugador) {
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
    static robarCartas(jugador, cantidad) {
        const accion = new CombatActions_1.AccionRobarCartas(jugador, cantidad, (arr) => this.mezclarArray(arr), (j) => this.actualizarContadoresMazo(j));
        accion.ejecutar();
    }
    static descartarMano(jugador) {
        while (jugador.mano.length > 0) {
            const carta = jugador.mano.pop();
            if (carta)
                jugador.descarteInterno.push(carta);
        }
        this.actualizarContadoresMazo(jugador);
    }
    static reducirEstadosPorTurno(entidad) {
        ["VULNERABLE", "DEBIL"].forEach((estado) => {
            const val = entidad.estados.get(estado) || 0;
            if (val > 1)
                entidad.estados.set(estado, val - 1);
            else if (val === 1)
                entidad.estados.delete(estado);
        });
    }
    static procesarInicioTurno(entidad, state) {
        if (entidad.hp <= 0)
            return;
        const veneno = entidad.estados.get("VENENO") || 0;
        if (veneno > 0) {
            if (veneno > 1) {
                entidad.estados.set("VENENO", veneno - 1);
            }
            else {
                entidad.estados.delete("VENENO");
            }
            if (state) {
                this.colaActiva.encolarAlFinal(new CombatActions_1.AccionAplicarDanio(undefined, entidad, veneno, "VENENO"));
                this.procesarColaPendiente(state);
            }
            else {
                entidad.hp = Math.max(0, entidad.hp - veneno);
            }
        }
    }
    static ejecutarTurnoEnemigos(state) {
        state.enemigos.forEach((enemigo) => {
            if (enemigo.hp <= 0 || state.faseActual !== "COMBAT")
                return;
            enemigo.bloqueo = 0;
            this.procesarInicioTurno(enemigo, state);
            // Si murió por veneno al empezar su turno, no actúa
            if (enemigo.hp <= 0 || state.faseActual !== "COMBAT")
                return;
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
                        this.colaActiva.encolarAlFinal(new CombatActions_1.AccionAplicarDanio(enemigo, jugador, enemigo.intencionValor, "ATAQUE_ENEMIGO"));
                        this.procesarColaPendiente(state);
                    }
                });
            }
            else if (enemigo.intencionTipo === "BLOQUEAR") {
                this.colaActiva.encolarAlFinal(new CombatActions_1.AccionGanarBloqueo(enemigo, enemigo.intencionValor));
                this.procesarColaPendiente(state);
            }
            if (enemigo.hp <= 0 || state.faseActual !== "COMBAT")
                return;
            this.reducirEstadosPorTurno(enemigo);
            const info = Enemigos_1.ENEMIGOS_INFO[enemigo.enemigoId];
            if (info && info.patron.length > 0) {
                enemigo.indicePatron = (enemigo.indicePatron + 1) % info.patron.length;
                enemigo.intencionTipo = info.patron[enemigo.indicePatron].tipo;
                enemigo.intencionValor = info.patron[enemigo.indicePatron].valor;
            }
        });
        this.verificarVictoriaCombate(state);
    }
    static verificarVictoriaCombate(state) {
        this.colaActiva.encolarAlFinal(new CombatActions_1.AccionVerificarFinCombate());
        this.procesarColaPendiente(state);
    }
    static actualizarContadoresMazo(jugador) {
        jugador.cantPilaRobo = jugador.pilaRoboInterna.length;
        jugador.cantDescarte = jugador.descarteInterno.length;
    }
    static mezclarArray(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }
}
exports.CombatEngine = CombatEngine;
