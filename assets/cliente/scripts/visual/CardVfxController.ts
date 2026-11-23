import {
    _decorator,
    Component,
    Node,
    Prefab,
    instantiate,
    Vec3,
    UITransform,
    tween,
    Tween,
    UIOpacity
} from "cc";
import { CartaVisualVfx, IContextoVisualCartaVfx } from "./CartaVisualVfx";
import { CartaAgotadaVfx } from "./CartaAgotadaVfx";

const { ccclass, property } = _decorator;

interface IVueloCartaActivo {
    vista: CartaVisualVfx;
    progreso: { t: number };
    uiOpacity: UIOpacity | null;
}

@ccclass("CardVfxController")
export class CardVfxController extends Component {
    @property(Node) capaVfx: Node = null!;
    @property(Prefab) prefabCartaVfx: Prefab = null!;
    @property(Prefab) prefabCartaAgotada: Prefab = null!;

    @property(Node) nodoPilaRobo: Node = null!;
    @property(Node) nodoPilaDescarte: Node = null!;

    @property({ tooltip: "Duración del vuelo de una carta al descarte o hacia tu mano (segundos)." })
    duracionVueloCartaSeg: number = 0.28;

    @property({ tooltip: "Duración del vuelo de cada dorso al mezclar Descarte -> Robo (segundos)." })
    duracionVueloMezclaSeg: number = 0.26;

    @property({ tooltip: "Separación temporal entre cartas cuando salen varias seguidas." })
    delayEntreCartasSeg: number = 0.055;

    @property({ tooltip: "Tope visual de dorsos al mezclar para no saturar mazos gigantes." })
    maxCartasMezcla: number = 10;

    @property({ tooltip: "Escala de la carta al entrar o salir de los botones de Robo/Descarte." })
    escalaEnPila: number = 0.22;

    @property({ tooltip: "Curvatura vertical del arco de vuelo en píxeles." })
    alturaCurva: number = 75;

    private poolCartas: CartaVisualVfx[] = [];
    private poolAgotadas: CartaAgotadaVfx[] = [];
    private vuelosActivos: Set<IVueloCartaActivo> = new Set();

    onDisable() {
        this.limpiar();
    }

    private obtenerContenedor(): Node {
        return this.capaVfx || this.node;
    }

    /** Carta real volando desde la mano/soltado hacia Descarte (se achica) */
    public lanzarCartaHaciaDescarte(
        rawCartaId: string,
        posOrigenMundo: Vec3,
        delaySeg: number = 0,
        contexto?: IContextoVisualCartaVfx,
        escalaInicial: number = 1
    ): void {
        if (!this.nodoPilaDescarte) return;
        const destino = this.nodoPilaDescarte.worldPosition.clone();

        this.lanzarCartaAnimada({
            modo: "CARTA",
            rawCartaId,
            contexto,
            posOrigenMundo,
            posDestinoMundo: destino,
            escalaInicial,
            escalaFinal: this.escalaEnPila,
            anguloInicial: 0,
            anguloFinal: 16,
            duracionSeg: this.duracionVueloCartaSeg,
            delaySeg,
            desvanecerAlFinal: false
        });
    }

    /** Carta Poder volando hacia tu personaje (se achica y se funde) */
    public lanzarCartaHaciaPersonaje(
        rawCartaId: string,
        posOrigenMundo: Vec3,
        posPersonajeMundo: Vec3,
        delaySeg: number = 0,
        contexto?: IContextoVisualCartaVfx
    ): void {
        this.lanzarCartaAnimada({
            modo: "CARTA",
            rawCartaId,
            contexto,
            posOrigenMundo,
            posDestinoMundo: posPersonajeMundo,
            escalaInicial: 1,
            escalaFinal: 0.35,
            anguloInicial: 0,
            anguloFinal: -10,
            duracionSeg: this.duracionVueloCartaSeg + 0.06,
            delaySeg,
            desvanecerAlFinal: true
        });
    }

    /**
     * Carta real volando desde Robo hacia la posición exacta de su slot en la mano (crece hasta 1.0).
     * Llama a `alLlegar()` en el frame exacto en que aterriza para revelar la carta real jugable.
     */
    public lanzarCartaDesdeRoboAMano(
        rawCartaId: string,
        posDestinoMundo: Vec3,
        delaySeg: number = 0,
        contexto?: IContextoVisualCartaVfx,
        alLlegar?: () => void
    ): void {
        // Respaldo de seguridad: si falta configurar prefab o botón de robo, revelar de inmediato
        if (!this.prefabCartaVfx || !this.nodoPilaRobo) {
            alLlegar?.();
            return;
        }

        const origen = this.nodoPilaRobo.worldPosition.clone();
        this.lanzarCartaAnimada({
            modo: "CARTA",
            rawCartaId,
            contexto,
            posOrigenMundo: origen,
            posDestinoMundo: posDestinoMundo,
            escalaInicial: this.escalaEnPila,
            escalaFinal: 1,
            anguloInicial: -14,
            anguloFinal: 0,
            duracionSeg: this.duracionVueloCartaSeg,
            delaySeg,
            desvanecerAlFinal: false,
            alLlegar
        });
    }

