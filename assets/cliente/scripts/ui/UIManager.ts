import { _decorator, Component, Node, Label } from "cc";
import {
    NetworkManager,
    NetworkEvents,
    EVENTO_ESTADO_ACTUALIZADO,
    EVENTO_SECUENCIA_COMBATE
} from "../network/NetworkManager";
import { FaseSala, IEstadoSalaCliente, EventoVisualCombate } from "../../compartido/GameTypes";

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
    @property(Node) btnToggleMapa: Node = null!;

    private mapaAbiertoEnConsulta: boolean = false;
    private ultimaFaseAplicada: FaseSala | "" = "";
    private timestampFinSecuenciaEstimado: number = 0;
    private timerTransicionFase: ReturnType<typeof setTimeout> | null = null;

    onLoad() {
        NetworkEvents.on(EVENTO_ESTADO_ACTUALIZADO, this.onEstadoActualizado, this);
        NetworkEvents.on(EVENTO_SECUENCIA_COMBATE, this.onSecuenciaRecibida, this);
    }

    async start() {
        const nombreRandom = "Jugador_" + Math.floor(Math.random() * 100);
        await NetworkManager.instance?.conectarYSala(nombreRandom);
    }

    onDestroy() {
        NetworkEvents.off(EVENTO_ESTADO_ACTUALIZADO, this.onEstadoActualizado, this);
        NetworkEvents.off(EVENTO_SECUENCIA_COMBATE, this.onSecuenciaRecibida, this);
        if (this.timerTransicionFase) {
            clearTimeout(this.timerTransicionFase);
        }
    }

    private onSecuenciaRecibida(eventos: EventoVisualCombate[]) {
        if (!eventos || eventos.length === 0) return;
        // Estimamos ~220ms por evento visual para no cortar el golpe final antes de mostrar Recompensas
        const duracionMs = Math.min(2500, eventos.length * 220 + 250);
        this.timestampFinSecuenciaEstimado = Math.max(
            this.timestampFinSecuenciaEstimado,
            Date.now() + duracionMs
        );
    }

    private onEstadoActualizado(state: IEstadoSalaCliente) {
        const fase: FaseSala = state.faseActual;
        if (fase === this.ultimaFaseAplicada) return;

        const saliendoDeCombate =
            this.ultimaFaseAplicada === "COMBAT" &&
            (fase === "REWARD" || fase === "VICTORY" || fase === "DEFEAT");

        const esperaRestante = this.timestampFinSecuenciaEstimado - Date.now();

        if (saliendoDeCombate && esperaRestante > 50) {
            if (this.timerTransicionFase) clearTimeout(this.timerTransicionFase);
            this.timerTransicionFase = setTimeout(() => {
                this.timerTransicionFase = null;
                this.aplicarCambioDeFase(fase);
            }, esperaRestante);
            return;
        }

        this.aplicarCambioDeFase(fase);
    }

    private aplicarCambioDeFase(fase: FaseSala) {
        if (this.timerTransicionFase) {
            clearTimeout(this.timerTransicionFase);
            this.timerTransicionFase = null;
        }

        this.mapaAbiertoEnConsulta = false;
        this.ultimaFaseAplicada = fase;

        if (this.panelLobby) this.panelLobby.active = fase === "LOBBY";
        if (this.panelCombate) this.panelCombate.active = fase === "COMBAT";
        if (this.panelRecompensa) this.panelRecompensa.active = fase === "REWARD";
        if (this.panelMapa) {
            this.panelMapa.active = fase === "MAP" || this.mapaAbiertoEnConsulta;
        }
        if (this.panelCofre) this.panelCofre.active = fase === "CHEST";
        if (this.barraSuperiorReliquias) {
            this.barraSuperiorReliquias.active = fase !== "LOBBY";
        }
        if (this.btnToggleMapa) {
            this.btnToggleMapa.active =
                fase === "COMBAT" || fase === "REWARD" || fase === "CHEST";
        }

        const esFin = fase === "VICTORY" || fase === "DEFEAT";
        if (this.panelFinPartida) this.panelFinPartida.active = esFin;
        if (esFin && this.labelFinPartida) {
            this.labelFinPartida.string =
                fase === "VICTORY"
                    ? "¡VICTORIA! Derrotaron al Jefe Final"
                    : "DERROTA — Todos los jugadores cayeron";
        }
    }

    public onClickToggleMapaConsulta() {
        const fase = NetworkManager.instance?.room?.state?.faseActual;
        if (fase === "MAP") return;

        this.mapaAbiertoEnConsulta = !this.mapaAbiertoEnConsulta;
        if (this.panelMapa) {
            this.panelMapa.active = this.mapaAbiertoEnConsulta;
        }
    }

    public onClickVolverAlLobby() {
        NetworkManager.instance?.reiniciarPartida();
    }
}