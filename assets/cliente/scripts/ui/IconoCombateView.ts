import { _decorator, Component, Sprite, Label, Button, Color, Node } from "cc";
import { SpriteManager, TipoCarpeta } from "../utils/SpriteManager";

const { ccclass, property } = _decorator;

export type CallbackMostrarTooltip = (nodoOrigen: Node, titulo: string, descripcion: string) => void;

@ccclass("IconoCombateView")
export class IconoCombateView extends Component {
    @property(Sprite) spriteIcono: Sprite = null!;
    @property(Label) labelValor: Label = null!;

    private tituloTooltip: string = "";
    private descripcionTooltip: string = "";
    private onSolicitarTooltip: CallbackMostrarTooltip | null = null;
    private ultimaClaveSprite: string = "";

    onLoad() {
        if (!this.node.getComponent(Button)) {
            this.node.addComponent(Button);
        }
        this.node.on(Button.EventType.CLICK, this.onClickIcono, this);
    }

    public configurar(
        carpeta: TipoCarpeta,
        nombreSprite: string,
        textoValor: string,
        tituloTooltip: string,
        descripcionTooltip: string,
        onSolicitarTooltip: CallbackMostrarTooltip | null,
        colorValor: Color = new Color(255, 255, 255)
    ): void {
        this.tituloTooltip = tituloTooltip;
        this.descripcionTooltip = descripcionTooltip;
        this.onSolicitarTooltip = onSolicitarTooltip;

        if (this.labelValor) {
            this.labelValor.string = textoValor;
            this.labelValor.color = colorValor;
            this.labelValor.node.active = textoValor.length > 0;
        }

        const claveSprite = `${carpeta}/${nombreSprite}`;
        if (this.ultimaClaveSprite !== claveSprite) {
            this.ultimaClaveSprite = claveSprite;
            void SpriteManager.aplicarSprite(this.spriteIcono, carpeta, nombreSprite, "generico");
        }
    }

    private onClickIcono(): void {
        if (this.onSolicitarTooltip && this.tituloTooltip) {
            this.onSolicitarTooltip(this.node, this.tituloTooltip, this.descripcionTooltip);
        }
    }
}