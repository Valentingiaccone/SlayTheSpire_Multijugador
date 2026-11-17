import { Room, Client } from "colyseus";
import { SpireState, PlayerState } from "./schema/SpireState";
import {
    MENSAJES,
    PersonajeId,
    PERSONAJES_INFO,
    EventoVisualCombate
} from "../../../assets/cliente/compartido/GameTypes";
import { obtenerMazoInicial } from "../../../assets/cliente/compartido/Cartas";
import { TipoNodoMapa } from "../../../assets/cliente/compartido/Mapa";
import { MapService } from "./services/MapService";
import { ChestService } from "./services/ChestService";
import { RewardService } from "./services/RewardService";
import { CombatCoordinator } from "./services/CombatCoordinator";

export class SpireRoom extends Room<SpireState> {
    maxClients = 4;

    private mapService!: MapService;
    private chestService!: ChestService;
    private rewardService!: RewardService;
    private combatCoordinator!: CombatCoordinator;

    onCreate(): void {
        this.setState(new SpireState());

        this.mapService = new MapService(this.state, this.clock, (tipoNodo) =>
            this.alViajarANodo(tipoNodo)
        );

        this.chestService = new ChestService(this.state, this.clock, () => {
            this.mapService.desbloquearSiguientesNodos();
            this.mapService.abrirFaseMapa();
        });

        this.rewardService = new RewardService(this.state, () => {
            this.mapService.desbloquearSiguientesNodos();
            this.mapService.abrirFaseMapa();
        });

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
            (client, data: { cartaId: string | null; tomarReliquia?: boolean }) => {
                this.rewardService.elegirRecompensa(
                    client.sessionId,
                    data?.cartaId ?? null,
                    Boolean(data?.tomarReliquia)
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
            case "COMBATE":
            default:
                this.combatCoordinator.iniciarCombate("COMBATE");
                break;
        }
    }
}