import { _decorator, Component, Node, Label, Sprite, Color, UIOpacity, Vec3, tween, ParticleSystem2D, EventTouch } from 'cc';
import { ICartaData } from "../../compartido/Cartas";
import {
    CATALOGO_ENCANTAMIENTOS,
    EncantamientoId
} from "../../compartido/CondicionesYEfectos";
import {
    CalculadoraCombate,
    IContextoCalculoCarta,
    IMapaEstadosLectura
} from "../../compartido/CalculadoraCombate";
import { SpriteManager } from "../utils/SpriteManager";

const { ccclass, property } = _decorator;

@ccclass("CardView")
export class CardView extends Component {
    @property(Label) labelCosto: Label = null!;
    @property(Label) labelNombre: Label = null!;
    @property(Label) labelDescripcion: Label = null!;
    @property(Label) labelTipo: Label = null!;
    @property(Sprite) imagen: Sprite = null!;
    @property(Node) nodoEncantado: Node = null!;
    @property(ParticleSystem2D)
    particulasFuego: ParticleSystem2D | null = null;

    private indiceMano: number = -1;
    private cartaData: ICartaData | null = null;
    private ultimoSpriteEncantamiento: string = "";
    private posOriginal: Vec3 = new Vec3();
    private arrastrando: boolean = false;
    private arrastreHabilitado: boolean = true;

    private estadosLanzadorActual: IMapaEstadosLectura | undefined = undefined;
    private contextoExtraActual: IContextoCalculoCarta | undefined = undefined;
    private ultimoObjetivoHoverId: string | undefined = undefined;

    private onSolicitarJugar: ((indiceMano: number, objetivoId?: string) => void) | null = null;
    private buscarObjetivoEnPunto: ((tipo: "ENEMIGO" | "ALIADO", touchPosWorld: Vec3) => string | undefined) | null = null;
    private obtenerEstadosObjetivo: ((objetivoId: string) => IMapaEstadosLectura | undefined) | null = null;

    public get estaArrastrando(): boolean {
        return this.arrastrando;
    }

    onLoad() {
        this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
    }

    onDisable() {
        this.arrastrando = false;
        this.ultimoObjetivoHoverId = undefined;
    }

    public animarDescarte(posicionMazoDescarte: Vec3, alTerminar?: () => void) {
        // Nos aseguramos de que la carta tenga el componente para controlar la opacidad
        let uiOpacity = this.getComponent(UIOpacity);
        if (!uiOpacity) uiOpacity = this.addComponent(UIOpacity);

        // Tween de posición y escala (Se achica y viaja hacia el mazo)
        tween(this.node)
            .to(0.4, { position: posicionMazoDescarte, scale: new Vec3(0.2, 0.2, 1) }, { easing: 'quadIn' })
            .start();
        
        // Tween de opacidad (Se desvanece)
        tween(uiOpacity)
            .to(0.4, { opacity: 0 })
            .call(() => {
                if (alTerminar) alTerminar();
                this.node.destroy(); // Destruye el nodo visualmente al terminar
            })
            .start();
    }

    public animarAgotar(posicionCentro: Vec3, alTerminar?: () => void) {
        let uiOpacity = this.getComponent(UIOpacity);
        if (!uiOpacity) uiOpacity = this.addComponent(UIOpacity);

        // Movemos la carta al centro de la pantalla
        tween(this.node)
            .to(0.2, { position: posicionCentro, scale: new Vec3(1.2, 1.2, 1) }, { easing: 'backOut' })
            .call(() => {
                // Cuando llega al centro, encendemos el fuego
                if (this.particulasFuego) {
                    this.particulasFuego.resetSystem(); // Inicia el fuego
                }
                
                // Oscurecemos la carta (efecto de quemado)
                const sprite = this.getComponent(Sprite);
                if (sprite) {
                    tween(sprite)
                        .to(0.3, { color: new Color(50, 50, 50, 255) }) // Se pone negra
                        .start();
                }
            })
            .delay(0.5) // Esperamos medio segundo mientras se quema
            .call(() => {
                // La desaparecemos
                tween(uiOpacity)
                    .to(0.3, { opacity: 0 })
                    .call(() => {
                        if (alTerminar) alTerminar();
                        this.node.destroy();
                    })
                    .start();
            })
            .start();
    }

