import { _decorator, Component, Node, Label, Color, Vec3, tween, UITransform, Vec2 } from "cc";
import { IEnemigoCliente, IJugadorCliente, IMapaEstadosCliente } from "../../compartido/GameTypes";
import { CalculadoraCombate } from "../../compartido/CalculadoraCombate";

const { ccclass } = _decorator;

@ccclass("CombatEntityView")
export class CombatEntityView extends Component {
    public entidadId: string = "";
    public esEnemigo: boolean = false;

    private labelPrincipal: Label | null = null;
    private posBase: Vec3 = new Vec3();
    private posBaseCapturada: boolean = false;

    private hpMostrado: number = 0;
    private hpMaxMostrado: number = 0;
    private bloqueoMostrado: number = 0;
    private nombreMostrado: string = "";
    private intencionTexto: string = "";
    private energiaTexto: string = "";
    private estadoTurnoTexto: string = "";
    private colorTexto: Color = new Color(255, 255, 255);
    private estadosTexto: string = "";

    onLoad() {
        this.labelPrincipal = this.node.getComponent(Label) || this.node.getComponentInChildren(Label);
    }

    private asegurarPosBase() {
        if (!this.posBaseCapturada) {
            this.posBase.set(this.node.position);
            this.posBaseCapturada = true;
        }
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
        this.nombreMostrado = enemigo.nombre;
        this.hpMaxMostrado = enemigo.hpMax;
        this.estadosTexto = this.formatearEstados(enemigo.estados);

        if (enemigo.intencionTipo === "ATACAR") {
            const danioReal = CalculadoraCombate.calcularDanioAtaque(
                enemigo.intencionValor,
                enemigo.estados,
                estadosMiJugador
            );
            const indicador =
                danioReal > enemigo.intencionValor
                    ? "▲"
                    : danioReal < enemigo.intencionValor
                    ? "▼"
                    : "";
            this.intencionTexto = `⚔️ Ataca por ${danioReal}${indicador} (a TODOS)`;
        } else {
            this.intencionTexto = `🛡️ Se cubrirá +${enemigo.intencionValor}`;
        }

        if (!bloquearHpYBloqueo) {
            this.hpMostrado = enemigo.hp;
            this.bloqueoMostrado = enemigo.bloqueo;
            this.node.active = enemigo.hp > 0;
        }

        this.refrescarLabel();
    }

    public sincronizarAliado(
        jugador: IJugadorCliente,
        esYo: boolean,
        bloquearHpYBloqueo: boolean
    ): void {
        this.entidadId = jugador.sessionId;
        this.esEnemigo = false;
        this.node.active = true;

        const tagYo = esYo ? " (Vos)" : "";
        this.nombreMostrado = `${jugador.nombre}${tagYo}`;
        this.hpMaxMostrado = jugador.hpMax;
        this.estadosTexto = this.formatearEstados(jugador.estados);
        this.energiaTexto = `⚡ ${jugador.energia}/${jugador.energiaMax}`;

        if (!bloquearHpYBloqueo) {
            this.hpMostrado = jugador.hp;
            this.bloqueoMostrado = jugador.bloqueo;
        }

        this.estadoTurnoTexto =
            this.hpMostrado <= 0
                ? "[CAÍDO]"
                : jugador.turnoTerminado
                ? "[Turno Listo]"
                : "[Jugando]";

        this.colorTexto = jugador.turnoTerminado
            ? new Color(150, 255, 150)
            : new Color(255, 255, 255);

        this.refrescarLabel();
    }

    public aplicarValoresVisuales(hp: number, bloqueo: number): void {
        this.hpMostrado = hp;
        this.bloqueoMostrado = bloqueo;
        if (!this.esEnemigo && this.hpMostrado <= 0) {
            this.estadoTurnoTexto = "[CAÍDO]";
        }
        this.refrescarLabel();
    }

    public animarAtaque(): Promise<void> {
        return new Promise((resolve) => {
            if (!this.node.active) {
                resolve();
                return;
            }
            this.asegurarPosBase();
            const direccionX = this.esEnemigo ? -35 : 35;
            const destino = new Vec3(this.posBase.x + direccionX, this.posBase.y + 12, 0);

            tween(this.node)
                .to(0.1, { position: destino, scale: new Vec3(1.08, 1.08, 1) })
                .to(0.12, { position: this.posBase, scale: new Vec3(1, 1, 1) })
                .call(() => resolve())
                .start();
        });
    }

    public animarImpacto(
        danioAlHp: number,
        danioBloqueado: number,
        hpRestante: number,
        bloqueoRestante: number
    ): Promise<void> {
        return new Promise((resolve) => {
            this.aplicarValoresVisuales(hpRestante, bloqueoRestante);

            if (danioAlHp > 0) {
                this.mostrarTextoFlotante(`-${danioAlHp} HP`, new Color(255, 85, 85));
            } else if (danioBloqueado > 0) {
                this.mostrarTextoFlotante(`🛡️ -${danioBloqueado}`, new Color(130, 200, 255));
            } else {
                this.mostrarTextoFlotante(`0`, new Color(200, 200, 200));
            }

            if (!this.node.active) {
                resolve();
                return;
            }

            this.asegurarPosBase();
            tween(this.node)
                .to(0.05, { position: new Vec3(this.posBase.x + 12, this.posBase.y, 0) })
                .to(0.05, { position: new Vec3(this.posBase.x - 12, this.posBase.y, 0) })
                .to(0.05, { position: new Vec3(this.posBase.x + 6, this.posBase.y, 0) })
                .to(0.05, { position: this.posBase })
                .call(() => resolve())
                .start();
        });
    }

