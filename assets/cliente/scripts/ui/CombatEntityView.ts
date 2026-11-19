import {
    _decorator,
    Component,
    Node,
    Label,
    Color,
    Vec3,
    tween,
    UITransform,
    Vec2,
    ProgressBar,
    Prefab,
    instantiate
} from "cc";
import { IEnemigoCliente, IJugadorCliente, IMapaEstadosCliente } from "../../compartido/GameTypes";
import { EstadoId } from "../../compartido/CondicionesYEfectos";
import { CalculadoraCombate } from "../../compartido/CalculadoraCombate";
import { SpriteSheetAnimator } from "../visual/SpriteSheetAnimator";
import { INFO_VISUAL_ESTADOS, INFO_VISUAL_INTENCIONES } from "../visual/CatalogoVisualCombate";
import { CallbackMostrarTooltip, IconoCombateView } from "./IconoCombateView";

const { ccclass, property } = _decorator;

const ORDEN_ESTADOS: EstadoId[] = [
    "FUERZA",
    "FUERZA_TEMPORAL",
    "VULNERABLE",
    "DEBIL",
    "ESPINAS",
    "VENENO",
    "AVARICIA",
    "ARRIESGAR_GANAR",
    "SIN_ROBO",
    "COMBUSTION"
];

@ccclass("CombatEntityView")
export class CombatEntityView extends Component {
    public entidadId: string = "";
    public esEnemigo: boolean = false;

    @property(SpriteSheetAnimator) animador: SpriteSheetAnimator = null!;
    @property(Label) labelNombre: Label = null!;

    // Barra visual + texto de HP independientes
    @property(ProgressBar) barraVida: ProgressBar = null!;
    @property(Label) labelVida: Label = null!;

    // Bloqueo independiente (se oculta automáticamente si es 0)
    @property(Node) nodoBloqueo: Node = null!;
    @property(Label) labelBloqueo: Label = null!;

    // Solo para aliados (pueden quedar vacíos en TemplateEnemigo)
    @property(Node) nodoEnergia: Node = null!;
    @property(Label) labelEnergia: Label = null!;
    @property(Label) labelEstadoTurno: Label = null!;

    // Solo para enemigos (puede quedar vacío en TemplateAliado)
    @property(IconoCombateView) vistaIntencion: IconoCombateView = null!;

    // Contenedor con Layout horizontal donde se instancian los íconos de estados
    @property(Node) contenedorEstados: Node = null!;
    @property(Prefab) prefabIconoEstado: Prefab = null!;

    private poolIconosEstado: IconoCombateView[] = [];
    private onSolicitarTooltip: CallbackMostrarTooltip | null = null;

    private posBase: Vec3 = new Vec3();
    private posBaseCapturada: boolean = false;

    private hpMostrado: number = 0;
    private hpMaxMostrado: number = 1;
    private bloqueoMostrado: number = 0;

    onLoad() {
        if (!this.animador) {
            this.animador = this.node.getComponentInChildren(SpriteSheetAnimator)!;
        }
    }

    public vincularTooltip(callback: CallbackMostrarTooltip): void {
        this.onSolicitarTooltip = callback;
    }

    private asegurarPosBase(): void {
        if (!this.posBaseCapturada) {
            const objetivo = this.obtenerNodoAnimable();
            this.posBase.set(objetivo.position);
            this.posBaseCapturada = true;
        }
    }

    private obtenerNodoAnimable(): Node {
        return this.animador ? this.animador.node : this.node;
    }

    public contienePuntoMundo(puntoMundo: Vec3): boolean {
        if (!this.node.active) return false;
        const uiTrans = this.node.getComponent(UITransform);
        if (!uiTrans) return false;
        return uiTrans.getBoundingBoxToWorld().contains(new Vec2(puntoMundo.x, puntoMundo.y));
    }

