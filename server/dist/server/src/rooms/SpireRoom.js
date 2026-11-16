"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpireRoom = void 0;
const colyseus_1 = require("colyseus");
const SpireState_1 = require("./schema/SpireState");
const GameTypes_1 = require("../../../assets/cliente/compartido/GameTypes");
const Enemigos_1 = require("../../../assets/cliente/compartido/Enemigos");
const Cartas_1 = require("../../../assets/cliente/compartido/Cartas");
const Mapa_1 = require("../../../assets/cliente/compartido/Mapa");
const CombatEngine_1 = require("../engine/CombatEngine");
class SpireRoom extends colyseus_1.Room {
    constructor() {
        super(...arguments);
        this.maxClients = 4;
        this.timerMapa = null;
    }
    onCreate() {
        this.setState(new SpireState_1.SpireState());
        this.registrarMensajes();
    }
    onJoin(client, options) {
        if (this.state.faseActual !== "LOBBY")
            throw new Error("La partida ya está en curso.");
        const jugador = new SpireState_1.PlayerState();
        jugador.sessionId = client.sessionId;
        jugador.nombre = options?.nombre || `Jugador ${this.clients.length}`;
        const primerPj = Object.keys(GameTypes_1.PERSONAJES_INFO)[0];
        jugador.aplicarDatosPersonaje(primerPj);
        this.state.jugadores.set(client.sessionId, jugador);
    }
    onLeave(client) {
        this.state.jugadores.delete(client.sessionId);
        if (this.state.jugadores.size === 0) {
            this.cancelarCuentaRegresivaMapa();
            return;
        }
        if (this.state.faseActual === "LOBBY") {
            this.verificarInicioPartida();
        }
        else if (this.state.faseActual === "MAP") {
            this.evaluarVotosMapa();
        }
        else if (this.state.faseActual === "COMBAT") {
            this.verificarFinTurnoJugadores();
        }
        else if (this.state.faseActual === "REWARD") {
            this.verificarFinRecompensas();
        }
    }
    registrarMensajes() {
        this.onMessage(GameTypes_1.MENSAJES.ELEGIR_PERSONAJE, (client, data) => {
            if (this.state.faseActual !== "LOBBY")
                return;
            const jugador = this.state.jugadores.get(client.sessionId);
            if (!jugador || !GameTypes_1.PERSONAJES_INFO[data?.personajeId])
                return;
            jugador.aplicarDatosPersonaje(data.personajeId);
            jugador.listo = false;
        });
        this.onMessage(GameTypes_1.MENSAJES.TOGGLE_LISTO, (client) => {
            if (this.state.faseActual !== "LOBBY")
                return;
            const jugador = this.state.jugadores.get(client.sessionId);
            if (!jugador)
                return;
            jugador.listo = !jugador.listo;
            this.verificarInicioPartida();
        });
        this.onMessage(GameTypes_1.MENSAJES.VOTAR_NODO, (client, data) => {
            if (this.state.faseActual !== "MAP")
                return;
            const jugador = this.state.jugadores.get(client.sessionId);
            if (!jugador)
                return;
            const nodo = this.state.nodosMapa.find((n) => n.id === data?.nodoId);
            if (!nodo || nodo.estado !== "DISPONIBLE")
                return;
            jugador.nodoVotadoId = nodo.id;
            this.evaluarVotosMapa();
        });
        this.onMessage(GameTypes_1.MENSAJES.TERMINAR_TURNO, (client) => {
            if (this.state.faseActual !== "COMBAT")
                return;
            const jugador = this.state.jugadores.get(client.sessionId);
            if (!jugador || jugador.hp <= 0 || jugador.turnoTerminado)
                return;
            jugador.turnoTerminado = true;
            CombatEngine_1.CombatEngine.descartarMano(jugador);
            this.verificarFinTurnoJugadores();
        });
        this.onMessage(GameTypes_1.MENSAJES.JUGAR_CARTA, (client, data) => {
            const jugador = this.state.jugadores.get(client.sessionId);
            if (!jugador)
                return;
            const jugadaExitosa = CombatEngine_1.CombatEngine.jugarCarta(this.state, jugador, data.indiceMano, data.objetivoId);
            if (jugadaExitosa && this.state.faseActual === "REWARD") {
                this.prepararRecompensas();
            }
        });
        this.onMessage(GameTypes_1.MENSAJES.ELEGIR_RECOMPENSA, (client, data) => {
            if (this.state.faseActual !== "REWARD")
                return;
            const jugador = this.state.jugadores.get(client.sessionId);
            if (!jugador || jugador.recompensaElegida)
                return;
            if (data?.cartaId && jugador.opcionesRecompensa.includes(data.cartaId)) {
                jugador.mazoMaestro.push(data.cartaId);
            }
            jugador.recompensaElegida = true;
            jugador.opcionesRecompensa.clear();
            this.verificarFinRecompensas();
        });
        this.onMessage(GameTypes_1.MENSAJES.REINICIAR_PARTIDA, () => {
            if (this.state.faseActual !== "VICTORY" && this.state.faseActual !== "DEFEAT")
                return;
            this.cancelarCuentaRegresivaMapa();
            this.state.pisoActual = 1;
            this.state.turnoNumero = 1;
            this.state.nodoActualId = "";
            this.state.nodosMapa.clear();
            this.state.enemigos.clear();
            this.state.jugadores.forEach((j) => {
                j.listo = false;
                j.nodoVotadoId = "";
                j.aplicarDatosPersonaje(j.personajeId);
            });
            this.state.faseActual = "LOBBY";
        });
    }
    verificarInicioPartida() {
        if (this.state.jugadores.size === 0)
            return;
        let todosListos = true;
        this.state.jugadores.forEach((j) => { if (!j.listo)
            todosListos = false; });
        if (todosListos) {
            this.state.jugadores.forEach((j) => {
                j.mazoMaestro.clear();
                (0, Cartas_1.obtenerMazoInicial)(j.personajeId).forEach((id) => j.mazoMaestro.push(id));
                j.nodoVotadoId = "";
            });
            this.inicializarMapaNuevaRun();
        }
    }
    inicializarMapaNuevaRun() {
        this.state.nodosMapa.clear();
        this.state.nodoActualId = "";
        this.state.pisoActual = 1;
        const datosMapa = (0, Mapa_1.generarMapaRun)();
        for (const d of datosMapa) {
            const nodoSchema = new SpireState_1.MapNodeState();
            nodoSchema.id = d.id;
            nodoSchema.piso = d.piso;
            nodoSchema.columna = d.columna;
            nodoSchema.tipo = d.tipo;
            nodoSchema.estado = d.estado;
            d.siguientesIds.forEach((sigId) => nodoSchema.siguientesIds.push(sigId));
            this.state.nodosMapa.push(nodoSchema);
        }
        this.abrirFaseMapa();
    }
    abrirFaseMapa() {
        this.cancelarCuentaRegresivaMapa();
        this.state.jugadores.forEach((j) => { j.nodoVotadoId = ""; });
        this.state.faseActual = "MAP";
    }
    evaluarVotosMapa() {
        const totalJugadores = this.state.jugadores.size;
        if (totalJugadores === 0)
            return;
        let votosEmitidos = 0;
        const conteo = new Map();
        this.state.jugadores.forEach((j) => {
            if (j.nodoVotadoId) {
                votosEmitidos++;
                conteo.set(j.nodoVotadoId, (conteo.get(j.nodoVotadoId) || 0) + 1);
            }
        });
        // Todavía faltan jugadores por votar
        if (votosEmitidos < totalJugadores) {
            this.cancelarCuentaRegresivaMapa();
            return;
        }
        // Todos votaron: buscamos el máximo
        let maxVotos = 0;
        let candidatosGanadores = [];
        conteo.forEach((cantidad, nodoId) => {
            if (cantidad > maxVotos) {
                maxVotos = cantidad;
                candidatosGanadores = [nodoId];
            }
            else if (cantidad === maxVotos) {
                candidatosGanadores.push(nodoId);
            }
        });
        // Caso Empate: se cancela el reloj hasta que alguien cambie su voto
        if (candidatosGanadores.length !== 1) {
            this.cancelarCuentaRegresivaMapa();
            this.state.hayEmpateMapa = true;
            return;
        }
        // Hay un único ganador por mayoría
        const ganadorId = candidatosGanadores[0];
        this.state.hayEmpateMapa = false;
        // Si el reloj ya estaba corriendo para este mismo nodo ganador, sigue sin reiniciarse
        if (this.timerMapa && this.state.nodoGanadorMapaId === ganadorId) {
            return;
        }
        // Si no había reloj o cambió el nodo ganador, (re)iniciamos a 3 segundos
        this.iniciarCuentaRegresivaMapa(ganadorId);
    }
    iniciarCuentaRegresivaMapa(ganadorId) {
        this.cancelarCuentaRegresivaMapa();
        this.state.nodoGanadorMapaId = ganadorId;
        this.state.tiempoCuentaRegresivaMapa = Mapa_1.CONFIG_MAPA.SEGUNDOS_CUENTA_REGRESIVA;
        this.timerMapa = this.clock.setInterval(() => {
            this.state.tiempoCuentaRegresivaMapa -= 1;
            if (this.state.tiempoCuentaRegresivaMapa <= 0) {
                const destinoId = this.state.nodoGanadorMapaId;
                this.cancelarCuentaRegresivaMapa();
                this.viajarANodo(destinoId);
            }
        }, 1000);
    }
    cancelarCuentaRegresivaMapa() {
        if (this.timerMapa) {
            this.timerMapa.clear();
            this.timerMapa = null;
        }
        this.state.tiempoCuentaRegresivaMapa = 0;
        this.state.nodoGanadorMapaId = "";
        this.state.hayEmpateMapa = false;
    }
    viajarANodo(nodoId) {
        const nodoElegido = this.state.nodosMapa.find((n) => n.id === nodoId);
        if (!nodoElegido)
            return;
        // Marcar el nodo anterior como COMPLETADO y bloquear los caminos descartados de este piso
        this.state.nodosMapa.forEach((n) => {
            if (n.estado === "ACTUAL") {
                n.estado = "COMPLETADO";
            }
            else if (n.estado === "DISPONIBLE" && n.id !== nodoElegido.id) {
                n.estado = "BLOQUEADO";
            }
        });
        nodoElegido.estado = "ACTUAL";
        this.state.nodoActualId = nodoElegido.id;
        this.state.pisoActual = nodoElegido.piso;
        this.state.jugadores.forEach((j) => { j.nodoVotadoId = ""; });
        // Ejecutar el evento según el tipo de nodo (escalable para futuros eventos)
        switch (nodoElegido.tipo) {
            case "JEFE":
                this.iniciarCombate(true);
                break;
            case "COMBATE":
            default:
                this.iniciarCombate(false);
                break;
        }
    }
    iniciarCombate(esJefe = false) {
        this.state.faseActual = "COMBAT";
        this.state.turnoNumero = 1;
        this.state.enemigos.clear();
        const cantidadJugadores = Math.max(1, this.state.jugadores.size);
        const idsEnemigos = (0, Enemigos_1.obtenerEncuentroAleatorio)(esJefe, this.state.pisoActual);
        idsEnemigos.forEach((enemigoId, index) => {
            const info = Enemigos_1.ENEMIGOS_INFO[enemigoId];
            if (!info)
                return;
            const enemigo = new SpireState_1.EnemyState();
            enemigo.uid = `enemigo_${index}_${Date.now()}`;
            enemigo.enemigoId = info.id;
            enemigo.nombre = info.nombre;
            enemigo.hpMax = info.hpBase * cantidadJugadores;
            enemigo.hp = enemigo.hpMax;
            enemigo.indicePatron = 0;
            enemigo.intencionTipo = info.patron[0].tipo;
            enemigo.intencionValor = info.patron[0].valor;
            this.state.enemigos.push(enemigo);
        });
        this.state.jugadores.forEach((j) => {
            if (j.hp > 0)
                CombatEngine_1.CombatEngine.prepararMazoCombate(j);
        });
        this.iniciarNuevoTurnoJugadores();
    }
    verificarFinTurnoJugadores() {
        let todosTerminaron = true;
        this.state.jugadores.forEach((j) => {
            if (j.hp > 0 && !j.turnoTerminado)
                todosTerminaron = false;
        });
        if (todosTerminaron) {
            CombatEngine_1.CombatEngine.ejecutarTurnoEnemigos(this.state);
            let hayAlgunVivo = false;
            this.state.jugadores.forEach((j) => {
                if (j.hp > 0) {
                    hayAlgunVivo = true;
                    CombatEngine_1.CombatEngine.reducirEstadosPorTurno(j);
                }
            });
            if (!hayAlgunVivo) {
                this.state.faseActual = "DEFEAT";
                return;
            }
            this.state.turnoNumero += 1;
            this.iniciarNuevoTurnoJugadores();
        }
    }
    iniciarNuevoTurnoJugadores() {
        this.state.jugadores.forEach((j) => {
            if (j.hp <= 0)
                return;
            j.bloqueo = 0;
            j.energia = j.energiaMax;
            j.turnoTerminado = false;
            CombatEngine_1.CombatEngine.robarCartas(j, 5);
        });
    }
    prepararRecompensas() {
        this.state.jugadores.forEach((jugador) => {
            if (jugador.hp <= 0) {
                jugador.hp = Math.max(1, Math.floor(jugador.hpMax * 0.3));
            }
            jugador.recompensaElegida = false;
            jugador.opcionesRecompensa.clear();
            const opciones = (0, Cartas_1.generarOpcionesRecompensa)(jugador.personajeId, 3);
            opciones.forEach((id) => jugador.opcionesRecompensa.push(id));
        });
    }
    verificarFinRecompensas() {
        let todosEligieron = true;
        this.state.jugadores.forEach((j) => {
            if (!j.recompensaElegida)
                todosEligieron = false;
        });
        if (todosEligieron) {
            this.desbloquearSiguientesNodosMapa();
            this.abrirFaseMapa();
        }
    }
    desbloquearSiguientesNodosMapa() {
        const nodoActual = this.state.nodosMapa.find((n) => n.id === this.state.nodoActualId);
        if (!nodoActual)
            return;
        nodoActual.estado = "COMPLETADO";
        const siguientes = new Set(Array.from(nodoActual.siguientesIds));
        this.state.nodosMapa.forEach((n) => {
            if (siguientes.has(n.id)) {
                n.estado = "DISPONIBLE";
            }
        });
    }
}
exports.SpireRoom = SpireRoom;