    public animarBloqueo(cantidad: number, bloqueoTotal: number): Promise<void> {
        return new Promise((resolve) => {
            this.bloqueoMostrado = bloqueoTotal;
            this.refrescarLabel();
            this.mostrarTextoFlotante(`+${cantidad} 🛡️`, new Color(120, 210, 255));

            tween(this.node)
                .to(0.08, { scale: new Vec3(1.06, 1.06, 1) })
                .to(0.08, { scale: new Vec3(1, 1, 1) })
                .call(() => resolve())
                .start();
        });
    }

    public animarCuracion(cantidad: number, hpActual: number): Promise<void> {
        return new Promise((resolve) => {
            this.hpMostrado = hpActual;
            this.refrescarLabel();
            this.mostrarTextoFlotante(`+${cantidad} 💚`, new Color(120, 255, 140));

            tween(this.node)
                .to(0.1, { scale: new Vec3(1.06, 1.06, 1) })
                .to(0.1, { scale: new Vec3(1, 1, 1) })
                .call(() => resolve())
                .start();
        });
    }

    public animarEstado(estadoId: string, valorAgregado: number): Promise<void> {
        return new Promise((resolve) => {
            const signo = valorAgregado > 0 ? "+" : "";
            this.mostrarTextoFlotante(`${signo}${valorAgregado} ${estadoId}`, new Color(255, 220, 110));
            setTimeout(() => resolve(), 140);
        });
    }

    public animarMuerte(): Promise<void> {
        return new Promise((resolve) => {
            this.hpMostrado = 0;
            this.bloqueoMostrado = 0;
            this.refrescarLabel();

            if (this.esEnemigo) {
                tween(this.node)
                    .to(0.2, { scale: new Vec3(0.2, 0.2, 1) })
                    .call(() => {
                        this.node.setScale(1, 1, 1);
                        this.node.active = false;
                        resolve();
                    })
                    .start();
            } else {
                resolve();
            }
        });
    }

    public mostrarTextoFlotante(texto: string, color: Color): void {
        const nodoPopup = new Node("TextoFlotanteCombate");
        this.node.addChild(nodoPopup);
        nodoPopup.setPosition(0, 35, 0);

        const lbl = nodoPopup.addComponent(Label);
        lbl.string = texto;
        lbl.fontSize = 22;
        lbl.lineHeight = 26;
        lbl.color = color;

        tween(nodoPopup)
            .to(0.45, { position: new Vec3(0, 95, 0) })
            .call(() => nodoPopup.destroy())
            .start();
    }

    private refrescarLabel(): void {
        if (!this.labelPrincipal) {
            this.labelPrincipal = this.node.getComponent(Label) || this.node.getComponentInChildren(Label);
        }
        if (!this.labelPrincipal) return;

        if (this.esEnemigo) {
            const bloqueoTxt = this.bloqueoMostrado > 0 ? ` (+${this.bloqueoMostrado} 🛡️)` : "";
            this.labelPrincipal.string = `${this.nombreMostrado}${this.estadosTexto}\nHP: ${this.hpMostrado}/${this.hpMaxMostrado}${bloqueoTxt}\n${this.intencionTexto}`;
        } else {
            this.labelPrincipal.string = `${this.nombreMostrado}${this.estadosTexto} | HP: ${this.hpMostrado}/${this.hpMaxMostrado} | 🛡️ ${this.bloqueoMostrado} | ${this.energiaTexto} ${this.estadoTurnoTexto}`;
            this.labelPrincipal.color = this.colorTexto;
        }
    }

    private formatearEstados(estados?: IMapaEstadosCliente): string {
        if (!estados) return "";
        const leer = (clave: string): number =>
            typeof estados.get === "function"
                ? estados.get(clave) || 0
                : ((estados as unknown as Record<string, number>)[clave] || 0);

        const lista: string[] = [];
        const fuerza = leer("FUERZA");
        const fuerzaTemp = leer("FUERZA_TEMPORAL");
        const vuln = leer("VULNERABLE");
        const debil = leer("DEBIL");
        const espinas = leer("ESPINAS");
        const veneno = leer("VENENO");
        const avaricia = leer("AVARICIA");
        const arriesgar = leer("ARRIESGAR_GANAR");
        const sinRobo = leer("SIN_ROBO");
        const combustion = leer("COMBUSTION");

        if (fuerza !== 0) lista.push(`💪${fuerza > 0 ? "+" : ""}${fuerza}`);
        if (fuerzaTemp > 0) lista.push(`⏳FuerzaTemp(-${fuerzaTemp})`);
        if (vuln > 0) lista.push(`💔Vuln(${vuln})`);
        if (debil > 0) lista.push(`📉Débil(${debil})`);
        if (espinas > 0) lista.push(`🌵Espinas(${espinas})`);
        if (veneno > 0) lista.push(`☠️Veneno(${veneno})`);
        if (avaricia > 0) lista.push(`💰Avaricia(${avaricia})`);
        if (arriesgar > 0) lista.push(`🎲Arriesgar(${arriesgar})`);
        if (sinRobo > 0) lista.push(`🚫SinRobo`);
        if (combustion > 0) lista.push(`🔥Combustión(${combustion})`);

        return lista.length > 0 ? ` [${lista.join(" ")}]` : "";
    }
}