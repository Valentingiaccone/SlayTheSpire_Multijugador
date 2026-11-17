import { SpireState } from "../schema/SpireState";
import {
    generarOpcionesRecompensa,
    obtenerPrecioCarta
} from "../../../../assets/cliente/compartido/Cartas";
import {
    obtenerReliquiasRecompensa,
    obtenerPrecioReliquia
} from "../../../../assets/cliente/compartido/Reliquias";
import { ECONOMIA_CONFIG } from "../../../../assets/cliente/compartido/GameTypes";

export class ShopService {
    constructor(
        private state: SpireState,
        private onTiendaCompletadaCallback: () => void
    ) {}

    public iniciarEventoTienda(): void {
        this.state.jugadores.forEach((jugador) => {
            jugador.tiendaCompletada = false;
            jugador.tiendaEliminacionUsada = false;
            jugador.tiendaCartas.clear();
            jugador.tiendaReliquias.clear();

            const cartasOferta = generarOpcionesRecompensa(jugador.personajeId, 4);
            cartasOferta.forEach((cId) => jugador.tiendaCartas.push(cId));

            const reliquiasOferta = obtenerReliquiasRecompensa(
                this.state.jugadores,
                3,
                jugador.personajeId
            );
            reliquiasOferta.forEach((rId) => jugador.tiendaReliquias.push(rId));
        });

        this.state.faseActual = "SHOP";
    }

    public comprarCarta(sessionId: string, indiceTienda: number): void {
        if (this.state.faseActual !== "SHOP") return;
        const jugador = this.state.jugadores.get(sessionId);
        if (!jugador || jugador.tiendaCompletada) return;
        if (indiceTienda < 0 || indiceTienda >= jugador.tiendaCartas.length) return;

        const cartaId = jugador.tiendaCartas[indiceTienda];
        if (!cartaId) return;

        const precio = obtenerPrecioCarta(cartaId);
        if (jugador.oro < precio) return;

        jugador.oro -= precio;
        jugador.mazoMaestro.push(cartaId);
        jugador.tiendaCartas.splice(indiceTienda, 1);
    }

    public comprarReliquia(sessionId: string, indiceReliquia: number): void {
        if (this.state.faseActual !== "SHOP") return;
        const jugador = this.state.jugadores.get(sessionId);
        if (!jugador || jugador.tiendaCompletada) return;
        if (indiceReliquia < 0 || indiceReliquia >= jugador.tiendaReliquias.length) return;

        const reliquiaId = jugador.tiendaReliquias[indiceReliquia];
        if (!reliquiaId) return;

        const precio = obtenerPrecioReliquia(reliquiaId);
        if (jugador.oro < precio) return;

        jugador.oro -= precio;
        jugador.reliquias.push(reliquiaId);
        jugador.tiendaReliquias.splice(indiceReliquia, 1);
    }

    public eliminarCartaMazo(sessionId: string, indiceMazo: number): void {
        if (this.state.faseActual !== "SHOP") return;
        const jugador = this.state.jugadores.get(sessionId);
        if (!jugador || jugador.tiendaCompletada || jugador.tiendaEliminacionUsada) return;
        if (jugador.mazoMaestro.length <= 1) return;
        if (indiceMazo < 0 || indiceMazo >= jugador.mazoMaestro.length) return;

        const costo = ECONOMIA_CONFIG.COSTO_ELIMINAR_CARTA_TIENDA;
        if (jugador.oro < costo) return;

        jugador.oro -= costo;
        jugador.mazoMaestro.splice(indiceMazo, 1);
        jugador.tiendaEliminacionUsada = true;
    }

    public salirTienda(sessionId: string): void {
        if (this.state.faseActual !== "SHOP") return;
        const jugador = this.state.jugadores.get(sessionId);
        if (!jugador || jugador.tiendaCompletada) return;

        jugador.tiendaCompletada = true;
        this.verificarFinTienda();
    }

    public verificarFinTienda(): void {
        if (this.state.faseActual !== "SHOP") return;

        let todosListos = true;
        this.state.jugadores.forEach((j) => {
            if (!j.tiendaCompletada) todosListos = false;
        });

        if (todosListos) {
            this.onTiendaCompletadaCallback();
        }
    }
}