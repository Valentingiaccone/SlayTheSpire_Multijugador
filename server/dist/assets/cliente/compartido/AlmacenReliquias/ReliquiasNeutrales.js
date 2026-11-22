"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RELIQUIAS_NEUTRALES = void 0;
exports.RELIQUIAS_NEUTRALES = [
    // ================= COMUNES =================
    {
        id: "distintivo_abogado",
        nombre: "Distintivo de Abogado",
        descripcion: "Al inicio de cada combate, gana 10 de bloqueo.",
        icono: "reliquia_distintivo_abogado",
        clase: "neutral",
        calidad: "COMUN",
        enPoolRecompensa: true,
        trigger: "AL_INICIAR_COMBATE",
        efectos: [{ tipo: "BLOQUEO", valor: 10, objetivo: "PROPIO" }]
    },
    {
        id: "lluvia_espinas",
        nombre: "Lluvia de Espinas",
        descripcion: "Al inicio del combate, gana 3 de Espinas (devuelve daño al ser atacado).",
        icono: "reliquia_espinas",
        clase: "neutral",
        calidad: "COMUN",
        enPoolRecompensa: true,
        trigger: "AL_INICIAR_COMBATE",
        efectos: [{ tipo: "APLICAR_ESTADO", valor: 3, objetivo: "PROPIO", estadoId: "ESPINAS" }]
    },
    {
        id: "mancuernas",
        nombre: "Mancuernas",
        descripcion: "Si terminás tu turno sin haber jugado ataques, ganás +2 de Fuerza por el resto del combate.",
        icono: "reliquia_mancuernas",
        clase: "neutral",
        calidad: "COMUN",
        enPoolRecompensa: true,
        trigger: "AL_TERMINAR_TURNO",
        condicion: { tipo: "ATAQUES_TURNO_IGUAL", cantidad: 0 },
        efectos: [{ tipo: "APLICAR_ESTADO", valor: 2, objetivo: "PROPIO", estadoId: "FUERZA" }]
    },
    {
        id: "pala",
        nombre: "Pala",
        descripcion: "Al inicio del combate, aplica 1 de Vulnerable a TODOS los enemigos.",
        icono: "reliquia_pala",
        clase: "neutral",
        calidad: "COMUN",
        enPoolRecompensa: true,
        trigger: "AL_INICIAR_COMBATE",
        efectos: [{ tipo: "APLICAR_ESTADO", valor: 1, objetivo: "TODOS_ENEMIGOS", estadoId: "VULNERABLE" }]
    },
    {
        id: "cofre_clash",
        nombre: "Cofre de Clash Royale",
        descripcion: "Al comienzo del combate, roba 2 cartas adicionales.",
        icono: "reliquia_cofre_clash",
        clase: "neutral",
        calidad: "COMUN",
        enPoolRecompensa: true,
        trigger: "AL_INICIAR_COMBATE",
        efectos: [{ tipo: "ROBAR_CARTA", valor: 2, objetivo: "PROPIO" }]
    },
    {
        id: "girasol",
        nombre: "Girasol",
        descripcion: "Cada 3 turnos, gana 1 de Energía adicional.",
        icono: "reliquia_girasol",
        clase: "neutral",
        calidad: "COMUN",
        enPoolRecompensa: true,
        trigger: "AL_INICIAR_TURNO",
        contadorConfig: { modo: "TURNO_CICLO", meta: 3 },
        condicion: { tipo: "TURNO_MULTIPLO", divisor: 3 },
        efectos: [{ tipo: "GANAR_ENERGIA", valor: 1, objetivo: "PROPIO" }]
    },
    {
        id: "spooky",
        nombre: "Spooky",
        descripcion: "En el turno 2 de cada combate, otorga 8 de bloqueo a TODOS los aliados.",
        icono: "reliquia_spooky",
        clase: "neutral",
        calidad: "COMUN",
        enPoolRecompensa: true,
        trigger: "AL_INICIAR_TURNO",
        contadorConfig: { modo: "TURNO_OBJETIVO", meta: 2 },
        condicion: { tipo: "TURNO_EXACTO", turno: 2 },
        efectos: [{ tipo: "BLOQUEO", valor: 8, objetivo: "TODOS_ALIADOS" }]
    },
    {
        id: "oso_en_punto",
        nombre: "Las oso en punto",
        descripcion: "En el turno 8, inflige 50 de daño a todos los enemigos.",
        icono: "reliquia_oso_en_punto",
        clase: "neutral",
        calidad: "COMUN",
        enPoolRecompensa: true,
        trigger: "AL_INICIAR_TURNO",
        contadorConfig: { modo: "TURNO_OBJETIVO", meta: 8 },
        condicion: { tipo: "TURNO_EXACTO", turno: 8 },
        efectos: [{ tipo: "DANIO", valor: 50, objetivo: "TODOS_ENEMIGOS", fuente: "RELIQUIA" }]
    },
    {
        id: "sanacion",
        nombre: "Sanación",
        descripcion: "Al iniciar un combate, cura 2 de HP.",
        icono: "reliquia_sanacion",
        clase: "neutral",
        calidad: "COMUN",
        enPoolRecompensa: true,
        trigger: "AL_INICIAR_COMBATE",
        efectos: [{ tipo: "CURAR_HP", valor: 2, objetivo: "PROPIO" }]
    },
    {
        id: "elixir",
        nombre: "Elixir",
        descripcion: "Al iniciar un combate, gana 1 de energía.",
        icono: "reliquia_elixir",
        clase: "neutral",
        calidad: "COMUN",
        enPoolRecompensa: true,
        trigger: "AL_INICIAR_COMBATE",
        efectos: [{ tipo: "GANAR_ENERGIA", valor: 1, objetivo: "PROPIO" }]
    },
    {
        id: "reloj_par",
        nombre: "Reloj par",
        descripcion: "Al inicio de cada turno PAR, gana 4 de bloqueo.",
        icono: "reliquia_reloj_par",
        clase: "neutral",
        calidad: "COMUN",
        enPoolRecompensa: true,
        trigger: "AL_INICIAR_TURNO",
        condicion: { tipo: "TURNO_PARIDAD", esPar: true },
        efectos: [{ tipo: "BLOQUEO", valor: 4, objetivo: "PROPIO" }]
    },
    {
        id: "robo_de_dinero",
        nombre: "Robo de dinero",
        descripcion: "Gana 15 de oro al inicio de un combate.",
        icono: "reliquia_robo_de_dinero",
        clase: "neutral",
        calidad: "COMUN",
        enPoolRecompensa: true,
        trigger: "AL_INICIAR_COMBATE",
        efectos: [{ tipo: "GANAR_ORO", valor: 15 }]
    },
    {
        id: "pintura_rosa",
        nombre: "Pintura rosa",
        descripcion: "Al recoger esta reliquia, mejora 2 cartas de tipo Habilidad de forma aleatoria.",
        icono: "reliquia_pintura_rosa",
        clase: "neutral",
        calidad: "COMUN",
        enPoolRecompensa: true,
        trigger: "AL_RECOGER",
        efectos: [],
        efectosAlRecoger: [{ tipo: "MEJORAR_CARTAS_MAZO_AZAR", cantidad: 2, filtroTipo: "HABILIDAD" }]
    },
    {
        id: "piedra_de_afilar",
        nombre: "Piedra de afilar",
        descripcion: "Al recoger esta reliquia, mejora 2 cartas de tipo Ataque de forma aleatoria.",
        icono: "reliquia_piedra_de_afilar",
        clase: "neutral",
        calidad: "COMUN",
        enPoolRecompensa: true,
        trigger: "AL_RECOGER",
        efectos: [],
        efectosAlRecoger: [{ tipo: "MEJORAR_CARTAS_MAZO_AZAR", cantidad: 2, filtroTipo: "ATAQUE" }]
    },
    {
        id: "megahucha",
        nombre: "Megahucha",
        descripcion: "Al final del combate, si tenés menos de 200 de oro, gana 35 de oro.",
        icono: "reliquia_megahucha",
        clase: "neutral",
        calidad: "COMUN",
        enPoolRecompensa: true,
        trigger: "AL_FINALIZAR_COMBATE",
        condicion: { tipo: "ORO_MENOR_A", maximoExclusivo: 200 },
        efectos: [{ tipo: "GANAR_ORO", valor: 35 }]
    },
    {
        id: "autopsia",
        nombre: "Autopsia",
        descripcion: "Cuando un enemigo muere, hace 2 de daño a todos los enemigos y les aplica 1 de Débil.",
        icono: "reliquia_autopsia",
        clase: "neutral",
        calidad: "COMUN",
        enPoolRecompensa: true,
        trigger: "AL_MORIR_ENEMIGO",
        efectos: [
            { tipo: "DANIO", valor: 2, objetivo: "TODOS_ENEMIGOS", fuente: "RELIQUIA" },
            { tipo: "APLICAR_ESTADO", estadoId: "DEBIL", valor: 1, objetivo: "TODOS_ENEMIGOS" }
        ]
    },
    {
        id: "celular_de_maya",
        nombre: "Celular de Maya",
        descripcion: "Al inicio de tu turno, gana 2 de bloqueo.",
        icono: "reliquia_celular_de_maya",
        clase: "neutral",
        calidad: "COMUN",
        enPoolRecompensa: true,
        trigger: "AL_INICIAR_TURNO",
        efectos: [{ tipo: "BLOQUEO", valor: 2, objetivo: "PROPIO" }]
    },
    {
        id: "mr_monkey",
        nombre: "Mr Monkey",
        descripcion: "Al inicio del combate, inflige 7 de daño a un enemigo aleatorio.",
        icono: "reliquia_mr_monkey",
        clase: "neutral",
        calidad: "COMUN",
        enPoolRecompensa: true,
        trigger: "AL_INICIAR_COMBATE",
        efectos: [{ tipo: "DANIO", valor: 7, objetivo: "ENEMIGO_ALEATORIO", fuente: "RELIQUIA" }]
    },
    {
        id: "coleccion_de_cartas",
        nombre: "Colección de cartas",
        descripcion: "Al inicio de tu turno, cada 7 cartas que tenga tu mazo, gana 1 de bloqueo.",
        icono: "reliquia_coleccion_de_cartas",
        clase: "neutral",
        calidad: "COMUN",
        enPoolRecompensa: true,
        trigger: "AL_INICIAR_TURNO",
        efectos: [{ tipo: "BLOQUEO_POR_CARTAS_MAZO", cadaCuantasCartas: 7, bloqueoPorTramo: 1 }]
    },
    // ================= ÉPICAS =================
    {
        id: "preparacion",
        nombre: "Preparación",
        descripcion: "Al inicio del combate, gana 1 de Fuerza.",
        icono: "reliquia_preparacion",
        clase: "neutral",
        calidad: "EPICA",
        enPoolRecompensa: true,
        trigger: "AL_INICIAR_COMBATE",
        efectos: [{ tipo: "APLICAR_ESTADO", estadoId: "FUERZA", valor: 1, objetivo: "PROPIO" }]
    },
    {
        id: "fogata_dorada",
        nombre: "Fogata dorada",
        descripcion: "Al ingresar a una fogata, cura 3 de HP por cada 5 cartas que tengas en el mazo.",
        icono: "reliquia_fogata_dorada",
        clase: "neutral",
        calidad: "EPICA",
        enPoolRecompensa: true,
        trigger: "AL_INGRESAR_FOGATA",
        efectos: [],
        modificadorPasivo: { tipo: "CURAR_AL_ENTRAR_FOGATA_POR_MAZO", cadaCuantasCartas: 5, hpPorTramo: 3 }
    },
    {
        id: "experiencia",
        nombre: "Experiencia",
        descripcion: "Cuando un enemigo muere, gana 1 de energía y roba 1 carta.",
        icono: "reliquia_experiencia",
        clase: "neutral",
        calidad: "EPICA",
        enPoolRecompensa: true,
        trigger: "AL_MORIR_ENEMIGO",
        efectos: [
            { tipo: "GANAR_ENERGIA", valor: 1, objetivo: "PROPIO" },
            { tipo: "ROBAR_CARTA", valor: 1, objetivo: "PROPIO" }
        ]
    },
    {
        id: "ingenio",
        nombre: "Ingenio",
        descripcion: "Al jugar 3 Habilidades en un mismo turno, hace 5 de daño a todos los enemigos.",
        icono: "reliquia_ingenio",
        clase: "neutral",
        calidad: "EPICA",
        enPoolRecompensa: true,
        trigger: "AL_JUGAR_CARTA",
        contadorConfig: {
            modo: "ACUMULAR_CARTAS",
            meta: 3,
            filtroTipoCarta: "HABILIDAD",
            reiniciarCadaTurno: true
        },
        efectos: [{ tipo: "DANIO", valor: 5, objetivo: "TODOS_ENEMIGOS", fuente: "RELIQUIA" }]
    },
    {
        id: "hacker",
        nombre: "Hacker",
        descripcion: "Los siguientes 2 cofres darán reliquias Legendarias.",
        icono: "reliquia_hacker",
        clase: "neutral",
        calidad: "EPICA",
        enPoolRecompensa: true,
        trigger: "PASIVA",
        contadorConfig: { modo: "CARGAS", valorInicial: 2 },
        modificadorPasivo: { tipo: "COFRE_LEGENDARIO_CARGAS" },
        efectos: []
    },
    {
        id: "chuleta_cocinada",
        nombre: "Chuleta cocinada",
        descripcion: "Al final de un combate, si tu vida está por debajo del 50%, te cura 12 de HP.",
        icono: "reliquia_chuleta_cocinada",
        clase: "neutral",
        calidad: "EPICA",
        enPoolRecompensa: true,
        trigger: "AL_FINALIZAR_COMBATE",
        condicion: { tipo: "HP_PORCENTAJE_MENOR_A", porcentaje: 50 },
        efectos: [{ tipo: "CURAR_HP", valor: 12, objetivo: "PROPIO" }]
    },
    {
        id: "rayo_arcano",
        nombre: "Rayo arcano",
        descripcion: "Al jugar un Poder, una carta aleatoria de tu mano cuesta 0 este turno.",
        icono: "reliquia_rayo_arcano",
        clase: "neutral",
        calidad: "EPICA",
        enPoolRecompensa: true,
        trigger: "AL_JUGAR_CARTA",
        condicion: { tipo: "CARTA_TIPO_ES", tipoCarta: "PODER" },
        efectos: [{ tipo: "HACER_CARTA_MANO_GRATIS_TURNO", cantidad: 1 }]
    },
    {
        id: "espada_plateada",
        nombre: "Espada plateada",
        descripcion: "Al jugar 3 Ataques en un mismo turno, gana 4 de bloqueo.",
        icono: "reliquia_espada_plateada",
        clase: "neutral",
        calidad: "EPICA",
        enPoolRecompensa: true,
        trigger: "AL_JUGAR_CARTA",
        contadorConfig: {
            modo: "ACUMULAR_CARTAS",
            meta: 3,
            filtroTipoCarta: "ATAQUE",
            reiniciarCadaTurno: true
        },
        efectos: [{ tipo: "BLOQUEO", valor: 4, objetivo: "PROPIO" }]
    },
    {
        id: "tarta_de_calabaza",
        nombre: "Tarta de calabaza",
        descripcion: "Al inicio de un combate de Jefe, te cura 25 de HP.",
        icono: "reliquia_tarta_de_calabaza",
        clase: "neutral",
        calidad: "EPICA",
        enPoolRecompensa: true,
        trigger: "AL_INICIAR_COMBATE",
        condicion: { tipo: "ES_COMBATE_JEFE" },
        efectos: [{ tipo: "CURAR_HP", valor: 25, objetivo: "PROPIO" }]
    },
    {
        id: "pera",
        nombre: "Pera",
        descripcion: "Al recoger esta reliquia, obtenés +10 HP máximo y te cura 10 de HP.",
        icono: "reliquia_pera",
        clase: "neutral",
        calidad: "EPICA",
        enPoolRecompensa: true,
        trigger: "AL_RECOGER",
        efectos: [],
        efectosAlRecoger: [{ tipo: "AUMENTAR_HP_MAX_Y_CURAR", valor: 10 }]
    },
    {
        id: "carta_interrogante",
        nombre: "Carta interrogante",
        descripcion: "En las recompensas de selección de cartas, tenés una opción extra.",
        icono: "reliquia_carta_interrogante",
        clase: "neutral",
        calidad: "EPICA",
        enPoolRecompensa: true,
        trigger: "PASIVA",
        modificadorPasivo: { tipo: "OPCION_CARTA_RECOMPENSA_EXTRA", valor: 1 },
        efectos: []
    },
    {
        id: "carta_extrarara",
        nombre: "Carta extrarara",
        descripcion: "Al recogerla, ganás una carta Legendaria aleatoria y mejora Colección de cartas a VIP si la tenés.",
        icono: "reliquia_carta_extrarara",
        clase: "neutral",
        calidad: "EPICA",
        enPoolRecompensa: true,
        trigger: "AL_RECOGER",
        efectos: [],
        efectosAlRecoger: [
            { tipo: "GANAR_CARTA_CALIDAD_AZAR", calidad: "LEGENDARIA" },
            {
                tipo: "REEMPLAZAR_RELIQUIA_SI_TIENE",
                reliquiaOrigen: "coleccion_de_cartas",
                reliquiaDestino: "coleccion_de_cartas_vip"
            }
        ]
    },
    // ================= LEGENDARIAS =================
    {
        id: "el_pensador",
        nombre: "El pensador",
        descripcion: "Al inicio de tu turno, inflige 15 de daño a un enemigo aleatorio.",
        icono: "reliquia_el_pensador",
        clase: "neutral",
        calidad: "LEGENDARIA",
        enPoolRecompensa: true,
        trigger: "AL_INICIAR_TURNO",
        efectos: [{ tipo: "DANIO", valor: 15, objetivo: "ENEMIGO_ALEATORIO", fuente: "RELIQUIA" }]
    },
    {
        id: "pasaporte",
        nombre: "Pasaporte",
        descripcion: "Al recoger esta reliquia, encanta una carta que quieras con \"Gratis\" (cuesta 0 toda la run).",
        icono: "reliquia_pasaporte",
        clase: "neutral",
        calidad: "LEGENDARIA",
        enPoolRecompensa: true,
        trigger: "AL_RECOGER",
        efectos: [],
        efectosAlRecoger: [{ tipo: "INICIAR_ENCANTAR_CARTA", encantamiento: "GRATIS", cantidad: 1 }]
    },
    // ================= ESPECIAL (NO OBTENIBLE) =================
    {
        id: "coleccion_de_cartas_vip",
        nombre: "Colección de cartas VIP",
        descripcion: "Al inicio de tu turno, cada 4 cartas que tenga tu mazo, gana 1 de bloqueo.",
        icono: "reliquia_coleccion_de_cartas_vip",
        clase: "neutral",
        calidad: "ESPECIAL",
        enPoolRecompensa: false,
        trigger: "AL_INICIAR_TURNO",
        efectos: [{ tipo: "BLOQUEO_POR_CARTAS_MAZO", cadaCuantasCartas: 4, bloqueoPorTramo: 1 }]
    }
];
