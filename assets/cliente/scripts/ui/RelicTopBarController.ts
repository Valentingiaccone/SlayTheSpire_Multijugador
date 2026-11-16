import { _decorator, Component, Node, Label, Sprite, Button, UITransform } from "cc";
import { NetworkManager, NetworkEvents, EVENTO_ESTADO_ACTUALIZADO } from "../network/NetworkManager";
import { CATALOGO_RELIQUIAS, IReliquiaData } from "../../compartido/Reliquias";
import { SpriteManager } from "../utils/SpriteManager";

const { ccclass, property } = _decorator;

@ccclass("RelicTopBarController")
export class RelicTopBarController extends Component {
    @property(Node) contenedorIconos: Node = null!;

    // Popup de inspección al hacer clic en un ícono
    @property(Node) panelDetalle: Node = null!;
    @property(Sprite) spriteDetalle: Sprite = null!;
    @property(Label) labelNombreDetalle: Label = null!;
    @property(Label) labelDescripcionDetalle: Label = null!;

    private nodosIconos: Node[] = [];

    onLoad() {
        if (this.panelDetalle) this.panelDetalle.active = false;
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
        const miId = NetworkManager.instance?.room?.sessionId;
        const miJugador = miId ? state.jugadores.get(miId) : null;
        if (!miJugador || !this.contenedorIconos) return;

        const misReliquias: string[] = Array.from(miJugador.reliquias || []);

        while (this.nodosIconos.length < misReliquias.length) {
            const iconoNode = new Node("IconoReliquiaTopBar");
            const uiTrans = iconoNode.addComponent(UITransform);
            uiTrans.setContentSize(48, 48);
            const sp = iconoNode.addComponent(Sprite);
            sp.sizeMode = Sprite.SizeMode.CUSTOM;
            iconoNode.addComponent(Button);
            this.contenedorIconos.addChild(iconoNode);
            this.nodosIconos.push(iconoNode);
        }

        this.nodosIconos.forEach((nodo, i) => {
            if (i >= misReliquias.length) {
                nodo.active = false;
                return;
            }

            const reliquiaId = misReliquias[i];
            const data = CATALOGO_RELIQUIAS[reliquiaId];
            if (!data) {
                nodo.active = false;
                return;
            }

            nodo.active = true;
            const sp = nodo.getComponent(Sprite);
            SpriteManager.aplicarSprite(sp, "reliquias", data.icono);

            nodo.off(Button.EventType.CLICK);
            nodo.on(Button.EventType.CLICK, () => {
                this.mostrarDetalleReliquia(data);
            });
        });
    }

    private mostrarDetalleReliquia(data: IReliquiaData) {
        if (!this.panelDetalle) return;
        this.panelDetalle.active = true;

        if (this.labelNombreDetalle) this.labelNombreDetalle.string = data.nombre;
        if (this.labelDescripcionDetalle) this.labelDescripcionDetalle.string = data.descripcion;
        if (this.spriteDetalle) {
            SpriteManager.aplicarSprite(this.spriteDetalle, "reliquias", data.icono);
        }
    }

    // Asignar al botón de cerrar del PanelDetalle
    public onClickCerrarDetalle() {
        if (this.panelDetalle) this.panelDetalle.active = false;
    }
}