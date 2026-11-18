import { ICartaData } from "../Cartas";

export const CARTAS_LADRON: ICartaData[] = [
    // ================= COMUNES (⬜️) =================
    {
        id: "propina",
        nombre: "Propina",
        costo: 0,
        costoOro: 5,
        sprite: "defender_combate",
        clase: "ladron",
        calidad: "COMUN",
        tipo: "HABILIDAD",
        enPoolRecompensa: true,
        descripcion: "Gasta 5 de oro. Gana {B} de bloqueo.",
        efectos: [{ tipo: "BLOQUEO", valor: 8, objetivo: "PROPIO" }],
        mejora: {
            descripcion: "Gasta 5 de oro. Gana {B} de bloqueo.",
            efectos: [{ tipo: "BLOQUEO", valor: 12, objetivo: "PROPIO" }]
        }
    },
    {
        id: "daga_dorada",
        nombre: "Daga dorada",
        costo: 1,
        sprite: "golpe_combate",
        clase: "ladron",
        calidad: "COMUN",
        tipo: "ATAQUE",
        objetivoSeleccion: "ENEMIGO",
        enPoolRecompensa: true,
        descripcion: "Inflige {D} de daño. Si tenés 50 o más de oro, inflige otros {D} de daño.",
        efectos: [
            { tipo: "DANIO", valor: 5, objetivo: "ENEMIGO" },
            {
                tipo: "CONDICIONAL",
                condicion: { tipo: "ORO_MINIMO", minimo: 50 },
                efectosSiCumple: [{ tipo: "DANIO", valor: 5, objetivo: "ENEMIGO" }]
            }
        ],
        mejora: {
            descripcion: "Inflige {D} de daño. Si tenés 50 o más de oro, inflige otros {D} de daño.",
            efectos: [
                { tipo: "DANIO", valor: 7, objetivo: "ENEMIGO" },
                {
                    tipo: "CONDICIONAL",
                    condicion: { tipo: "ORO_MINIMO", minimo: 50 },
                    efectosSiCumple: [{ tipo: "DANIO", valor: 7, objetivo: "ENEMIGO" }]
                }
            ]
        }
    },
    {
        id: "escudo_dorado",
        nombre: "Escudo dorado",
        costo: 1,
        sprite: "defender_combate",
        clase: "ladron",
        calidad: "COMUN",
        tipo: "HABILIDAD",
        enPoolRecompensa: true,
        descripcion: "Gana {B} de bloqueo. Si tenés 50 o más de oro, gana otros {B} de bloqueo.",
        efectos: [
            { tipo: "BLOQUEO", valor: 5, objetivo: "PROPIO" },
            {
                tipo: "CONDICIONAL",
                condicion: { tipo: "ORO_MINIMO", minimo: 50 },
                efectosSiCumple: [{ tipo: "BLOQUEO", valor: 5, objetivo: "PROPIO" }]
            }
        ],
        mejora: {
            descripcion: "Gana {B} de bloqueo. Si tenés 50 o más de oro, gana otros {B} de bloqueo.",
            efectos: [
                { tipo: "BLOQUEO", valor: 7, objetivo: "PROPIO" },
                {
                    tipo: "CONDICIONAL",
                    condicion: { tipo: "ORO_MINIMO", minimo: 50 },
                    efectosSiCumple: [{ tipo: "BLOQUEO", valor: 7, objetivo: "PROPIO" }]
                }
            ]
        }
    },
    {
        id: "pequeno_hallazgo",
        nombre: "Pequeño hallazgo",
        costo: 1,
        sprite: "escudo_rectangular",
        clase: "ladron",
        calidad: "COMUN",
        tipo: "HABILIDAD",
        agotar: true,
        enPoolRecompensa: true,
        descripcion: "Gana 8 de oro. Roba 1 carta. Se agota.",
        efectos: [
            { tipo: "GANAR_ORO", valor: 8 },
            { tipo: "ROBAR_CARTA", valor: 1, objetivo: "PROPIO" }
        ],
        mejora: {
            descripcion: "Gana 12 de oro. Roba 2 cartas. Se agota.",
            efectos: [
                { tipo: "GANAR_ORO", valor: 12 },
                { tipo: "ROBAR_CARTA", valor: 2, objetivo: "PROPIO" }
            ]
        }
    },
    {
        id: "oro_filoso",
        nombre: "Oro filoso",
        costo: 1,
        sprite: "golpe_combate",
        clase: "ladron",
        calidad: "COMUN",
        tipo: "ATAQUE",
        objetivoSeleccion: "ENEMIGO",
        enPoolRecompensa: true,
        descripcion: "Inflige {D} de daño y gana 5 de oro.",
        efectos: [
            { tipo: "DANIO", valor: 5, objetivo: "ENEMIGO" },
            { tipo: "GANAR_ORO", valor: 5 }
        ],
        mejora: {
            descripcion: "Inflige {D} de daño y gana 8 de oro.",
            efectos: [
                { tipo: "DANIO", valor: 8, objetivo: "ENEMIGO" },
                { tipo: "GANAR_ORO", valor: 8 }
            ]
        }
    },
    {
        id: "oro_multiuso",
        nombre: "Oro multiuso",
        costo: 1,
        sprite: "onda_de_hierro",
        clase: "ladron",
        calidad: "COMUN",
        tipo: "ATAQUE",
        objetivoSeleccion: "ENEMIGO",
        enPoolRecompensa: true,
        descripcion: "Inflige {D} de daño, gana {B} de bloqueo y gana 4 de oro.",
        efectos: [
            { tipo: "DANIO", valor: 4, objetivo: "ENEMIGO" },
            { tipo: "BLOQUEO", valor: 4, objetivo: "PROPIO" },
            { tipo: "GANAR_ORO", valor: 4 }
        ],
        mejora: {
            descripcion: "Inflige {D} de daño, gana {B} de bloqueo y gana 6 de oro.",
            efectos: [
                { tipo: "DANIO", valor: 6, objetivo: "ENEMIGO" },
                { tipo: "BLOQUEO", valor: 6, objetivo: "PROPIO" },
                { tipo: "GANAR_ORO", valor: 6 }
            ]
        }
    },
    {
        id: "cofre_de_monedas",
        nombre: "Cofre de monedas",
        costo: 2,
        sprite: "defender_combate",
        clase: "ladron",
        calidad: "COMUN",
        tipo: "HABILIDAD",
        agotar: true,
        enPoolRecompensa: true,
        descripcion: "Gana 30 de oro. Se agota.",
        efectos: [{ tipo: "GANAR_ORO", valor: 30 }],
        mejora: {
            descripcion: "Gana 42 de oro. Se agota.",
            efectos: [{ tipo: "GANAR_ORO", valor: 42 }]
        }
    },
    {
        id: "tesoro",
        nombre: "Tesoro",
        costo: 3,
        sprite: "defender_combate",
        clase: "ladron",
        calidad: "COMUN",
        tipo: "HABILIDAD",
        agotar: true,
        enPoolRecompensa: true,
        descripcion: "Gana 75 de oro. Se agota.",
        efectos: [{ tipo: "GANAR_ORO", valor: 75 }],
        mejora: {
            descripcion: "Gana 100 de oro. Se agota.",
            efectos: [{ tipo: "GANAR_ORO", valor: 100 }]
        }
    },
    {
        id: "oro_mortal",
        nombre: "Oro mortal",
        costo: 2,
        sprite: "golpe_fuerte_combate",
        clase: "ladron",
        calidad: "COMUN",
        tipo: "ATAQUE",
        objetivoSeleccion: "ENEMIGO",
        enPoolRecompensa: true,
        descripcion: "Inflige {D} de daño. Si mata a un enemigo, gana 20 de oro.",
        efectos: [
            { tipo: "DANIO", valor: 20, objetivo: "ENEMIGO", oroSiMata: 20 }
        ],
        mejora: {
            descripcion: "Inflige {D} de daño. Si mata a un enemigo, gana 30 de oro.",
            efectos: [
                { tipo: "DANIO", valor: 26, objetivo: "ENEMIGO", oroSiMata: 30 }
            ]
        }
    },
    {
        id: "bolsa_de_monedas",
        nombre: "Bolsa de monedas",
        costo: 1,
        sprite: "defender_combate",
        clase: "ladron",
        calidad: "COMUN",
        tipo: "HABILIDAD",
        agotar: true,
        enPoolRecompensa: true,
        descripcion: "Gana 12 de oro. Se agota.",
        efectos: [{ tipo: "GANAR_ORO", valor: 12 }],
        mejora: {
            descripcion: "Gana 18 de oro. Se agota.",
            efectos: [{ tipo: "GANAR_ORO", valor: 18 }]
        }
    },
    {
        id: "oro_fuerte",
        nombre: "Oro fuerte",
        costo: 0,
        sprite: "defender_combate",
        clase: "ladron",
        calidad: "COMUN",
        tipo: "HABILIDAD",
        agotar: true,
        enPoolRecompensa: true,
        descripcion: "Gana {B} de bloqueo y 3 de oro. Se agota.",
        efectos: [
            { tipo: "BLOQUEO", valor: 5, objetivo: "PROPIO" },
            { tipo: "GANAR_ORO", valor: 3 }
        ],
        mejora: {
            descripcion: "Gana {B} de bloqueo y 5 de oro. Se agota.",
            efectos: [
                { tipo: "BLOQUEO", valor: 8, objetivo: "PROPIO" },
                { tipo: "GANAR_ORO", valor: 5 }
            ]
        }
    },
    {
        id: "monedas",
        nombre: "Monedas",
        costo: 0,
        sprite: "defender_combate",
        clase: "ladron",
        calidad: "COMUN",
        tipo: "HABILIDAD",
        agotar: true,
        enPoolRecompensa: true,
        descripcion: "Gana 5 de oro. Se agota.",
        efectos: [{ tipo: "GANAR_ORO", valor: 5 }],
        mejora: {
            descripcion: "Gana 8 de oro. Se agota.",
            efectos: [{ tipo: "GANAR_ORO", valor: 8 }]
        }
    },

    // ================= ÉPICAS (🟨) =================
    {
        id: "apuesta",
        nombre: "Apuesta",
        costo: 0,
        sprite: "escudo_rectangular",
        clase: "ladron",
        calidad: "EPICA",
        tipo: "HABILIDAD",
        enPoolRecompensa: true,
        descripcion: "50% de ganar 50 de oro o perder 25 de oro. Roba 1 carta.",
        efectos: [
            { tipo: "APUESTA_ORO", probabilidadExito: 50, oroGanado: 50, oroPerdido: 25 },
            { tipo: "ROBAR_CARTA", valor: 1, objetivo: "PROPIO" }
        ],
        mejora: {
            descripcion: "50% de ganar 70 de oro o perder 20 de oro. Roba 1 carta.",
            efectos: [
                { tipo: "APUESTA_ORO", probabilidadExito: 50, oroGanado: 70, oroPerdido: 20 },
                { tipo: "ROBAR_CARTA", valor: 1, objetivo: "PROPIO" }
            ]
        }
    },
    {
        id: "solidaridad",
        nombre: "Solidaridad",
        costo: 0,
        sprite: "cobertura_combate",
        clase: "ladron",
        calidad: "EPICA",
        tipo: "HABILIDAD",
        soloMultijugador: true,
        enPoolRecompensa: true,
        descripcion: "Reparte el 50% de tu oro a los demás aliados. Roba 1 carta.",
        efectos: [
            { tipo: "REPARTIR_ORO_ALIADOS", porcentaje: 0.5 },
            { tipo: "ROBAR_CARTA", valor: 1, objetivo: "PROPIO" }
        ],
        mejora: {
            descripcion: "Reparte el 50% de tu oro a los demás aliados. Roba 2 cartas.",
            efectos: [
                { tipo: "REPARTIR_ORO_ALIADOS", porcentaje: 0.5 },
                { tipo: "ROBAR_CARTA", valor: 2, objetivo: "PROPIO" }
            ]
        }
    },
    {
        id: "bloque_de_oro",
        nombre: "Bloque de oro",
        costo: 1,
        sprite: "escudo_rectangular",
        clase: "ladron",
        calidad: "EPICA",
        tipo: "HABILIDAD",
        agotar: true,
        enPoolRecompensa: true,
        descripcion: "Gana oro igual a tu bloqueo actual. Se agota.",
        efectos: [{ tipo: "ORO_IGUAL_A_BLOQUEO" }],
        mejora: {
            costo: 0,
            descripcion: "Gana oro igual a tu bloqueo actual. Se agota.",
            efectos: [{ tipo: "ORO_IGUAL_A_BLOQUEO" }]
        }
    },
    {
        id: "trabajo_duro",
        nombre: "Trabajo duro",
        costo: 0,
        sprite: "defender_combate",
        clase: "ladron",
        calidad: "EPICA",
        tipo: "HABILIDAD",
        agotar: true,
        enPoolRecompensa: true,
        descripcion: "Gana 20 de oro. Recibís 1 de Débil y 1 de Vulnerable. Se agota.",
        efectos: [
            { tipo: "GANAR_ORO", valor: 20 },
            { tipo: "APLICAR_ESTADO", estadoId: "DEBIL", valor: 1, objetivo: "PROPIO" },
            { tipo: "APLICAR_ESTADO", estadoId: "VULNERABLE", valor: 1, objetivo: "PROPIO" }
        ],
        mejora: {
            descripcion: "Gana 30 de oro. Recibís 1 de Débil y 1 de Vulnerable. Se agota.",
            efectos: [
                { tipo: "GANAR_ORO", valor: 30 },
                { tipo: "APLICAR_ESTADO", estadoId: "DEBIL", valor: 1, objetivo: "PROPIO" },
                { tipo: "APLICAR_ESTADO", estadoId: "VULNERABLE", valor: 1, objetivo: "PROPIO" }
            ]
        }
    },
    {
        id: "multiataque_dorado",
        nombre: "Multiataque dorado",
        costo: 2,
        sprite: "golpe_perforante",
        clase: "ladron",
        calidad: "EPICA",
        tipo: "ATAQUE",
        enPoolRecompensa: true,
        descripcion: "Inflige {D} de daño a todos los enemigos 2 veces. Si golpea la salud del enemigo, gana 3 de oro.",
        efectos: [
            {
                tipo: "DANIO",
                valor: 7,
                objetivo: "TODOS_ENEMIGOS",
                repeticiones: 2,
                oroPorGolpeAlHp: 3
            }
        ],
        mejora: {
            descripcion: "Inflige {D} de daño a todos los enemigos 2 veces. Si golpea la salud del enemigo, gana 4 de oro.",
            efectos: [
                {
                    tipo: "DANIO",
                    valor: 9,
                    objetivo: "TODOS_ENEMIGOS",
                    repeticiones: 2,
                    oroPorGolpeAlHp: 4
                }
            ]
        }
    },
    {
        id: "rey_del_oro",
        nombre: "Rey del oro",
        costo: 2,
        sprite: "formacion_defensiva_combate",
        clase: "ladron",
        calidad: "EPICA",
        tipo: "HABILIDAD",
        agotar: true,
        enPoolRecompensa: true,
        descripcion: "Gana 10 de oro. Por cada 50 de oro que tengas, gana 1 de Fuerza. Se agota.",
        efectos: [
            { tipo: "GANAR_ORO", valor: 10 },
            { tipo: "FUERZA_POR_CADA_ORO", cadaCuantoOro: 50, fuerzaGanada: 1 }
        ],
        mejora: {
            descripcion: "Gana 15 de oro. Por cada 40 de oro que tengas, gana 1 de Fuerza. Se agota.",
            efectos: [
                { tipo: "GANAR_ORO", valor: 15 },
                { tipo: "FUERZA_POR_CADA_ORO", cadaCuantoOro: 40, fuerzaGanada: 1 }
            ]
        }
    },
    {
        id: "mano_codiciosa",
        nombre: "Mano codiciosa",
        costo: 1,
        sprite: "golpe_fuerte_combate",
        clase: "ladron",
        calidad: "EPICA",
        tipo: "ATAQUE",
        objetivoSeleccion: "ENEMIGO",
        agotar: true,
        enPoolRecompensa: true,
        descripcion: "Inflige {D} de daño. Gana 1 de oro por cada HP que le falte al enemigo (máx. 200). Se agota.",
        efectos: [
            { tipo: "DANIO", valor: 6, objetivo: "ENEMIGO" },
            { tipo: "ORO_POR_HP_FALTANTE_ENEMIGO", oroPorHp: 1, maximoOro: 200, objetivo: "ENEMIGO" }
        ],
        mejora: {
            descripcion: "Inflige {D} de daño. Gana 1 de oro por cada HP que le falte al enemigo (máx. 250). Se agota.",
            efectos: [
                { tipo: "DANIO", valor: 10, objetivo: "ENEMIGO" },
                { tipo: "ORO_POR_HP_FALTANTE_ENEMIGO", oroPorHp: 1, maximoOro: 250, objetivo: "ENEMIGO" }
            ]
        }
    },
    {
        id: "interes_compuesto",
        nombre: "Interés compuesto",
        costo: 1,
        sprite: "escudo_rectangular",
        clase: "ladron",
        calidad: "EPICA",
        tipo: "HABILIDAD",
        agotar: true,
        enPoolRecompensa: true,
        descripcion: "Gana 5 de oro por cada 25 de oro que tengas. Se agota.",
        efectos: [{ tipo: "INTERES_ORO", cadaCuantoOro: 25, oroGanado: 5 }],
        mejora: {
            descripcion: "Gana 7 de oro por cada 25 de oro que tengas. Se agota.",
            efectos: [{ tipo: "INTERES_ORO", cadaCuantoOro: 25, oroGanado: 7 }]
        }
    },
    {
        id: "soborno",
        nombre: "Soborno",
        costo: 2,
        costoOro: 20,
        sprite: "bash",
        clase: "ladron",
        calidad: "EPICA",
        tipo: "HABILIDAD",
        enPoolRecompensa: true,
        descripcion: "Gasta 20 de oro y aplica 3 de Débil y 3 de Vulnerable a todos los enemigos.",
        efectos: [
            { tipo: "APLICAR_ESTADO", estadoId: "DEBIL", valor: 3, objetivo: "TODOS_ENEMIGOS" },
            { tipo: "APLICAR_ESTADO", estadoId: "VULNERABLE", valor: 3, objetivo: "TODOS_ENEMIGOS" }
        ],
        mejora: {
            descripcion: "Gasta 20 de oro y aplica 5 de Débil y 5 de Vulnerable a todos los enemigos.",
            efectos: [
                { tipo: "APLICAR_ESTADO", estadoId: "DEBIL", valor: 5, objetivo: "TODOS_ENEMIGOS" },
                { tipo: "APLICAR_ESTADO", estadoId: "VULNERABLE", valor: 5, objetivo: "TODOS_ENEMIGOS" }
            ]
        }
    },

    // ================= LEGENDARIAS (🟪) =================
    {
        id: "avaricia",
        nombre: "Avaricia",
        costo: 1,
        sprite: "formacion_defensiva_combate",
        clase: "ladron",
        calidad: "LEGENDARIA",
        tipo: "PODER",
        enPoolRecompensa: true,
        descripcion: "Gana 4 de oro por cada HP que pierdas.",
        efectos: [
            { tipo: "APLICAR_ESTADO", estadoId: "AVARICIA", valor: 4, objetivo: "PROPIO" }
        ],
        mejora: {
            descripcion: "Gana 6 de oro por cada HP que pierdas.",
            efectos: [
                { tipo: "APLICAR_ESTADO", estadoId: "AVARICIA", valor: 6, objetivo: "PROPIO" }
            ]
        }
    },
    {
        id: "imprimir_dinero",
        nombre: "Imprimir dinero",
        costo: 3,
        sprite: "escudo_rectangular",
        clase: "ladron",
        calidad: "LEGENDARIA",
        tipo: "HABILIDAD",
        agotar: true,
        enPoolRecompensa: true,
        descripcion: "Perdés 10 de HP y duplicás tu oro. Se agota.",
        efectos: [
            { tipo: "PERDER_HP", valor: 10, objetivo: "PROPIO" },
            { tipo: "DUPLICAR_ORO" }
        ],
        mejora: {
            costo: 2,
            descripcion: "Perdés 8 de HP y duplicás tu oro. Se agota.",
            efectos: [
                { tipo: "PERDER_HP", valor: 8, objetivo: "PROPIO" },
                { tipo: "DUPLICAR_ORO" }
            ]
        }
    },
    {
        id: "inversion",
        nombre: "Inversión",
        costo: 3,
        costoOro: 50,
        sprite: "golpe_fuerte_combate",
        clase: "ladron",
        calidad: "LEGENDARIA",
        tipo: "ATAQUE",
        objetivoSeleccion: "ENEMIGO",
        enPoolRecompensa: true,
        descripcion: "Gasta 50 de oro e inflige {D} de daño.",
        efectos: [{ tipo: "DANIO", valor: 50, objetivo: "ENEMIGO" }],
        mejora: {
            descripcion: "Gasta 50 de oro e inflige {D} de daño.",
            efectos: [{ tipo: "DANIO", valor: 70, objetivo: "ENEMIGO" }]
        }
    },
    {
        id: "el_que_no_arriesga_no_gana",
        nombre: "El que no arriesga, no gana",
        costo: 2,
        sprite: "formacion_defensiva_combate",
        clase: "ladron",
        calidad: "LEGENDARIA",
        tipo: "PODER",
        enPoolRecompensa: true,
        descripcion: "Al inicio de cada turno, perdés 3 de HP y ganás 3 de oro por cada 20 de oro que tengas.",
        efectos: [
            { tipo: "APLICAR_ESTADO", estadoId: "ARRIESGAR_GANAR", valor: 3, objetivo: "PROPIO" }
        ],
        mejora: {
            costo: 1,
            descripcion: "Al inicio de cada turno, perdés 3 de HP y ganás 4 de oro por cada 20 de oro que tengas.",
            efectos: [
                { tipo: "APLICAR_ESTADO", estadoId: "ARRIESGAR_GANAR", valor: 4, objetivo: "PROPIO" }
            ]
        }
    },
    {
        id: "armadura_dorada",
        nombre: "Armadura dorada",
        costo: 2,
        sprite: "defender_combate",
        clase: "ladron",
        calidad: "LEGENDARIA",
        tipo: "HABILIDAD",
        enPoolRecompensa: true,
        descripcion: "Gasta hasta 50 de oro y gana tanto bloqueo como oro gastado.",
        efectos: [{ tipo: "BLOQUEO_POR_ORO_GASTADO", maximoOro: 50 }],
        mejora: {
            descripcion: "Gasta hasta 75 de oro y gana tanto bloqueo como oro gastado.",
            efectos: [{ tipo: "BLOQUEO_POR_ORO_GASTADO", maximoOro: 75 }]
        }
    }
];