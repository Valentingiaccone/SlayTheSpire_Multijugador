import {
    _decorator,
    Component,
    Animation,
    Sprite,
    Color,
    Vec3,
    tween,
    Tween,
    UIOpacity
} from "cc";
import { CartaVisualVfx, IContextoVisualCartaVfx } from "./CartaVisualVfx";

const { ccclass, property } = _decorator;

@ccclass("CartaAgotadaVfx")
export class CartaAgotadaVfx extends Component {
    @property(CartaVisualVfx) vistaCarta: CartaVisualVfx = null!;
    @property(Animation) animacion: Animation = null!;

    @property({
        tooltip: "Nombre del AnimationClip a reproducir. Si se deja vacío, usa el Default Clip del componente Animation."
    })
    nombreClipAgotar: string = "";

    @property({
        tooltip: "Duración del efecto temporal si todavía no asignaste ningún AnimationClip."
    })
    duracionFallbackSeg: number = 0.45;

    private uiOpacity: UIOpacity | null = null;
    private spritesParaTinte: Sprite[] = [];
    private coloresOriginales: Color[] = [];
    private onTerminarCallback: (() => void) | null = null;
    private finalizado: boolean = false;

    onLoad() {
        if (!this.vistaCarta) {
            this.vistaCarta =
                this.node.getComponent(CartaVisualVfx) ||
                this.node.getComponentInChildren(CartaVisualVfx)!;
        }
        if (!this.animacion) {
            this.animacion =
                this.node.getComponent(Animation) || this.node.getComponentInChildren(Animation)!;
        }
        this.uiOpacity = this.node.getComponent(UIOpacity) || this.node.addComponent(UIOpacity);

        this.spritesParaTinte = this.node.getComponentsInChildren(Sprite);
        this.coloresOriginales = this.spritesParaTinte.map((sp) => sp.color.clone());
    }

    onDisable() {
        this.limpiarListenersYTimers();
    }

    public reproducir(
        rawCartaId: string,
        alTerminar: () => void,
        contexto?: IContextoVisualCartaVfx
    ): void {
        this.detener();
        this.onTerminarCallback = alTerminar;
        this.finalizado = false;

        this.node.active = true;
        this.node.setScale(1, 1, 1);
        this.node.angle = 0;
        if (this.uiOpacity) this.uiOpacity.opacity = 255;
        this.restaurarColoresSprites();

        if (this.vistaCarta && rawCartaId) {
            this.vistaCarta.mostrarCarta(rawCartaId, contexto);
        }

        if (this.intentarReproducirClip()) {
            return;
        }

        this.reproducirEfectoFallback();
    }

    public detener(): void {
        this.limpiarListenersYTimers();
        this.onTerminarCallback = null;
        this.finalizado = true;
    }

    private intentarReproducirClip(): boolean {
        if (!this.animacion) return false;

        const nombreElegido = this.nombreClipAgotar.trim();
        const tieneClipNombrado = Boolean(nombreElegido && this.animacion.getState(nombreElegido));
        const tieneDefault = Boolean(this.animacion.defaultClip);

        if (!tieneClipNombrado && !tieneDefault) {
            return false;
        }

        const estado = tieneClipNombrado
            ? this.animacion.getState(nombreElegido)
            : this.animacion.getState(this.animacion.defaultClip!.name);

        this.animacion.once(Animation.EventType.FINISHED, this.notificarFin, this);

        if (tieneClipNombrado) {
            this.animacion.play(nombreElegido);
        } else {
            this.animacion.play();
        }

        const duracionSegura = estado && estado.duration > 0 ? estado.duration + 0.15 : 1.5;
        this.scheduleOnce(this.notificarFin, duracionSegura);
        return true;
    }

    private reproducirEfectoFallback(): void {
        const dur = Math.max(0.15, this.duracionFallbackSeg);

        // Tinte cálido temporal simulando quemado sobre los sprites de la carta
        const colorFuego = new Color(255, 135, 65, 255);
        this.spritesParaTinte.forEach((sp) => {
            if (sp && sp.isValid) sp.color = colorFuego;
        });

        const posInicial = this.node.position.clone();
        tween(this.node)
            .to(dur * 0.14, {
                position: new Vec3(posInicial.x - 6, posInicial.y + 8, 0),
                scale: new Vec3(1.08, 1.08, 1)
            })
            .to(dur * 0.14, {
                position: new Vec3(posInicial.x + 6, posInicial.y + 16, 0)
            })
            .to(dur * 0.72, {
                position: new Vec3(posInicial.x, posInicial.y + 44, 0),
                scale: new Vec3(0.45, 0.45, 1)
            })
            .call(() => this.notificarFin())
            .start();

        if (this.uiOpacity) {
            tween(this.uiOpacity)
                .delay(dur * 0.25)
                .to(dur * 0.75, { opacity: 0 })
                .start();
        }
    }

    private restaurarColoresSprites(): void {
        for (let i = 0; i < this.spritesParaTinte.length; i++) {
            const sp = this.spritesParaTinte[i];
            if (sp && sp.isValid && this.coloresOriginales[i]) {
                sp.color = this.coloresOriginales[i].clone();
            }
        }
    }

    private notificarFin(): void {
        if (this.finalizado) return;
        this.finalizado = true;

        const cb = this.onTerminarCallback;
        this.limpiarListenersYTimers();
        this.onTerminarCallback = null;
        this.node.active = false;
        cb?.();
    }

    private limpiarListenersYTimers(): void {
        this.unscheduleAllCallbacks();
        Tween.stopAllByTarget(this.node);
        if (this.uiOpacity) {
            Tween.stopAllByTarget(this.uiOpacity);
        }
        if (this.animacion && this.animacion.isValid) {
            this.animacion.off(Animation.EventType.FINISHED, this.notificarFin, this);
            this.animacion.stop();
        }
    }
}