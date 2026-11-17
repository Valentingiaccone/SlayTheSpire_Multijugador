import { _decorator, Component, Label, EventTouch, Vec3, Node, Sprite } from "cc";
import { ICartaData } from "../../compartido/Cartas";
import { SpriteManager } from "../utils/SpriteManager";

const { ccclass, property } = _decorator;

@ccclass("CardView")
export class CardView extends Component {
    @property(Label) labelCosto: Label = null!;
    @property(Label) labelNombre: Label = null!;
    @property(Label) labelDescripcion: Label = null!;
    @property(Label) labelTipo: Label = null!;
    @property(Sprite) imagen: Sprite = null!;

    private indiceMano: number = -1;
    private cartaData: ICartaData | null = null;
    private posOriginal: Vec3 = new Vec3();
    private arrastrando: boolean = false;

    private onSolicitarJugar: ((indiceMano: number, objetivoId?: string) => void) | null = null;
    private buscarObjetivoEnPunto: ((tipo: "ENEMIGO" | "ALIADO", touchPosWorld: Vec3) => string | undefined) | null = null;

    public get estaArrastrando(): boolean {
        return this.arrastrando;
    }

    public get idCartaActual(): string | undefined {
        return this.cartaData?.id;
    }

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
        this.onSolicitarJugar = onJugar;
        this.buscarObjetivoEnPunto = buscarObjetivo;

        // Si el jugador está arrastrando esta misma carta en este instante, solo actualizamos su índice sin resetear su posición ni escala
        if (this.arrastrando && this.cartaData?.id === data.id) {
            return;
        }

        const cambioDeCarta = this.cartaData?.id !== data.id;
        this.cartaData = data;

        if (this.labelCosto) this.labelCosto.string = `${data.costo}`;
        if (this.labelNombre) this.labelNombre.string = data.nombre;
        if (this.labelDescripcion) this.labelDescripcion.string = data.descripcion;
        if (this.labelTipo) this.labelTipo.string = data.tipo;

        const escala = puedePagarse ? 1 : 0.92;
        this.node.setScale(escala, escala, 1);

        if (cambioDeCarta) {
            SpriteManager.aplicarSprite(this.imagen, "cartas", data.sprite);
        }
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

        if (desplazamientoY < 90) return;

        if (!this.cartaData.objetivoSeleccion) {
            this.onSolicitarJugar?.(this.indiceMano, undefined);
        } else {
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