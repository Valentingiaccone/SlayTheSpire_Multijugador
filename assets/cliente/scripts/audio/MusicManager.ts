import {
    _decorator,
    Component,
    AudioSource,
    AudioClip,
    resources,
    tween,
    Tween,
    input,
    Input
} from "cc";
import {
    NetworkManager,
    NetworkEvents,
    EVENTO_ESTADO_ACTUALIZADO
} from "../network/NetworkManager";
import { IEstadoSalaCliente } from "../../compartido/GameTypes";
import {
    CONFIG_MUSICA,
    FASES_QUE_MANTIENEN_MUSICA_SI_VACIO,
    FASES_SIN_BUCLE,
    obtenerListaOstParaEstado,
    TipoCombateMusica,
    VOLUMEN_POR_PISTA
} from "./CatalogoMusica";

const { ccclass, property } = _decorator;

@ccclass("MusicManager")
export class MusicManager extends Component {
    public static instance: MusicManager | null = null;

    @property({ range: [0, 1, 0.05] })
    volumenMaestro: number = CONFIG_MUSICA.VOLUMEN_BASE;

    @property
    silenciado: boolean = false;

    private audioSource: AudioSource = null!;
    private cacheClips: Map<string, AudioClip> = new Map();
    private ultimaPistaPorGrupo: Map<string, string> = new Map();

    private claveContextoActual: string = "";
    private pistaActual: string = "";
    private loopActual: boolean = true;
    private tokenCarga: number = 0;

    onLoad() {
        if (MusicManager.instance) {
            this.node.destroy();
            return;
        }
        MusicManager.instance = this;

        this.audioSource =
            this.node.getComponent(AudioSource) || this.node.addComponent(AudioSource);
        this.audioSource.playOnAwake = false;
        this.audioSource.volume = this.silenciado ? 0 : this.volumenMaestro;

        // Desbloquea la reproducción en navegadores si el primer audio intentó sonar antes del primer clic
        input.on(Input.EventType.TOUCH_START, this.reintentarSiBloqueadoPorNavegador, this);
        input.on(Input.EventType.MOUSE_DOWN, this.reintentarSiBloqueadoPorNavegador, this);
    }

    onEnable() {
        NetworkEvents.on(EVENTO_ESTADO_ACTUALIZADO, this.onEstadoActualizado, this);
        if (NetworkManager.instance?.room?.state) {
            this.onEstadoActualizado(NetworkManager.instance.room.state);
        }
    }

    onDisable() {
        NetworkEvents.off(EVENTO_ESTADO_ACTUALIZADO, this.onEstadoActualizado, this);
    }

    onDestroy() {
        if (MusicManager.instance === this) {
            MusicManager.instance = null;
        }
        input.off(Input.EventType.TOUCH_START, this.reintentarSiBloqueadoPorNavegador, this);
        input.off(Input.EventType.MOUSE_DOWN, this.reintentarSiBloqueadoPorNavegador, this);
        if (this.audioSource) {
            Tween.stopAllByTarget(this.audioSource);
        }
    }

    private onEstadoActualizado(state: IEstadoSalaCliente): void {
        const claveContexto = this.construirClaveContexto(state);
        if (claveContexto === this.claveContextoActual) return;
        this.claveContextoActual = claveContexto;

        const listaPistas = obtenerListaOstParaEstado(
            state.faseActual,
            state.ambientacionActual,
            state.esCombateElite,
            state.esCombateJefe
        );

        if (listaPistas.length === 0) {
            if (!FASES_QUE_MANTIENEN_MUSICA_SI_VACIO.includes(state.faseActual)) {
                void this.detenerConFade();
            }
            return;
        }

        const claveGrupo = this.construirClaveGrupo(state);
        const pistaElegida = this.elegirPistaAleatoria(claveGrupo, listaPistas);
        const debeHacerBucle = !FASES_SIN_BUCLE.includes(state.faseActual);

        void this.reproducirPista(pistaElegida, debeHacerBucle);
    }

    /**
     * Identifica una instancia concreta de fase/combate para que:
     * - Al iniciar un combate nuevo se sortee 1 OST y quede en bucle toda la pelea.
     * - Votar nodos en el mapa o jugar cartas no reinicie la canción.
     */
    private construirClaveContexto(state: IEstadoSalaCliente): string {
        if (state.faseActual === "COMBAT") {
            const tipo: TipoCombateMusica = state.esCombateJefe
                ? "JEFE"
                : state.esCombateElite
                ? "ELITE"
                : "NORMAL";
            return `COMBAT|${state.ambientacionActual}|${tipo}|${state.mapaActual}|${state.nodoActualId}`;
        }

        if (state.faseActual === "EVENT") {
            return `EVENT|${state.ambientacionActual}|${state.mapaActual}|${state.nodoActualId}|${state.eventoActualId}`;
        }

        return `${state.faseActual}|${state.ambientacionActual}|${state.mapaActual}|${state.nodoActualId}`;
    }

    /** Agrupa el historial para evitar repetir la misma pista dos veces seguidas en el mismo tipo de pantalla */
    private construirClaveGrupo(state: IEstadoSalaCliente): string {
        if (state.faseActual === "COMBAT") {
            const tipo: TipoCombateMusica = state.esCombateJefe
                ? "JEFE"
                : state.esCombateElite
                ? "ELITE"
                : "NORMAL";
            return `COMBAT_${state.ambientacionActual}_${tipo}`;
        }
        return `${state.faseActual}_${state.ambientacionActual}`;
    }