    /**
     * Múltiples dorsos (`carta_dorso`) volando de Descarte -> Robo.
     * Devuelve el delay recomendado (en segundos) antes de disparar las cartas robadas.
     */
    public reproducirMezclaDescarteARobo(cantidadCartas: number): number {
        if (!this.prefabCartaVfx || !this.nodoPilaDescarte || !this.nodoPilaRobo || cantidadCartas <= 0) {
            return 0;
        }

        const cantidadVisual = Math.min(Math.max(1, cantidadCartas), this.maxCartasMezcla);
        const origen = this.nodoPilaDescarte.worldPosition.clone();
        const destino = this.nodoPilaRobo.worldPosition.clone();
        const delayMezcla = Math.max(0.025, this.delayEntreCartasSeg * 0.75);

        for (let i = 0; i < cantidadVisual; i++) {
            this.lanzarCartaAnimada({
                modo: "DORSO",
                rawCartaId: "",
                posOrigenMundo: origen,
                posDestinoMundo: destino,
                escalaInicial: this.escalaEnPila,
                escalaFinal: this.escalaEnPila,
                escalaPicoIntermedio: Math.max(this.escalaEnPila + 0.14, 0.36),
                anguloInicial: 10,
                anguloFinal: -10,
                duracionSeg: this.duracionVueloMezclaSeg,
                delaySeg: i * delayMezcla,
                desvanecerAlFinal: false
            });
        }

        return (cantidadVisual - 1) * delayMezcla + this.duracionVueloMezclaSeg * 0.85;
    }

    /** Instancia/reutiliza el prefab de carta agotada con el dibujo real de la carta */
    public reproducirCartaAgotada(
        rawCartaId: string,
        posOrigenMundo: Vec3,
        delaySeg: number = 0,
        contexto?: IContextoVisualCartaVfx
    ): void {
        if (!this.prefabCartaAgotada) return;

        const posLocal = this.mundoALocal(posOrigenMundo);
        if (!posLocal) return;

        const ejecutar = () => {
            if (!this.isValid) return;
            const vfx = this.obtenerAgotadaDelPool();
            vfx.node.setPosition(posLocal);
            vfx.reproducir(
                rawCartaId,
                () => this.devolverAgotadaAlPool(vfx),
                contexto
            );
        };

        if (delaySeg > 0) {
            this.scheduleOnce(ejecutar, delaySeg);
        } else {
            ejecutar();
        }
    }

    public limpiar(): void {
        this.unscheduleAllCallbacks();

        this.vuelosActivos.forEach((vuelo) => {
            Tween.stopAllByTarget(vuelo.progreso);
            Tween.stopAllByTarget(vuelo.vista.node);
            if (vuelo.uiOpacity) {
                Tween.stopAllByTarget(vuelo.uiOpacity);
                vuelo.uiOpacity.opacity = 255;
            }
            if (vuelo.vista.isValid) {
                vuelo.vista.node.active = false;
                this.poolCartas.push(vuelo.vista);
            }
        });
        this.vuelosActivos.clear();

        const contenedor = this.obtenerContenedor();
        contenedor.children.forEach((hijo) => {
            const vfx = hijo.getComponent(CartaAgotadaVfx);
            if (vfx && hijo.active) {
                vfx.detener();
                hijo.active = false;
                if (!this.poolAgotadas.includes(vfx)) {
                    this.poolAgotadas.push(vfx);
                }
            }
        });
    }

