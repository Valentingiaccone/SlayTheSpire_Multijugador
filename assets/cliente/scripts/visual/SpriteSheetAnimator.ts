import { _decorator, Component, Sprite, SpriteFrame, Rect, Size, UITransform, Vec3 } from "cc";
import { SpriteManager } from "../utils/SpriteManager";
import {
    CATALOGO_ANIMACIONES_ENTIDADES,
    expandirCoordsAnimacion,
    IConfigSpriteEntidad,
    IDefinicionAnimacion,
    NombreAnimacion,
    PLACEHOLDER_ENTIDAD
} from "./CatalogoAnimaciones";

const { ccclass, property } = _decorator;

@ccclass("SpriteSheetAnimator")
export class SpriteSheetAnimator extends Component {
    @property(Sprite) spriteTarget: Sprite = null!;

    // Caché compartida: clave "archivo|cols|filas" -> matriz [fila][col] de SpriteFrame
    private static cacheGrillas: Map<string, SpriteFrame[][]> = new Map();

    private entidadConfigId: string = "";
    private configActual: IConfigSpriteEntidad | null = null;
    private grillaActual: SpriteFrame[][] | null = null;

    private animacionActual: NombreAnimacion | null = null;
    private defActual: IDefinicionAnimacion | null = null;
    private framesActuales: SpriteFrame[] = [];
    private indiceFrame: number = 0;
    private acumuladorTiempo: number = 0;
    private reproduciendo: boolean = false;
    private resolverPromesaActual: (() => void) | null = null;

    onLoad() {
        if (!this.spriteTarget) {
            this.spriteTarget = this.node.getComponent(Sprite) || this.node.addComponent(Sprite);
        }
        this.spriteTarget.sizeMode = Sprite.SizeMode.CUSTOM;
    }

    onDisable() {
        this.finalizarPromesaPendiente();
    }

    public get tieneAnimaciones(): boolean {
        return Boolean(this.grillaActual && this.configActual);
    }

    /**
     * Configura la entidad por su ID ("SHELLY", "robot", etc.), aplica su tamaño y carga su spritesheet o placeholder.
     */
    public async configurar(entidadVisualId: string): Promise<void> {
        if (this.entidadConfigId === entidadVisualId && (this.grillaActual || this.spriteTarget?.spriteFrame)) {
            return;
        }

        this.entidadConfigId = entidadVisualId;
        this.detenerAnimacion();
        this.grillaActual = null;

        const config = CATALOGO_ANIMACIONES_ENTIDADES[entidadVisualId] || null;
        this.configActual = config;

        const tamano = config?.tamano || PLACEHOLDER_ENTIDAD.tamanoPorDefecto;
        this.aplicarTamanoYOrientacion(tamano.ancho, tamano.alto, Boolean(config?.voltearX));

        if (!this.spriteTarget) {
            this.spriteTarget = this.node.getComponent(Sprite) || this.node.addComponent(Sprite);
            this.spriteTarget.sizeMode = Sprite.SizeMode.CUSTOM;
        }

        if (config) {
            const grilla = await this.obtenerOCortarGrilla(config);
            if (!this.isValid || this.entidadConfigId !== entidadVisualId) return;

            if (grilla) {
                this.grillaActual = grilla;
                if (config.animaciones.idle) {
                    this.reproducirLoop("idle");
                } else if (grilla[0]?.[0]) {
                    this.spriteTarget.spriteFrame = grilla[0][0];
                }
                return;
            }
        }

        // Fallback: PNG estático genérico (resources/entidades/placeholder.png)
        await SpriteManager.aplicarSprite(this.spriteTarget, "entidades", PLACEHOLDER_ENTIDAD.archivo);
    }

    /** Permite cambiar el tamaño de la entidad en tiempo de ejecución si hace falta */
    public aplicarTamanoYOrientacion(ancho: number, alto: number, voltearX: boolean = false): void {
        const uiTrans = this.node.getComponent(UITransform);
        if (uiTrans) {
            uiTrans.setContentSize(ancho, alto);
        }
        const escalaX = voltearX ? -Math.abs(this.node.scale.x || 1) : Math.abs(this.node.scale.x || 1);
        const escalaY = Math.abs(this.node.scale.y || 1);
        this.node.setScale(new Vec3(escalaX, escalaY, 1));
    }

    public reproducirLoop(nombre: NombreAnimacion): void {
        const def = this.configActual?.animaciones[nombre];
        if (!def || !this.grillaActual) return;

        this.finalizarPromesaPendiente();
        this.cargarSecuencia(nombre, { ...def, loop: true });
    }

