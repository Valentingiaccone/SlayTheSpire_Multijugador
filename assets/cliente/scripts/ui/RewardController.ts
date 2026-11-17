import { _decorator, Component, Node, Label, Button, Sprite, Color, instantiate } from "cc";
import { NetworkManager, NetworkEvents, EVENTO_ESTADO_ACTUALIZADO } from "../network/NetworkManager";
import { IEstadoSalaCliente } from "../../compartido/GameTypes";
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

    @property(Node) contenedorReliquiaElite: Node = null!;
    @property(Sprite) spriteReliquiaElite: Sprite = null!;
    @property(Label) labelReliquiaElite: Label = null!;

    // Botón/Nodo seleccionable para agarrar o dejar el Oro de recompensa
    @property(Node) contenedorOroRecompensa: Node = null!;
    @property(Label) labelOroRecompensa: Label = null!;

    @property(Button) btnContinuar: Button = null!;
    @property(Label) labelBtnContinuar: Label = null!;

    private nodosOpciones: Node[] = [];
    private opcionesActuales: string[] = [];
    private cartaSeleccionadaId: string | null = null;
    private reliquiaSeleccionada: boolean = false;
    private oroSeleccionado: boolean = false;
    private ultimoPisoInicializado: number = -1;
    private ultimaFirmaPropia: string = "";

    onLoad() {
        if (this.templateCartaRecompensa) this.templateCartaRecompensa.active = false;
        if (this.contenedorReliquiaElite) {
            this.contenedorReliquiaElite.on(Button.EventType.CLICK, this.onToggleReliquiaElite, this);
        }
        if (this.contenedorOroRecompensa) {
            this.contenedorOroRecompensa.on(Button.EventType.CLICK, this.onToggleOroRecompensa, this);
        }
    }

    onEnable() {
        this.cartaSeleccionadaId = null;
        this.reliquiaSeleccionada = false;
        this.oroSeleccionado = false;
        this.ultimaFirmaPropia = "";
        NetworkEvents.on(EVENTO_ESTADO_ACTUALIZADO, this.onEstadoCambiado, this);
        if (NetworkManager.instance?.room?.state) {
            this.onEstadoCambiado(NetworkManager.instance.room.state);
        }
    }

    onDisable() {
        NetworkEvents.off(EVENTO_ESTADO_ACTUALIZADO, this.onEstadoCambiado, this);
    }

    private onEstadoCambiado(state: IEstadoSalaCliente) {
        if (state.faseActual !== "REWARD") return;

        const miId = NetworkManager.instance?.room?.sessionId;
        const miJugador = miId ? state.jugadores.get(miId) : undefined;
        if (!miJugador) return;

        if (this.ultimoPisoInicializado !== state.pisoActual) {
            this.ultimoPisoInicializado = state.pisoActual;
            this.cartaSeleccionadaId = null;
            this.reliquiaSeleccionada = false;
            this.oroSeleccionado = false;
            this.ultimaFirmaPropia = "";
        }

        const opciones = Array.from(miJugador.opcionesRecompensa || []);
        const firmaActual = `${miJugador.recompensaElegida}|${opciones.join(",")}|${miJugador.reliquiaRecompensa}|${miJugador.oroRecompensa}`;
        if (firmaActual === this.ultimaFirmaPropia) return;
        this.ultimaFirmaPropia = firmaActual;

        if (miJugador.recompensaElegida) {
            if (this.labelTitulo) {
                this.labelTitulo.string = "Recompensas confirmadas. Esperando a tus aliados...";
            }
            this.nodosOpciones.forEach((n) => (n.active = false));
            if (this.contenedorReliquiaElite) this.contenedorReliquiaElite.active = false;
            if (this.contenedorOroRecompensa) this.contenedorOroRecompensa.active = false;
            if (this.btnContinuar) this.btnContinuar.node.active = false;
            return;
        }

        if (this.labelTitulo) {
            this.labelTitulo.string = "🎁 Seleccioná tus recompensas y dale a Continuar";
        }
        if (this.btnContinuar) this.btnContinuar.node.active = true;

        this.opcionesActuales = opciones;
        this.renderizarCartas(this.opcionesActuales);
        this.renderizarReliquiaElite(miJugador.reliquiaRecompensa);
        this.renderizarOroRecompensa(miJugador.oroRecompensa);
        this.actualizarTextoBotonContinuar();
    }

    private renderizarCartas(opciones: string[]) {
        while (this.nodosOpciones.length < opciones.length) {
            const idx = this.nodosOpciones.length;
            const nodo = instantiate(this.templateCartaRecompensa);
            nodo.parent = this.contenedorOpciones;
            nodo.on(
                Button.EventType.CLICK,
                () => {
                    const cartaId = this.opcionesActuales[idx];
                    if (!cartaId) return;
                    this.cartaSeleccionadaId = this.cartaSeleccionadaId === cartaId ? null : cartaId;
                    this.renderizarCartas(this.opcionesActuales);
                    this.actualizarTextoBotonContinuar();
                },
                this
            );
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
            cardView?.configurarModoEstatico(data, estaSeleccionada ? 1.12 : 0.95);
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

    private renderizarOroRecompensa(oroDisponible: number) {
        if (!this.contenedorOroRecompensa) return;

        if (!oroDisponible || oroDisponible <= 0) {
            this.contenedorOroRecompensa.active = false;
            return;
        }

        this.contenedorOroRecompensa.active = true;
        if (this.labelOroRecompensa) {
            const tag = this.oroSeleccionado ? "✅ [SELECCIONADO]" : "[Clic para seleccionar]";
            this.labelOroRecompensa.string = `💰 +${oroDisponible} de Oro ${tag}`;
            this.labelOroRecompensa.color = this.oroSeleccionado
                ? new Color(130, 255, 150)
                : new Color(255, 230, 110);
        }
    }

    public onToggleReliquiaElite() {
        this.reliquiaSeleccionada = !this.reliquiaSeleccionada;
        const miId = NetworkManager.instance?.room?.sessionId;
        const miJugador = miId ? NetworkManager.instance?.room?.state.jugadores.get(miId) : undefined;
        if (miJugador) {
            this.renderizarReliquiaElite(miJugador.reliquiaRecompensa);
            this.actualizarTextoBotonContinuar();
        }
    }

    public onToggleOroRecompensa() {
        this.oroSeleccionado = !this.oroSeleccionado;
        const miId = NetworkManager.instance?.room?.sessionId;
        const miJugador = miId ? NetworkManager.instance?.room?.state.jugadores.get(miId) : undefined;
        if (miJugador) {
            this.renderizarOroRecompensa(miJugador.oroRecompensa);
            this.actualizarTextoBotonContinuar();
        }
    }

    private actualizarTextoBotonContinuar() {
        if (!this.labelBtnContinuar) return;
        const cantidad =
            (this.cartaSeleccionadaId ? 1 : 0) +
            (this.reliquiaSeleccionada ? 1 : 0) +
            (this.oroSeleccionado ? 1 : 0);
        this.labelBtnContinuar.string =
            cantidad > 0 ? `Continuar (${cantidad} seleccionada/s)` : "Continuar (Saltar todo)";
    }

    public onClickContinuar() {
        NetworkManager.instance?.elegirRecompensa(
            this.cartaSeleccionadaId,
            this.reliquiaSeleccionada,
            this.oroSeleccionado
        );
    }
}