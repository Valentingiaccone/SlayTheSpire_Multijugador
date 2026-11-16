import { _decorator, Component, Node, Label, Button, Color, instantiate, Prefab } from "cc";
import { NetworkManager, NetworkEvents, EVENTO_ESTADO_ACTUALIZADO } from "../network/NetworkManager";
import { IPersonajeInfo, PERSONAJES_INFO, PersonajeId } from "../../compartido/GameTypes";
import { ElegirPersonaje } from "../prefabs/ElegirPersonaje";

const { ccclass, property } = _decorator;

@ccclass("LobbyController")
export class LobbyController extends Component {

    @property([Label]) slotsJugadores: Label[] = [];
    @property(Node) contenedorPersonajes: Node = null
    @property(Prefab) templateBotonPersonaje: Prefab = null
    @property(Label) labelInfoPersonaje: Label = null
    @property(Label) labelBotonListo: Label = null

    onLoad() {
        this.generarBotonesPersonajes();
    }

    onEnable() {
        NetworkEvents.on(EVENTO_ESTADO_ACTUALIZADO, this.onEstadoCambiado, this);
    }

    onDisable() {
        NetworkEvents.off(EVENTO_ESTADO_ACTUALIZADO, this.onEstadoCambiado, this);
    }

    private generarBotonesPersonajes() {
        if (!this.contenedorPersonajes || !this.templateBotonPersonaje) return;

        Object.values(PERSONAJES_INFO).forEach((info: IPersonajeInfo) => {
            const btnNode = instantiate(this.templateBotonPersonaje)
            this.contenedorPersonajes.addChild(btnNode)

            const script: ElegirPersonaje = btnNode.getComponent(ElegirPersonaje)
            if (script){
                script.setId(info.id)
                script.setSprite(info.icono)
            }
        });
    }

    private onEstadoCambiado(state: any) {
        if (state.faseActual !== "LOBBY") return;

        // 1. Actualizar la lista de hasta 4 jugadores conectados
        let index = 0;
        state.jugadores.forEach((jugador: any, sessionId: string) => {
            if (index < this.slotsJugadores.length) {
                const esYo = sessionId === NetworkManager.instance?.room?.sessionId;
                const tagYo = esYo ? " (Vos)" : "";
                const estadoTxt = jugador.listo ? "[LISTO]" : "[Esperando...]";
                const infoPj = PERSONAJES_INFO[jugador.personajeId as PersonajeId];
                const nombrePj = infoPj ? infoPj.nombre : jugador.personajeId;

                this.slotsJugadores[index].string = `${jugador.nombre}${tagYo}  |  ${nombrePj}  ${estadoTxt}`;
                this.slotsJugadores[index].color = jugador.listo ? new Color(100, 255, 120) : new Color(255, 255, 255);
                index++;
            }
        });

        for (let i = index; i < this.slotsJugadores.length; i++) {
            this.slotsJugadores[i].string = "Slot disponible...";
            this.slotsJugadores[i].color = new Color(140, 140, 140);
        }

        // 2. Actualizar la descripción de tu personaje elegido y el texto del botón Listo
        const miId = NetworkManager.instance?.room?.sessionId;
        const miJugador = miId ? state.jugadores.get(miId) : null;
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

    // Asignar este método al evento Click Events del botón BtnListo en el Inspector
    public onClickListo() {
        NetworkManager.instance?.toggleListo();
    }
}