    public configurar(
        indice: number,
        data: ICartaData,
        puedePagarse: boolean,
        onJugar: (indiceMano: number, objetivoId?: string) => void,
        buscarObjetivo: (tipo: "ENEMIGO" | "ALIADO", pos: Vec3) => string | undefined,
        estadosLanzador?: IMapaEstadosLectura,
        obtenerEstadosObjetivo?: (objetivoId: string) => IMapaEstadosLectura | undefined,
        permitirArrastre: boolean = true,
        contextoExtra?: IContextoCalculoCarta,
        encantamiento?: EncantamientoId,
        gratisEsteTurno: boolean = false
    ) {
        this.indiceMano = indice;
        this.onSolicitarJugar = onJugar;
        this.buscarObjetivoEnPunto = buscarObjetivo;
        this.estadosLanzadorActual = estadosLanzador;
        this.contextoExtraActual = contextoExtra;
        this.obtenerEstadosObjetivo = obtenerEstadosObjetivo || null;
        this.arrastreHabilitado = permitirArrastre && !data.injugable;

        if (this.arrastrando && this.cartaData?.id === data.id) {
            this.refrescarTextoDinamico(
                this.ultimoObjetivoHoverId
                    ? this.obtenerEstadosObjetivo?.(this.ultimoObjetivoHoverId)
                    : undefined
            );
            return;
        }

        const cambioDeSprite = this.cartaData?.sprite !== data.sprite;
        this.cartaData = data;

        const costoMostrado = CalculadoraCombate.calcularCostoCarta(
            data.costo,
            data.reduccionCostoPorHpPerdido,
            contextoExtra?.hpPerdidoCombate || 0,
            encantamiento,
            gratisEsteTurno
        );

        if (this.labelCosto) {
            this.labelCosto.string = data.injugable ? "-" : `${costoMostrado}`;
            this.labelCosto.color =
                costoMostrado < data.costo
                    ? new Color(130, 255, 140)
                    : new Color(255, 255, 255);
        }

        if (this.labelNombre) {
            this.labelNombre.string = data.nombre;
            if (data.tipo === "MALDICION") {
                this.labelNombre.color = new Color(215, 120, 255);
            } else if (data.esMejorada) {
                this.labelNombre.color = new Color(130, 255, 140);
            } else {
                this.labelNombre.color = new Color(255, 255, 255);
            }
        }

        if (this.labelTipo) this.labelTipo.string = data.tipo;

        this.actualizarVisualEncantamiento(encantamiento);
        this.refrescarTextoDinamico(undefined);

        const jugableVisual = puedePagarse && !data.injugable;
        const escala = jugableVisual ? 1 : 0.92;
        this.node.setScale(escala, escala, 1);

        if (cambioDeSprite) {
            void SpriteManager.aplicarSprite(this.imagen, "cartas", data.sprite);
        }
    }

    public configurarModoEstatico(
        data: ICartaData,
        escala: number = 1,
        encantamiento?: EncantamientoId
    ) {
        this.arrastrando = false;
        this.ultimoObjetivoHoverId = undefined;
        this.configurar(
            -1,
            data,
            true,
            () => {},
            () => undefined,
            undefined,
            undefined,
            false,
            undefined,
            encantamiento,
            false
        );
        this.node.setScale(escala, escala, 1);
    }

    private actualizarVisualEncantamiento(encantamiento?: EncantamientoId) {
        if (!this.nodoEncantado) return;

        const infoEnc = encantamiento ? CATALOGO_ENCANTAMIENTOS[encantamiento] : undefined;
        if (!infoEnc) {
            this.nodoEncantado.active = false;
            return;
        }

        this.nodoEncantado.active = true;
        if (this.ultimoSpriteEncantamiento !== infoEnc.sprite) {
            this.ultimoSpriteEncantamiento = infoEnc.sprite;
            const spEnc =
                this.nodoEncantado.getComponent(Sprite) ||
                this.nodoEncantado.getComponentInChildren(Sprite);
            if (spEnc) {
                void SpriteManager.aplicarSprite(
                    spEnc,
                    "encantamientos",
                    infoEnc.sprite,
                    "generico"
                );
            }
        }
    }

    private refrescarTextoDinamico(estadosObjetivo?: IMapaEstadosLectura) {
        if (!this.cartaData || !this.labelDescripcion) return;

        const resultado = CalculadoraCombate.formatearDescripcionCarta(
            this.cartaData.descripcion,
            this.cartaData.efectos,
            this.estadosLanzadorActual,
            estadosObjetivo,
            this.contextoExtraActual
        );

        this.labelDescripcion.string = resultado.texto;

        if (resultado.estadoDanio === "AUMENTADO" || resultado.estadoBloqueo === "AUMENTADO") {
            this.labelDescripcion.color = new Color(135, 255, 145);
        } else if (resultado.estadoDanio === "REDUCIDO" || resultado.estadoBloqueo === "REDUCIDO") {
            this.labelDescripcion.color = new Color(255, 130, 130);
        } else {
            this.labelDescripcion.color = new Color(255, 255, 255);
        }
    }

    private onTouchStart() {
        if (!this.arrastreHabilitado) return;
        this.arrastrando = true;
        this.ultimoObjetivoHoverId = undefined;
        this.posOriginal.set(this.node.position);
    }

    private onTouchMove(event: EventTouch) {
        if (!this.arrastrando || !this.cartaData) return;
        const delta = event.getUIDelta();
        this.node.setPosition(this.node.position.x + delta.x, this.node.position.y + delta.y, 0);

        if (this.buscarObjetivoEnPunto && this.obtenerEstadosObjetivo) {
            const uiPos = event.getUILocation();
            const enemigoBajoCursorId = this.buscarObjetivoEnPunto(
                "ENEMIGO",
                new Vec3(uiPos.x, uiPos.y, 0)
            );

            if (enemigoBajoCursorId !== this.ultimoObjetivoHoverId) {
                this.ultimoObjetivoHoverId = enemigoBajoCursorId;
                const estadosEnemigo = enemigoBajoCursorId
                    ? this.obtenerEstadosObjetivo(enemigoBajoCursorId)
                    : undefined;
                this.refrescarTextoDinamico(estadosEnemigo);
            }
        }
    }

    private onTouchEnd(event: EventTouch) {
        if (!this.arrastrando || !this.cartaData) return;
        this.arrastrando = false;
        this.ultimoObjetivoHoverId = undefined;
        this.refrescarTextoDinamico(undefined);

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