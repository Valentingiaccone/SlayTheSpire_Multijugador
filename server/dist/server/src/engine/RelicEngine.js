"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelicEngine = void 0;
const SpireState_1 = require("../rooms/schema/SpireState");
const Reliquias_1 = require("../../../assets/cliente/compartido/Reliquias");
const Cartas_1 = require("../../../assets/cliente/compartido/Cartas");
const CombatEngine_1 = require("./CombatEngine");
class RelicEngine {
    // ================= ENTREGA CENTRALIZADA Y EFECTOS AL RECOGER =================
    static otorgarReliquia(state, jugador, reliquiaId, dispararAlRecoger = true) {
        const data = Reliquias_1.CATALOGO_RELIQUIAS[reliquiaId];
        if (!data)
            return;
        jugador.reliquias.push(reliquiaId);
        if (data.contadorConfig?.modo === "CARGAS") {
            jugador.contadoresReliquias.set(reliquiaId, data.contadorConfig.valorInicial);
        }
        if (!dispararAlRecoger || !data.efectosAlRecoger)
            return;
        for (const ef of data.efectosAlRecoger) {
            switch (ef.tipo) {
                case "MEJORAR_CARTAS_MAZO_AZAR": {
                    const indicesCandidatos = [];
                    for (let i = 0; i < jugador.mazoMaestro.length; i++) {
                        const rawId = jugador.mazoMaestro[i];
                        if (!(0, Cartas_1.puedeMejorarseCarta)(rawId))
                            continue;
                        if (ef.filtroTipo !== "CUALQUIERA") {
                            const cData = (0, Cartas_1.obtenerDataCarta)(rawId);
                            if (cData?.tipo !== ef.filtroTipo)
                                continue;
                        }
                        indicesCandidatos.push(i);
                    }
                    this.mezclarArray(indicesCandidatos);
                    const limite = Math.min(ef.cantidad, indicesCandidatos.length);
                    for (let k = 0; k < limite; k++) {
                        const idx = indicesCandidatos[k];
                        const nuevoId = (0, Cartas_1.obtenerIdCartaMejoradaPreservandoExtras)(jugador.mazoMaestro[idx]);
                        if (nuevoId)
                            jugador.mazoMaestro[idx] = nuevoId;
                    }
                    break;
                }
                case "AUMENTAR_HP_MAX_Y_CURAR": {
                    jugador.hpMax += ef.valor;
                    jugador.hp = Math.min(jugador.hpMax, jugador.hp + ef.valor);
                    break;
                }
                case "GANAR_CARTA_CALIDAD_AZAR": {
                    const nuevaCarta = (0, Cartas_1.generarCartaPorCalidad)(jugador.personajeId, ef.calidad, Math.max(1, state.jugadores.size));
                    if (nuevaCarta) {
                        jugador.mazoMaestro.push(nuevaCarta);
                    }
                    break;
                }
                case "REEMPLAZAR_RELIQUIA_SI_TIENE": {
                    const lista = Array.from(jugador.reliquias);
                    const idx = lista.indexOf(ef.reliquiaOrigen);
                    if (idx !== -1) {
                        lista[idx] = ef.reliquiaDestino;
                        CombatEngine_1.CombatEngine.sincronizarArraySchema(jugador.reliquias, lista);
                    }
                    break;
                }
                case "OTORGAR_RELIQUIAS_ALEATORIAS": {
                    const excluir = new Set([reliquiaId]);
                    const nuevasComunes = (0, Reliquias_1.obtenerReliquiasRecompensa)(state.jugadores, ef.comunes, jugador.personajeId, "COFRE", "COMUN", excluir);
                    nuevasComunes.forEach((id) => excluir.add(id));
                    const nuevasEpicas = (0, Reliquias_1.obtenerReliquiasRecompensa)(state.jugadores, ef.epicas, jugador.personajeId, "COFRE", "EPICA", excluir);
                    nuevasEpicas.forEach((id) => excluir.add(id));
                    const nuevasLeg = ef.legendarias
                        ? (0, Reliquias_1.obtenerReliquiasRecompensa)(state.jugadores, ef.legendarias, jugador.personajeId, "COFRE", "LEGENDARIA", excluir)
                        : [];
                    // Se otorgan recursivamente para disparar sus propios efectos AL_RECOGER
                    for (const id of [...nuevasComunes, ...nuevasEpicas, ...nuevasLeg]) {
                        this.otorgarReliquia(state, jugador, id, true);
                    }
                    break;
                }
                case "INICIAR_ENCANTAR_CARTA": {
                    const hayElegible = Array.from(jugador.mazoMaestro).some((id) => (0, Cartas_1.puedeEncantarseCarta)(id));
                    if (hayElegible) {
                        this.encolarAccionPendiente(jugador, "ENCANTAR_CARTA", ef.encantamiento, ef.cantidad);
                    }
                    break;
                }
                case "INICIAR_ELIMINAR_CARTAS": {
                    if (jugador.mazoMaestro.length > 1) {
                        const maxPosible = Math.min(ef.cantidadMaxima, jugador.mazoMaestro.length - 1);
                        this.encolarAccionPendiente(jugador, "ELIMINAR_CARTAS", "", maxPosible);
                    }
                    break;
                }
            }
        }
    }
    // ================= ACCIONES PENDIENTES (PASAPORTE / TACHO DE BASURA) =================
    static encolarAccionPendiente(jugador, tipo, param, restantes) {
        if (!jugador.accionReliquiaPendienteTipo) {
            jugador.accionReliquiaPendienteTipo = tipo;
            jugador.accionReliquiaPendienteParam = param;
            jugador.accionReliquiaPendienteRestantes = restantes;
        }
        else {
            jugador.colaAccionesReliquiaPendientes.push({ tipo, param, restantes });
        }
    }
    static resolverAccionPendiente(jugador, payload) {
        const tipo = jugador.accionReliquiaPendienteTipo;
        if (!tipo)
            return;
        if (payload.terminar) {
            if (tipo === "ELIMINAR_CARTAS") {
                this.avanzarSiguienteAccionPendiente(jugador);
            }
            return;
        }
        const idx = payload.indiceMazo;
        if (typeof idx !== "number" || idx < 0 || idx >= jugador.mazoMaestro.length)
            return;
        if (tipo === "ENCANTAR_CARTA") {
            const rawId = jugador.mazoMaestro[idx];
            if (!(0, Cartas_1.puedeEncantarseCarta)(rawId))
                return;
            const enc = (jugador.accionReliquiaPendienteParam || "GRATIS");
            jugador.mazoMaestro[idx] = (0, Cartas_1.aplicarEncantamientoCarta)(rawId, enc);
            jugador.accionReliquiaPendienteRestantes -= 1;
            if (jugador.accionReliquiaPendienteRestantes <= 0 ||
                !Array.from(jugador.mazoMaestro).some((id) => (0, Cartas_1.puedeEncantarseCarta)(id))) {
                this.avanzarSiguienteAccionPendiente(jugador);
            }
        }
        else if (tipo === "ELIMINAR_CARTAS") {
            if (jugador.mazoMaestro.length <= 1) {
                this.avanzarSiguienteAccionPendiente(jugador);
                return;
            }
            const nuevoMazo = Array.from(jugador.mazoMaestro);
            nuevoMazo.splice(idx, 1);
            CombatEngine_1.CombatEngine.sincronizarArraySchema(jugador.mazoMaestro, nuevoMazo);
            jugador.accionReliquiaPendienteRestantes -= 1;
            if (jugador.accionReliquiaPendienteRestantes <= 0 || jugador.mazoMaestro.length <= 1) {
                this.avanzarSiguienteAccionPendiente(jugador);
            }
        }
    }
    static avanzarSiguienteAccionPendiente(jugador) {
        const sig = jugador.colaAccionesReliquiaPendientes.shift();
        if (sig) {
            jugador.accionReliquiaPendienteTipo = sig.tipo;
            jugador.accionReliquiaPendienteParam = sig.param;
            jugador.accionReliquiaPendienteRestantes = sig.restantes;
        }
        else {
            jugador.accionReliquiaPendienteTipo = "";
            jugador.accionReliquiaPendienteParam = "";
            jugador.accionReliquiaPendienteRestantes = 0;
        }
    }
    // ================= CONSULTAS PASIVAS Y DE EVENTOS DE MAPA =================
    static obtenerCartasExtraRecompensa(jugador) {
        let extra = 0;
        jugador.reliquias.forEach((relId) => {
            const mod = Reliquias_1.CATALOGO_RELIQUIAS[relId]?.modificadorPasivo;
            if (mod?.tipo === "OPCION_CARTA_RECOMPENSA_EXTRA") {
                extra += mod.valor;
            }
        });
        return extra;
    }
    /**
     * Si algún jugador tiene cargas de Hacker (> 0), devuelve true y consume 1 carga
     * de TODOS los jugadores que tengan la reliquia con cargas activas.
     */
    static consumirCargasCofreLegendario(state) {
        let activado = false;
        state.jugadores.forEach((j) => {
            j.reliquias.forEach((relId) => {
                const mod = Reliquias_1.CATALOGO_RELIQUIAS[relId]?.modificadorPasivo;
                if (mod?.tipo === "COFRE_LEGENDARIO_CARGAS") {
                    const cargas = j.contadoresReliquias.get(relId) || 0;
                    if (cargas > 0) {
                        activado = true;
                        j.contadoresReliquias.set(relId, cargas - 1);
                    }
                }
            });
        });
        return activado;
    }
    static dispararAlIngresarFogata(state) {
        state.jugadores.forEach((j) => {
            if (j.hp <= 0)
                return;
            j.reliquias.forEach((relId) => {
                const mod = Reliquias_1.CATALOGO_RELIQUIAS[relId]?.modificadorPasivo;
                if (mod?.tipo === "CURAR_AL_ENTRAR_FOGATA_POR_MAZO" && mod.cadaCuantasCartas > 0) {
                    const tramos = Math.floor(j.mazoMaestro.length / mod.cadaCuantasCartas);
                    const curacion = tramos * mod.hpPorTramo;
                    if (curacion > 0) {
                        j.hp = Math.min(j.hpMax, j.hp + curacion);
                    }
                }
            });
        });
    }
    // ================= CONTADORES DE COMBATE =================
    static reiniciarContadoresCombate(jugador) {
        jugador.reliquias.forEach((relId) => {
            const cfg = Reliquias_1.CATALOGO_RELIQUIAS[relId]?.contadorConfig;
            if (!cfg)
                return;
            if (cfg.modo === "ACUMULAR_CARTAS" && cfg.reiniciarCadaTurno) {
                jugador.contadoresReliquias.set(relId, 0);
            }
            else if (cfg.modo === "TURNO_CICLO" || cfg.modo === "TURNO_OBJETIVO") {
                jugador.contadoresReliquias.set(relId, 0);
            }
        });
    }
    static actualizarContadoresInicioTurno(jugador, turnoNumero) {
        jugador.reliquias.forEach((relId) => {
            const cfg = Reliquias_1.CATALOGO_RELIQUIAS[relId]?.contadorConfig;
            if (!cfg)
                return;
            if (cfg.modo === "ACUMULAR_CARTAS" && cfg.reiniciarCadaTurno) {
                jugador.contadoresReliquias.set(relId, 0);
            }
            else if (cfg.modo === "TURNO_CICLO") {
                const ciclo = ((turnoNumero - 1) % cfg.meta) + 1;
                jugador.contadoresReliquias.set(relId, ciclo);
            }
            else if (cfg.modo === "TURNO_OBJETIVO") {
                jugador.contadoresReliquias.set(relId, turnoNumero <= cfg.meta ? turnoNumero : 0);
            }
        });
    }
    // ================= CONDICIONES Y DISPARO EN COMBATE =================
    static evaluarCondicion(condicion, state, portador, params) {
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
            case "ORO_MENOR_A":
                return portador.oro < condicion.maximoExclusivo;
            case "HP_PORCENTAJE_MENOR_A":
                return portador.hpMax > 0 && (portador.hp / portador.hpMax) * 100 < condicion.porcentaje;
            case "ES_COMBATE_JEFE":
                return state.esCombateJefe;
            case "CARTA_TIPO_ES":
                return params.cartaJugada?.tipo === condicion.tipoCarta;
            case "TIENE_ESTADO": {
                const min = condicion.minimo ?? 1;
                if (condicion.objetivo === "ENEMIGO" && params.objetivoId) {
                    const enemigoDirecto = state.enemigos.find((e) => e.uid === params.objetivoId);
                    return Boolean(enemigoDirecto &&
                        (enemigoDirecto.estados.get(condicion.estadoId) || 0) >= min);
                }
                const objetivos = CombatEngine_1.CombatEngine.resolverObjetivos(state, portador, condicion.objetivo, params.objetivoId, params.atacante);
                return objetivos.some((obj) => (obj.estados.get(condicion.estadoId) || 0) >= min);
            }
            default:
                return true;
        }
    }
    static dispararParaJugador(trigger, state, portador, params = {}, colaActiva) {
        if (!portador.reliquias || portador.reliquias.length === 0)
            return;
        if (portador.hp <= 0 && trigger !== "AL_FINALIZAR_COMBATE")
            return;
        const cola = colaActiva || CombatEngine_1.CombatEngine.obtenerColaActiva();
        const objetivoPorDefecto = params.objetivoId ||
            (params.atacante instanceof SpireState_1.EnemyState ? params.atacante.uid : undefined);
        portador.reliquias.forEach((reliquiaId) => {
            const data = Reliquias_1.CATALOGO_RELIQUIAS[reliquiaId];
            if (!data || data.trigger !== trigger)
                return;
            // Gestión genérica de reliquias con contador de cartas
            if (trigger === "AL_JUGAR_CARTA" && data.contadorConfig?.modo === "ACUMULAR_CARTAS") {
                const filtro = data.contadorConfig.filtroTipoCarta;
                if (filtro && params.cartaJugada?.tipo !== filtro)
                    return;
                const nuevoConteo = (portador.contadoresReliquias.get(reliquiaId) || 0) + 1;
                if (nuevoConteo >= data.contadorConfig.meta) {
                    portador.contadoresReliquias.set(reliquiaId, 0);
                }
                else {
                    portador.contadoresReliquias.set(reliquiaId, nuevoConteo);
                    return;
                }
            }
            if (data.condicion && !this.evaluarCondicion(data.condicion, state, portador, params)) {
                return;
            }
            cola.emitirVisual({
                tipo: "RELIQUIA_ACTIVADA",
                jugadorId: portador.sessionId,
                reliquiaId: data.id
            });
            CombatEngine_1.CombatEngine.encolarEfectos(state, cola, portador, data.efectos, objetivoPorDefecto, params.atacante, "RELIQUIA");
        });
        if (!colaActiva) {
            CombatEngine_1.CombatEngine.procesarColaPendiente(state);
        }
    }
    static dispararParaTodos(trigger, state, params = {}, colaActiva) {
        const cola = colaActiva || CombatEngine_1.CombatEngine.obtenerColaActiva();
        state.jugadores.forEach((jugador) => {
            this.dispararParaJugador(trigger, state, jugador, params, cola);
        });
        if (!colaActiva) {
            CombatEngine_1.CombatEngine.procesarColaPendiente(state);
        }
    }
    static mezclarArray(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }
}
exports.RelicEngine = RelicEngine;
