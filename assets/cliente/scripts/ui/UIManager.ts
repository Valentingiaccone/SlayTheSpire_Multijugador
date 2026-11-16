import { _decorator, Component, Node, Label } from "cc";
import { NetworkManager, NetworkEvents, EVENTO_ESTADO_ACTUALIZADO } from "../network/NetworkManager";
import { FaseSala } from "../../compartido/GameTypes";

const { ccclass, property } = _decorator;

@ccclass("UIManager")
export class UIManager extends Component {
    @property(Node) panelLobby: Node = null!;
    @property(Node) panelCombate: Node = null!;
    @property(Node) panelRecompensa: Node = null!;
    @property(Node) panelFinPartida: Node = null!;
    @property(Label) labelFinPartida: Label = null!;

    onLoad() {
        NetworkEvents.on(EVENTO_ESTADO_ACTUALIZADO, this.onEstadoActualizado, this);
    }

    async start() {
        const nombreRandom = "Jugador_" + Math.floor(Math.random() * 100);
        await NetworkManager.instance?.conectarYSala(nombreRandom);
    }

    onDestroy() {
        NetworkEvents.off(EVENTO_ESTADO_ACTUALIZADO, this.onEstadoActualizado, this);
    }

    private onEstadoActualizado(state: any) {
        const fase: FaseSala = state.faseActual;
        if (this.panelLobby) this.panelLobby.active = (fase === "LOBBY");
        if (this.panelCombate) this.panelCombate.active = (fase === "COMBAT");
        if (this.panelRecompensa) this.panelRecompensa.active = (fase === "REWARD");

        const esFin = fase === "VICTORY" || fase === "DEFEAT";
        if (this.panelFinPartida) this.panelFinPartida.active = esFin;
        if (esFin && this.labelFinPartida) {
            this.labelFinPartida.string = fase === "VICTORY"
                ? "¡VICTORIA! Completaron los 3 pisos"
                : "DERROTA — Todos los jugadores cayeron";
        }
    }

    // Asignar al Click Events del botón BtnVolverAlLobby dentro de PanelFinPartida
    public onClickVolverAlLobby() {
        NetworkManager.instance?.reiniciarPartida();
    }
}