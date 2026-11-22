"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CATALOGO_EVENTOS = void 0;
exports.obtenerEventoAleatorio = obtenerEventoAleatorio;
exports.opcionRequiereElegirCartaMazo = opcionRequiereElegirCartaMazo;
exports.validarRequisitosOpcionParaJugador = validarRequisitosOpcionParaJugador;
exports.formatearTextoOpcionEvento = formatearTextoOpcionEvento;
const Cartas_1 = require("./Cartas");
const Reliquias_1 = require("./Reliquias");
exports.CATALOGO_EVENTOS = {
    escalera_resbaladiza: {
        id: "escalera_resbaladiza",
        titulo: "❓ La Escalera Resbaladiza",
        descripcion: "Vas subiendo por una escalera de piedra húmeda cuando te tropezás y tus pertenencias caen rodando hacia el abismo. Solo tenés tiempo de sujetar una cosa antes de que el resto caiga.",
        modo: "INDIVIDUAL",
        opciones: [
            {
                textoBase: "Manotear tu bolsa de monedas",
                efectos: [
                    { tipo: "GANAR_ORO", cantidad: 50 },
                    { tipo: "ELIMINAR_CARTA_AZAR" }
                ]
            },
            {
                textoBase: "Atrapar el pergamino que brillaba en el suelo",
                efectos: [{ tipo: "GANAR_CARTA" }]
            },
            {
                textoBase: "Proteger tu cuerpo en la caída",
                efectos: [{ tipo: "CURAR_HP", porcentajeHpMax: 0.15 }]
            }
        ]
    },
    cofre_manos_llenas: {
        id: "cofre_manos_llenas",
        titulo: "❓ El Tesoro del Derrumbe",
        descripcion: "Encontraste una cámara oculta repleta de tesoros antiguos, pero el techo empieza a colapsar y tenés las manos llenas. Solo podés llevarte un objeto antes de escapar.",
        modo: "INDIVIDUAL",
        opciones: [
            {
                textoBase: "Tomar el artefacto antiguo",
                efectos: [{ tipo: "GANAR_RELIQUIA" }]
            },
            {
                textoBase: "Tomar la técnica grabada",
                efectos: [{ tipo: "GANAR_CARTA" }]
            },
            {
                textoBase: "Llenarte los bolsillos de oro",
                efectos: [{ tipo: "GANAR_ORO", cantidad: 60 }]
            }
        ]
    },
    altar_del_coleccionista: {
        id: "altar_del_coleccionista",
        titulo: "❓ El Altar del Coleccionista",
        descripcion: "Un espíritu tasador examina tu baraja. Cuanto más valiosa sea la carta que aceptes sacrificar al azar, mayor será su recompensa.",
        modo: "INDIVIDUAL",
        opciones: [
            {
                textoBase: "Sacrificar una carta Común",
                efectos: [
                    { tipo: "ELIMINAR_CARTA_CALIDAD_AZAR", calidad: "COMUN" },
                    { tipo: "GANAR_ORO", cantidad: 45 }
                ]
            },
            {
                textoBase: "Sacrificar una carta Épica",
                efectos: [
                    { tipo: "ELIMINAR_CARTA_CALIDAD_AZAR", calidad: "EPICA" },
                    { tipo: "GANAR_RELIQUIA" }
                ]
            },
            {
                textoBase: "Sacrificar una carta Legendaria",
                efectos: [
                    { tipo: "ELIMINAR_CARTA_CALIDAD_AZAR", calidad: "LEGENDARIA" },
                    { tipo: "GANAR_RELIQUIA" },
                    { tipo: "GANAR_ORO", cantidad: 100 },
                    { tipo: "CURAR_HP", porcentajeHpMax: 0.3 }
                ]
            },
            {
                textoBase: "Retirarse sin sacrificar nada",
                efectos: [{ tipo: "NADA" }]
            }
        ]
    },
    altar_maldito: {
        id: "altar_maldito",
        titulo: "❓ El Ídolo Susurrante",
        descripcion: "Sobre un pedestal oscuro descansa una reliquia bañada en energía prohibida. Sabés que tocarla despertará una maldición ancestral, o podés purificar una de tus cartas en la llama sagrada.",
        modo: "INDIVIDUAL",
        opciones: [
            {
                textoBase: "Robar la reliquia prohibida",
                efectos: [{ tipo: "GANAR_RELIQUIA" }, { tipo: "GANAR_MALDICION" }]
            },
            {
                textoBase: "Ofrendar oro en la llama para purificar tu mazo",
                efectos: [
                    { tipo: "PERDER_ORO", cantidad: 45 },
                    { tipo: "ELIMINAR_CARTA_ELECCION" }
                ]
            },
            {
                textoBase: "Alejarse en silencio",
                efectos: [{ tipo: "NADA" }]
            }
        ]
    },
    mercader_sombras: {
        id: "mercader_sombras",
        titulo: "❓ El Cirujano de las Sombras",
        descripcion: "Una figura encapuchada te ofrece intercambiar vitalidad por poder inmediato, o aliviar la carga de tu mazo a cambio de unas monedas.",
        modo: "INDIVIDUAL",
        opciones: [
            {
                textoBase: "Pacto de sangre por una reliquia",
                efectos: [
                    { tipo: "PERDER_HP", cantidad: 12 },
                    { tipo: "GANAR_RELIQUIA" }
                ]
            },
            {
                textoBase: "Purificar tu mente (elegir carta a eliminar)",
                efectos: [
                    { tipo: "PERDER_HP", cantidad: 6 },
                    { tipo: "ELIMINAR_CARTA_ELECCION" }
                ]
            },
            {
                textoBase: "Rechazar el trato",
                efectos: [{ tipo: "NADA" }]
            }
        ]
    },
    // ================= EVENTOS COMUNITARIOS =================
    pacto_del_grupo: {
        id: "pacto_del_grupo",
        titulo: "🤝 Evento Grupal: La Fuente Carmesí",
        descripcion: "El grupo llega ante una fuente ancestral que exige una decisión unánime. Lo que la mayoría vote afectará a todos los integrantes del equipo por igual.",
        modo: "COMUNITARIO",
        opciones: [
            {
                textoBase: "Sacrificar sangre del grupo por un artefacto para todos",
                efectos: [
                    { tipo: "PERDER_HP", cantidad: 10 },
                    { tipo: "GANAR_RELIQUIA" }
                ]
            },
            {
                textoBase: "Beber de las aguas calmantes",
                efectos: [{ tipo: "CURAR_HP", porcentajeHpMax: 0.25 }]
            },
            {
                textoBase: "Extraer las monedas del fondo y sufrir una maldición",
                efectos: [
                    { tipo: "GANAR_ORO", cantidad: 75 },
                    { tipo: "GANAR_MALDICION" }
                ]
            }
        ]
    },
    peaje_de_los_bandidos: {
        id: "peaje_de_los_bandidos",
        titulo: "🤝 Evento Grupal: El Puente del Peaje",
        descripcion: "Un gremio de mercenarios bloquea el único puente hacia el siguiente piso. Todo el grupo debe votar cómo proceder.",
        modo: "COMUNITARIO",
        opciones: [
            {
                textoBase: "Sobornar a los guardias y comprar su reliquia",
                efectos: [
                    { tipo: "PERDER_ORO", cantidad: 50 },
                    { tipo: "GANAR_RELIQUIA" }
                ]
            },
            {
                textoBase: "Cruzar corriendo bajo una lluvia de flechas",
                efectos: [
                    { tipo: "PERDER_HP", cantidad: 8 },
                    { tipo: "GANAR_ORO", cantidad: 35 }
                ]
            },
            {
                textoBase: "Entregar suministros al azar para pasar ilesos",
                efectos: [{ tipo: "ELIMINAR_CARTA_AZAR" }]
            }
        ]
    }
};
function obtenerEventoAleatorio() {
    const lista = Object.values(exports.CATALOGO_EVENTOS);
    const idx = Math.floor(Math.random() * lista.length);
    return lista[idx];
}
function opcionRequiereElegirCartaMazo(opcion) {
    return opcion.efectos.some((e) => e.tipo === "ELIMINAR_CARTA_ELECCION");
}
function validarRequisitosOpcionParaJugador(opcion, jugador) {
    for (const ef of opcion.efectos) {
        if (ef.tipo === "PERDER_ORO" && jugador.oro < ef.cantidad) {
            return { valida: false, motivoBloqueo: `Requiere ${ef.cantidad} de Oro` };
        }
        if (ef.tipo === "PERDER_HP" && jugador.hp <= ef.cantidad) {
            return { valida: false, motivoBloqueo: `Requiere más de ${ef.cantidad} HP` };
        }
        if ((ef.tipo === "ELIMINAR_CARTA_AZAR" || ef.tipo === "ELIMINAR_CARTA_ELECCION") &&
            jugador.mazoLength <= 1) {
            return { valida: false, motivoBloqueo: "Mazo mínimo alcanzado" };
        }
        if (ef.tipo === "ELIMINAR_CARTA_CALIDAD_AZAR") {
            if (jugador.mazoLength <= 1) {
                return { valida: false, motivoBloqueo: "Mazo mínimo alcanzado" };
            }
            const listaIds = jugador.mazoCartasIds ? Array.from(jugador.mazoCartasIds) : [];
            const tieneDeEsaCalidad = listaIds.some((id) => Cartas_1.CATALOGO_CARTAS[id]?.calidad === ef.calidad);
            if (!tieneDeEsaCalidad) {
                return { valida: false, motivoBloqueo: `No tenés cartas ${ef.calidad}` };
            }
        }
    }
    return { valida: true };
}
function formatearTextoOpcionEvento(opcion, cartaId, reliquiaId, maldicionId, hpMaxJugador = 80) {
    const detalles = [];
    for (const ef of opcion.efectos) {
        switch (ef.tipo) {
            case "GANAR_ORO":
                detalles.push(`+${ef.cantidad} 💰 Oro`);
                break;
            case "PERDER_ORO":
                detalles.push(`-${ef.cantidad} 💰 Oro`);
                break;
            case "CURAR_HP": {
                const monto = ef.porcentajeHpMax
                    ? Math.max(1, Math.floor(hpMaxJugador * ef.porcentajeHpMax))
                    : ef.cantidad || 0;
                detalles.push(`+${monto} 💚 HP`);
                break;
            }
            case "PERDER_HP":
                detalles.push(`-${ef.cantidad} 💔 HP`);
                break;
            case "GANAR_CARTA": {
                const nombreCarta = (cartaId && Cartas_1.CATALOGO_CARTAS[cartaId]?.nombre) || "Carta";
                detalles.push(`Recibir carta [${nombreCarta}]`);
                break;
            }
            case "GANAR_RELIQUIA": {
                const nombreRel = (reliquiaId && Reliquias_1.CATALOGO_RELIQUIAS[reliquiaId]?.nombre) || "Reliquia";
                detalles.push(`Recibir reliquia [${nombreRel}]`);
                break;
            }
            case "GANAR_MALDICION": {
                const nombreMald = (maldicionId && Cartas_1.CATALOGO_CARTAS[maldicionId]?.nombre) || "Maldición";
                detalles.push(`Sufrir maldición [${nombreMald}]`);
                break;
            }
            case "ELIMINAR_CARTA_AZAR":
                detalles.push("Perder 1 carta al azar del mazo");
                break;
            case "ELIMINAR_CARTA_ELECCION":
                detalles.push("Elegir y eliminar 1 carta de tu mazo");
                break;
            case "ELIMINAR_CARTA_CALIDAD_AZAR":
                detalles.push(`Perder 1 carta ${ef.calidad} al azar`);
                break;
            case "NADA":
                detalles.push("Continuar sin cambios");
                break;
        }
    }
    return `${opcion.textoBase}\n(${detalles.join("  •  ")})`;
}
