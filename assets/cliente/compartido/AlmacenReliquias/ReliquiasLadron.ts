import { IReliquiaData } from "../Reliquias";

export const RELIQUIAS_LADRON: IReliquiaData[] = [
    // ================= COMUNES =================
    {
        id: "numero_de_oro",
        nombre: "Número de oro",
        descripcion: "En el turno 6 de combate, gana 35 de oro.",
        icono: "reliquia_numero_de_oro",
        clase: "ladron",
        calidad: "COMUN",
        enPoolRecompensa: true,
        trigger: "AL_INICIAR_TURNO",
        contadorConfig: { modo: "TURNO_OBJETIVO", meta: 6 },
        condicion: { tipo: "TURNO_EXACTO", turno: 6 },
        efectos: [{ tipo: "GANAR_ORO", valor: 35 }]
    },
    {
        id: "carta_dorada",
        nombre: "Carta dorada",
        descripcion: "Cada 3 cartas que jugás en un mismo turno, gana 2 de oro.",
        icono: "reliquia_carta_dorada",
        clase: "ladron",
        calidad: "COMUN",
        enPoolRecompensa: true,
        trigger: "AL_JUGAR_CARTA",
        contadorConfig: { modo: "ACUMULAR_CARTAS", meta: 3, reiniciarCadaTurno: true },
        efectos: [{ tipo: "GANAR_ORO", valor: 2 }]
    },
    {
        id: "sangre_dorada",
        nombre: "Sangre dorada",
        descripcion: "Por cada 1 HP que pierdas, gana 2 de oro.",
        icono: "reliquia_sangre_dorada",
        clase: "ladron",
        calidad: "COMUN",
        enPoolRecompensa: true,
        trigger: "PASIVA",
        modificadorPasivo: { tipo: "ORO_POR_HP_PERDIDO", valor: 2 },
        efectos: []
    },
    {
        id: "suerte_dorada",
        nombre: "Suerte dorada",
        descripcion: "Cada vez que ganás oro, tiene un 5% de probabilidad de ganar el doble.",
        icono: "reliquia_suerte_dorada",
        clase: "ladron",
        calidad: "COMUN",
        enPoolRecompensa: true,
        trigger: "PASIVA",
        modificadorPasivo: { tipo: "PROBABILIDAD_DOBLE_ORO", probabilidad: 5 },
        efectos: []
    },
    {
        id: "experiencia_dorada",
        nombre: "Experiencia dorada",
        descripcion: "Cuando un enemigo muere, gana 7 de oro.",
        icono: "reliquia_experiencia_dorada",
        clase: "ladron",
        calidad: "COMUN",
        enPoolRecompensa: true,
        trigger: "AL_MORIR_ENEMIGO",
        efectos: [{ tipo: "GANAR_ORO", valor: 7 }]
    },

    // ================= ÉPICAS =================
    {
        id: "corazon_de_oro",
        nombre: "Corazón de oro",
        descripcion: "Al inicio del combate, por cada 20 de oro que tengas, gana 1 de bloqueo.",
        icono: "reliquia_corazon_de_oro",
        clase: "ladron",
        calidad: "EPICA",
        enPoolRecompensa: true,
        trigger: "AL_INICIAR_COMBATE",
        efectos: [{ tipo: "BLOQUEO_POR_ORO", cadaCuantoOro: 20, bloqueoPorTramo: 1 }]
    },
    {
        id: "moneda_del_rey",
        nombre: "Moneda del rey",
        descripcion: "Al inicio de tu turno, si tenés 400 o más de oro, gana 1 de Fuerza.",
        icono: "reliquia_moneda_del_rey",
        clase: "ladron",
        calidad: "EPICA",
        enPoolRecompensa: true,
        trigger: "AL_INICIAR_TURNO",
        condicion: { tipo: "ORO_MINIMO", minimo: 400 },
        efectos: [{ tipo: "APLICAR_ESTADO", estadoId: "FUERZA", valor: 1, objetivo: "PROPIO" }]
    },

    // ================= LEGENDARIAS =================
    {
        id: "pay_to_win",
        nombre: "Pay to Win",
        descripcion: "Al perder vida, gasta automáticamente 15 de oro por cada 1 HP para evitar perderlo.",
        icono: "reliquia_pay_to_win",
        clase: "ladron",
        calidad: "LEGENDARIA",
        enPoolRecompensa: true,
        trigger: "PASIVA",
        modificadorPasivo: { tipo: "ESCUDO_ORO_AL_PERDER_HP", oroPorHp: 15 },
        efectos: []
    },
    {
        id: "gran_mejora",
        nombre: "Gran mejora",
        descripcion: "Al recoger esta reliquia, mejora 6 cartas aleatorias de tu mazo.",
        icono: "reliquia_gran_mejora",
        clase: "ladron",
        calidad: "LEGENDARIA",
        enPoolRecompensa: true,
        trigger: "AL_RECOGER",
        efectos: [],
        efectosAlRecoger: [{ tipo: "MEJORAR_CARTAS_MAZO_AZAR", cantidad: 6, filtroTipo: "CUALQUIERA" }]
    },
    {
        id: "recolector_de_elixir",
        nombre: "Recolector de elixir",
        descripcion: "Al inicio de tu turno, gana 1 de energía extra.",
        icono: "reliquia_recolector_de_elixir",
        clase: "ladron",
        calidad: "LEGENDARIA",
        enPoolRecompensa: true,
        trigger: "AL_INICIAR_TURNO",
        efectos: [{ tipo: "GANAR_ENERGIA", valor: 1, objetivo: "PROPIO" }]
    },
    {
        id: "cofre_super_magico",
        nombre: "Cofre súper mágico",
        descripcion: "Al recoger esta reliquia, añade 3 reliquias Comunes aleatorias y 1 reliquia Épica aleatoria.",
        icono: "reliquia_cofre_super_magico",
        clase: "ladron",
        calidad: "LEGENDARIA",
        enPoolRecompensa: true,
        trigger: "AL_RECOGER",
        efectos: [],
        efectosAlRecoger: [{ tipo: "OTORGAR_RELIQUIAS_ALEATORIAS", comunes: 3, epicas: 1 }]
    },
    {
        id: "tacho_de_basura",
        nombre: "Tacho de basura",
        descripcion: "Al recoger esta reliquia, podés eliminar hasta 3 cartas de tu mazo (mínimo 1 restante).",
        icono: "reliquia_tacho_de_basura",
        clase: "ladron",
        calidad: "LEGENDARIA",
        enPoolRecompensa: true,
        trigger: "AL_RECOGER",
        efectos: [],
        efectosAlRecoger: [{ tipo: "INICIAR_ELIMINAR_CARTAS", cantidadMaxima: 3 }]
    }
];