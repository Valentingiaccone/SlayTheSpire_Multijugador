"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CombatEventBus = void 0;
class CombatEventBus {
    constructor() {
        this.listeners = {};
    }
    suscribir(evento, listener) {
        if (!this.listeners[evento]) {
            this.listeners[evento] = [];
        }
        this.listeners[evento].push(listener);
    }
    emitir(evento, payload) {
        const lista = this.listeners[evento];
        if (!lista)
            return;
        for (const fn of lista) {
            fn(payload);
        }
    }
}
exports.CombatEventBus = CombatEventBus;
