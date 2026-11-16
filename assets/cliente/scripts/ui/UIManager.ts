import { _decorator, Component, Node, Label } from "cc";
import { NetworkManager, NetworkEvents, EVENTO_ESTADO_ACTUALIZADO } from "../network/NetworkManager";
import { FaseSala } from "../../compartido/GameTypes";

const { ccclass, property } = _decorator;

@ccclass("UIManager")
export class UIManager extends Component {
    @property(Node) panelLobby: Node = null!;
    @property(Node) panelMapa: Node = null!;
    @property(Node) panelCombate: Node = null!;
    @property(Node) panelRecompensa: Node = null!;
    @property(Node) panelFinPartida: Node = null!;
    @property(Label) labelFinPartida: Label = null!;
    @property(Node) panelCofre: Node = null!;
    @property(Node) barraSuperiorReliquias: Node = null!;

    // Botón flotante arriba a la derecha para abrir/cerrar el mapa en cualquier momento
    @property(Node) btnToggleMapa: Node = null!;

    private mapaAbiertoEnConsulta: boolean = false;
    private ultimaFase: FaseSala | "" = "";

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

        // Si cambió la fase de la sala, cerramos el modo consulta manual
        if (fase !== this.ultimaFase) {
            this.mapaAbiertoEnConsulta = false;
            this.ultimaFase = fase;
        }

        if (this.panelLobby) this.panelLobby.active = (fase === "LOBBY");
        if (this.panelCombate) this.panelCombate.active = (fase === "COMBAT");
        if (this.panelRecompensa) this.panelRecompensa.active = (fase === "REWARD");

        // El mapa está visible siempre en fase MAP, o cuando el jugador lo abre en modo consulta
        if (this.panelMapa) {
            this.panelMapa.active = (fase === "MAP") || this.mapaAbiertoEnConsulta;
        }

        if (this.panelCofre) this.panelCofre.active = (fase === "CHEST");
        if (this.barraSuperiorReliquias) {
            this.barraSuperiorReliquias.active = (fase !== "LOBBY");
        }
        if (this.btnToggleMapa) {
            this.btnToggleMapa.active = (fase === "COMBAT" || fase === "REWARD" || fase === "CHEST");
        }

        const esFin = fase === "VICTORY" || fase === "DEFEAT";
        if (this.panelFinPartida) this.panelFinPartida.active = esFin;
        if (esFin && this.labelFinPartida) {
            this.labelFinPartida.string = fase === "VICTORY"
                ? "¡VICTORIA! Derrotaron al Jefe Final"
                : "DERROTA — Todos los jugadores cayeron";
        }
    }

    // Asignar al Click Events de BtnToggleMapa y también al BtnCerrarConsulta del PanelMapa
    public onClickToggleMapaConsulta() {
        const fase = NetworkManager.instance?.room?.state?.faseActual;
        if (fase === "MAP") return; // En fase MAP es obligatorio votar, no se cierra

        this.mapaAbiertoEnConsulta = !this.mapaAbiertoEnConsulta;
        if (this.panelMapa) {
            this.panelMapa.active = this.mapaAbiertoEnConsulta;
        }
    }

    public onClickVolverAlLobby() {
        NetworkManager.instance?.reiniciarPartida();
    }
}