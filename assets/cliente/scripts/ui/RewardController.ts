import { _decorator, Component, Node, Label, Button, Sprite, Color, instantiate } from "cc";
import { NetworkManager, NetworkEvents, EVENTO_ESTADO_ACTUALIZADO } from "../network/NetworkManager";
import { CATALOGO_CARTAS } from "../../compartido/Cartas";
import { CATALOGO_RELIQUIAS } from "../../compartido/Reliquias";
import { SpriteManager } from "../utils/SpriteManager";
import { CardView } from "./CardView";

const { ccclass, property } = _decorator;

@ccclass("RewardController")
export class RewardController extends Component {
    @property(Label) labelTitulo: Label = null!;
    @property(Node) contenedorOpciones: Node = null!;
    @property(Node) templateCartaRecompensa: Node = null!;

    // Nodo opcional para mostrar la reliquia cuando se vence a un Élite
    @property(Node) contenedorReliquiaElite: Node = null!;
    @property(Sprite) spriteReliquiaElite: Sprite = null!;
    @property(Label) labelReliquiaElite: Label = null!;

    @property(Button) btnContinuar: Button = null!;
    @property(Label) labelBtnContinuar: Label = null!;

    private nodosOpciones: Node[] = [];
    private cartaSeleccionadaId: string | null = null;
    private reliquiaSeleccionada: boolean = false;
    private ultimoPisoInicializado: number = -1;

    onLoad() {
        if (this.templateCartaRecompensa) this.templateCartaRecompensa.active = false;
        if (this.contenedorReliquiaElite) {
            this.contenedorReliquiaElite.on(Button.EventType.CLICK, this.onToggleReliquiaElite, this);
        }
    }

    onEnable() {
        this.cartaSeleccionadaId = null;
        this.reliquiaSeleccionada = false;
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

        // Si entramos a un nuevo piso de recompensa y hay reliquia de élite, podemos dejarla pre-seleccionada o desmarcar todo
        if (this.ultimoPisoInicializado !== state.pisoActual) {
            this.ultimoPisoInicializado = state.pisoActual;
            this.cartaSeleccionadaId = null;
            this.reliquiaSeleccionada = false;
        }

        if (miJugador.recompensaElegida) {
            if (this.labelTitulo) this.labelTitulo.string = "Recompensas confirmadas. Esperando a tus aliados...";
            this.nodosOpciones.forEach((n) => (n.active = false));
            if (this.contenedorReliquiaElite) this.contenedorReliquiaElite.active = false;
            if (this.btnContinuar) this.btnContinuar.node.active = false;
            return;
        }

        if (this.labelTitulo) {
            this.labelTitulo.string = "🎁 Seleccioná tus recompensas y dale a Continuar";
        }
        if (this.btnContinuar) this.btnContinuar.node.active = true;

        this.renderizarCartas(Array.from(miJugador.opcionesRecompensa || []));
        this.renderizarReliquiaElite(miJugador.reliquiaRecompensa);
        this.actualizarTextoBotonContinuar();
    }

    private renderizarCartas(opciones: string[]) {
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
            const estaSeleccionada = this.cartaSeleccionadaId === cartaId;
            const cardView = nodo.getComponent(CardView);
            cardView?.configurar(i, data, true, () => {}, () => undefined);

            // Destacar visualmente la carta seleccionada (escala mayor y leve elevación)
            nodo.setScale(estaSeleccionada ? 1.12 : 0.95, estaSeleccionada ? 1.12 : 0.95, 1);

            nodo.off(Button.EventType.CLICK);
            nodo.on(Button.EventType.CLICK, () => {
                // Toggle: si toca la misma se deselecciona; si toca otra, reemplaza la anterior
                this.cartaSeleccionadaId = this.cartaSeleccionadaId === cartaId ? null : cartaId;
                this.renderizarCartas(opciones);
                this.actualizarTextoBotonContinuar();
            });
        });
    }

    private renderizarReliquiaElite(reliquiaId: string) {
        if (!this.contenedorReliquiaElite) return;

        const dataReliquia = reliquiaId ? CATALOGO_RELIQUIAS[reliquiaId] : null;
        if (!dataReliquia) {
            this.contenedorReliquiaElite.active = false;
            return;
        }

        this.contenedorReliquiaElite.active = true;
        if (this.spriteReliquiaElite) {
            SpriteManager.aplicarSprite(this.spriteReliquiaElite, "reliquias", dataReliquia.icono);
            this.spriteReliquiaElite.color = this.reliquiaSeleccionada
                ? new Color(130, 255, 150)
                : new Color(255, 255, 255);
        }

        if (this.labelReliquiaElite) {
            const tag = this.reliquiaSeleccionada ? "✅ [SELECCIONADA]" : "[Clic para seleccionar]";
            this.labelReliquiaElite.string = `${dataReliquia.nombre} ${tag}\n${dataReliquia.descripcion}`;
        }
    }

    private onToggleReliquiaElite() {
        this.reliquiaSeleccionada = !this.reliquiaSeleccionada;
        const state = NetworkManager.instance?.room?.state;
        if (state) this.onEstadoCambiado(state);
    }

    private actualizarTextoBotonContinuar() {
        if (!this.labelBtnContinuar) return;
        const cantidad = (this.cartaSeleccionadaId ? 1 : 0) + (this.reliquiaSeleccionada ? 1 : 0);
        this.labelBtnContinuar.string =
            cantidad > 0 ? `Continuar (${cantidad} seleccionada/s)` : "Continuar (Saltar todo)";
    }

    // Asignar al Click Events de BtnContinuar
    public onClickContinuar() {
        NetworkManager.instance?.elegirRecompensa(this.cartaSeleccionadaId, this.reliquiaSeleccionada);
    }
}