    public sincronizarEnemigo(
        enemigo: IEnemigoCliente,
        bloquearHpYBloqueo: boolean,
        estadosMiJugador?: IMapaEstadosCliente
    ): void {
        this.entidadId = enemigo.uid;
        this.esEnemigo = true;
        this.hpMaxMostrado = Math.max(1, enemigo.hpMax);

        if (this.labelNombre) {
            this.labelNombre.string = enemigo.nombre;
        }
        if (this.nodoEnergia) this.nodoEnergia.active = false;
        if (this.labelEstadoTurno) this.labelEstadoTurno.node.active = false;

        void this.animador?.configurar(enemigo.enemigoId);

        this.actualizarIntencionEnemigo(enemigo, estadosMiJugador);
        this.actualizarIconosEstados(enemigo.estados);

        if (!bloquearHpYBloqueo) {
            this.hpMostrado = enemigo.hp;
            this.bloqueoMostrado = enemigo.bloqueo;
            this.node.active = enemigo.hp > 0;
            this.refrescarVidaYBloqueo();
        }
    }

    public sincronizarAliado(
        jugador: IJugadorCliente,
        esYo: boolean,
        bloquearHpYBloqueo: boolean
    ): void {
        this.entidadId = jugador.sessionId;
        this.esEnemigo = false;
        this.node.active = true;
        this.hpMaxMostrado = Math.max(1, jugador.hpMax);

        if (this.labelNombre) {
            this.labelNombre.string = esYo ? `${jugador.nombre} (Vos)` : jugador.nombre;
        }
        if (this.vistaIntencion) {
            this.vistaIntencion.node.active = false;
        }
        if (this.nodoEnergia) {
            this.nodoEnergia.active = true;
        }
        if (this.labelEnergia) {
            this.labelEnergia.string = `${jugador.energia}/${jugador.energiaMax}`;
        }

        void this.animador?.configurar(jugador.personajeId);
        this.actualizarIconosEstados(jugador.estados);

        if (!bloquearHpYBloqueo) {
            this.hpMostrado = jugador.hp;
            this.bloqueoMostrado = jugador.bloqueo;
            this.refrescarVidaYBloqueo();
        }

        if (this.labelEstadoTurno) {
            this.labelEstadoTurno.node.active = true;
            this.labelEstadoTurno.string =
                this.hpMostrado <= 0
                    ? "CAÍDO"
                    : jugador.turnoTerminado
                    ? "Turno Listo"
                    : "Jugando";
            this.labelEstadoTurno.color =
                this.hpMostrado <= 0
                    ? new Color(255, 110, 110)
                    : jugador.turnoTerminado
                    ? new Color(150, 255, 150)
                    : new Color(255, 255, 255);
        }
    }

    private actualizarIntencionEnemigo(
        enemigo: IEnemigoCliente,
        estadosMiJugador?: IMapaEstadosCliente
    ): void {
        if (!this.vistaIntencion) return;

        const info = INFO_VISUAL_INTENCIONES[enemigo.intencionTipo];
        if (!info || enemigo.hp <= 0) {
            this.vistaIntencion.node.active = false;
            return;
        }

        this.vistaIntencion.node.active = true;

        let valorMostrar = enemigo.intencionValor;
        let textoValor = `${valorMostrar}`;
        let colorTexto = new Color(255, 255, 255);
        const golpes = enemigo.intencionGolpes || 1;

        if (enemigo.intencionTipo === "ATACAR" || enemigo.intencionTipo === "ATACAR_Y_BLOQUEAR") {
            const danioReal = CalculadoraCombate.calcularDanioAtaque(
                enemigo.intencionValor,
                enemigo.estados,
                estadosMiJugador
            );
            valorMostrar = danioReal;
            textoValor = golpes > 1 && enemigo.intencionTipo === "ATACAR" ? `${danioReal}x${golpes}` : `${danioReal}`;

            if (danioReal > enemigo.intencionValor) {
                colorTexto = new Color(255, 120, 120);
            } else if (danioReal < enemigo.intencionValor) {
                colorTexto = new Color(140, 220, 255);
            }
        }

        const descripcion = info.construirDescripcion(
            valorMostrar,
            golpes,
            enemigo.intencionInvocarId || ""
        );

        this.vistaIntencion.configurar(
            "intenciones",
            info.sprite,
            textoValor,
            info.nombre,
            descripcion,
            this.onSolicitarTooltip,
            colorTexto
        );
    }

