import { Color } from "cc";
import { EventoVisualCombate } from "../../compartido/GameTypes";
import { CATALOGO_RELIQUIAS } from "../../compartido/Reliquias";
import { CombatEntityView } from "./CombatEntityView";

export class CombatSequencer {
    private cola: EventoVisualCombate[] = [];
    private procesando: boolean = false;

    constructor(
        private buscarVistaEntidad: (id: string) => CombatEntityView | undefined,
        private alTerminarColaCallback: () => void
    ) {}

    public get estaReproduciendo(): boolean {
        return this.procesando || this.cola.length > 0;
    }

    public encolarLote(eventos: EventoVisualCombate[]): void {
        if (!eventos || eventos.length === 0) return;
        this.cola.push(...eventos);
        if (!this.procesando) {
            void this.reproducirSiguiente();
        }
    }

    public limpiar(): void {
        this.cola = [];
        this.procesando = false;
    }

    private async reproducirSiguiente(): Promise<void> {
        this.procesando = true;

        while (this.cola.length > 0) {
            const ev = this.cola.shift()!;
            await this.ejecutarEvento(ev);
        }

        this.procesando = false;
        this.alTerminarColaCallback();
    }

    private async ejecutarEvento(ev: EventoVisualCombate): Promise<void> {
        switch (ev.tipo) {
            case "CARTA_JUGADA":
                await this.esperar(60);
                break;

            case "ATAQUE_EJECUTADO": {
                const atacante = this.buscarVistaEntidad(ev.atacanteId);
                if (atacante) {
                    await atacante.animarAtaque();
                }
                break;
            }

            case "IMPACTO_DANIO": {
                const objetivo = this.buscarVistaEntidad(ev.objetivoId);
                if (objetivo) {
                    await objetivo.animarImpacto(
                        ev.danioAlHp,
                        ev.danioBloqueado,
                        ev.hpRestante,
                        ev.bloqueoRestante
                    );
                }
                await this.esperar(70);
                break;
            }

            case "BLOQUEO_GANADO": {
                const entidad = this.buscarVistaEntidad(ev.entidadId);
                if (entidad) {
                    await entidad.animarBloqueo(ev.cantidad, ev.bloqueoTotal);
                }
                break;
            }

            case "ESTADO_APLICADO": {
                const entidad = this.buscarVistaEntidad(ev.entidadId);
                if (entidad) {
                    await entidad.animarEstado(ev.estadoId, ev.valorAgregado);
                }
                break;
            }

            case "CURACION_RECIBIDA": {
                const entidad = this.buscarVistaEntidad(ev.entidadId);
                if (entidad) {
                    await entidad.animarCuracion(ev.cantidad, ev.hpActual);
                }
                break;
            }

            case "RELIQUIA_ACTIVADA": {
                const portador = this.buscarVistaEntidad(ev.jugadorId);
                const infoReliquia = CATALOGO_RELIQUIAS[ev.reliquiaId];
                if (portador && infoReliquia) {
                    portador.mostrarTextoFlotante(`✨ ${infoReliquia.nombre}`, new Color(255, 215, 80));
                    await this.esperar(160);
                }
                break;
            }

            case "ENTIDAD_MURIO": {
                const entidad = this.buscarVistaEntidad(ev.entidadId);
                if (entidad) {
                    await entidad.animarMuerte();
                }
                break;
            }
        }
    }

    private esperar(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}