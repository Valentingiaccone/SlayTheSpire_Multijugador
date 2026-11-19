import { _decorator, Component, Label, Node, UITransform, Vec3 } from "cc";

const { ccclass, property } = _decorator;

@ccclass("TooltipPopupView")
export class TooltipPopupView extends Component {
    @property(Label) labelTitulo: Label = null!;
    @property(Label) labelDescripcion: Label = null!;
    @property duracionSegundos: number = 3.5;
    @property offsetVertical: number = 18;

    private nodoOrigenActual: Node | null = null;
    private readonly ocultarCallback = () => this.ocultar();

    onLoad() {
        this.node.active = false;
    }

    public mostrar(nodoOrigen: Node, titulo: string, descripcion: string): void {
        // Si toca el mismo botón mientras está abierto, lo cerramos
        if (this.node.active && this.nodoOrigenActual === nodoOrigen) {
            this.ocultar();
            return;
        }

        this.nodoOrigenActual = nodoOrigen;
        if (this.labelTitulo) this.labelTitulo.string = titulo;
        if (this.labelDescripcion) this.labelDescripcion.string = descripcion;

        this.node.active = true;
        this.posicionarEncimaDe(nodoOrigen);

        this.unschedule(this.ocultarCallback);
        this.scheduleOnce(this.ocultarCallback, this.duracionSegundos);
    }

    public ocultar(): void {
        this.unschedule(this.ocultarCallback);
        this.nodoOrigenActual = null;
        this.node.active = false;
    }

    private posicionarEncimaDe(nodoOrigen: Node): void {
        const padre = this.node.parent;
        if (!padre) return;

        const uiPadre = padre.getComponent(UITransform);
        const uiTooltip = this.node.getComponent(UITransform);
        const uiOrigen = nodoOrigen.getComponent(UITransform);
        if (!uiPadre) return;

        const posLocalOrigen = uiPadre.convertToNodeSpaceAR(nodoOrigen.worldPosition);
        const mitadAltoOrigen = uiOrigen ? uiOrigen.height * 0.5 : 20;
        const mitadAltoTooltip = uiTooltip ? uiTooltip.height * 0.5 : 45;
        const mitadAnchoTooltip = uiTooltip ? uiTooltip.width * 0.5 : 110;

        let x = posLocalOrigen.x;
        let y = posLocalOrigen.y + mitadAltoOrigen + mitadAltoTooltip + this.offsetVertical;

        // Evitar que se salga por los bordes del contenedor padre
        const limiteX = uiPadre.width * 0.5 - mitadAnchoTooltip - 12;
        const limiteSupY = uiPadre.height * 0.5 - mitadAltoTooltip - 12;

        if (limiteX > 0) {
            x = Math.max(-limiteX, Math.min(limiteX, x));
        }
        if (y > limiteSupY) {
            // Si no entra arriba, lo mostramos debajo del ícono
            y = posLocalOrigen.y - mitadAltoOrigen - mitadAltoTooltip - this.offsetVertical;
        }

        this.node.setPosition(new Vec3(x, y, 0));
    }
}