    private actualizarIconosEstados(estados?: IMapaEstadosCliente): void {
        if (!this.contenedorEstados || !this.prefabIconoEstado) return;

        const leer = (clave: EstadoId): number => {
            if (!estados) return 0;
            return typeof estados.get === "function"
                ? estados.get(clave) || 0
                : ((estados as unknown as Record<string, number>)[clave] || 0);
        };

        const activos: { id: EstadoId; valor: number }[] = [];
        for (const estadoId of ORDEN_ESTADOS) {
            const val = leer(estadoId);
            if (val !== 0) {
                activos.push({ id: estadoId, valor: val });
            }
        }

        while (this.poolIconosEstado.length < activos.length) {
            const nodo = instantiate(this.prefabIconoEstado);
            this.contenedorEstados.addChild(nodo);
            const vista = nodo.getComponent(IconoCombateView) || nodo.addComponent(IconoCombateView);
            this.poolIconosEstado.push(vista);
        }

        for (let i = 0; i < this.poolIconosEstado.length; i++) {
            const vista = this.poolIconosEstado[i];
            if (i >= activos.length) {
                vista.node.active = false;
                continue;
            }

            const { id, valor } = activos[i];
            const info = INFO_VISUAL_ESTADOS[id];
            vista.node.active = true;

            const textoVal = id === "SIN_ROBO" ? "" : `${valor}`;
            const colorVal = valor < 0 ? new Color(255, 120, 120) : new Color(255, 255, 255);

            vista.configurar(
                "estados",
                info.sprite,
                textoVal,
                info.nombre,
                info.construirDescripcion(valor),
                this.onSolicitarTooltip,
                colorVal
            );
        }
    }

    private refrescarVidaYBloqueo(): void {
        if (this.labelVida) {
            this.labelVida.string = `${this.hpMostrado}/${this.hpMaxMostrado}`;
        }
        if (this.barraVida) {
            this.barraVida.progress = Math.max(0, Math.min(1, this.hpMostrado / this.hpMaxMostrado));
        }

        const tieneBloqueo = this.bloqueoMostrado > 0;
        if (this.nodoBloqueo) {
            this.nodoBloqueo.active = tieneBloqueo;
        }
        if (this.labelBloqueo) {
            this.labelBloqueo.string = `${this.bloqueoMostrado}`;
            if (!this.nodoBloqueo) {
                this.labelBloqueo.node.active = tieneBloqueo;
            }
        }
    }

    public aplicarValoresVisuales(hp: number, bloqueo: number): void {
        this.hpMostrado = hp;
        this.bloqueoMostrado = bloqueo;
        this.refrescarVidaYBloqueo();

        if (!this.esEnemigo && this.hpMostrado <= 0 && this.labelEstadoTurno) {
            this.labelEstadoTurno.string = "CAÍDO";
            this.labelEstadoTurno.color = new Color(255, 110, 110);
        }
    }

    public async animarAtaque(): Promise<void> {
        if (!this.node.active) return;
        this.asegurarPosBase();

        const objetivo = this.obtenerNodoAnimable();
        const direccionX = this.esEnemigo ? -30 : 30;
        const destino = new Vec3(this.posBase.x + direccionX, this.posBase.y + 8, 0);

        const promesaAnimacion = this.animador?.reproducirUnaVez("atacar") || Promise.resolve(false);
        const promesaTween = new Promise<void>((resolve) => {
            tween(objetivo)
                .to(0.1, { position: destino })
                .to(0.12, { position: this.posBase })
                .call(() => resolve())
                .start();
        });

        await Promise.all([promesaAnimacion, promesaTween]);
    }