    private lanzarCartaAnimada(opciones: {
        modo: "CARTA" | "DORSO";
        rawCartaId: string;
        contexto?: IContextoVisualCartaVfx;
        posOrigenMundo: Vec3;
        posDestinoMundo: Vec3;
        escalaInicial: number;
        escalaFinal: number;
        escalaPicoIntermedio?: number;
        anguloInicial: number;
        anguloFinal: number;
        duracionSeg: number;
        delaySeg: number;
        desvanecerAlFinal: boolean;
        alLlegar?: () => void;
    }): void {
        if (!this.prefabCartaVfx) {
            opciones.alLlegar?.();
            return;
        }

        const p0 = this.mundoALocal(opciones.posOrigenMundo);
        const p2 = this.mundoALocal(opciones.posDestinoMundo);
        if (!p0 || !p2) {
            opciones.alLlegar?.();
            return;
        }

        const iniciarVuelo = () => {
            if (!this.isValid) return;

            const vista = this.obtenerCartaDelPool();
            const nodo = vista.node;
            nodo.active = true;
            nodo.setPosition(p0);
            nodo.setScale(opciones.escalaInicial, opciones.escalaInicial, 1);
            nodo.angle = opciones.anguloInicial;

            const uiOpacity = nodo.getComponent(UIOpacity) || nodo.addComponent(UIOpacity);
            uiOpacity.opacity = 255;

            if (opciones.modo === "DORSO") {
                vista.mostrarDorso();
            } else {
                vista.mostrarCarta(opciones.rawCartaId, opciones.contexto);
            }

            const variacionX = (Math.random() - 0.5) * 45;
            const variacionY = this.alturaCurva * (0.8 + Math.random() * 0.4);
            const p1 = new Vec3(
                (p0.x + p2.x) * 0.5 + variacionX,
                Math.max(p0.y, p2.y) + variacionY,
                0
            );

            const progreso = { t: 0 };
            const vuelo: IVueloCartaActivo = { vista, progreso, uiOpacity };
            this.vuelosActivos.add(vuelo);

            const dur = Math.max(0.12, opciones.duracionSeg);
            const posTemp = new Vec3();

            tween(progreso)
                .to(
                    dur,
                    { t: 1 },
                    {
                        easing: "quadOut",
                        onUpdate: () => {
                            if (!nodo.isValid) return;
                            const t = progreso.t;
                            const inv = 1 - t;
                            posTemp.set(
                                inv * inv * p0.x + 2 * inv * t * p1.x + t * t * p2.x,
                                inv * inv * p0.y + 2 * inv * t * p1.y + t * t * p2.y,
                                0
                            );
                            nodo.setPosition(posTemp);
                        }
                    }
                )
                .call(() => {
                    this.vuelosActivos.delete(vuelo);
                    if (nodo.isValid) {
                        nodo.active = false;
                        uiOpacity.opacity = 255;
                        this.poolCartas.push(vista);
                    }
                    opciones.alLlegar?.();
                })
                .start();

            if (opciones.escalaPicoIntermedio !== undefined) {
                const pico = opciones.escalaPicoIntermedio;
                tween(nodo)
                    .to(dur * 0.5, {
                        scale: new Vec3(pico, pico, 1),
                        angle: (opciones.anguloInicial + opciones.anguloFinal) * 0.5
                    })
                    .to(dur * 0.5, {
                        scale: new Vec3(opciones.escalaFinal, opciones.escalaFinal, 1),
                        angle: opciones.anguloFinal
                    })
                    .start();
            } else {
                tween(nodo)
                    .to(
                        dur,
                        {
                            scale: new Vec3(opciones.escalaFinal, opciones.escalaFinal, 1),
                            angle: opciones.anguloFinal
                        },
                        { easing: "quadOut" }
                    )
                    .start();
            }

            if (opciones.desvanecerAlFinal) {
                tween(uiOpacity)
                    .delay(dur * 0.55)
                    .to(dur * 0.45, { opacity: 0 })
                    .start();
            }
        };

        if (opciones.delaySeg > 0) {
            this.scheduleOnce(iniciarVuelo, opciones.delaySeg);
        } else {
            iniciarVuelo();
        }
    }

    private mundoALocal(posMundo: Vec3): Vec3 | null {
        const contenedor = this.obtenerContenedor();
        const uiTrans = contenedor.getComponent(UITransform);
        if (!uiTrans) return null;
        return uiTrans.convertToNodeSpaceAR(posMundo);
    }

    private obtenerCartaDelPool(): CartaVisualVfx {
        while (this.poolCartas.length > 0) {
            const vista = this.poolCartas.pop()!;
            if (vista && vista.isValid) return vista;
        }
        const nuevo = instantiate(this.prefabCartaVfx);
        this.obtenerContenedor().addChild(nuevo);
        return nuevo.getComponent(CartaVisualVfx) || nuevo.addComponent(CartaVisualVfx);
    }

    private obtenerAgotadaDelPool(): CartaAgotadaVfx {
        while (this.poolAgotadas.length > 0) {
            const vfx = this.poolAgotadas.pop()!;
            if (vfx && vfx.isValid) return vfx;
        }
        const nuevo = instantiate(this.prefabCartaAgotada);
        this.obtenerContenedor().addChild(nuevo);
        return nuevo.getComponent(CartaAgotadaVfx) || nuevo.addComponent(CartaAgotadaVfx);
    }

    private devolverAgotadaAlPool(vfx: CartaAgotadaVfx): void {
        if (vfx && vfx.isValid) {
            vfx.node.active = false;
            if (!this.poolAgotadas.includes(vfx)) {
                this.poolAgotadas.push(vfx);
            }
        }
    }
}