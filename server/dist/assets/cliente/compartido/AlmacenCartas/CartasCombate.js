"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CARTAS_COMBATE = void 0;
exports.CARTAS_COMBATE = [
    // ================= BÁSICAS =================
    {
        id: "golpe_combate",
        nombre: "Golpe",
        costo: 1,
        sprite: "golpe_combate",
        clase: "combate",
        calidad: "BASICA",
        descripcion: "Inflige {D} de daño.",
        enPoolRecompensa: false,
        objetivoSeleccion: "ENEMIGO",
        tipo: "ATAQUE",
        efectos: [{ tipo: "DANIO", valor: 6, objetivo: "ENEMIGO" }],
        mejora: {
            descripcion: "Inflige {D} de daño.",
            efectos: [{ tipo: "DANIO", valor: 9, objetivo: "ENEMIGO" }]
        }
    },
    {
        id: "defender_combate",
        nombre: "Defender",
        costo: 1,
        descripcion: "Gana {B} de bloqueo.",
        clase: "combate",
        calidad: "BASICA",
        sprite: "defender_combate",
        enPoolRecompensa: false,
        tipo: "HABILIDAD",
        efectos: [{ tipo: "BLOQUEO", valor: 5, objetivo: "PROPIO" }],
        mejora: {
            descripcion: "Gana {B} de bloqueo.",
            efectos: [{ tipo: "BLOQUEO", valor: 8, objetivo: "PROPIO" }]
        }
    },
    {
        id: "bash",
        nombre: "Bash",
        costo: 2,
        descripcion: "Inflige {D} de daño y aplica 2 de Vulnerable.",
        objetivoSeleccion: "ENEMIGO",
        clase: "combate",
        calidad: "BASICA",
        sprite: "bash",
        enPoolRecompensa: false,
        tipo: "ATAQUE",
        efectos: [
            { tipo: "DANIO", valor: 8, objetivo: "ENEMIGO" },
            { tipo: "APLICAR_ESTADO", valor: 2, objetivo: "ENEMIGO", estadoId: "VULNERABLE" }
        ],
        mejora: {
            descripcion: "Inflige {D} de daño y aplica 3 de Vulnerable.",
            efectos: [
                { tipo: "DANIO", valor: 10, objetivo: "ENEMIGO" },
                { tipo: "APLICAR_ESTADO", valor: 3, objetivo: "ENEMIGO", estadoId: "VULNERABLE" }
            ]
        }
    },
    // ================= COMUNES (⬜️) =================
    {
        id: "formacion_defensiva",
        nombre: "Formación Defensiva",
        costo: 1,
        descripcion: "Todos los aliados ganan {B} de bloqueo.",
        clase: "combate",
        calidad: "COMUN",
        sprite: "formacion_defensiva_combate",
        enPoolRecompensa: true,
        tipo: "HABILIDAD",
        efectos: [{ tipo: "BLOQUEO", valor: 6, objetivo: "TODOS_ALIADOS" }],
        mejora: {
            descripcion: "Todos los aliados ganan {B} de bloqueo.",
            efectos: [{ tipo: "BLOQUEO", valor: 9, objetivo: "TODOS_ALIADOS" }]
        }
    },
    {
        id: "cobertura_aliada",
        nombre: "Cobertura",
        costo: 1,
        descripcion: "Otorga {B} de bloqueo a un aliado. Roba 1 carta.",
        objetivoSeleccion: "ALIADO",
        soloMultijugador: true,
        clase: "combate",
        calidad: "COMUN",
        sprite: "cobertura_combate",
        enPoolRecompensa: true,
        tipo: "HABILIDAD",
        efectos: [
            { tipo: "BLOQUEO", valor: 7, objetivo: "ALIADO" },
            { tipo: "ROBAR_CARTA", valor: 1, objetivo: "PROPIO" }
        ],
        mejora: {
            descripcion: "Otorga {B} de bloqueo a un aliado. Roba 2 cartas.",
            efectos: [
                { tipo: "BLOQUEO", valor: 10, objetivo: "ALIADO" },
                { tipo: "ROBAR_CARTA", valor: 2, objetivo: "PROPIO" }
            ]
        }
    },
    {
        id: "golpe_perforante",
        nombre: "Golpe perforante",
        costo: 1,
        descripcion: "Inflige {D} de daño a todos los enemigos.",
        clase: "combate",
        calidad: "COMUN",
        sprite: "golpe_perforante",
        enPoolRecompensa: true,
        tipo: "ATAQUE",
        efectos: [{ tipo: "DANIO", valor: 8, objetivo: "TODOS_ENEMIGOS" }],
        mejora: {
            descripcion: "Inflige {D} de daño a todos los enemigos.",
            efectos: [{ tipo: "DANIO", valor: 11, objetivo: "TODOS_ENEMIGOS" }]
        }
    },
    {
        id: "onda_de_hierro",
        nombre: "Onda de hierro",
        costo: 1,
        descripcion: "Inflige {D} de daño a un enemigo. Gana {B} de bloqueo.",
        clase: "combate",
        calidad: "COMUN",
        sprite: "onda_de_hierro",
        enPoolRecompensa: true,
        objetivoSeleccion: "ENEMIGO",
        tipo: "ATAQUE",
        efectos: [
            { tipo: "DANIO", valor: 5, objetivo: "ENEMIGO" },
            { tipo: "BLOQUEO", valor: 5, objetivo: "PROPIO" }
        ],
        mejora: {
            descripcion: "Inflige {D} de daño a un enemigo. Gana {B} de bloqueo.",
            efectos: [
                { tipo: "DANIO", valor: 7, objetivo: "ENEMIGO" },
                { tipo: "BLOQUEO", valor: 7, objetivo: "PROPIO" }
            ]
        }
    },
    {
        id: "golpe_fuerte_combate",
        nombre: "Golpe fuerte",
        costo: 1,
        descripcion: "Inflige {D} de daño. Roba 1 carta.",
        clase: "combate",
        calidad: "COMUN",
        sprite: "golpe_fuerte_combate",
        enPoolRecompensa: true,
        objetivoSeleccion: "ENEMIGO",
        tipo: "ATAQUE",
        efectos: [
            { tipo: "DANIO", valor: 9, objetivo: "ENEMIGO" },
            { tipo: "ROBAR_CARTA", valor: 1, objetivo: "PROPIO" }
        ],
        mejora: {
            descripcion: "Inflige {D} de daño. Roba 2 cartas.",
            efectos: [
                { tipo: "DANIO", valor: 11, objetivo: "ENEMIGO" },
                { tipo: "ROBAR_CARTA", valor: 2, objetivo: "PROPIO" }
            ]
        }
    },
    {
        id: "escudo_rectangular",
        nombre: "Escudo rectangular",
        costo: 1,
        descripcion: "Gana {B} de bloqueo. Roba 1 carta.",
        clase: "combate",
        calidad: "COMUN",
        sprite: "escudo_rectangular",
        enPoolRecompensa: true,
        tipo: "HABILIDAD",
        efectos: [
            { tipo: "BLOQUEO", valor: 8, objetivo: "PROPIO" },
            { tipo: "ROBAR_CARTA", valor: 1, objetivo: "PROPIO" }
        ],
        mejora: {
            descripcion: "Gana {B} de bloqueo. Roba 1 carta.",
            efectos: [
                { tipo: "BLOQUEO", valor: 11, objetivo: "PROPIO" },
                { tipo: "ROBAR_CARTA", valor: 1, objetivo: "PROPIO" }
            ]
        }
    },
    {
        id: "golpe_boomerang",
        nombre: "Golpe boomerang",
        costo: 1,
        descripcion: "Inflige {D} de daño a un enemigo aleatorio 3 veces.",
        clase: "combate",
        calidad: "COMUN",
        sprite: "golpe_boomerang",
        enPoolRecompensa: true,
        tipo: "ATAQUE",
        efectos: [{ tipo: "DANIO", valor: 3, objetivo: "ENEMIGO_ALEATORIO", repeticiones: 3 }],
        mejora: {
            descripcion: "Inflige {D} de daño a un enemigo aleatorio 4 veces.",
            efectos: [{ tipo: "DANIO", valor: 3, objetivo: "ENEMIGO_ALEATORIO", repeticiones: 4 }]
        }
    },
    {
        id: "armamento",
        nombre: "Armamento",
        costo: 1,
        sprite: "defender_combate",
        clase: "combate",
        calidad: "COMUN",
        tipo: "HABILIDAD",
        enPoolRecompensa: true,
        descripcion: "Gana {B} de bloqueo. Mejora 1 carta de tu mano por el resto del combate.",
        efectos: [
            { tipo: "BLOQUEO", valor: 5, objetivo: "PROPIO" },
            { tipo: "MEJORAR_CARTAS_MANO", cantidad: 1 }
        ],
        mejora: {
            descripcion: "Gana {B} de bloqueo. Mejora TODAS las cartas de tu mano por el resto del combate.",
            efectos: [
                { tipo: "BLOQUEO", valor: 5, objetivo: "PROPIO" },
                { tipo: "MEJORAR_CARTAS_MANO", cantidad: "TODAS" }
            ]
        }
    },
    {
        id: "golpe_corporal",
        nombre: "Golpe corporal",
        costo: 1,
        sprite: "escudo_rectangular",
        clase: "combate",
        calidad: "COMUN",
        tipo: "ATAQUE",
        objetivoSeleccion: "ENEMIGO",
        enPoolRecompensa: true,
        descripcion: "Inflige daño igual a tu bloqueo ({D}).",
        efectos: [{ tipo: "DANIO", valor: 0, objetivo: "ENEMIGO", danioIgualABloqueo: true }],
        mejora: {
            costo: 0,
            descripcion: "Inflige daño igual a tu bloqueo ({D}).",
            efectos: [{ tipo: "DANIO", valor: 0, objetivo: "ENEMIGO", danioIgualABloqueo: true }]
        }
    },
    {
        id: "clash",
        nombre: "Clash",
        costo: 0,
        sprite: "clash",
        clase: "combate",
        calidad: "COMUN",
        tipo: "ATAQUE",
        objetivoSeleccion: "ENEMIGO",
        requiereManoSoloAtaques: true,
        enPoolRecompensa: true,
        descripcion: "Solo puede jugarse si todas las cartas en tu mano son Ataques. Inflige {D} de daño.",
        efectos: [{ tipo: "DANIO", valor: 14, objetivo: "ENEMIGO" }],
        mejora: {
            descripcion: "Solo puede jugarse si todas las cartas en tu mano son Ataques. Inflige {D} de daño.",
            efectos: [{ tipo: "DANIO", valor: 18, objetivo: "ENEMIGO" }]
        }
    },
    {
        id: "golpe_critico",
        nombre: "Golpe crítico",
        costo: 2,
        sprite: "golpe_critico",
        clase: "combate",
        calidad: "COMUN",
        tipo: "ATAQUE",
        objetivoSeleccion: "ENEMIGO",
        enPoolRecompensa: true,
        descripcion: "Inflige {D} de daño y aplica 2 de Débil.",
        efectos: [
            { tipo: "DANIO", valor: 12, objetivo: "ENEMIGO" },
            { tipo: "APLICAR_ESTADO", estadoId: "DEBIL", valor: 2, objetivo: "ENEMIGO" }
        ],
        mejora: {
            descripcion: "Inflige {D} de daño y aplica 3 de Débil.",
            efectos: [
                { tipo: "DANIO", valor: 14, objetivo: "ENEMIGO" },
                { tipo: "APLICAR_ESTADO", estadoId: "DEBIL", valor: 3, objetivo: "ENEMIGO" }
            ]
        }
    },
    {
        id: "flexion",
        nombre: "Flexión",
        costo: 0,
        sprite: "flexion",
        clase: "combate",
        calidad: "COMUN",
        tipo: "HABILIDAD",
        enPoolRecompensa: true,
        descripcion: "Gana 2 de Fuerza. Al final de tu turno, perdés 2 de Fuerza.",
        efectos: [
            { tipo: "APLICAR_ESTADO", estadoId: "FUERZA", valor: 2, objetivo: "PROPIO" },
            { tipo: "APLICAR_ESTADO", estadoId: "FUERZA_TEMPORAL", valor: 2, objetivo: "PROPIO" }
        ],
        mejora: {
            descripcion: "Gana 4 de Fuerza. Al final de tu turno, perdés 4 de Fuerza.",
            efectos: [
                { tipo: "APLICAR_ESTADO", estadoId: "FUERZA", valor: 4, objetivo: "PROPIO" },
                { tipo: "APLICAR_ESTADO", estadoId: "FUERZA_TEMPORAL", valor: 4, objetivo: "PROPIO" }
            ]
        }
    },
    {
        id: "espada_pesada",
        nombre: "Espada pesada",
        costo: 2,
        sprite: "espada_pesada",
        clase: "combate",
        calidad: "COMUN",
        tipo: "ATAQUE",
        objetivoSeleccion: "ENEMIGO",
        enPoolRecompensa: true,
        descripcion: "Inflige {D} de daño. La Fuerza afecta a esta carta 3 veces.",
        efectos: [
            { tipo: "DANIO", valor: 14, objetivo: "ENEMIGO", multiplicadorFuerza: 3 }
        ],
        mejora: {
            descripcion: "Inflige {D} de daño. La Fuerza afecta a esta carta 5 veces.",
            efectos: [
                { tipo: "DANIO", valor: 14, objetivo: "ENEMIGO", multiplicadorFuerza: 5 }
            ]
        }
    },
    {
        id: "golpe_perfecto",
        nombre: "Golpe perfecto",
        costo: 2,
        sprite: "golpe_combate",
        clase: "combate",
        calidad: "COMUN",
        tipo: "ATAQUE",
        objetivoSeleccion: "ENEMIGO",
        enPoolRecompensa: true,
        descripcion: "Inflige {D} de daño (suma +2 de daño por cada otro Ataque en tu mano).",
        efectos: [
            { tipo: "DANIO", valor: 6, objetivo: "ENEMIGO", danioExtraPorAtaqueEnMano: 2 }
        ],
        mejora: {
            descripcion: "Inflige {D} de daño (suma +3 de daño por cada otro Ataque en tu mano).",
            efectos: [
                { tipo: "DANIO", valor: 6, objetivo: "ENEMIGO", danioExtraPorAtaqueEnMano: 3 }
            ]
        }
    },
    {
        id: "temblor",
        nombre: "Temblor",
        costo: 1,
        sprite: "temblor",
        clase: "combate",
        calidad: "COMUN",
        tipo: "ATAQUE",
        objetivoSeleccion: "ENEMIGO",
        enPoolRecompensa: true,
        descripcion: "Inflige {D} de daño a un enemigo y aplica 1 de Vulnerable a TODOS los enemigos.",
        efectos: [
            { tipo: "DANIO", valor: 4, objetivo: "ENEMIGO" },
            { tipo: "APLICAR_ESTADO", estadoId: "VULNERABLE", valor: 1, objetivo: "TODOS_ENEMIGOS" }
        ],
        mejora: {
            descripcion: "Inflige {D} de daño a un enemigo y aplica 2 de Vulnerable a TODOS los enemigos.",
            efectos: [
                { tipo: "DANIO", valor: 7, objetivo: "ENEMIGO" },
                { tipo: "APLICAR_ESTADO", estadoId: "VULNERABLE", valor: 2, objetivo: "TODOS_ENEMIGOS" }
            ]
        }
    },
    {
        id: "cinturon",
        nombre: "Cinturón",
        costo: 1,
        sprite: "defender_combate",
        clase: "combate",
        calidad: "COMUN",
        tipo: "HABILIDAD",
        enPoolRecompensa: true,
        descripcion: "Gana {B} de bloqueo. Agota 1 carta aleatoria de tu mano.",
        efectos: [
            { tipo: "BLOQUEO", valor: 7, objetivo: "PROPIO" },
            { tipo: "AGOTAR_CARTA_MANO_AZAR", cantidad: 1 }
        ],
        mejora: {
            descripcion: "Gana {B} de bloqueo. Agota 1 carta aleatoria de tu mano.",
            efectos: [
                { tipo: "BLOQUEO", valor: 10, objetivo: "PROPIO" },
                { tipo: "AGOTAR_CARTA_MANO_AZAR", cantidad: 1 }
            ]
        }
    },
    {
        id: "golpe_doble",
        nombre: "Golpe doble",
        costo: 1,
        sprite: "golpe_combate",
        clase: "combate",
        calidad: "COMUN",
        tipo: "ATAQUE",
        objetivoSeleccion: "ENEMIGO",
        enPoolRecompensa: true,
        descripcion: "Inflige {D} de daño 2 veces.",
        efectos: [{ tipo: "DANIO", valor: 5, objetivo: "ENEMIGO", repeticiones: 2 }],
        mejora: {
            descripcion: "Inflige {D} de daño 2 veces.",
            efectos: [{ tipo: "DANIO", valor: 7, objetivo: "ENEMIGO", repeticiones: 2 }]
        }
    },
    // ================= ÉPICAS (🟨) =================
    {
        id: "trance_de_batalla",
        nombre: "Trance de batalla",
        costo: 0,
        sprite: "escudo_rectangular",
        clase: "combate",
        calidad: "EPICA",
        tipo: "HABILIDAD",
        enPoolRecompensa: true,
        descripcion: "Roba 3 cartas. No podés robar más cartas durante este turno.",
        efectos: [
            { tipo: "ROBAR_CARTA", valor: 3, objetivo: "PROPIO" },
            { tipo: "APLICAR_ESTADO", estadoId: "SIN_ROBO", valor: 1, objetivo: "PROPIO" }
        ],
        mejora: {
            descripcion: "Roba 4 cartas. No podés robar más cartas durante este turno.",
            efectos: [
                { tipo: "ROBAR_CARTA", valor: 4, objetivo: "PROPIO" },
                { tipo: "APLICAR_ESTADO", estadoId: "SIN_ROBO", valor: 1, objetivo: "PROPIO" }
            ]
        }
    },
    {
        id: "sangre_por_sangre",
        nombre: "Sangre por sangre",
        costo: 4,
        reduccionCostoPorHpPerdido: true,
        sprite: "sangre_por_sangre",
        clase: "combate",
        calidad: "EPICA",
        tipo: "ATAQUE",
        objetivoSeleccion: "ENEMIGO",
        enPoolRecompensa: true,
        descripcion: "Cuesta 1 menos de energía por cada HP perdido en este combate. Inflige {D} de daño.",
        efectos: [{ tipo: "DANIO", valor: 18, objetivo: "ENEMIGO" }],
        mejora: {
            costo: 3,
            descripcion: "Cuesta 1 menos de energía por cada HP perdido en este combate. Inflige {D} de daño.",
            efectos: [{ tipo: "DANIO", valor: 22, objetivo: "ENEMIGO" }]
        }
    },
    {
        id: "sangre_cargada",
        nombre: "Sangre cargada",
        costo: 0,
        sprite: "formacion_defensiva_combate",
        clase: "combate",
        calidad: "EPICA",
        tipo: "HABILIDAD",
        enPoolRecompensa: true,
        descripcion: "Perdés 3 de HP y ganás 2 de energía.",
        efectos: [
            { tipo: "PERDER_HP", valor: 3, objetivo: "PROPIO" },
            { tipo: "GANAR_ENERGIA", valor: 2, objetivo: "PROPIO" }
        ],
        mejora: {
            descripcion: "Perdés 3 de HP y ganás 3 de energía.",
            efectos: [
                { tipo: "PERDER_HP", valor: 3, objetivo: "PROPIO" },
                { tipo: "GANAR_ENERGIA", valor: 3, objetivo: "PROPIO" }
            ]
        }
    },
    {
        id: "carniceria",
        nombre: "Carnicería",
        costo: 2,
        eterno: true,
        sprite: "carniceria_combate",
        clase: "combate",
        calidad: "EPICA",
        tipo: "ATAQUE",
        objetivoSeleccion: "ENEMIGO",
        enPoolRecompensa: true,
        descripcion: "Eterno (se mantiene en tu mano al terminar el turno). Inflige {D} de daño.",
        efectos: [{ tipo: "DANIO", valor: 20, objetivo: "ENEMIGO" }],
        mejora: {
            descripcion: "Eterno (se mantiene en tu mano al terminar el turno). Inflige {D} de daño.",
            efectos: [{ tipo: "DANIO", valor: 28, objetivo: "ENEMIGO" }]
        }
    },
    {
        id: "combustion",
        nombre: "Combustión",
        costo: 1,
        sprite: "combustion",
        clase: "combate",
        calidad: "EPICA",
        tipo: "PODER",
        enPoolRecompensa: true,
        descripcion: "Al final de tu turno, perdés 1 de HP e infligís 5 de daño a todos los enemigos.",
        efectos: [
            { tipo: "APLICAR_ESTADO", estadoId: "COMBUSTION", valor: 5, objetivo: "PROPIO" }
        ],
        mejora: {
            descripcion: "Al final de tu turno, perdés 1 de HP e infligís 7 de daño a todos los enemigos.",
            efectos: [
                { tipo: "APLICAR_ESTADO", estadoId: "COMBUSTION", valor: 7, objetivo: "PROPIO" }
            ]
        }
    },
    {
        id: "desarmado",
        nombre: "Desarmado",
        costo: 1,
        agotar: true,
        sprite: "desarmado",
        clase: "combate",
        calidad: "EPICA",
        tipo: "HABILIDAD",
        objetivoSeleccion: "ENEMIGO",
        enPoolRecompensa: true,
        descripcion: "Un enemigo pierde 2 de Fuerza. Se agota.",
        efectos: [
            { tipo: "APLICAR_ESTADO", estadoId: "FUERZA", valor: -2, objetivo: "ENEMIGO" }
        ],
        mejora: {
            descripcion: "Un enemigo pierde 3 de Fuerza. Se agota.",
            efectos: [
                { tipo: "APLICAR_ESTADO", estadoId: "FUERZA", valor: -3, objetivo: "ENEMIGO" }
            ]
        }
    },
    {
        id: "patada",
        nombre: "Patada",
        costo: 1,
        sprite: "patada",
        clase: "combate",
        calidad: "EPICA",
        tipo: "ATAQUE",
        objetivoSeleccion: "ENEMIGO",
        enPoolRecompensa: true,
        descripcion: "Inflige {D} de daño. Si el enemigo tiene Vulnerable, gana 1 de energía y roba 1 carta.",
        efectos: [
            { tipo: "DANIO", valor: 5, objetivo: "ENEMIGO" },
            {
                tipo: "CONDICIONAL",
                condicion: { tipo: "TIENE_ESTADO", objetivo: "ENEMIGO", estadoId: "VULNERABLE", minimo: 1 },
                efectosSiCumple: [
                    { tipo: "GANAR_ENERGIA", valor: 1, objetivo: "PROPIO" },
                    { tipo: "ROBAR_CARTA", valor: 1, objetivo: "PROPIO" }
                ]
            }
        ],
        mejora: {
            descripcion: "Inflige {D} de daño. Si el enemigo tiene Vulnerable, gana 1 de energía y roba 1 carta.",
            efectos: [
                { tipo: "DANIO", valor: 8, objetivo: "ENEMIGO" },
                {
                    tipo: "CONDICIONAL",
                    condicion: { tipo: "TIENE_ESTADO", objetivo: "ENEMIGO", estadoId: "VULNERABLE", minimo: 1 },
                    efectosSiCumple: [
                        { tipo: "GANAR_ENERGIA", valor: 1, objetivo: "PROPIO" },
                        { tipo: "ROBAR_CARTA", valor: 1, objetivo: "PROPIO" }
                    ]
                }
            ]
        }
    }
];
