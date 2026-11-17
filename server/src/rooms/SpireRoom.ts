import { Room, Client } from "colyseus";
import { SpireState, PlayerState } from "./schema/SpireState";
import {
    MENSAJES,
    PersonajeId,
    PERSONAJES_INFO,
    EventoVisualCombate,
    TipoAccionFogata
} from "../../../assets/cliente/compartido/GameTypes";
import { obtenerMazoInicial } from "../../../assets/cliente/compartido/Cartas";
import { TipoNodoMapa } from "../../../assets/cliente/compartido/Mapa";
import { MapService } from "./services/MapService";
import { ChestService } from "./services/ChestService";
import { RewardService } from "./services/RewardService";
import { CampfireService } from "./services/CampfireService";
import { ShopService } from "./services/ShopService";
import { CombatCoordinator } from "./services/CombatCoordinator";

export class SpireRoom extends Room<SpireState> {
    maxClients = 4;

    private mapService!: MapService;
    private chestService!: ChestService;
    private rewardService!: RewardService;
    private campfireService!: CampfireService;
    private shopService!: ShopService;
    private combatCoordinator!: CombatCoordinator;

    onCreate(): void {
        this.setState(new SpireState());

        const avanzarAlMapa = () => {
            this.mapService.desbloquearSiguientesNodos();
            this.mapService.abrirFaseMapa();
        };

        this.mapService = new MapService(this.state, this.clock, (tipoNodo) =>
            this.alViajarANodo(tipoNodo)
        );
        this.chestService = new ChestService(this.state, this.clock, avanzarAlMapa);
        this.rewardService = new RewardService(this.state, avanzarAlMapa);
        this.campfireService = new CampfireService(this.state, avanzarAlMapa);
        this.shopService = new ShopService(this.state, avanzarAlMapa);

        this.combatCoordinator = new CombatCoordinator(
            this.state,
            () => this.rewardService.prepararRecompensas(),
            (eventos: EventoVisualCombate[]) => this.broadcast(MENSAJES.SECUENCIA_COMBATE, eventos)
        );

        this.registrarMensajes();
    }

    onJoin(client: Client, options: { nombre?: string }): void {
        if (this.state.faseActual !== "LOBBY") {
            throw new Error("La partida ya está en curso.");
        }

        const jugador = new PlayerState();
        jugador.sessionId = client.sessionId;
        jugador.nombre = options?.nombre || `Jugador ${this.clients.length}`;
        const primerPj = Object.keys(PERSONAJES_INFO)[0] as PersonajeId;
        jugador.aplicarDatosPersonaje(primerPj);

        this.state.jugadores.set(client.sessionId, jugador);
    }

    onLeave(client: Client): void {
        this.state.jugadores.delete(client.sessionId);
        if (this.state.jugadores.size === 0) {
            this.mapService.cancelarCuentaRegresiva();
            this.chestService.cancelarCuentaRegresiva();
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
                if (this.state.cofreAbierto) this.chestService.evaluarVotos();
                break;
            case "CAMPFIRE":
                this.campfireService.verificarFinFogata();
                break;
            case "SHOP":
                this.shopService.verificarFinTienda();
                break;
        }
    }

