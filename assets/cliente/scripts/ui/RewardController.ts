import { _decorator, Component, Node, Label, Button, instantiate } from "cc";
import { NetworkManager, NetworkEvents, EVENTO_ESTADO_ACTUALIZADO } from "../network/NetworkManager";
import { CATALOGO_CARTAS } from "../../compartido/Cartas";
import { CardView } from "./CardView";

const { ccclass, property } = _decorator;

@ccclass("RewardController")
export class RewardController extends Component {
    @property(Label) labelTitulo: Label = null!;
    @property(Node) contenedorOpciones: Node = null!;
    @property(Node) templateCartaRecompensa: Node = null!;
    @property(Button) btnSaltar: Button = null!;

    private nodosOpciones: Node[] = [];

    onLoad() {
        if (this.templateCartaRecompensa) this.templateCartaRecompensa.active = false;
    }

    onEnable() {
        NetworkEvents.on(EVENTO_ESTADO_ACTUALIZADO, this.onEstadoCambiado, this);
        if (NetworkManager.instance?.room?.state) {
            this.onEstadoCambiado(NetworkManager.instance.room.state);
        }
    }

    onDisable() {
        NetworkEvents.off(EVENTO_ESTADO_ACTUALIZADO, this.onEstadoCambiado, this);
    }

    private onEstadoCambiado(state: any) {
        if (state.faseActual !== "REWARD") return;

        const miId = NetworkManager.instance?.room?.sessionId;
        const miJugador = miId ? state.jugadores.get(miId) : null;
        if (!miJugador) return;

        if (miJugador.recompensaElegida) {
            if (this.labelTitulo) this.labelTitulo.string = "Carta agregada al mazo. Esperando a tus aliados...";
            this.nodosOpciones.forEach((n) => (n.active = false));
            if (this.btnSaltar) this.btnSaltar.node.active = false;
            return;
        }

        if (this.labelTitulo) this.labelTitulo.string = `¡Combate superado! Elegí 1 carta para tu mazo`;
        if (this.btnSaltar) this.btnSaltar.node.active = true;

        const opciones: string[] = Array.from(miJugador.opcionesRecompensa || []);
        while (this.nodosOpciones.length < opciones.length) {
            const nodo = instantiate(this.templateCartaRecompensa);
            nodo.parent = this.contenedorOpciones;
            this.nodosOpciones.push(nodo);
        }

        this.nodosOpciones.forEach((nodo, i) => {
            if (i >= opciones.length) {
                nodo.active = false;
                return;
            }

            const cartaId = opciones[i];
            const data = CATALOGO_CARTAS[cartaId];
            if (!data) {
                nodo.active = false;
                return;
            }

            nodo.active = true;
            const cardView = nodo.getComponent(CardView);
            cardView?.configurar(i, data, true, () => {}, () => undefined);

            // Quitamos listeners viejos y asignamos el clic de selección
            nodo.off(Button.EventType.CLICK);
            nodo.on(Button.EventType.CLICK, () => {
                NetworkManager.instance?.elegirRecompensa(cartaId);
            });
        });
    }

    // Asignar al Click Events del botón BtnSaltar
    public onClickSaltar() {
        NetworkManager.instance?.elegirRecompensa(null);
    }
}