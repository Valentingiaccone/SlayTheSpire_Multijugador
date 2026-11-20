import { _decorator, Component, EventTarget } from "cc";
import {
    MENSAJES,
    PersonajeId,
    IEstadoSalaCliente,
    EventoVisualCombate,
    TipoAccionFogata
} from "../../compartido/GameTypes";

const { ccclass, property } = _decorator;

export const NetworkEvents = new EventTarget();
export const EVENTO_ESTADO_ACTUALIZADO = "estado_actualizado";
export const EVENTO_SECUENCIA_COMBATE = "secuencia_combate";

@ccclass("NetworkManager")
export class NetworkManager extends Component {
    public static instance: NetworkManager | null = null;

    @property
    public usarServidorLocal: boolean = true;

    private client: any = null;
    public room: any = null;

    onLoad() {
        if (NetworkManager.instance) {
            this.node.destroy();
            return;
        }
        NetworkManager.instance = this;
    }

    public async conectarYSala(nombreJugador: string) {
        try {
            const Colyseus = (window as any).Colyseus;
            const urlServidor = this.usarServidorLocal
                ? "ws://localhost:2567"
                : "https://slaythespire-multijugador.onrender.com";

            this.client = new Colyseus.Client(urlServidor);
            this.room = await this.client.joinOrCreate("spire_room", {
                nombre: nombreJugador
            });
            console.log("Conectado a la sala:", this.room.roomId, "Mi ID:", this.room.sessionId);

            this.room.onStateChange((state: IEstadoSalaCliente) => {
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

    public elegirRecompensa(
        cartaId: string | null,
        tomarReliquia: boolean = false,
        tomarOro: boolean = false
    ) {
        this.room?.send(MENSAJES.ELEGIR_RECOMPENSA, { cartaId, tomarReliquia, tomarOro });
    }

    public abrirCofre() {
        this.room?.send(MENSAJES.ABRIR_COFRE);
    }

    public votarReliquiaCofre(reliquiaId: string) {
        this.room?.send(MENSAJES.VOTAR_RELIQUIA_COFRE, { reliquiaId });
    }

    public enviarAccionFogata(accion: TipoAccionFogata) {
        this.room?.send(MENSAJES.ACCION_FOGATA, accion);
    }

    public comprarCartaTienda(indiceTienda: number) {
        this.room?.send(MENSAJES.COMPRAR_CARTA_TIENDA, { indiceTienda });
    }

    public comprarReliquiaTienda(indiceReliquia: number) {
        this.room?.send(MENSAJES.COMPRAR_RELIQUIA_TIENDA, { indiceReliquia });
    }

    public eliminarCartaTienda(indiceMazo: number) {
        this.room?.send(MENSAJES.ELIMINAR_CARTA_TIENDA, { indiceMazo });
    }

    public salirTienda() {
        this.room?.send(MENSAJES.SALIR_TIENDA);
    }

    public enviarAccionEvento(indiceOpcion: number, indiceCartaEliminar?: number) {
        this.room?.send(MENSAJES.ACCION_EVENTO, { indiceOpcion, indiceCartaEliminar });
    }

    public votarOpcionEvento(indiceOpcion: number) {
        this.room?.send(MENSAJES.VOTAR_OPCION_EVENTO, { indiceOpcion });
    }

    public resolverAccionReliquia(indiceMazo?: number, terminar: boolean = false) {
        this.room?.send(MENSAJES.RESOLVER_ACCION_RELIQUIA, { indiceMazo, terminar });
    }

    public reiniciarPartida() {
        this.room?.send(MENSAJES.REINICIAR_PARTIDA);
    }

    public votarNodoMapa(nodoId: string) {
        this.room?.send(MENSAJES.VOTAR_NODO, { nodoId });
    }
}