    private registrarMensajes(): void {
        this.onMessage(MENSAJES.ELEGIR_PERSONAJE, (client, data: { personajeId: PersonajeId }) => {
            if (this.state.faseActual !== "LOBBY") return;
            const jugador = this.state.jugadores.get(client.sessionId);
            if (!jugador || !PERSONAJES_INFO[data?.personajeId]) return;

            jugador.aplicarDatosPersonaje(data.personajeId);
            jugador.listo = false;
        });

        this.onMessage(MENSAJES.TOGGLE_LISTO, (client) => {
            if (this.state.faseActual !== "LOBBY") return;
            const jugador = this.state.jugadores.get(client.sessionId);
            if (!jugador) return;

            jugador.listo = !jugador.listo;
            this.verificarInicioPartida();
        });

        this.onMessage(MENSAJES.VOTAR_NODO, (client, data: { nodoId: string }) => {
            this.mapService.registrarVoto(client.sessionId, data?.nodoId);
        });

        this.onMessage(MENSAJES.TERMINAR_TURNO, (client) => {
            this.combatCoordinator.terminarTurnoJugador(client.sessionId);
        });

        this.onMessage(MENSAJES.JUGAR_CARTA, (client, data: { indiceMano: number; objetivoId?: string }) => {
            if (!data || typeof data.indiceMano !== "number") return;
            this.combatCoordinator.jugarCarta(client.sessionId, data.indiceMano, data.objetivoId);
        });

        this.onMessage(
            MENSAJES.ELEGIR_RECOMPENSA,
            (
                client,
                data: { cartaId: string | null; tomarReliquia?: boolean; tomarOro?: boolean }
            ) => {
                this.rewardService.elegirRecompensa(
                    client.sessionId,
                    data?.cartaId ?? null,
                    Boolean(data?.tomarReliquia),
                    Boolean(data?.tomarOro)
                );
            }
        );

        this.onMessage(MENSAJES.ABRIR_COFRE, (client) => {
            this.chestService.abrirCofre(client.sessionId);
        });

        this.onMessage(MENSAJES.VOTAR_RELIQUIA_COFRE, (client, data: { reliquiaId: string }) => {
            if (!data?.reliquiaId) return;
            this.chestService.votarReliquia(client.sessionId, data.reliquiaId);
        });

        this.onMessage(MENSAJES.ACCION_FOGATA, (client, data: TipoAccionFogata) => {
            this.campfireService.procesarAccionFogata(client.sessionId, data);
        });

        this.onMessage(MENSAJES.COMPRAR_CARTA_TIENDA, (client, data: { indiceTienda: number }) => {
            if (typeof data?.indiceTienda !== "number") return;
            this.shopService.comprarCarta(client.sessionId, data.indiceTienda);
        });

        this.onMessage(MENSAJES.COMPRAR_RELIQUIA_TIENDA, (client, data: { indiceReliquia: number }) => {
            if (typeof data?.indiceReliquia !== "number") return;
            this.shopService.comprarReliquia(client.sessionId, data.indiceReliquia);
        });

        this.onMessage(MENSAJES.ELIMINAR_CARTA_TIENDA, (client, data: { indiceMazo: number }) => {
            if (typeof data?.indiceMazo !== "number") return;
            this.shopService.eliminarCartaMazo(client.sessionId, data.indiceMazo);
        });

        this.onMessage(MENSAJES.SALIR_TIENDA, (client) => {
            this.shopService.salirTienda(client.sessionId);
        });

        // ================= ATAJOS DE DESARROLLO LOCAL (SOLO PARA TESTEO) =================
        this.onMessage("debug_comando", (client, data: { accion: string }) => {
            const jugador = this.state.jugadores.get(client.sessionId);
            if (!jugador || !data?.accion) return;

            switch (data.accion) {
                case "IR_FOGATA":
                    this.campfireService.iniciarEventoFogata();
                    break;
                case "IR_TIENDA":
                    jugador.oro += 300;
                    this.shopService.iniciarEventoTienda();
                    break;
                case "IR_COFRE":
                    this.chestService.iniciarEventoCofre();
                    break;
                case "GANAR_COMBATE":
                    if (this.state.faseActual === "COMBAT") {
                        this.state.enemigos.forEach((e) => {
                            e.hp = 0;
                        });
                        this.rewardService.prepararRecompensas();
                        this.state.faseActual = "REWARD";
                    }
                    break;
                case "BUFF_TEST":
                    jugador.energia += 5;
                    jugador.oro += 100;
                    jugador.estados.set("FUERZA", (jugador.estados.get("FUERZA") || 0) + 10);
                    break;
            }
        });

        this.onMessage(MENSAJES.REINICIAR_PARTIDA, (client) => {
            if (!this.state.jugadores.has(client.sessionId)) return;
            if (this.state.faseActual !== "VICTORY" && this.state.faseActual !== "DEFEAT") return;

            this.mapService.cancelarCuentaRegresiva();
            this.chestService.cancelarCuentaRegresiva();
            this.state.pisoActual = 1;
            this.state.turnoNumero = 1;
            this.state.nodoActualId = "";
            this.state.nodosMapa.clear();
            this.state.enemigos.clear();

            this.state.jugadores.forEach((j) => {
                j.listo = false;
                j.nodoVotadoId = "";
                j.reliquiaCofreVotadaId = "";
                j.fogataCompletada = false;
                j.tiendaCompletada = false;
                j.tiendaEliminacionUsada = false;
                j.tiendaCartas.clear();
                j.tiendaReliquias.clear();
                j.reliquias.clear();
                j.aplicarDatosPersonaje(j.personajeId);
            });

            this.state.faseActual = "LOBBY";
        });
    }

    private verificarInicioPartida(): void {
        if (this.state.jugadores.size === 0) return;
        let todosListos = true;
        this.state.jugadores.forEach((j) => {
            if (!j.listo) todosListos = false;
        });

        if (!todosListos) return;

        this.state.jugadores.forEach((j) => {
            j.aplicarDatosPersonaje(j.personajeId);
            j.mazoMaestro.clear();
            obtenerMazoInicial(j.personajeId).forEach((id) => j.mazoMaestro.push(id));

            j.reliquias.clear();
            const info = PERSONAJES_INFO[j.personajeId];
            if (info?.reliquiaInicial) {
                j.reliquias.push(info.reliquiaInicial);
            }
            j.nodoVotadoId = "";
        });

        this.mapService.inicializarMapaNuevaRun();
    }

    private alViajarANodo(tipoNodo: TipoNodoMapa): void {
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
            case "COMBATE":
            default:
                this.combatCoordinator.iniciarCombate("COMBATE");
                break;
        }
    }
}