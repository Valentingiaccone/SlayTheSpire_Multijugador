import { _decorator, Component, Node, Label, Button, Sprite, Color, instantiate } from "cc";
import { NetworkManager, NetworkEvents, EVENTO_ESTADO_ACTUALIZADO } from "../network/NetworkManager";
import { ECONOMIA_CONFIG, IEstadoSalaCliente, IJugadorCliente } from "../../compartido/GameTypes";
import { CATALOGO_CARTAS, obtenerPrecioCarta } from "../../compartido/Cartas";
import { CATALOGO_RELIQUIAS, obtenerPrecioReliquia } from "../../compartido/Reliquias";
import { SpriteManager } from "../utils/SpriteManager";
import { CardView } from "./CardView";
import { DeckViewerController } from "./DeckViewerController";

const { ccclass, property } = _decorator;

@ccclass("ShopController")
export class ShopController extends Component {
    @property(Label) labelTituloTienda: Label = null!;
    @property(Label) labelMiOro: Label = null!;

    // 1. Sección Cartas en venta
    @property(Node) contenedorCartasTienda: Node = null!;
    @property(Node) templateItemCartaTienda: Node = null!;

    // 2. Sección 3 Reliquias en venta
    @property(Node) contenedorReliquiasTienda: Node = null!;
    @property(Node) templateItemReliquiaTienda: Node = null!;

    // 3. Sección 3 Pociones (espacio provisional preparado)
    @property([Label]) labelsSlotsPociones: Label[] = [];

    // 4. Servicio de Eliminar Carta y Salir
    @property(Button) btnEliminarCarta: Button = null!;
    @property(Label) labelBtnEliminarCarta: Label = null!;
    @property(Button) btnContinuarSalir: Button = null!;
    @property(Label) labelBtnContinuarSalir: Label = null!;

    @property(DeckViewerController) visorMazo: DeckViewerController = null!;

    private nodosCartas: Node[] = [];
    private nodosReliquias: Node[] = [];

