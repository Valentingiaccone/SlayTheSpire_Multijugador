"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CATALOGO_CARTAS = void 0;
exports.parsearCartaInstancia = parsearCartaInstancia;
exports.construirIdInstanciaCarta = construirIdInstanciaCarta;
exports.obtenerDataCarta = obtenerDataCarta;
exports.obtenerEncantamientoCarta = obtenerEncantamientoCarta;
exports.esCartaGratisEsteTurno = esCartaGratisEsteTurno;
exports.limpiarMarcadoresTemporalesCarta = limpiarMarcadoresTemporalesCarta;
exports.marcarCartaGratisEsteTurno = marcarCartaGratisEsteTurno;
exports.puedeEncantarseCarta = puedeEncantarseCarta;
exports.aplicarEncantamientoCarta = aplicarEncantamientoCarta;
exports.puedeMejorarseCarta = puedeMejorarseCarta;
exports.obtenerCartaMejorada = obtenerCartaMejorada;
exports.obtenerIdCartaMejoradaPreservandoExtras = obtenerIdCartaMejoradaPreservandoExtras;
exports.obtenerPrecioCarta = obtenerPrecioCarta;
exports.obtenerMazoInicial = obtenerMazoInicial;
exports.obtenerMaldicionAleatoria = obtenerMaldicionAleatoria;
exports.generarCartaPorCalidad = generarCartaPorCalidad;
exports.generarOpcionesRecompensa = generarOpcionesRecompensa;
const CartasCombate_1 = require("./AlmacenCartas/CartasCombate");
const CartasVeneno_1 = require("./AlmacenCartas/CartasVeneno");
const CartasLadron_1 = require("./AlmacenCartas/CartasLadron");
const CartasAsesino_1 = require("./AlmacenCartas/CartasAsesino");
const CartasMaldicion_1 = require("./AlmacenCartas/CartasMaldicion");
const GameTypes_1 = require("./GameTypes");
const PRECIOS_POR_CALIDAD = {
    BASICA: 45,
    COMUN: 55,
    EPICA: 95,
    LEGENDARIA: 150,
    MALDICION: 0
};
const TODAS_LAS_CARTAS_BASE = [
    ...CartasCombate_1.CARTAS_COMBATE,
    ...CartasVeneno_1.CARTAS_VENENO,
    ...CartasLadron_1.CARTAS_LADRON,
    ...CartasAsesino_1.CARTAS_ASESINO,
    ...CartasMaldicion_1.CARTAS_MALDICION
];
exports.CATALOGO_CARTAS = {};
for (const base of TODAS_LAS_CARTAS_BASE) {
    if (exports.CATALOGO_CARTAS[base.id]) {
        console.error(`[Cartas] ¡ID duplicado detectado!: "${base.id}"`);
    }
    const calidadFinal = base.calidad ||
        (base.tipo === "MALDICION" ? "MALDICION" : base.enPoolRecompensa ? "COMUN" : "BASICA");
    const precioBase = base.precioTienda ?? PRECIOS_POR_CALIDAD[calidadFinal];
    const esSoloMulti = Boolean(base.soloMultijugador || base.objetivoSeleccion === "ALIADO");
    const tieneMejora = Boolean(base.mejora);
    const idMejorada = tieneMejora ? `${base.id}+` : undefined;
    const cartaNormal = {
        ...base,
        calidad: calidadFinal,
        soloMultijugador: esSoloMulti,
        precioTienda: precioBase,
        esMejorada: false,
        idMejora: idMejorada,
        idBase: base.id
    };
    exports.CATALOGO_CARTAS[cartaNormal.id] = cartaNormal;
    if (base.mejora && idMejorada) {
        const cartaMejorada = {
            ...base,
            id: idMejorada,
            nombre: base.mejora.nombre || `${base.nombre}+`,
            costo: base.mejora.costo ?? base.costo,
            costoOro: base.mejora.costoOro ?? base.costoOro,
            descripcion: base.mejora.descripcion,
            efectos: base.mejora.efectos,
            calidad: calidadFinal,
            soloMultijugador: esSoloMulti,
            enPoolRecompensa: false,
            precioTienda: Math.floor(precioBase * 1.4),
            esMejorada: true,
            idMejora: undefined,
            idBase: base.id,
            mejora: undefined
        };
        exports.CATALOGO_CARTAS[cartaMejorada.id] = cartaMejorada;
    }
}
function parsearCartaInstancia(rawId) {
    if (!rawId)
        return { cartaIdBase: "", gratisEsteTurno: false };
    let texto = rawId;
    let gratisEsteTurno = false;
    if (texto.endsWith("~0")) {
        gratisEsteTurno = true;
        texto = texto.slice(0, -2);
    }
    const idxArroba = texto.indexOf("@");
    if (idxArroba !== -1) {
        return {
            cartaIdBase: texto.slice(0, idxArroba),
            encantamiento: texto.slice(idxArroba + 1),
            gratisEsteTurno
        };
    }
    return { cartaIdBase: texto, gratisEsteTurno };
}
function construirIdInstanciaCarta(cartaIdBase, encantamiento, gratisEsteTurno = false) {
    let res = cartaIdBase;
    if (encantamiento)
        res += `@${encantamiento}`;
    if (gratisEsteTurno)
        res += "~0";
    return res;
}
function obtenerDataCarta(rawId) {
    const { cartaIdBase } = parsearCartaInstancia(rawId);
    return exports.CATALOGO_CARTAS[cartaIdBase];
}
function obtenerEncantamientoCarta(rawId) {
    return parsearCartaInstancia(rawId).encantamiento;
}
function esCartaGratisEsteTurno(rawId) {
    return parsearCartaInstancia(rawId).gratisEsteTurno;
}
function limpiarMarcadoresTemporalesCarta(rawId) {
    const { cartaIdBase, encantamiento } = parsearCartaInstancia(rawId);
    return construirIdInstanciaCarta(cartaIdBase, encantamiento, false);
}
function marcarCartaGratisEsteTurno(rawId) {
    const { cartaIdBase, encantamiento } = parsearCartaInstancia(rawId);
    return construirIdInstanciaCarta(cartaIdBase, encantamiento, true);
}
function puedeEncantarseCarta(rawId) {
    const parsed = parsearCartaInstancia(rawId);
    return Boolean(exports.CATALOGO_CARTAS[parsed.cartaIdBase] && !parsed.encantamiento);
}
function aplicarEncantamientoCarta(rawId, encantamiento) {
    const parsed = parsearCartaInstancia(rawId);
    return construirIdInstanciaCarta(parsed.cartaIdBase, encantamiento, parsed.gratisEsteTurno);
}
function puedeMejorarseCarta(rawId) {
    const data = obtenerDataCarta(rawId);
    return Boolean(data && !data.esMejorada && data.idMejora && exports.CATALOGO_CARTAS[data.idMejora]);
}
function obtenerCartaMejorada(rawId) {
    const data = obtenerDataCarta(rawId);
    if (!data || !data.idMejora)
        return undefined;
    return exports.CATALOGO_CARTAS[data.idMejora];
}
function obtenerIdCartaMejoradaPreservandoExtras(rawId) {
    const parsed = parsearCartaInstancia(rawId);
    const mejorada = obtenerCartaMejorada(rawId);
    if (!mejorada)
        return undefined;
    return construirIdInstanciaCarta(mejorada.id, parsed.encantamiento, parsed.gratisEsteTurno);
}
function obtenerPrecioCarta(rawId) {
    const data = obtenerDataCarta(rawId);
    if (!data)
        return 55;
    return data.precioTienda ?? PRECIOS_POR_CALIDAD[data.calidad || "COMUN"];
}
function obtenerMazoInicial(personajeId) {
    const info = GameTypes_1.PERSONAJES_INFO[personajeId];
    return info ? [...info.mazoInicial] : [];
}
function obtenerMaldicionAleatoria() {
    if (CartasMaldicion_1.CARTAS_MALDICION.length === 0)
        return "maldicion_herida";
    const idx = Math.floor(Math.random() * CartasMaldicion_1.CARTAS_MALDICION.length);
    return CartasMaldicion_1.CARTAS_MALDICION[idx].id;
}
function generarCartaPorCalidad(personajeId, calidad, cantidadJugadores = 2) {
    const infoPersonaje = GameTypes_1.PERSONAJES_INFO[personajeId];
    const clasesPermitidas = infoPersonaje ? [...infoPersonaje.clases] : ["combate"];
    const esJuegoSolitario = cantidadJugadores <= 1;
    let candidatas = Object.values(exports.CATALOGO_CARTAS).filter((c) => c.enPoolRecompensa &&
        !c.esMejorada &&
        c.calidad === calidad &&
        clasesPermitidas.includes(c.clase) &&
        (!esJuegoSolitario || !c.soloMultijugador));
    if (candidatas.length === 0) {
        candidatas = Object.values(exports.CATALOGO_CARTAS).filter((c) => c.enPoolRecompensa && !c.esMejorada && c.calidad === calidad);
    }
    if (candidatas.length === 0)
        return undefined;
    return candidatas[Math.floor(Math.random() * candidatas.length)].id;
}
function sortearCalidadPorContexto(contexto) {
    if (contexto === "JEFE") {
        return "LEGENDARIA";
    }
    const tirada = Math.random() * 100;
    if (contexto === "TIENDA") {
        if (tirada < 5)
            return "LEGENDARIA";
        if (tirada < 25)
            return "EPICA";
        return "COMUN";
    }
    if (contexto === "ELITE") {
        if (tirada < 12)
            return "LEGENDARIA";
        if (tirada < 45)
            return "EPICA";
        return "COMUN";
    }
    if (tirada < 3)
        return "LEGENDARIA";
    if (tirada < 23)
        return "EPICA";
    return "COMUN";
}
function generarOpcionesRecompensa(personajeId, cantidad = 3, contexto = "COMBATE", cantidadJugadores = 2) {
    const infoPersonaje = GameTypes_1.PERSONAJES_INFO[personajeId];
    const clasesPermitidas = infoPersonaje ? [...infoPersonaje.clases] : ["combate"];
    const esJuegoSolitario = cantidadJugadores <= 1;
    const candidatasValidas = Object.values(exports.CATALOGO_CARTAS).filter((carta) => {
        if (!carta.enPoolRecompensa || carta.esMejorada || carta.tipo === "MALDICION")
            return false;
        if (!clasesPermitidas.includes(carta.clase))
            return false;
        if (esJuegoSolitario && carta.soloMultijugador)
            return false;
        return true;
    });
    if (candidatasValidas.length === 0)
        return [];
    const elegidas = [];
    const usadas = new Set();
    for (let i = 0; i < cantidad; i++) {
        const calidadBuscada = sortearCalidadPorContexto(contexto);
        let poolCalidad = candidatasValidas.filter((c) => c.calidad === calidadBuscada && !usadas.has(c.id));
        if (poolCalidad.length === 0) {
            poolCalidad = candidatasValidas.filter((c) => !usadas.has(c.id));
        }
        if (poolCalidad.length === 0) {
            poolCalidad = candidatasValidas;
        }
        const idx = Math.floor(Math.random() * poolCalidad.length);
        const seleccionada = poolCalidad[idx];
        elegidas.push(seleccionada.id);
        usadas.add(seleccionada.id);
    }
    return elegidas;
}