    private elegirPistaAleatoria(claveGrupo: string, lista: string[]): string {
        if (lista.length === 1) {
            this.ultimaPistaPorGrupo.set(claveGrupo, lista[0]);
            return lista[0];
        }

        const ultima = this.ultimaPistaPorGrupo.get(claveGrupo);
        const candidatas = ultima ? lista.filter((p) => p !== ultima) : lista;
        const poolFinal = candidatas.length > 0 ? candidatas : lista;

        const elegida = poolFinal[Math.floor(Math.random() * poolFinal.length)];
        this.ultimaPistaPorGrupo.set(claveGrupo, elegida);
        return elegida;
    }

    public async reproducirPista(nombrePista: string, loop: boolean = true): Promise<void> {
        // Si ya está sonando exactamente la misma canción, la dejamos continuar sin cortes
        if (this.pistaActual === nombrePista && this.audioSource.playing) {
            this.audioSource.loop = loop;
            this.loopActual = loop;
            return;
        }

        const tokenLocal = ++this.tokenCarga;
        const clip = await this.cargarClip(nombrePista);

        if (!this.isValid || tokenLocal !== this.tokenCarga || !clip) return;

        const duracionFade = Math.max(0, CONFIG_MUSICA.DURACION_FADE_SEGUNDOS);

        if (this.audioSource.playing && duracionFade > 0) {
            await this.animarVolumen(0, duracionFade);
            if (!this.isValid || tokenLocal !== this.tokenCarga) return;
        }

        this.audioSource.stop();
        this.audioSource.clip = clip;
        this.audioSource.loop = loop;
        this.pistaActual = nombrePista;
        this.loopActual = loop;

        const volumenObjetivo = this.calcularVolumenObjetivo(nombrePista);

        if (duracionFade > 0 && volumenObjetivo > 0) {
            this.audioSource.volume = 0;
            this.audioSource.play();
            await this.animarVolumen(volumenObjetivo, duracionFade);
        } else {
            this.audioSource.volume = volumenObjetivo;
            this.audioSource.play();
        }
    }

    public async detenerConFade(): Promise<void> {
        const tokenLocal = ++this.tokenCarga;
        this.pistaActual = "";

        if (!this.audioSource || !this.audioSource.playing) return;

        const duracionFade = Math.max(0, CONFIG_MUSICA.DURACION_FADE_SEGUNDOS);
        if (duracionFade > 0) {
            await this.animarVolumen(0, duracionFade);
            if (!this.isValid || tokenLocal !== this.tokenCarga) return;
        }

        this.audioSource.stop();
    }

    public setVolumen(nuevoVolumen: number): void {
        this.volumenMaestro = Math.max(0, Math.min(1, nuevoVolumen));
        if (this.audioSource && this.audioSource.isValid) {
            Tween.stopAllByTarget(this.audioSource);
            this.audioSource.volume = this.calcularVolumenObjetivo(this.pistaActual);
        }
    }

    public toggleSilencio(): void {
        this.silenciado = !this.silenciado;
        if (this.audioSource && this.audioSource.isValid) {
            Tween.stopAllByTarget(this.audioSource);
            this.audioSource.volume = this.calcularVolumenObjetivo(this.pistaActual);
        }
    }

    private calcularVolumenObjetivo(nombrePista: string): number {
        if (this.silenciado) return 0;
        const factorPista = nombrePista ? VOLUMEN_POR_PISTA[nombrePista] ?? 1 : 1;
        return Math.max(0, Math.min(1, this.volumenMaestro * factorPista));
    }

    private cargarClip(nombrePista: string): Promise<AudioClip | null> {
        const carpeta = CONFIG_MUSICA.CARPETA_RESOURCES.replace(/^\/+|\/+$/g, "");
        const ruta = carpeta ? `${carpeta}/${nombrePista}` : nombrePista;

        if (this.cacheClips.has(ruta)) {
            return Promise.resolve(this.cacheClips.get(ruta)!);
        }

        return new Promise((resolve) => {
            resources.load(ruta, AudioClip, (err, clip) => {
                if (err || !clip) {
                    console.warn(`[MusicManager] No se encontró el OST en: resources/${ruta}`);
                    resolve(null);
                    return;
                }
                this.cacheClips.set(ruta, clip);
                resolve(clip);
            });
        });
    }

    private animarVolumen(destino: number, duracionSeg: number): Promise<void> {
        return new Promise((resolve) => {
            if (!this.audioSource || !this.audioSource.isValid) {
                resolve();
                return;
            }
            Tween.stopAllByTarget(this.audioSource);
            tween(this.audioSource)
                .to(duracionSeg, { volume: destino })
                .call(() => resolve())
                .start();
        });
    }

    private reintentarSiBloqueadoPorNavegador(): void {
        if (
            this.pistaActual &&
            this.audioSource &&
            this.audioSource.clip &&
            !this.audioSource.playing &&
            this.loopActual
        ) {
            this.audioSource.volume = this.calcularVolumenObjetivo(this.pistaActual);
            this.audioSource.play();
        }
    }
}