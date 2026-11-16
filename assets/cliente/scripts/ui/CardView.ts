import { _decorator, Component, Label, EventTouch, Vec3, UITransform, Node } from "cc";
import { ICartaData } from "../../compartido/Cartas";

const { ccclass, property } = _decorator;

@ccclass("CardView")
export class CardView extends Component {
    @property(Label) labelCosto: Label = null;
    @property(Label) labelNombre: Label = null;
    @property(Label) labelDescripcion: Label = null;
    @property(Label) labelTipo: Label = null;

    private indiceMano: number = -1;
    private cartaData: ICartaData | null = null;
    private posOriginal: Vec3 = new Vec3();
    private arrastrando: boolean = false;

    // Callback que le pasa CombatController (embudo único en cliente)
    private onSolicitarJugar: ((indiceMano: number, objetivoId?: string) => void) | null = null;
    private buscarObjetivoEnPunto: ((tipo: "ENEMIGO" | "ALIADO", touchPosWorld: Vec3) => string | undefined) | null = null;

    onLoad() {
        this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
    }

    public configurar(
        indice: number,
        data: ICartaData,
        puedePagarse: boolean,
        onJugar: (indiceMano: number, objetivoId?: string) => void,
        buscarObjetivo: (tipo: "ENEMIGO" | "ALIADO", pos: Vec3) => string | undefined
    ) {
        this.indiceMano = indice;
        this.cartaData = data;
        this.onSolicitarJugar = onJugar;
        this.buscarObjetivoEnPunto = buscarObjetivo;

        if (this.labelCosto) this.labelCosto.string = `${data.costo}`;
        if (this.labelNombre) this.labelNombre.string = data.nombre;
        if (this.labelDescripcion) this.labelDescripcion.string = data.descripcion;
        if (this.labelTipo) this.labelTipo.string = data.tipo;

        this.node.setScale(puedePagarse ? 1 : 0.92, puedePagarse ? 1 : 0.92, 1);
    }

    private onTouchStart() {
        this.arrastrando = true;
        this.posOriginal.set(this.node.position);
    }

    private onTouchMove(event: EventTouch) {
        if (!this.arrastrando) return;
        const delta = event.getUIDelta();
        this.node.setPosition(this.node.position.x + delta.x, this.node.position.y + delta.y, 0);
    }

    private onTouchEnd(event: EventTouch) {
        if (!this.arrastrando || !this.cartaData) return;
        this.arrastrando = false;

        const desplazamientoY = this.node.position.y - this.posOriginal.y;
        this.node.setPosition(this.posOriginal);

        // Si no se levantó lo suficiente, se cancela el arrastre
        if (desplazamientoY < 90) return;

        if (!this.cartaData.objetivoSeleccion) {
            // Caso 1: Carta sin objetivo (arrastrar hacia arriba) -> llama al embudo
            this.onSolicitarJugar?.(this.indiceMano, undefined);
        } else {
            // Caso 2: Carta con objetivo (soltar encima de un enemigo o aliado) -> llama al MISMO embudo
            const uiPos = event.getUILocation();
            const objetivoId = this.buscarObjetivoEnPunto?.(
                this.cartaData.objetivoSeleccion,
                new Vec3(uiPos.x, uiPos.y, 0)
            );
            if (objetivoId) {
                this.onSolicitarJugar?.(this.indiceMano, objetivoId);
            }
        }
    }
}