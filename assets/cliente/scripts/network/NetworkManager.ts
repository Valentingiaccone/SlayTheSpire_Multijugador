import { _decorator, Component, EventTarget } from "cc";
import type { Client, Room } from "colyseus.js";
import {
    MENSAJES,
    PersonajeId,
    IEstadoSalaCliente,
    EventoVisualCombate
} from "../../compartido/GameTypes";

const { ccclass } = _decorator;

export const NetworkEvents = new EventTarget();
export const EVENTO_ESTADO_ACTUALIZADO = "estado_actualizado";
export const EVENTO_SECUENCIA_COMBATE = "secuencia_combate";

@ccclass("NetworkManager")
export class NetworkManager extends Component {
    public static instance: NetworkManager | null = null;

    private client: Client | null = null;
    public room: Room<IEstadoSalaCliente> | null = null;

    onLoad() {
        if (NetworkManager.instance) {
            this.node.destroy();
            return;
        }
        NetworkManager.instance = this;
    }

    public async conectarYSala(nombreJugador: string) {
        try {
            const ColyseusLib = (window as unknown as { Colyseus: { Client: new (url: string) => Client } }).Colyseus;
            // this.client = new ColyseusLib.Client("ws://localhost:2567");
            this.client = new ColyseusLib.Client("https://slaythespire-multijugador.onrender.com");
            this.room = await this.client.joinOrCreate<IEstadoSalaCliente>("spire_room", {
                nombre: nombreJugador
            });
            console.log("Conectado a la sala:", this.room.roomId, "Mi ID:", this.room.sessionId);

            this.room.onStateChange((state) => {
                NetworkEvents.emit(EVENTO_ESTADO_ACTUALIZADO, state);
            });

            this.room.onMessage(MENSAJES.SECUENCIA_COMBATE, (eventos: EventoVisualCombate[]) => {
                NetworkEvents.emit(EVENTO_SECUENCIA_COMBATE, eventos);
            });
        } catch (e) {
            console.error("Error al conectar con Colyseus:", e);
        }
    }

    public elegirPersonaje(personajeId: PersonajeId) {
        this.room?.send(MENSAJES.ELEGIR_PERSONAJE, { personajeId });
    }

    public toggleListo() {
        this.room?.send(MENSAJES.TOGGLE_LISTO);
    }

    public terminarTurno() {
        this.room?.send(MENSAJES.TERMINAR_TURNO);
    }

    public jugarCarta(indiceMano: number, objetivoId?: string) {
        this.room?.send(MENSAJES.JUGAR_CARTA, { indiceMano, objetivoId });
    }

    public elegirRecompensa(cartaId: string | null, tomarReliquia: boolean = false) {
        this.room?.send(MENSAJES.ELEGIR_RECOMPENSA, { cartaId, tomarReliquia });
    }

    public abrirCofre() {
        this.room?.send(MENSAJES.ABRIR_COFRE);
    }

    public votarReliquiaCofre(reliquiaId: string) {
        this.room?.send(MENSAJES.VOTAR_RELIQUIA_COFRE, { reliquiaId });
    }

    public reiniciarPartida() {
        this.room?.send(MENSAJES.REINICIAR_PARTIDA);
    }

    public votarNodoMapa(nodoId: string) {
        this.room?.send(MENSAJES.VOTAR_NODO, { nodoId });
    }
}