"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionQueue = void 0;
class ActionQueue {
    constructor() {
        this.cola = [];
        this.eventosVisuales = [];
        this.procesando = false;
    }
    static { this.MAX_PASOS_SEGURIDAD = 500; }
    encolarAlFinal(accion) {
        this.cola.push(accion);
    }
    encolarAlInicio(accion) {
        this.cola.unshift(accion);
    }
    emitirVisual(evento) {
        this.eventosVisuales.push(evento);
    }
    procesarTodo(state, bus) {
        if (this.procesando)
            return [];
        this.procesando = true;
        let pasos = 0;
        while (this.cola.length > 0 && pasos < ActionQueue.MAX_PASOS_SEGURIDAD) {
            if (state.faseActual !== "COMBAT") {
                this.cola = [];
                break;
            }
            const accion = this.cola.shift();
            accion.ejecutar(state, this, bus);
            pasos++;
        }
        if (pasos >= ActionQueue.MAX_PASOS_SEGURIDAD) {
            console.warn("[ActionQueue] Se alcanzó el límite de seguridad de 500 acciones anidadas.");
            this.cola = [];
        }
        this.procesando = false;
        const lote = [...this.eventosVisuales];
        this.eventosVisuales = [];
        return lote;
    }
}
exports.ActionQueue = ActionQueue;
