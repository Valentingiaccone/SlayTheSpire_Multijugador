import { _decorator, Component, Node, Label, input, Input, EventKeyboard, KeyCode } from "cc";
import {
    NetworkManager,
    NetworkEvents,
    EVENTO_ESTADO_ACTUALIZADO,
    EVENTO_SECUENCIA_COMBATE
} from "../network/NetworkManager";
import { FaseSala, IEstadoSalaCliente, EventoVisualCombate } from "../../compartido/GameTypes";
import { DeckViewerController } from "./DeckViewerController";

const { ccclass, property } = _decorator;

@ccclass("UIManager")
export class UIManager extends Component {
    @property(Node) panelLobby: Node = null!;
    @property(Node) panelMapa: Node = null!;
    @property(Node) panelCombate: Node = null!;
    @property(Node) panelRecompensa: Node = null!;
    @property(Node) panelCofre: Node = null!;
    @property(Node) panelFogata: Node = null!;
    @property(Node) panelTienda: Node = null!;
    @property(Node) panelEvento: Node = null!;
    @property(Node) panelFinPartida: Node = null!;
    @property(Label) labelFinPartida: Label = null!;

    @property(Node) barraSuperiorReliquias: Node = null!;
    @property(Node) btnToggleMapa: Node = null!;
    @property(Node) btnToggleMazo: Node = null!;
    @property(DeckViewerController) visorMazo: DeckViewerController = null!;

    private mapaAbiertoEnConsulta: boolean = false;
    private ultimaFaseAplicada: FaseSala | "" = "";
    private timestampFinSecuenciaEstimado: number = 0;
    private timerTransicionFase: ReturnType<typeof setTimeout> | null = null;

    onLoad() {
        NetworkEvents.on(EVENTO_ESTADO_ACTUALIZADO, this.onEstadoActualizado, this);
        NetworkEvents.on(EVENTO_SECUENCIA_COMBATE, this.onSecuenciaRecibida, this);
        input.on(Input.EventType.KEY_DOWN, this.onTeclaDebugPresionada, this);
    }

    async start() {
        const nombreRandom = "Jugador_" + Math.floor(Math.random() * 100);
        await NetworkManager.instance?.conectarYSala(nombreRandom);
    }

    onDestroy() {
        NetworkEvents.off(EVENTO_ESTADO_ACTUALIZADO, this.onEstadoActualizado, this);
        NetworkEvents.off(EVENTO_SECUENCIA_COMBATE, this.onSecuenciaRecibida, this);
        input.off(Input.EventType.KEY_DOWN, this.onTeclaDebugPresionada, this);
        if (this.timerTransicionFase) {
            clearTimeout(this.timerTransicionFase);
        }
    }

    private onTeclaDebugPresionada(event: EventKeyboard) {
        const room = NetworkManager.instance?.room;
        if (!room) return;

        switch (event.keyCode) {
            case KeyCode.DIGIT_1:
                room.send("debug_comando", { accion: "IR_FOGATA" });
                break;
            case KeyCode.DIGIT_2:
                room.send("debug_comando", { accion: "IR_TIENDA" });
                break;
            case KeyCode.DIGIT_3:
                room.send("debug_comando", { accion: "IR_COFRE" });
                break;
            case KeyCode.DIGIT_4:
                room.send("debug_comando", { accion: "GANAR_COMBATE" });
                break;
            case KeyCode.DIGIT_5:
                room.send("debug_comando", { accion: "BUFF_TEST" });
                break;
            case KeyCode.DIGIT_6:
                room.send("debug_comando", { accion: "IR_EVENTO" });
                break;
        }
    }

    private onSecuenciaRecibida(eventos: EventoVisualCombate[]) {
        if (!eventos || eventos.length === 0) return;
        const duracionMs = Math.min(2500, eventos.length * 220 + 250);
        this.timestampFinSecuenciaEstimado = Math.max(
            this.timestampFinSecuenciaEstimado,
            Date.now() + duracionMs
        );
    }

    private onEstadoActualizado(state: IEstadoSalaCliente) {
        this.sincronizarAccionReliquiaPendiente(state);

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

    private sincronizarAccionReliquiaPendiente(state: IEstadoSalaCliente) {
        if (!this.visorMazo) return;
        const miId = NetworkManager.instance?.room?.sessionId;
        const miJugador = miId ? state.jugadores.get(miId) : undefined;
        if (!miJugador) return;

        const pendiente = miJugador.accionReliquiaPendienteTipo;

        if (pendiente === "ENCANTAR_CARTA") {
            if (!this.visorMazo.node.active || !this.visorMazo.esModoAccionReliquia()) {
                this.visorMazo.abrirModoEncantarReliquia();
            }
        } else if (pendiente === "ELIMINAR_CARTAS") {
            if (!this.visorMazo.node.active || !this.visorMazo.esModoAccionReliquia()) {
                this.visorMazo.abrirModoEliminarMultipleReliquia();
            }
        } else if (this.visorMazo.node.active && this.visorMazo.esModoAccionReliquia()) {
            this.visorMazo.cerrarVisor();
        }
    }

    private aplicarCambioDeFase(fase: FaseSala) {
        if (this.timerTransicionFase) {
            clearTimeout(this.timerTransicionFase);
            this.timerTransicionFase = null;
        }

        this.mapaAbiertoEnConsulta = false;
        if (this.visorMazo && !this.visorMazo.esModoAccionReliquia()) {
            this.visorMazo.cerrarVisor();
        }
        this.ultimaFaseAplicada = fase;

        if (this.panelLobby) this.panelLobby.active = fase === "LOBBY";
        if (this.panelCombate) this.panelCombate.active = fase === "COMBAT";
        if (this.panelRecompensa) this.panelRecompensa.active = fase === "REWARD";
        if (this.panelCofre) this.panelCofre.active = fase === "CHEST";
        if (this.panelFogata) this.panelFogata.active = fase === "CAMPFIRE";
        if (this.panelTienda) this.panelTienda.active = fase === "SHOP";
        if (this.panelEvento) this.panelEvento.active = fase === "EVENT";

        if (this.panelMapa) {
            this.panelMapa.active = fase === "MAP" || this.mapaAbiertoEnConsulta;
        }

        const enPartidaActiva =
            fase === "MAP" ||
            fase === "COMBAT" ||
            fase === "REWARD" ||
            fase === "CHEST" ||
            fase === "CAMPFIRE" ||
            fase === "SHOP" ||
            fase === "EVENT";

        if (this.barraSuperiorReliquias) {
            this.barraSuperiorReliquias.active = fase !== "LOBBY";
        }
        if (this.btnToggleMapa) {
            this.btnToggleMapa.active = enPartidaActiva && fase !== "MAP";
        }
        if (this.btnToggleMazo) {
            this.btnToggleMazo.active = enPartidaActiva;
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

    public onClickToggleMazoConsulta() {
        if (!this.visorMazo || this.visorMazo.esModoAccionReliquia()) return;
        if (this.visorMazo.node.active) {
            this.visorMazo.cerrarVisor();
        } else {
            this.visorMazo.abrirModoConsulta();
        }
    }

    public onClickVolverAlLobby() {
        NetworkManager.instance?.reiniciarPartida();
    }
}