    /**
     * Reproduce una animación una sola vez (atacar, recibir_danio, morir, etc.)
     * y resuelve la Promise al terminar. Devuelve `true` si existía animación, `false` si usó fallback.
     */
    public reproducirUnaVez(nombre: NombreAnimacion): Promise<boolean> {
        const def = this.configActual?.animaciones[nombre];
        if (!def || !this.grillaActual) {
            return Promise.resolve(false);
        }

        this.finalizarPromesaPendiente();
        const frames = this.construirFramesDeDefinicion(def);
        if (frames.length === 0) {
            return Promise.resolve(false);
        }

        return new Promise<boolean>((resolve) => {
            this.resolverPromesaActual = () => resolve(true);
            this.cargarSecuencia(nombre, { ...def, loop: false }, frames);
        });
    }

    public detenerAnimacion(): void {
        this.reproduciendo = false;
        this.animacionActual = null;
        this.defActual = null;
        this.framesActuales = [];
        this.acumuladorTiempo = 0;
        this.finalizarPromesaPendiente();
    }

    update(dt: number) {
        if (!this.reproduciendo || !this.defActual || this.framesActuales.length === 0) return;

        const duracionFrame = 1 / Math.max(1, this.defActual.fps);
        this.acumuladorTiempo += dt;

        while (this.acumuladorTiempo >= duracionFrame) {
            this.acumuladorTiempo -= duracionFrame;
            this.indiceFrame++;

            if (this.indiceFrame >= this.framesActuales.length) {
                if (this.defActual.loop) {
                    this.indiceFrame = 0;
                } else {
                    const mantener = Boolean(this.defActual.mantenerUltimoFrame);
                    const resolver = this.resolverPromesaActual;
                    this.resolverPromesaActual = null;

                    if (mantener) {
                        this.indiceFrame = this.framesActuales.length - 1;
                        this.reproduciendo = false;
                        this.aplicarFrameActual();
                    } else {
                        this.reproduciendo = false;
                        if (this.configActual?.animaciones.idle) {
                            this.reproducirLoop("idle");
                        }
                    }

                    resolver?.();
                    return;
                }
            }

            this.aplicarFrameActual();
        }
    }

    private cargarSecuencia(
        nombre: NombreAnimacion,
        def: IDefinicionAnimacion,
        framesPrecalculados?: SpriteFrame[]
    ): void {
        const frames = framesPrecalculados || this.construirFramesDeDefinicion(def);
        if (frames.length === 0) return;

        this.animacionActual = nombre;
        this.defActual = def;
        this.framesActuales = frames;
        this.indiceFrame = 0;
        this.acumuladorTiempo = 0;
        this.reproduciendo = true;
        this.aplicarFrameActual();
    }

    private aplicarFrameActual(): void {
        if (!this.spriteTarget || !this.spriteTarget.isValid) return;
        const frame = this.framesActuales[this.indiceFrame];
        if (frame) {
            this.spriteTarget.spriteFrame = frame;
        }
    }

    private construirFramesDeDefinicion(def: IDefinicionAnimacion): SpriteFrame[] {
        if (!this.grillaActual) return [];
        const coords = expandirCoordsAnimacion(def);
        const resultado: SpriteFrame[] = [];

        for (const { fila, col } of coords) {
            const frame = this.grillaActual[fila]?.[col];
            if (frame) resultado.push(frame);
        }
        return resultado;
    }

    private async obtenerOCortarGrilla(config: IConfigSpriteEntidad): Promise<SpriteFrame[][] | null> {
        const clave = `${config.archivo}|${config.columnas}|${config.filas}`;
        if (SpriteSheetAnimator.cacheGrillas.has(clave)) {
            return SpriteSheetAnimator.cacheGrillas.get(clave)!;
        }

        const textura = await SpriteManager.obtenerTextura("entidades", config.archivo, true);
        if (!textura) return null;

        const cols = Math.max(1, config.columnas);
        const filas = Math.max(1, config.filas);
        const anchoFrame = Math.floor(textura.width / cols);
        const altoFrame = Math.floor(textura.height / filas);

        const grilla: SpriteFrame[][] = [];
        for (let f = 0; f < filas; f++) {
            const filaFrames: SpriteFrame[] = [];
            for (let c = 0; c < cols; c++) {
                const sf = new SpriteFrame();
                sf.texture = textura;
                sf.rect = new Rect(c * anchoFrame, f * altoFrame, anchoFrame, altoFrame);
                sf.originalSize = new Size(anchoFrame, altoFrame);
                sf.packable = false;
                filaFrames.push(sf);
            }
            grilla.push(filaFrames);
        }

        SpriteSheetAnimator.cacheGrillas.set(clave, grilla);
        return grilla;
    }

    private finalizarPromesaPendiente(): void {
        if (this.resolverPromesaActual) {
            const fn = this.resolverPromesaActual;
            this.resolverPromesaActual = null;
            fn();
        }
    }
}