    public async animarImpacto(
        danioAlHp: number,
        danioBloqueado: number,
        hpRestante: number,
        bloqueoRestante: number
    ): Promise<void> {
        this.aplicarValoresVisuales(hpRestante, bloqueoRestante);

        if (danioAlHp > 0) {
            this.mostrarTextoFlotante(`-${danioAlHp} HP`, new Color(255, 85, 85));
        } else if (danioBloqueado > 0) {
            this.mostrarTextoFlotante(`🛡️ -${danioBloqueado}`, new Color(130, 200, 255));
        } else {
            this.mostrarTextoFlotante(`0`, new Color(200, 200, 200));
        }

        if (!this.node.active) return;

        this.asegurarPosBase();
        const objetivo = this.obtenerNodoAnimable();

        const promesaDanio =
            danioAlHp > 0 && hpRestante > 0 && this.animador
                ? this.animador.reproducirUnaVez("recibir_danio")
                : Promise.resolve(false);

        const promesaShake = new Promise<void>((resolve) => {
            tween(objetivo)
                .to(0.05, { position: new Vec3(this.posBase.x + 10, this.posBase.y, 0) })
                .to(0.05, { position: new Vec3(this.posBase.x - 10, this.posBase.y, 0) })
                .to(0.05, { position: new Vec3(this.posBase.x + 5, this.posBase.y, 0) })
                .to(0.05, { position: this.posBase })
                .call(() => resolve())
                .start();
        });

        await Promise.all([promesaDanio, promesaShake]);
    }

    public animarBloqueo(cantidad: number, bloqueoTotal: number): Promise<void> {
        return new Promise((resolve) => {
            this.bloqueoMostrado = bloqueoTotal;
            this.refrescarVidaYBloqueo();
            this.mostrarTextoFlotante(`+${cantidad} 🛡️`, new Color(120, 210, 255));

            const objetivo = this.obtenerNodoAnimable();
            const escalaBase = objetivo.scale.clone();
            tween(objetivo)
                .to(0.08, { scale: new Vec3(escalaBase.x * 1.06, escalaBase.y * 1.06, 1) })
                .to(0.08, { scale: escalaBase })
                .call(() => resolve())
                .start();
        });
    }

    public animarCuracion(cantidad: number, hpActual: number): Promise<void> {
        return new Promise((resolve) => {
            this.hpMostrado = hpActual;
            this.refrescarVidaYBloqueo();
            this.mostrarTextoFlotante(`+${cantidad} 💚`, new Color(120, 255, 140));

            const objetivo = this.obtenerNodoAnimable();
            const escalaBase = objetivo.scale.clone();
            tween(objetivo)
                .to(0.1, { scale: new Vec3(escalaBase.x * 1.06, escalaBase.y * 1.06, 1) })
                .to(0.1, { scale: escalaBase })
                .call(() => resolve())
                .start();
        });
    }

    public animarEstado(estadoId: string, valorAgregado: number): Promise<void> {
        return new Promise((resolve) => {
            const nombreEstado = INFO_VISUAL_ESTADOS[estadoId as EstadoId]?.nombre || estadoId;
            const signo = valorAgregado > 0 ? "+" : "";
            this.mostrarTextoFlotante(`${signo}${valorAgregado} ${nombreEstado}`, new Color(255, 220, 110));
            setTimeout(() => resolve(), 140);
        });
    }

    public async animarMuerte(): Promise<void> {
        this.hpMostrado = 0;
        this.bloqueoMostrado = 0;
        this.refrescarVidaYBloqueo();

        if (this.vistaIntencion) {
            this.vistaIntencion.node.active = false;
        }

        const reprodujoSprites = this.animador ? await this.animador.reproducirUnaVez("morir") : false;

        if (this.esEnemigo) {
            if (!reprodujoSprites) {
                const objetivo = this.obtenerNodoAnimable();
                const escalaBase = objetivo.scale.clone();
                await new Promise<void>((resolve) => {
                    tween(objetivo)
                        .to(0.22, { scale: new Vec3(escalaBase.x * 0.2, escalaBase.y * 0.2, 1) })
                        .call(() => {
                            objetivo.setScale(escalaBase);
                            resolve();
                        })
                        .start();
                });
            }
            this.node.active = false;
        }
    }

    public mostrarTextoFlotante(texto: string, color: Color): void {
        const nodoPopup = new Node("TextoFlotanteCombate");
        this.node.addChild(nodoPopup);
        nodoPopup.setPosition(0, 45, 0);

        const lbl = nodoPopup.addComponent(Label);
        lbl.string = texto;
        lbl.fontSize = 22;
        lbl.lineHeight = 26;
        lbl.color = color;

        tween(nodoPopup)
            .to(0.45, { position: new Vec3(0, 105, 0) })
            .call(() => nodoPopup.destroy())
            .start();
    }
}