"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpireRoom = void 0;
const colyseus_1 = require("colyseus");
const SpireState_1 = require("./schema/SpireState");
const GameTypes_1 = require("../../../assets/cliente/compartido/GameTypes");
const Cartas_1 = require("../../../assets/cliente/compartido/Cartas");
const Mapa_1 = require("../../../assets/cliente/compartido/Mapa");
const MapService_1 = require("./services/MapService");
const ChestService_1 = require("./services/ChestService");
const RewardService_1 = require("./services/RewardService");
const CampfireService_1 = require("./services/CampfireService");
const ShopService_1 = require("./services/ShopService");
const EventService_1 = require("./services/EventService");
const CombatCoordinator_1 = require("./services/CombatCoordinator");
const RelicEngine_1 = require("../engine/RelicEngine");
class SpireRoom extends colyseus_1.Room {
    constructor() {
        super(...arguments);
        this.maxClients = 4;
    }
    onCreate() {
        this.setState(new SpireState_1.SpireState());
        const avanzarAlMapa = () => {
            if (this.state.esCombateJefe) {
                this.state.esCombateJefe = false;
                if (this.state.mapaActual < Mapa_1.CONFIG_MAPA.TOTAL_MAPAS) {
                    this.mapService.avanzarAlSiguienteMapa();
                }
                else {
                    this.state.faseActual = "VICTORY";
                }
                return;
            }
            this.mapService.desbloquearSiguientesNodos();
            this.mapService.abrirFaseMapa();
        };
        this.mapService = new MapService_1.MapService(this.state, this.clock, (tipoNodo) => this.alViajarANodo(tipoNodo));
        this.chestService = new ChestService_1.ChestService(this.state, this.clock, avanzarAlMapa);
        this.rewardService = new RewardService_1.RewardService(this.state, avanzarAlMapa);
        this.campfireService = new CampfireService_1.CampfireService(this.state, avanzarAlMapa);
        this.shopService = new ShopService_1.ShopService(this.state, avanzarAlMapa);
        this.eventService = new EventService_1.EventService(this.state, this.clock, avanzarAlMapa);
        this.combatCoordinator = new CombatCoordinator_1.CombatCoordinator(this.state, () => this.rewardService.prepararRecompensas(), (eventos) => this.broadcast(GameTypes_1.MENSAJES.SECUENCIA_COMBATE, eventos));
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
            this.mapService.cancelarCuentaRegresiva();
            this.chestService.cancelarCuentaRegresiva();
            this.eventService.cancelarCuentaRegresiva();
            return;
        }
        switch (this.state.faseActual) {
            case "LOBBY":
                this.verificarInicioPartida();
                break;
            case "MAP":
                this.mapService.evaluarVotos();
                break;
            case "COMBAT":
                this.combatCoordinator.verificarFinTurnoJugadores();
                break;
            case "REWARD":
                this.rewardService.verificarFinRecompensas();
                break;
            case "CHEST":
                if (this.state.cofreAbierto)
                    this.chestService.evaluarVotos();
                break;
            case "CAMPFIRE":
                this.campfireService.verificarFinFogata();
                break;
            case "SHOP":
                this.shopService.verificarFinTienda();
                break;
            case "EVENT":
                this.eventService.verificarFinEvento();
                break;
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
            this.mapService.registrarVoto(client.sessionId, data?.nodoId);
        });
        this.onMessage(GameTypes_1.MENSAJES.TERMINAR_TURNO, (client) => {
            const jugador = this.state.jugadores.get(client.sessionId);
            if (jugador && jugador.motivoSeleccionMano !== "NINGUNO")
                return;
            this.combatCoordinator.terminarTurnoJugador(client.sessionId);
        });
        this.onMessage(GameTypes_1.MENSAJES.JUGAR_CARTA, (client, data) => {
            if (!data || typeof data.indiceMano !== "number")
                return;
            const jugador = this.state.jugadores.get(client.sessionId);
            if (jugador && jugador.motivoSeleccionMano !== "NINGUNO")
                return; // Bloquea si hay selección pendiente
            this.combatCoordinator.jugarCarta(client.sessionId, data.indiceMano, data.objetivoId);
        });
        // NUEVO MENSAJE DE SELECCIÓN DE CARTAS MANUAL
        this.onMessage(GameTypes_1.MENSAJES.RESPONDER_SELECCION_MANO, (client, data) => {
            if (!data || !Array.isArray(data.indices))
                return;
            this.combatCoordinator.resolverSeleccionMano(client.sessionId, data.indices);
        });
        this.onMessage(GameTypes_1.MENSAJES.ELEGIR_RECOMPENSA, (client, data) => {
            this.rewardService.elegirRecompensa(client.sessionId, data?.cartaId ?? null, Boolean(data?.tomarReliquia), Boolean(data?.tomarOro));
        });
        this.onMessage(GameTypes_1.MENSAJES.ABRIR_COFRE, (client) => {
            this.chestService.abrirCofre(client.sessionId);
        });
        this.onMessage(GameTypes_1.MENSAJES.VOTAR_RELIQUIA_COFRE, (client, data) => {
            if (!data?.reliquiaId)
                return;
            this.chestService.votarReliquia(client.sessionId, data.reliquiaId);
        });
        this.onMessage(GameTypes_1.MENSAJES.ACCION_FOGATA, (client, data) => {
            this.campfireService.procesarAccionFogata(client.sessionId, data);
        });
        this.onMessage(GameTypes_1.MENSAJES.COMPRAR_CARTA_TIENDA, (client, data) => {
            if (typeof data?.indiceTienda !== "number")
                return;
            this.shopService.comprarCarta(client.sessionId, data.indiceTienda);
        });
        this.onMessage(GameTypes_1.MENSAJES.COMPRAR_RELIQUIA_TIENDA, (client, data) => {
            if (typeof data?.indiceReliquia !== "number")
                return;
            this.shopService.comprarReliquia(client.sessionId, data.indiceReliquia);
        });
        this.onMessage(GameTypes_1.MENSAJES.ELIMINAR_CARTA_TIENDA, (client, data) => {
            if (typeof data?.indiceMazo !== "number")
                return;
            this.shopService.eliminarCartaMazo(client.sessionId, data.indiceMazo);
        });
        this.onMessage(GameTypes_1.MENSAJES.SALIR_TIENDA, (client) => {
            this.shopService.salirTienda(client.sessionId);
        });
        this.onMessage(GameTypes_1.MENSAJES.ACCION_EVENTO, (client, data) => {
            this.eventService.procesarAccionIndividual(client.sessionId, data);
        });
        this.onMessage(GameTypes_1.MENSAJES.VOTAR_OPCION_EVENTO, (client, data) => {
            if (typeof data?.indiceOpcion !== "number")
                return;
            this.eventService.registrarVotoComunitario(client.sessionId, data.indiceOpcion);
        });
        this.onMessage(GameTypes_1.MENSAJES.RESOLVER_ACCION_RELIQUIA, (client, data) => {
            const jugador = this.state.jugadores.get(client.sessionId);
            if (!jugador)
                return;
            RelicEngine_1.RelicEngine.resolverAccionPendiente(jugador, data || {});
        });
        // Atajos de teclado para testeo local rápido (Teclas 1 a 6)
        this.onMessage("debug_comando", (client, data) => {
            const jugador = this.state.jugadores.get(client.sessionId);
            if (!jugador || !data?.accion)
                return;
            switch (data.accion) {
                case "IR_FOGATA":
                    if (this.state.faseActual === "MAP")
                        this.campfireService.iniciarEventoFogata();
                    break;
                case "IR_TIENDA":
                    jugador.oro += 300;
                    if (this.state.faseActual === "MAP")
                        this.shopService.iniciarEventoTienda();
                    break;
                case "IR_COFRE":
                    if (this.state.faseActual === "MAP")
                        this.chestService.iniciarEventoCofre();
                    break;
                case "GANAR_COMBATE":
                    if (this.state.faseActual === "COMBAT") {
                        // Código original y seguro:
                        this.state.enemigos.forEach((e) => { e.hp = 0; });
                        if (this.state.esCombateJefe && this.state.mapaActual >= Mapa_1.CONFIG_MAPA.TOTAL_MAPAS) {
                            this.state.faseActual = "VICTORY";
                        }
                        else {
                            this.rewardService.prepararRecompensas();
                            this.state.faseActual = "REWARD";
                        }
                    }
                    break;
                case "BUFF_TEST":
                    jugador.energia += 5;
                    jugador.oro += 100;
                    jugador.estados.set("FUERZA", (jugador.estados.get("FUERZA") || 0) + 10);
                    break;
                case "IR_EVENTO":
                    if (this.state.faseActual === "MAP")
                        this.eventService.iniciarEventoAleatorio();
                    break;
            }
        });
        this.onMessage(GameTypes_1.MENSAJES.REINICIAR_PARTIDA, (client) => {
            if (!this.state.jugadores.has(client.sessionId))
                return;
            if (this.state.faseActual !== "VICTORY" && this.state.faseActual !== "DEFEAT")
                return;
            this.mapService.cancelarCuentaRegresiva();
            this.chestService.cancelarCuentaRegresiva();
            this.eventService.cancelarCuentaRegresiva();
            this.state.mapaActual = 1;
            this.state.pisoActual = 1;
            this.state.turnoNumero = 1;
            this.state.nodoActualId = "";
            this.state.esCombateElite = false;
            this.state.esCombateJefe = false;
            this.state.combateFinalizando = false;
            this.state.nodosMapa.clear();
            this.state.enemigos.clear();
            this.state.jugadores.forEach((j) => {
                j.listo = false;
                j.nodoVotadoId = "";
                j.reliquiaCofreVotadaId = "";
                j.fogataCompletada = false;
                j.tiendaCompletada = false;
                j.tiendaEliminacionUsada = false;
                j.eventoCompletado = false;
                j.eventoVotoOpcion = -1;
                j.tiendaCartas.clear();
                j.tiendaReliquias.clear();
                j.eventoOpcionCartas.clear();
                j.eventoOpcionReliquias.clear();
                j.eventoOpcionMaldiciones.clear();
                j.reliquias.clear();
                j.contadoresReliquias.clear();
                j.motivoSeleccionMano = "NINGUNO";
                j.cantSeleccionManoMin = 0;
                j.cantSeleccionManoMax = 0;
                j.accionReliquiaPendienteTipo = "";
                j.accionReliquiaPendienteParam = "";
                j.accionReliquiaPendienteRestantes = 0;
                j.colaAccionesReliquiaPendientes = [];
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
        if (!todosListos)
            return;
        this.state.jugadores.forEach((j) => {
            j.aplicarDatosPersonaje(j.personajeId);
            j.mazoMaestro.clear();
            (0, Cartas_1.obtenerMazoInicial)(j.personajeId).forEach((id) => j.mazoMaestro.push(id));
            j.reliquias.clear();
            j.contadoresReliquias.clear();
            j.motivoSeleccionMano = "NINGUNO";
            j.accionReliquiaPendienteTipo = "";
            j.accionReliquiaPendienteParam = "";
            j.accionReliquiaPendienteRestantes = 0;
            j.colaAccionesReliquiaPendientes = [];
            const info = GameTypes_1.PERSONAJES_INFO[j.personajeId];
            if (info?.reliquiaInicial)
                RelicEngine_1.RelicEngine.otorgarReliquia(this.state, j, info.reliquiaInicial, false);
            j.nodoVotadoId = "";
        });
        this.mapService.inicializarMapaNuevaRun();
    }
    alViajarANodo(tipoNodo) {
        switch (tipoNodo) {
            case "JEFE":
                this.combatCoordinator.iniciarCombate("JEFE");
                break;
            case "ELITE":
                this.combatCoordinator.iniciarCombate("ELITE");
                break;
            case "COFRE":
                this.chestService.iniciarEventoCofre();
                break;
            case "HOGUERA":
                this.campfireService.iniciarEventoFogata();
                break;
            case "TIENDA":
                this.shopService.iniciarEventoTienda();
                break;
            case "EVENTO":
                this.eventService.iniciarEventoAleatorio();
                break;
            case "COMBATE":
            default:
                this.combatCoordinator.iniciarCombate("COMBATE");
                break;
        }
    }
}
exports.SpireRoom = SpireRoom;