    onLoad() {
        if (this.templateItemCartaTienda) this.templateItemCartaTienda.active = false;
        if (this.templateItemReliquiaTienda) this.templateItemReliquiaTienda.active = false;

        this.labelsSlotsPociones.forEach((lbl, idx) => {
            if (lbl) lbl.string = `🧪 Poción #${idx + 1}\n(Próximamente)`;
        });
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

    private onEstadoCambiado(state: IEstadoSalaCliente) {
        if (state.faseActual !== "SHOP") return;

        const miId = NetworkManager.instance?.room?.sessionId;
        const miJugador = miId ? state.jugadores.get(miId) : undefined;
        if (!miJugador) return;

        if (this.labelMiOro) {
            this.labelMiOro.string = `💰 Tu Oro: ${miJugador.oro}`;
        }

        if (miJugador.tiendaCompletada) {
            if (this.labelTituloTienda) {
                this.labelTituloTienda.string = "🛒 Saliste de la tienda. Esperando a tus aliados...";
            }
            if (this.btnContinuarSalir) this.btnContinuarSalir.interactable = false;
            if (this.labelBtnContinuarSalir) this.labelBtnContinuarSalir.string = "Esperando aliados...";
            if (this.btnEliminarCarta) this.btnEliminarCarta.interactable = false;
            this.visorMazo?.cerrarVisor();
            return;
        }

        if (this.labelTituloTienda) {
            this.labelTituloTienda.string = "🛒 Mercader — Stock Individual";
        }
        if (this.btnContinuarSalir) this.btnContinuarSalir.interactable = true;
        if (this.labelBtnContinuarSalir) this.labelBtnContinuarSalir.string = "Continuar (Salir)";

        this.renderizarCartasEnVenta(miJugador);
        this.renderizarReliquiasEnVenta(miJugador);
        this.actualizarBotonEliminarCarta(miJugador);
    }

    private renderizarCartasEnVenta(miJugador: IJugadorCliente) {
        if (!this.contenedorCartasTienda || !this.templateItemCartaTienda) return;

        const cartasIds: string[] = Array.from(miJugador.tiendaCartas || []);

        while (this.nodosCartas.length < cartasIds.length) {
            const idx = this.nodosCartas.length;
            const nodo = instantiate(this.templateItemCartaTienda);
            this.contenedorCartasTienda.addChild(nodo);
            if (!nodo.getComponent(Button)) nodo.addComponent(Button);
            nodo.on(
                Button.EventType.CLICK,
                () => NetworkManager.instance?.comprarCartaTienda(idx),
                this
            );
            this.nodosCartas.push(nodo);
        }

        this.nodosCartas.forEach((nodo, i) => {
            if (i >= cartasIds.length) {
                nodo.active = false;
                return;
            }

            const cartaId = cartasIds[i];
            const data = CATALOGO_CARTAS[cartaId];
            if (!data) {
                nodo.active = false;
                return;
            }

            nodo.active = true;
            const precio = obtenerPrecioCarta(cartaId);
            const alcanzaOro = miJugador.oro >= precio;

            const cardView = nodo.getComponent(CardView) || nodo.getComponentInChildren(CardView);
            cardView?.configurarModoEstatico(data, 0.9);

            // Si el template tiene un Label extra para el precio, o usamos el tipo/costo
            const labelPrecio = nodo.getChildByName("LabelPrecio")?.getComponent(Label);
            if (labelPrecio) {
                labelPrecio.string = `💰 ${precio}`;
                labelPrecio.color = alcanzaOro
                    ? new Color(255, 230, 100)
                    : new Color(255, 100, 100);
            } else if (cardView?.labelTipo) {
                cardView.labelTipo.string = `${data.tipo} | 💰 ${precio}`;
            }

            const btn = nodo.getComponent(Button);
            if (btn) btn.interactable = alcanzaOro;
        });
    }

    private renderizarReliquiasEnVenta(miJugador: IJugadorCliente) {
        if (!this.contenedorReliquiasTienda || !this.templateItemReliquiaTienda) return;

        const reliquiasIds: string[] = Array.from(miJugador.tiendaReliquias || []);

        while (this.nodosReliquias.length < reliquiasIds.length) {
            const idx = this.nodosReliquias.length;
            const nodo = instantiate(this.templateItemReliquiaTienda);
            this.contenedorReliquiasTienda.addChild(nodo);
            if (!nodo.getComponent(Button)) nodo.addComponent(Button);
            nodo.on(
                Button.EventType.CLICK,
                () => NetworkManager.instance?.comprarReliquiaTienda(idx),
                this
            );
            this.nodosReliquias.push(nodo);
        }

        this.nodosReliquias.forEach((nodo, i) => {
            if (i >= reliquiasIds.length) {
                nodo.active = false;
                return;
            }

            const relId = reliquiasIds[i];
            const data = CATALOGO_RELIQUIAS[relId];
            if (!data) {
                nodo.active = false;
                return;
            }

            nodo.active = true;
            const precio = obtenerPrecioReliquia(relId);
            const alcanzaOro = miJugador.oro >= precio;

            const sp = nodo.getComponentInChildren(Sprite);
            if (sp) {
                SpriteManager.aplicarSprite(sp, "reliquias", data.icono);
            }

            const lbl = nodo.getComponentInChildren(Label);
            if (lbl) {
                lbl.string = `${data.nombre} (💰 ${precio})\n${data.descripcion}`;
                lbl.color = alcanzaOro ? new Color(255, 255, 255) : new Color(255, 130, 130);
            }

            const btn = nodo.getComponent(Button);
            if (btn) btn.interactable = alcanzaOro;
        });
    }

    private actualizarBotonEliminarCarta(miJugador: IJugadorCliente) {
        const costo = ECONOMIA_CONFIG.COSTO_ELIMINAR_CARTA_TIENDA;
        const yaUsado = miJugador.tiendaEliminacionUsada;
        const tieneCartas = (miJugador.mazoMaestro?.length || 0) > 1;
        const puedePagar = !yaUsado && tieneCartas && miJugador.oro >= costo;

        if (this.btnEliminarCarta) {
            this.btnEliminarCarta.interactable = puedePagar;
        }
        if (this.labelBtnEliminarCarta) {
            this.labelBtnEliminarCarta.string = yaUsado
                ? "🗑️ Eliminar Carta (Agotado)"
                : `🗑️ Eliminar 1 Carta (💰 ${costo})`;
        }
    }

    // Asignar al Click Events del botón de Eliminar Carta en la tienda
    public onClickAbrirEliminarCarta() {
        this.visorMazo?.abrirModoEliminar(
            (indiceMazo) => {
                NetworkManager.instance?.eliminarCartaTienda(indiceMazo);
            },
            () => {}
        );
    }

    // Asignar al Click Events del botón Continuar / Salir de la tienda
    public onClickSalirTienda() {
        NetworkManager.instance?.salirTienda();
    }
}