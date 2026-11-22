"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PERSONAJES_INFO = exports.ECONOMIA_CONFIG = exports.MENSAJES = void 0;
exports.MENSAJES = {
    ELEGIR_PERSONAJE: "elegir_personaje",
    TOGGLE_LISTO: "toggle_listo",
    VOTAR_NODO: "votar_nodo",
    JUGAR_CARTA: "jugar_carta",
    TERMINAR_TURNO: "terminar_turno",
    RESPONDER_SELECCION_MANO: "responder_seleccion_mano",
    ELEGIR_RECOMPENSA: "elegir_recompensa",
    ABRIR_COFRE: "abrir_cofre",
    VOTAR_RELIQUIA_COFRE: "votar_reliquia_cofre",
    ACCION_FOGATA: "accion_fogata",
    COMPRAR_CARTA_TIENDA: "comprar_carta_tienda",
    COMPRAR_RELIQUIA_TIENDA: "comprar_reliquia_tienda",
    ELIMINAR_CARTA_TIENDA: "eliminar_carta_tienda",
    SALIR_TIENDA: "salir_tienda",
    ACCION_EVENTO: "accion_evento",
    VOTAR_OPCION_EVENTO: "votar_opcion_evento",
    RESOLVER_ACCION_RELIQUIA: "resolver_accion_reliquia",
    REINICIAR_PARTIDA: "reiniciar_partida",
    SECUENCIA_COMBATE: "secuencia_combate"
};
exports.ECONOMIA_CONFIG = {
    ORO_INICIAL: 100,
    ORO_COMBATE_NORMAL: 25,
    ORO_COMBATE_ELITE: 55,
    ORO_COMBATE_JEFE: 100,
    COSTO_ELIMINAR_CARTA_TIENDA: 75,
    PORCENTAJE_CURACION_FOGATA: 0.3
};
exports.PERSONAJES_INFO = {
    SHELLY: {
        id: "SHELLY",
        nombre: "Shelly",
        icono: "icono_shelly",
        hpMax: 90,
        energiaMax: 3,
        oroInicial: exports.ECONOMIA_CONFIG.ORO_INICIAL,
        descripcion: "Personaje simple, tiene buen ataque, defensa y forma de ganar dinero.",
        clases: ["combate", "ladron", "shelly"],
        mazoInicial: [
            "golpe_combate", "golpe_combate", "defender_combate", "defender_combate",
            "bash",
            "armamento", // <- Carta añadida para testear
            "propina", // <- Carta de ladrón añadida para testear
            "daga_dorada", // <- Carta de ladrón añadida para testear
            "cinturon",
            "desarmado"
        ],
        reliquiaInicial: "bandita"
    },
    CROW: {
        id: "CROW",
        nombre: "Crow",
        icono: "icono_crow",
        hpMax: 70,
        energiaMax: 3,
        oroInicial: exports.ECONOMIA_CONFIG.ORO_INICIAL,
        descripcion: "Envenena a sus enemigos y lanza muchos ataques para acabar con sus enemigos.",
        clases: ["veneno", "asesino", "crow"],
        mazoInicial: [
            "golpe_veneno", "golpe_veneno", "golpe_veneno", "golpe_veneno",
            "defender_veneno", "defender_veneno", "defender_veneno", "defender_veneno",
            "bash"
        ],
        reliquiaInicial: "cocoroch"
    }
};
