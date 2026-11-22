"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CombatEngine = void 0;
const SpireState_1 = require("../rooms/schema/SpireState");
const Cartas_1 = require("../../../assets/cliente/compartido/Cartas");
const CalculadoraCombate_1 = require("../../../assets/cliente/compartido/CalculadoraCombate");
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
        bus.suscribir("AL_INICIAR_COMBATE", ({ state, cola }) => { RelicEngine_1.RelicEngine.dispararParaTodos("AL_INICIAR_COMBATE", state, {}, cola); });
        bus.suscribir("AL_INICIAR_TURNO", ({ state, cola, jugador }) => { RelicEngine_1.RelicEngine.dispararParaJugador("AL_INICIAR_TURNO", state, jugador, {}, cola); });
        bus.suscribir("AL_TERMINAR_TURNO", ({ state, cola, jugador }) => { RelicEngine_1.RelicEngine.dispararParaJugador("AL_TERMINAR_TURNO", state, jugador, {}, cola); });
        bus.suscribir("AL_JUGAR_CARTA", ({ state, cola, jugador, carta, objetivoId }) => { RelicEngine_1.RelicEngine.dispararParaJugador("AL_JUGAR_CARTA", state, jugador, { cartaJugada: carta, objetivoId }, cola); });
        bus.suscribir("AL_INFLIGIR_DANIO", ({ state, cola, atacante, defensor, danioInfligido }) => { RelicEngine_1.RelicEngine.dispararParaJugador("AL_INFLIGIR_DANIO", state, atacante, { objetivoId: defensor.uid, danioInfligido }, cola); });
        bus.suscribir("AL_RECIBIR_DANIO", ({ state, cola, defensor, atacante, danioRecibido }) => { RelicEngine_1.RelicEngine.dispararParaJugador("AL_RECIBIR_DANIO", state, defensor, { atacante, objetivoId: atacante instanceof SpireState_1.EnemyState ? atacante.uid : undefined, danioRecibido }, cola); });
        bus.suscribir("AL_MORIR_ENTIDAD", ({ state, cola, entidadMuerta }) => { if (entidadMuerta instanceof SpireState_1.EnemyState)
            RelicEngine_1.RelicEngine.dispararParaTodos("AL_MORIR_ENEMIGO", state, { objetivoId: entidadMuerta.uid }, cola); });
        bus.suscribir("AL_FINALIZAR_COMBATE", ({ state, cola }) => { RelicEngine_1.RelicEngine.dispararParaTodos("AL_FINALIZAR_COMBATE", state, {}, cola); });
        return bus;
    }
    static obtenerColaActiva() { return this.colaActiva; }
    static obtenerBusEventos() { return this.busEventos; }
    static procesarColaPendiente(state) {
        const nuevos = this.colaActiva.procesarTodo(state, this.busEventos);
        if (nuevos.length > 0)
            this.bufferVisualSala.push(...nuevos);
        return nuevos;
    }
    static consumirEventosVisuales() {
        const copia = [...this.bufferVisualSala];
        this.bufferVisualSala = [];
        return copia;
    }
    static crearInstanciaEnemigo(enemigoId, state, uid) {
        const info = Enemigos_1.ENEMIGOS_INFO[enemigoId];
        if (!info)
            return null;
        const cantidadJugadores = Math.max(1, state.jugadores.size);
        const numeroMapa = state.mapaActual || 1;
        const hpBaseSorteado = (0, Enemigos_1.sortearRangoEntero)(info.hpMin, info.hpMax);
        const hpEscaladoMapa = (0, Enemigos_1.escalarVidaEnemigo)(hpBaseSorteado, numeroMapa);
        const enemigo = new SpireState_1.EnemyState();
        enemigo.uid = uid;
        enemigo.enemigoId = info.id;
        enemigo.nombre = info.nombre;
        enemigo.hpMax = hpEscaladoMapa * cantidadJugadores;
        enemigo.hp = enemigo.hpMax;
        enemigo.indicePatron = 0;
        if (enemigoId === "roly_poly")
            enemigo.estados.set("ASUSTADIZO", 9);
        if (enemigoId === "twin_shot")
            enemigo.estados.set("VUELO", 1);
        if (enemigoId === "double_edge")
            enemigo.estados.set("PONE_HERIDAS", 1);
        this.asignarIntencionSorteada(enemigo, info, 0, numeroMapa);
        return enemigo;
    }
    static asignarIntencionSorteada(enemigo, info, indicePatron, numeroMapa) {
        const resuelta = (0, Enemigos_1.resolverIntencionPatron)(info, indicePatron, numeroMapa);
        enemigo.intencionTipo = resuelta.tipo;
        enemigo.intencionValor = resuelta.valor;
        enemigo.intencionGolpes = resuelta.golpes;
        enemigo.intencionInvocarId = resuelta.invocarEnemigoId;
    }
    static invocarEnemigosEnCombate(state, enemigoIdAInvocar, cantidad) {
        let vivosActuales = 0;
        state.enemigos.forEach((e) => { if (e.hp > 0)
            vivosActuales++; });
        for (let i = 0; i < cantidad; i++) {
            if (vivosActuales >= Enemigos_1.CONFIG_ENEMIGOS.MAX_ENEMIGOS_SIMULTANEOS_EN_PANTALLA)
                break;
            const uid = `inv_${enemigoIdAInvocar}_${Date.now()}_${Math.floor(Math.random() * 10000)}_${i}`;
            const nuevo = this.crearInstanciaEnemigo(enemigoIdAInvocar, state, uid);
            if (nuevo) {
                state.enemigos.push(nuevo);
                vivosActuales++;
            }
        }
    }
    static contarAtaquesEnMano(jugador) {
        let cant = 0;
        for (let i = 0; i < jugador.mano.length; i++) {
            const c = (0, Cartas_1.obtenerDataCarta)(jugador.mano[i]);
            if (c?.tipo === "ATAQUE")
                cant++;
        }
        return cant;
    }
    static manoTieneSoloAtaques(jugador) {
        for (let i = 0; i < jugador.mano.length; i++) {
            const c = (0, Cartas_1.obtenerDataCarta)(jugador.mano[i]);
            if (!c || c.tipo !== "ATAQUE")
                return false;
        }
        return jugador.mano.length > 0;
    }
    static resolverObjetivos(state, lanzador, tipo, objetivoId, atacanteContexto) {
        switch (tipo) {
            case "PROPIO": return lanzador.hp > 0 ? [lanzador] : [];
            case "ATACANTE": return atacanteContexto && atacanteContexto.hp > 0 ? [atacanteContexto] : [];
            case "ENEMIGO": {
                const enemigo = state.enemigos.find((e) => e.uid === objetivoId && e.hp > 0);
                return enemigo ? [enemigo] : [];
            }
            case "ENEMIGO_ALEATORIO": {
                const vivos = state.enemigos.filter((e) => e.hp > 0);
                if (vivos.length === 0)
                    return [];
                return [vivos[Math.floor(Math.random() * vivos.length)]];
            }
            case "TODOS_ENEMIGOS": return state.enemigos.filter((e) => e.hp > 0);
            case "ALIADO": {
                if (!objetivoId || objetivoId === lanzador.sessionId)
                    return [];
                const aliado = state.jugadores.get(objetivoId);
                return aliado && aliado.hp > 0 ? [aliado] : [];
            }
            case "TODOS_ALIADOS": {
                const vivos = [];
                state.jugadores.forEach((j) => { if (j.hp > 0)
                    vivos.push(j); });
                return vivos;
            }
            default: return [];
        }
    }
    static resolverValorDinamico(valor, state, lanzador, objetivoId, atacanteContexto) {
        if (typeof valor === "number")
            return valor;
        if (valor.tipo === "LEER_ESTADO") {
            const objetivos = this.resolverObjetivos(state, lanzador, valor.objetivo, objetivoId, atacanteContexto);
            let total = 0;
            for (const obj of objetivos)
                total += (obj.estados.get(valor.estadoId) || 0);
            return Math.floor(total * valor.multiplicador);
        }
        return 0;
    }
    static encolarEfectos(state, cola, lanzador, efectos, objetivoId, atacanteContexto, fuentePorDefecto = "ATAQUE_CARTA") {
        for (const efecto of efectos) {
            switch (efecto.tipo) {
                case "DANIO": {
                    const golpes = Math.max(1, efecto.repeticiones || 1);
                    const fuente = efecto.fuente || fuentePorDefecto;
                    for (let hit = 1; hit <= golpes; hit++) {
                        cola.encolarAlFinal({
                            ejecutar: (st, q) => {
                                const objetivos = this.resolverObjetivos(st, lanzador, efecto.objetivo, objetivoId, atacanteContexto);
                                let valorBase = efecto.danioIgualABloqueo ? lanzador.bloqueo : this.resolverValorDinamico(efecto.valor, st, lanzador, objetivoId, atacanteContexto);
                                if (efecto.danioExtraPorAtaqueEnMano)
                                    valorBase += this.contarAtaquesEnMano(lanzador) * efecto.danioExtraPorAtaqueEnMano;
                                for (const obj of objetivos) {
                                    const objId = obj instanceof SpireState_1.PlayerState ? obj.sessionId : obj.uid;
                                    if (fuente === "ATAQUE_CARTA")
                                        q.emitirVisual({ tipo: "ATAQUE_EJECUTADO", atacanteId: lanzador.sessionId, objetivoId: objId, indiceGolpe: hit, totalGolpes: golpes });
                                    q.encolarAlInicio(new CombatActions_1.AccionAplicarDanio(lanzador, obj, valorBase, fuente, { oroPorGolpeAlHp: efecto.oroPorGolpeAlHp, oroSiMata: efecto.oroSiMata, multiplicadorFuerza: efecto.multiplicadorFuerza }));
                                }
                            }
                        });
                    }
                    break;
                }
                case "BLOQUEO": {
                    cola.encolarAlFinal({
                        ejecutar: (st, q) => {
                            const aplicaDestreza = fuentePorDefecto === "ATAQUE_CARTA" ? lanzador : undefined;
                            const objetivos = this.resolverObjetivos(st, lanzador, efecto.objetivo, objetivoId, atacanteContexto);
                            const valorBloqueo = this.resolverValorDinamico(efecto.valor, st, lanzador, objetivoId, atacanteContexto);
                            for (const obj of objetivos)
                                q.encolarAlInicio(new CombatActions_1.AccionGanarBloqueo(obj, valorBloqueo, aplicaDestreza));
                        }
                    });
                    break;
                }
                case "APLICAR_ESTADO": {
                    cola.encolarAlFinal({
                        ejecutar: (st, q) => {
                            const objetivos = this.resolverObjetivos(st, lanzador, efecto.objetivo, objetivoId, atacanteContexto);
                            const valorEstado = this.resolverValorDinamico(efecto.valor, st, lanzador, objetivoId, atacanteContexto);
                            for (const obj of objetivos)
                                q.encolarAlInicio(new CombatActions_1.AccionAplicarEstado(obj, efecto.estadoId, valorEstado));
                        }
                    });
                    break;
                }
                case "CURAR_HP": {
                    cola.encolarAlFinal({
                        ejecutar: (st, q) => {
                            const objetivos = this.resolverObjetivos(st, lanzador, efecto.objetivo, objetivoId, atacanteContexto);
                            const valorCura = this.resolverValorDinamico(efecto.valor, st, lanzador, objetivoId, atacanteContexto);
                            for (const obj of objetivos)
                                q.encolarAlInicio(new CombatActions_1.AccionCurarHp(obj, valorCura));
                        }
                    });
                    break;
                }
                case "PERDER_HP": {
                    cola.encolarAlFinal({
                        ejecutar: (st, q) => {
                            const objetivos = this.resolverObjetivos(st, lanzador, efecto.objetivo, objetivoId, atacanteContexto);
                            const valorPerdida = this.resolverValorDinamico(efecto.valor, st, lanzador, objetivoId, atacanteContexto);
                            for (const obj of objetivos)
                                q.encolarAlInicio(new CombatActions_1.AccionPerderHp(obj, valorPerdida, lanzador));
                        }
                    });
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
                        if (obj instanceof SpireState_1.PlayerState)
                            cola.encolarAlFinal(new CombatActions_1.AccionGanarEnergia(obj, efecto.valor));
                    }
                    break;
                }
                case "GANAR_ORO": {
                    cola.encolarAlFinal(new CombatActions_1.AccionModificarOro(lanzador, efecto.valor));
                    break;
                }
                case "APUESTA_ORO": {
                    cola.encolarAlFinal({
                        ejecutar: (_st, q) => {
                            const gano = Math.random() * 100 < efecto.probabilidadExito;
                            const delta = gano ? efecto.oroGanado : -efecto.oroPerdido;
                            q.encolarAlInicio(new CombatActions_1.AccionModificarOro(lanzador, delta));
                        }
                    });
                    break;
                }
                case "REPARTIR_ORO_ALIADOS": {
                    cola.encolarAlFinal({
                        ejecutar: (st, q) => {
                            const otrosAliados = [];
                            st.jugadores.forEach((j) => { if (j.sessionId !== lanzador.sessionId && j.hp > 0)
                                otrosAliados.push(j); });
                            if (otrosAliados.length === 0 || lanzador.oro <= 0)
                                return;
                            const oroARepartir = Math.floor(lanzador.oro * efecto.porcentaje);
                            if (oroARepartir <= 0)
                                return;
                            const porAliado = Math.floor(oroARepartir / otrosAliados.length);
                            const gastoTotal = porAliado * otrosAliados.length;
                            if (gastoTotal <= 0)
                                return;
                            q.encolarAlInicio(new CombatActions_1.AccionModificarOro(lanzador, -gastoTotal));
                            for (const aliado of otrosAliados)
                                q.encolarAlInicio(new CombatActions_1.AccionModificarOro(aliado, porAliado));
                        }
                    });
                    break;
                }
                case "ORO_IGUAL_A_BLOQUEO": {
                    cola.encolarAlFinal({ ejecutar: (_st, q) => { if (lanzador.bloqueo > 0)
                            q.encolarAlInicio(new CombatActions_1.AccionModificarOro(lanzador, lanzador.bloqueo)); } });
                    break;
                }
                case "FUERZA_POR_CADA_ORO": {
                    cola.encolarAlFinal({
                        ejecutar: (_st, q) => {
                            if (efecto.cadaCuantoOro <= 0)
                                return;
                            const tramos = Math.floor(lanzador.oro / efecto.cadaCuantoOro);
                            const fuerzaTotal = tramos * efecto.fuerzaGanada;
                            if (fuerzaTotal > 0)
                                q.encolarAlInicio(new CombatActions_1.AccionAplicarEstado(lanzador, "FUERZA", fuerzaTotal));
                        }
                    });
                    break;
                }
                case "BLOQUEO_POR_ORO": {
                    cola.encolarAlFinal({
                        ejecutar: (_st, q) => {
                            if (efecto.cadaCuantoOro <= 0)
                                return;
                            const tramos = Math.floor(lanzador.oro / efecto.cadaCuantoOro);
                            const blq = tramos * efecto.bloqueoPorTramo;
                            if (blq > 0)
                                q.encolarAlInicio(new CombatActions_1.AccionGanarBloqueo(lanzador, blq));
                        }
                    });
                    break;
                }
                case "BLOQUEO_POR_CARTAS_MAZO": {
                    cola.encolarAlFinal({
                        ejecutar: (_st, q) => {
                            if (efecto.cadaCuantasCartas <= 0)
                                return;
                            const tramos = Math.floor(lanzador.mazoMaestro.length / efecto.cadaCuantasCartas);
                            const blq = tramos * efecto.bloqueoPorTramo;
                            if (blq > 0)
                                q.encolarAlInicio(new CombatActions_1.AccionGanarBloqueo(lanzador, blq));
                        }
                    });
                    break;
                }
                case "HACER_CARTA_MANO_GRATIS_TURNO": {
                    cola.encolarAlFinal({
                        ejecutar: () => {
                            const manoTemp = [...lanzador.mano];
                            const elegibles = [];
                            for (let i = 0; i < manoTemp.length; i++) {
                                const cData = (0, Cartas_1.obtenerDataCarta)(manoTemp[i]);
                                if (!cData || cData.injugable)
                                    continue;
                                const costoActual = CalculadoraCombate_1.CalculadoraCombate.calcularCostoCarta(cData.costo, cData.reduccionCostoPorHpPerdido, lanzador.hpPerdidoCombate, (0, Cartas_1.obtenerEncantamientoCarta)(manoTemp[i]), (0, Cartas_1.esCartaGratisEsteTurno)(manoTemp[i]));
                                if (costoActual > 0)
                                    elegibles.push(i);
                            }
                            this.mezclarIndices(elegibles);
                            const limite = Math.min(efecto.cantidad, elegibles.length);
                            for (let k = 0; k < limite; k++) {
                                const idx = elegibles[k];
                                manoTemp[idx] = (0, Cartas_1.marcarCartaGratisEsteTurno)(manoTemp[idx]);
                            }
                            this.sincronizarArraySchema(lanzador.mano, manoTemp);
                        }
                    });
                    break;
                }
                case "ORO_POR_HP_FALTANTE_ENEMIGO": {
                    cola.encolarAlFinal({
                        ejecutar: (st, q) => {
                            const enemigo = st.enemigos.find((e) => e.uid === objetivoId);
                            if (!enemigo)
                                return;
                            const hpFaltante = Math.max(0, enemigo.hpMax - enemigo.hp);
                            const oroGanado = Math.min(efecto.maximoOro, hpFaltante * efecto.oroPorHp);
                            if (oroGanado > 0)
                                q.encolarAlInicio(new CombatActions_1.AccionModificarOro(lanzador, oroGanado));
                        }
                    });
                    break;
                }
                case "INTERES_ORO": {
                    cola.encolarAlFinal({
                        ejecutar: (_st, q) => {
                            if (efecto.cadaCuantoOro <= 0)
                                return;
                            const tramos = Math.floor(lanzador.oro / efecto.cadaCuantoOro);
                            const ganancia = tramos * efecto.oroGanado;
                            if (ganancia > 0)
                                q.encolarAlInicio(new CombatActions_1.AccionModificarOro(lanzador, ganancia));
                        }
                    });
                    break;
                }
                case "DUPLICAR_ORO": {
                    cola.encolarAlFinal({ ejecutar: (_st, q) => { if (lanzador.oro > 0)
                            q.encolarAlInicio(new CombatActions_1.AccionModificarOro(lanzador, lanzador.oro)); } });
                    break;
                }
                case "BLOQUEO_POR_ORO_GASTADO": {
                    cola.encolarAlFinal({
                        ejecutar: (_st, q) => {
                            const oroAGastar = Math.min(efecto.maximoOro, lanzador.oro);
                            if (oroAGastar <= 0)
                                return;
                            q.encolarAlInicio(new CombatActions_1.AccionGanarBloqueo(lanzador, oroAGastar));
                            q.encolarAlInicio(new CombatActions_1.AccionModificarOro(lanzador, -oroAGastar));
                        }
                    });
                    break;
                }
                case "COPIAR_CARTA_A_DESCARTE": {
                    cola.encolarAlFinal({
                        ejecutar: () => {
                            const copias = Math.max(1, efecto.cantidad || 1);
                            for (let i = 0; i < copias; i++)
                                lanzador.descarteInterno.push(efecto.cartaId);
                            this.actualizarContadoresMazo(lanzador);
                        }
                    });
                    break;
                }
                case "AGREGAR_CARTA_A_MANO": {
                    cola.encolarAlFinal({
                        ejecutar: () => {
                            const manoTemp = [...lanzador.mano];
                            for (let i = 0; i < efecto.cantidad; i++) {
                                if (manoTemp.length >= 10)
                                    break;
                                manoTemp.push(efecto.cartaId);
                            }
                            this.sincronizarArraySchema(lanzador.mano, manoTemp);
                        }
                    });
                    break;
                }
                case "SELECCIONAR_CARTAS_MANO": {
                    cola.encolarAlFinal({
                        ejecutar: () => {
                            lanzador.motivoSeleccionMano = efecto.motivo;
                            lanzador.cantSeleccionManoMin = efecto.cantidadMin;
                            lanzador.cantSeleccionManoMax = efecto.cantidadMax;
                        }
                    });
                    break;
                }
                case "MEJORAR_CARTAS_MANO": {
                    cola.encolarAlFinal({
                        ejecutar: () => {
                            const indicesMejorables = [];
                            // Recopilamos qué cartas en la mano se pueden mejorar
                            for (let i = 0; i < lanzador.mano.length; i++) {
                                if ((0, Cartas_1.puedeMejorarseCarta)(lanzador.mano[i]))
                                    indicesMejorables.push(i);
                            }
                            if (indicesMejorables.length === 0)
                                return;
                            // Hacemos una copia profunda (por valor) de la mano actual
                            const manoTemp = Array.from(lanzador.mano);
                            if (efecto.cantidad === "TODAS") {
                                for (const idx of indicesMejorables) {
                                    const mejoradaId = (0, Cartas_1.obtenerIdCartaMejoradaPreservandoExtras)(manoTemp[idx]);
                                    if (mejoradaId) {
                                        // Modificamos la copia
                                        manoTemp.splice(idx, 1, mejoradaId);
                                    }
                                }
                            }
                            else {
                                this.mezclarIndices(indicesMejorables);
                                const limite = Math.min(efecto.cantidad, indicesMejorables.length);
                                for (let i = 0; i < limite; i++) {
                                    const idx = indicesMejorables[i];
                                    const mejoradaId = (0, Cartas_1.obtenerIdCartaMejoradaPreservandoExtras)(manoTemp[idx]);
                                    if (mejoradaId) {
                                        // Modificamos la copia
                                        manoTemp.splice(idx, 1, mejoradaId);
                                    }
                                }
                            }
                            // Sincronizamos la copia ya modificada de vuelta al Schema
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
                                if (manoTemp.length === 0)
                                    break;
                                const idxAzar = Math.floor(Math.random() * manoTemp.length);
                                const agotada = manoTemp.splice(idxAzar, 1)[0];
                                if (agotada)
                                    lanzador.agotadasInterno.push((0, Cartas_1.limpiarMarcadoresTemporalesCarta)(agotada));
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
                            const cumple = RelicEngine_1.RelicEngine.evaluarCondicion(efecto.condicion, st, lanzador, { objetivoId, atacante: atacanteContexto });
                            const rama = cumple ? efecto.efectosSiCumple : efecto.efectosSiNoCumple || [];
                            if (rama.length > 0)
                                this.encolarEfectos(st, q, lanzador, rama, objetivoId, atacanteContexto, fuentePorDefecto);
                        }
                    });
                    break;
                }
            }
        }
    }
    static ejecutarEfecto(state, lanzador, efecto, objetivoId) {
        this.encolarEfectos(state, this.colaActiva, lanzador, [efecto], objetivoId);
        this.procesarColaPendiente(state);
    }
    static resolverSeleccionMano(state, jugador, indices) {
        if (jugador.motivoSeleccionMano === "NINGUNO")
            return;
        const ctasSeleccionadas = indices.length;
        if (ctasSeleccionadas < jugador.cantSeleccionManoMin || ctasSeleccionadas > jugador.cantSeleccionManoMax)
            return;
        // Ordenar de mayor a menor para que el splice() no desfase los índices
        indices.sort((a, b) => b - a);
        const nuevaMano = [...jugador.mano];
        switch (jugador.motivoSeleccionMano) {
            case "DESCARTAR":
                for (const idx of indices) {
                    const cartaId = nuevaMano.splice(idx, 1)[0];
                    jugador.descarteInterno.push((0, Cartas_1.limpiarMarcadoresTemporalesCarta)(cartaId));
                }
                break;
            case "AGOTAR":
                for (const idx of indices) {
                    const cartaId = nuevaMano.splice(idx, 1)[0];
                    jugador.agotadasInterno.push((0, Cartas_1.limpiarMarcadoresTemporalesCarta)(cartaId));
                }
                break;
            case "MEJORAR":
                for (const idx of indices) {
                    const cartaId = nuevaMano[idx];
                    const mejoradaId = (0, Cartas_1.obtenerIdCartaMejoradaPreservandoExtras)(cartaId);
                    if (mejoradaId)
                        nuevaMano[idx] = mejoradaId;
                }
                break;
            case "HACER_GRATIS":
                for (const idx of indices) {
                    nuevaMano[idx] = (0, Cartas_1.marcarCartaGratisEsteTurno)(nuevaMano[idx]);
                }
                break;
        }
        this.sincronizarArraySchema(jugador.mano, nuevaMano);
        this.actualizarContadoresMazo(jugador);
        jugador.motivoSeleccionMano = "NINGUNO";
        jugador.cantSeleccionManoMin = 0;
        jugador.cantSeleccionManoMax = 0;
        this.verificarVictoriaCombate(state);
    }
    static jugarCarta(state, jugador, indiceMano, objetivoId) {
        if (state.faseActual !== "COMBAT" || jugador.hp <= 0 || jugador.turnoTerminado)
            return false;
        if (indiceMano < 0 || indiceMano >= jugador.mano.length)
            return false;
        const cartaId = jugador.mano[indiceMano];
        const cartaData = (0, Cartas_1.obtenerDataCarta)(cartaId);
        if (!cartaData || cartaData.injugable)
            return false;
        if (cartaData.requiereManoSoloAtaques && !this.manoTieneSoloAtaques(jugador))
            return false;
        const costoRealEnergia = CalculadoraCombate_1.CalculadoraCombate.calcularCostoCarta(cartaData.costo, cartaData.reduccionCostoPorHpPerdido, jugador.hpPerdidoCombate, (0, Cartas_1.obtenerEncantamientoCarta)(cartaId), (0, Cartas_1.esCartaGratisEsteTurno)(cartaId));
        if (jugador.energia < costoRealEnergia)
            return false;
        if (cartaData.costoOro && jugador.oro < cartaData.costoOro)
            return false;
        if (cartaData.objetivoSeleccion === "ENEMIGO") {
            const existeEnemigoVivo = state.enemigos.some((e) => e.uid === objetivoId && e.hp > 0);
            if (!existeEnemigoVivo)
                return false;
        }
        else if (cartaData.objetivoSeleccion === "ALIADO") {
            if (!objetivoId || objetivoId === jugador.sessionId)
                return false;
            const aliado = state.jugadores.get(objetivoId);
            if (!aliado || aliado.hp <= 0)
                return false;
        }
        jugador.energia -= costoRealEnergia;
        const nuevaMano = [...jugador.mano];
        nuevaMano.splice(indiceMano, 1);
        this.sincronizarArraySchema(jugador.mano, nuevaMano);
        if (cartaData.costoOro && cartaData.costoOro > 0) {
            this.colaActiva.encolarAlFinal(new CombatActions_1.AccionModificarOro(jugador, -cartaData.costoOro));
        }
        jugador.cartasJugadasTurno += 1;
        jugador.cartasJugadasCombate += 1;
        if (cartaData.tipo === "ATAQUE")
            jugador.ataquesJugadosTurno += 1;
        this.colaActiva.emitirVisual({ tipo: "CARTA_JUGADA", jugadorId: jugador.sessionId, cartaId: cartaData.id, objetivoId });
        this.encolarEfectos(state, this.colaActiva, jugador, cartaData.efectos, objetivoId, undefined, "ATAQUE_CARTA");
        this.busEventos.emitir("AL_JUGAR_CARTA", { state, cola: this.colaActiva, jugador, carta: cartaData, objetivoId });
        const cartaLimpia = (0, Cartas_1.limpiarMarcadoresTemporalesCarta)(cartaId);
        if (cartaData.tipo === "PODER") {
            // Los poderes se consumen al jugarse
            this.colaActiva.emitirVisual({ tipo: "CARTA_AGOTADA", jugadorId: jugador.sessionId, cartaInstanciaId: cartaId });
        }
        else if (cartaData.agotar || cartaData.eterea) {
            jugador.agotadasInterno.push(cartaLimpia);
            this.colaActiva.emitirVisual({ tipo: "CARTA_AGOTADA", jugadorId: jugador.sessionId, cartaInstanciaId: cartaId });
        }
        else {
            jugador.descarteInterno.push(cartaLimpia);
            this.colaActiva.emitirVisual({ tipo: "CARTA_DESCARTADA", jugadorId: jugador.sessionId, cartaInstanciaId: cartaId });
        }
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
    static robarCartas(jugador, cantidad) {
        const accion = new CombatActions_1.AccionRobarCartas(jugador, cantidad, (arr) => this.mezclarArray(arr), (j) => this.actualizarContadoresMazo(j));
        accion.ejecutar();
    }
    static descartarMano(jugador, state) {
        if (state && jugador.hp > 0) {
            for (let i = 0; i < jugador.mano.length; i++) {
                const cartaId = jugador.mano[i];
                const data = (0, Cartas_1.obtenerDataCarta)(cartaId);
                if (data?.efectosFinTurnoEnMano && data.efectosFinTurnoEnMano.length > 0) {
                    this.encolarEfectos(state, this.colaActiva, jugador, data.efectosFinTurnoEnMano, undefined, undefined, "EFECTO_DIRECTO");
                }
            }
            const danioCombustion = jugador.estados.get("COMBUSTION") || 0;
            if (danioCombustion > 0 && jugador.hp > 0) {
                this.colaActiva.encolarAlFinal(new CombatActions_1.AccionPerderHp(jugador, 1, jugador));
                state.enemigos.forEach((enemigo) => {
                    if (enemigo.hp > 0)
                        this.colaActiva.encolarAlFinal(new CombatActions_1.AccionAplicarDanio(jugador, enemigo, danioCombustion, "EFECTO_DIRECTO"));
                });
            }
            const fuerzaTemp = jugador.estados.get("FUERZA_TEMPORAL") || 0;
            if (fuerzaTemp > 0) {
                jugador.estados.delete("FUERZA_TEMPORAL");
                this.colaActiva.encolarAlFinal(new CombatActions_1.AccionAplicarEstado(jugador, "FUERZA", -fuerzaTemp));
            }
            if (jugador.estados.has("SIN_ROBO"))
                jugador.estados.delete("SIN_ROBO");
            this.procesarColaPendiente(state);
        }
        const cartasActuales = [...jugador.mano];
        const retenidasEnMano = [];
        for (const carta of cartasActuales) {
            if (!carta)
                continue;
            const data = (0, Cartas_1.obtenerDataCarta)(carta);
            const cartaLimpia = (0, Cartas_1.limpiarMarcadoresTemporalesCarta)(carta);
            if (data?.eterea) {
                jugador.agotadasInterno.push(cartaLimpia);
                this.colaActiva.emitirVisual({ tipo: "CARTA_AGOTADA", jugadorId: jugador.sessionId, cartaInstanciaId: carta });
            }
            else if (data?.eterno) {
                retenidasEnMano.push(cartaLimpia);
            }
            else {
                jugador.descarteInterno.push(cartaLimpia);
                this.colaActiva.emitirVisual({ tipo: "CARTA_DESCARTADA", jugadorId: jugador.sessionId, cartaInstanciaId: carta });
            }
        }
        this.sincronizarArraySchema(jugador.mano, retenidasEnMano);
        this.actualizarContadoresMazo(jugador);
    }
    static reducirEstadosPorTurno(entidad) {
        const estadosAReducir = entidad instanceof SpireState_1.PlayerState ? ["DEBIL", "FRAGIL"] : ["VULNERABLE", "DEBIL", "FRAGIL"];
        estadosAReducir.forEach((estado) => {
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
            if (veneno > 1)
                entidad.estados.set("VENENO", veneno - 1);
            else
                entidad.estados.delete("VENENO");
            if (state) {
                this.colaActiva.encolarAlFinal(new CombatActions_1.AccionAplicarDanio(undefined, entidad, veneno, "VENENO"));
                this.procesarColaPendiente(state);
            }
            else {
                entidad.hp = Math.max(0, entidad.hp - veneno);
            }
        }
        if (entidad.hp <= 0)
            return;
        if (entidad instanceof SpireState_1.PlayerState && state) {
            const oroPorTramo = entidad.estados.get("ARRIESGAR_GANAR") || 0;
            if (oroPorTramo > 0) {
                const tramosDeVeinte = Math.floor(entidad.oro / 20);
                const oroGanado = tramosDeVeinte * oroPorTramo;
                this.colaActiva.encolarAlFinal(new CombatActions_1.AccionPerderHp(entidad, 3, entidad));
                if (oroGanado > 0)
                    this.colaActiva.encolarAlFinal(new CombatActions_1.AccionModificarOro(entidad, oroGanado));
                this.procesarColaPendiente(state);
            }
            // Efecto Pasivo: Gases Nocivos
            const gases = entidad.estados.get("GASES_NOCIVOS") || 0;
            if (gases > 0) {
                state.enemigos.forEach(e => {
                    if (e.hp > 0)
                        this.colaActiva.encolarAlFinal(new CombatActions_1.AccionAplicarEstado(e, "VENENO", gases));
                });
                this.procesarColaPendiente(state);
            }
        }
        if (entidad instanceof SpireState_1.EnemyState) {
            const ritual = entidad.estados.get("RITUAL") || 0;
            if (ritual > 0 && state)
                this.colaActiva.encolarAlFinal(new CombatActions_1.AccionAplicarEstado(entidad, "FUERZA", ritual));
            const enterrado = entidad.estados.get("ENTERRADO") || 0;
            if (enterrado > 0 && state)
                this.colaActiva.encolarAlFinal(new CombatActions_1.AccionAplicarEstado(entidad, "FUERZA", 1));
            const asustadizo = entidad.estados.get("ASUSTADIZO") || 0;
            if (asustadizo > 0) {
                if (asustadizo > 1)
                    entidad.estados.set("ASUSTADIZO", asustadizo - 1);
                else
                    entidad.estados.delete("ASUSTADIZO");
            }
            entidad.estados.delete("REFLEJAR");
            entidad.estados.delete("ASUSTADIZO_USADO");
            entidad.estados.delete("GOLPES_RECIBIDOS");
        }
    }
    // (El resto de ejecutarTurnoEnemigos y utilidades quedan exactamente como te los pasé en el mensaje anterior, sin cambios).
    static ejecutarTurnoEnemigos(state) {
        const jugadoresConVulnerablePrevio = new Set();
        state.jugadores.forEach((j) => {
            if (j.hp > 0 && (j.estados.get("VULNERABLE") || 0) > 0) {
                jugadoresConVulnerablePrevio.add(j.sessionId);
            }
        });
        const enemigosActuantes = [];
        state.enemigos.forEach((e) => {
            if (e.hp > 0)
                enemigosActuantes.push(e);
        });
        for (const enemigo of enemigosActuantes) {
            if (enemigo.hp <= 0 || state.faseActual !== "COMBAT")
                continue;
            enemigo.bloqueo = 0;
            this.procesarInicioTurno(enemigo, state);
            if (enemigo.hp <= 0 || state.faseActual !== "COMBAT")
                continue;
            if ((enemigo.estados.get("ATURDIDO") || 0) > 0) {
                enemigo.estados.delete("ATURDIDO");
                this.reducirEstadosPorTurno(enemigo);
                enemigo.indicePatron = 0;
                const info = Enemigos_1.ENEMIGOS_INFO[enemigo.enemigoId];
                if (info && info.patron.length > 0) {
                    this.asignarIntencionSorteada(enemigo, info, 0, state.mapaActual || 1);
                }
                continue;
            }
            switch (enemigo.intencionTipo) {
                case "ATACAR": {
                    const golpes = Math.max(1, enemigo.intencionGolpes || 1);
                    for (let hit = 1; hit <= golpes; hit++) {
                        state.jugadores.forEach((jugador) => {
                            if (enemigo.hp > 0 && jugador.hp > 0 && state.faseActual === "COMBAT") {
                                this.colaActiva.emitirVisual({ tipo: "ATAQUE_EJECUTADO", atacanteId: enemigo.uid, objetivoId: jugador.sessionId, indiceGolpe: hit, totalGolpes: golpes });
                                this.colaActiva.encolarAlFinal(new CombatActions_1.AccionAplicarDanio(enemigo, jugador, enemigo.intencionValor, "ATAQUE_ENEMIGO"));
                                this.procesarColaPendiente(state);
                            }
                        });
                    }
                    break;
                }
                case "BLOQUEAR": {
                    this.colaActiva.encolarAlFinal(new CombatActions_1.AccionGanarBloqueo(enemigo, enemigo.intencionValor));
                    this.procesarColaPendiente(state);
                    break;
                }
                case "ATACAR_Y_BLOQUEAR": {
                    state.jugadores.forEach((jugador) => {
                        if (enemigo.hp > 0 && jugador.hp > 0 && state.faseActual === "COMBAT") {
                            this.colaActiva.emitirVisual({ tipo: "ATAQUE_EJECUTADO", atacanteId: enemigo.uid, objetivoId: jugador.sessionId, indiceGolpe: 1, totalGolpes: 1 });
                            this.colaActiva.encolarAlFinal(new CombatActions_1.AccionAplicarDanio(enemigo, jugador, enemigo.intencionValor, "ATAQUE_ENEMIGO"));
                            this.procesarColaPendiente(state);
                        }
                    });
                    if (enemigo.hp > 0 && state.faseActual === "COMBAT") {
                        this.colaActiva.encolarAlFinal(new CombatActions_1.AccionGanarBloqueo(enemigo, enemigo.intencionValor));
                        this.procesarColaPendiente(state);
                    }
                    break;
                }
                case "GANAR_FUERZA": {
                    this.colaActiva.encolarAlFinal(new CombatActions_1.AccionAplicarEstado(enemigo, "FUERZA", enemigo.intencionValor));
                    this.procesarColaPendiente(state);
                    break;
                }
                case "GANAR_ESPINAS": {
                    this.colaActiva.encolarAlFinal(new CombatActions_1.AccionAplicarEstado(enemigo, "ESPINAS", enemigo.intencionValor));
                    this.procesarColaPendiente(state);
                    break;
                }
                case "APLICAR_VULNERABLE": {
                    state.jugadores.forEach((jugador) => { if (jugador.hp > 0)
                        this.colaActiva.encolarAlFinal(new CombatActions_1.AccionAplicarEstado(jugador, "VULNERABLE", enemigo.intencionValor)); });
                    this.procesarColaPendiente(state);
                    break;
                }
                case "APLICAR_DEBIL": {
                    state.jugadores.forEach((jugador) => { if (jugador.hp > 0)
                        this.colaActiva.encolarAlFinal(new CombatActions_1.AccionAplicarEstado(jugador, "DEBIL", enemigo.intencionValor)); });
                    this.procesarColaPendiente(state);
                    break;
                }
                case "CURAR_ALIADOS": {
                    state.enemigos.forEach((aliadoEnemigo) => { if (aliadoEnemigo.hp > 0)
                        this.colaActiva.encolarAlFinal(new CombatActions_1.AccionCurarHp(aliadoEnemigo, enemigo.intencionValor)); });
                    this.procesarColaPendiente(state);
                    break;
                }
                case "INVOCAR": {
                    if (enemigo.intencionInvocarId)
                        this.invocarEnemigosEnCombate(state, enemigo.intencionInvocarId, enemigo.intencionValor);
                    break;
                }
                case "APLICAR_FRAGIL":
                    state.jugadores.forEach((jugador) => { if (jugador.hp > 0)
                        this.colaActiva.encolarAlFinal(new CombatActions_1.AccionAplicarEstado(jugador, "FRAGIL", enemigo.intencionValor)); });
                    this.procesarColaPendiente(state);
                    break;
                case "GANAR_REFLEJAR":
                    this.colaActiva.encolarAlFinal(new CombatActions_1.AccionAplicarEstado(enemigo, "REFLEJAR", 1));
                    this.procesarColaPendiente(state);
                    break;
                case "GANAR_RITUAL":
                    this.colaActiva.encolarAlFinal(new CombatActions_1.AccionAplicarEstado(enemigo, "RITUAL", enemigo.intencionValor));
                    this.procesarColaPendiente(state);
                    break;
                case "GANAR_ENFURECIDO":
                    this.colaActiva.encolarAlFinal(new CombatActions_1.AccionAplicarEstado(enemigo, "ENFURECIDO", 1));
                    this.procesarColaPendiente(state);
                    break;
                case "GANAR_PONE_HERIDAS":
                    this.colaActiva.encolarAlFinal(new CombatActions_1.AccionAplicarEstado(enemigo, "PONE_HERIDAS", 1));
                    this.procesarColaPendiente(state);
                    break;
                case "GANAR_ENTERRADO":
                    this.colaActiva.encolarAlFinal(new CombatActions_1.AccionAplicarEstado(enemigo, "ENTERRADO", 1));
                    this.colaActiva.encolarAlFinal(new CombatActions_1.AccionGanarBloqueo(enemigo, enemigo.intencionValor));
                    this.procesarColaPendiente(state);
                    break;
                case "ESCUDO_AREA":
                    state.enemigos.forEach((aliadoEnemigo) => { if (aliadoEnemigo.hp > 0)
                        this.colaActiva.encolarAlFinal(new CombatActions_1.AccionGanarBloqueo(aliadoEnemigo, enemigo.intencionValor)); });
                    this.procesarColaPendiente(state);
                    break;
                case "BLOQUEAR_Y_VULNERABLE":
                    this.colaActiva.encolarAlFinal(new CombatActions_1.AccionGanarBloqueo(enemigo, enemigo.intencionValor));
                    state.jugadores.forEach((jugador) => { if (jugador.hp > 0)
                        this.colaActiva.encolarAlFinal(new CombatActions_1.AccionAplicarEstado(jugador, "VULNERABLE", 2)); });
                    this.procesarColaPendiente(state);
                    break;
            }
            if (enemigo.hp <= 0 || state.faseActual !== "COMBAT")
                continue;
            this.reducirEstadosPorTurno(enemigo);
            const info = Enemigos_1.ENEMIGOS_INFO[enemigo.enemigoId];
            if (info && info.patron.length > 0) {
                enemigo.indicePatron = (enemigo.indicePatron + 1) % info.patron.length;
                this.asignarIntencionSorteada(enemigo, info, enemigo.indicePatron, state.mapaActual || 1);
            }
        }
        state.jugadores.forEach((j) => {
            if (j.hp > 0 && jugadoresConVulnerablePrevio.has(j.sessionId)) {
                const val = j.estados.get("VULNERABLE") || 0;
                if (val > 1)
                    j.estados.set("VULNERABLE", val - 1);
                else if (val === 1)
                    j.estados.delete("VULNERABLE");
            }
        });
        this.verificarVictoriaCombate(state);
    }
    static verificarVictoriaCombate(state) {
        this.colaActiva.encolarAlFinal(new CombatActions_1.AccionVerificarFinCombate());
        this.procesarColaPendiente(state);
    }
    static sincronizarArraySchema(schemaArr, nuevoContenido) {
        while (schemaArr.length > nuevoContenido.length)
            schemaArr.pop();
        for (let i = 0; i < nuevoContenido.length; i++) {
            if (i < schemaArr.length) {
                if (schemaArr[i] !== nuevoContenido[i])
                    schemaArr[i] = nuevoContenido[i];
            }
            else {
                schemaArr.push(nuevoContenido[i]);
            }
        }
    }
    static actualizarContadoresMazo(jugador) {
        jugador.cantPilaRobo = jugador.pilaRoboInterna.length;
        jugador.cantDescarte = jugador.descarteInterno.length;
        jugador.cantAgotadas = jugador.agotadasInterno.length;
        this.sincronizarArraySchema(jugador.pilaRobo, jugador.pilaRoboInterna);
        this.sincronizarArraySchema(jugador.descarte, jugador.descarteInterno);
        this.sincronizarArraySchema(jugador.agotadas, jugador.agotadasInterno);
    }
    static mezclarArray(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }
    static mezclarIndices(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }
}
exports.CombatEngine = CombatEngine;
