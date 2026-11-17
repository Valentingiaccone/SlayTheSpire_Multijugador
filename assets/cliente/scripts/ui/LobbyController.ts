import { _decorator, Component, Node, Label, Color, instantiate, Prefab } from "cc";
import { NetworkManager, NetworkEvents, EVENTO_ESTADO_ACTUALIZADO } from "../network/NetworkManager";
import {
    IPersonajeInfo,
    PERSONAJES_INFO,
    PersonajeId,
    IEstadoSalaCliente,
    IJugadorCliente
} from "../../compartido/GameTypes";
import { ElegirPersonaje } from "../prefabs/ElegirPersonaje";

const { ccclass, property } = _decorator;

@ccclass("LobbyController")
export class LobbyController extends Component {
    @property([Label]) slotsJugadores: Label[] = [];
    @property(Node) contenedorPersonajes: Node = null!;
    @property(Prefab) templateBotonPersonaje: Prefab = null!;
    @property(Label) labelInfoPersonaje: Label = null!;
    @property(Label) labelBotonListo: Label = null!;

    private ultimaFirmaLobby: string = "";

    onLoad() {
        this.generarBotonesPersonajes();
    }

    onEnable() {
        this.ultimaFirmaLobby = "";
        NetworkEvents.on(EVENTO_ESTADO_ACTUALIZADO, this.onEstadoCambiado, this);
        if (NetworkManager.instance?.room?.state) {
            this.onEstadoCambiado(NetworkManager.instance.room.state);
        }
    }

    onDisable() {
        NetworkEvents.off(EVENTO_ESTADO_ACTUALIZADO, this.onEstadoCambiado, this);
    }

    private generarBotonesPersonajes() {
        if (!this.contenedorPersonajes || !this.templateBotonPersonaje) return;

        Object.values(PERSONAJES_INFO).forEach((info: IPersonajeInfo) => {
            const btnNode = instantiate(this.templateBotonPersonaje);
            this.contenedorPersonajes.addChild(btnNode);

            const script = btnNode.getComponent(ElegirPersonaje);
            if (script) {
                script.setId(info.id);
                script.setSprite(info.icono);
            }
        });
    }

    private onEstadoCambiado(state: IEstadoSalaCliente) {
        if (state.faseActual !== "LOBBY") return;

        const firmaActual = this.calcularFirmaLobby(state);
        if (firmaActual === this.ultimaFirmaLobby) return;
        this.ultimaFirmaLobby = firmaActual;

        const miId = NetworkManager.instance?.room?.sessionId;
        let index = 0;

        state.jugadores.forEach((jugador: IJugadorCliente, sessionId: string) => {
            if (index < this.slotsJugadores.length) {
                const esYo = sessionId === miId;
                const tagYo = esYo ? " (Vos)" : "";
                const estadoTxt = jugador.listo ? "[LISTO]" : "[Esperando...]";
                const infoPj = PERSONAJES_INFO[jugador.personajeId as PersonajeId];
                const nombrePj = infoPj ? infoPj.nombre : jugador.personajeId;

                this.slotsJugadores[index].string = `${jugador.nombre}${tagYo}  |  ${nombrePj}  ${estadoTxt}`;
                this.slotsJugadores[index].color = jugador.listo
                    ? new Color(100, 255, 120)
                    : new Color(255, 255, 255);
                index++;
            }
        });

        for (let i = index; i < this.slotsJugadores.length; i++) {
            this.slotsJugadores[i].string = "Slot disponible...";
            this.slotsJugadores[i].color = new Color(140, 140, 140);
        }

        const miJugador = miId ? state.jugadores.get(miId) : undefined;
        if (miJugador) {
            const infoPj = PERSONAJES_INFO[miJugador.personajeId as PersonajeId];
            if (this.labelInfoPersonaje && infoPj) {
                this.labelInfoPersonaje.string = `${infoPj.nombre} — HP: ${infoPj.hpMax} | Energía: ${infoPj.energiaMax}\n${infoPj.descripcion}`;
            }
            if (this.labelBotonListo) {
                this.labelBotonListo.string = miJugador.listo ? "CANCELAR" : "¡ESTOY LISTO!";
            }
        }
    }

    private calcularFirmaLobby(state: IEstadoSalaCliente): string {
        const partes: string[] = [];
        state.jugadores.forEach((j: IJugadorCliente, id: string) => {
            partes.push(`${id}:${j.nombre}:${j.personajeId}:${j.listo}`);
        });
        return partes.join("|");
    }

    public onClickListo() {
        NetworkManager.instance?.toggleListo();
    }
}