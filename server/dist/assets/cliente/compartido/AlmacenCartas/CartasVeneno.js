"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CARTAS_VENENO = void 0;
exports.CARTAS_VENENO = [
    {
        id: "golpe_veneno",
        nombre: "Golpe",
        costo: 1,
        sprite: "golpe_combate",
        clase: "veneno",
        calidad: "BASICA",
        descripcion: "Inflige {D} de daño.",
        enPoolRecompensa: false,
        precioTienda: 45,
        objetivoSeleccion: "ENEMIGO",
        tipo: "ATAQUE",
        efectos: [{ tipo: "DANIO", valor: 6, objetivo: "ENEMIGO" }],
        mejora: {
            descripcion: "Inflige {D} de daño.",
            efectos: [{ tipo: "DANIO", valor: 9, objetivo: "ENEMIGO" }]
        }
    },
    {
        id: "defender_veneno",
        nombre: "Defender",
        costo: 1,
        descripcion: "Gana {B} de bloqueo.",
        clase: "veneno",
        calidad: "BASICA",
        sprite: "defender_combate",
        enPoolRecompensa: false,
        precioTienda: 45,
        tipo: "HABILIDAD",
        efectos: [{ tipo: "BLOQUEO", valor: 5, objetivo: "PROPIO" }],
        mejora: {
            descripcion: "Gana {B} de bloqueo.",
            efectos: [{ tipo: "BLOQUEO", valor: 8, objetivo: "PROPIO" }]
        }
    },
    {
        id: "nube_mortal",
        nombre: "Nube mortal",
        costo: 1,
        sprite: "escudo_rectangular",
        clase: "veneno",
        calidad: "COMUN",
        tipo: "HABILIDAD",
        objetivoSeleccion: "ENEMIGO",
        enPoolRecompensa: true,
        descripcion: "Aplica 5 de Veneno.",
        efectos: [{ tipo: "APLICAR_ESTADO", estadoId: "VENENO", valor: 5, objetivo: "ENEMIGO" }],
        mejora: {
            descripcion: "Aplica 7 de Veneno.",
            efectos: [{ tipo: "APLICAR_ESTADO", estadoId: "VENENO", valor: 7, objetivo: "ENEMIGO" }]
        }
    },
    {
        id: "punalada_envenenada",
        nombre: "Puñalada envenenada",
        costo: 1,
        sprite: "golpe_perforante",
        clase: "veneno",
        calidad: "COMUN",
        tipo: "ATAQUE",
        objetivoSeleccion: "ENEMIGO",
        enPoolRecompensa: true,
        descripcion: "Inflige {D} de daño y aplica 3 de Veneno.",
        efectos: [
            { tipo: "DANIO", valor: 6, objetivo: "ENEMIGO" },
            { tipo: "APLICAR_ESTADO", estadoId: "VENENO", valor: 3, objetivo: "ENEMIGO" }
        ],
        mejora: {
            descripcion: "Inflige {D} de daño y aplica 4 de Veneno.",
            efectos: [
                { tipo: "DANIO", valor: 8, objetivo: "ENEMIGO" },
                { tipo: "APLICAR_ESTADO", estadoId: "VENENO", valor: 4, objetivo: "ENEMIGO" }
            ]
        }
    },
    {
        id: "perdicion",
        nombre: "Perdición",
        costo: 1,
        sprite: "golpe_combate",
        clase: "veneno",
        calidad: "COMUN",
        tipo: "ATAQUE",
        objetivoSeleccion: "ENEMIGO",
        enPoolRecompensa: true,
        descripcion: "Inflige {D} de daño. Si el enemigo tiene Veneno, inflige {D} de daño extra.",
        efectos: [
            { tipo: "DANIO", valor: 7, objetivo: "ENEMIGO" },
            {
                tipo: "CONDICIONAL",
                condicion: { tipo: "TIENE_ESTADO", objetivo: "ENEMIGO", estadoId: "VENENO", minimo: 1 },
                efectosSiCumple: [{ tipo: "DANIO", valor: 7, objetivo: "ENEMIGO" }]
            }
        ],
        mejora: {
            descripcion: "Inflige {D} de daño. Si el enemigo tiene Veneno, inflige {D} de daño extra.",
            efectos: [
                { tipo: "DANIO", valor: 10, objetivo: "ENEMIGO" },
                {
                    tipo: "CONDICIONAL",
                    condicion: { tipo: "TIENE_ESTADO", objetivo: "ENEMIGO", estadoId: "VENENO", minimo: 1 },
                    efectosSiCumple: [{ tipo: "DANIO", valor: 10, objetivo: "ENEMIGO" }]
                }
            ]
        }
    },
    {
        id: "frasco_rebotante",
        nombre: "Frasco rebotante",
        costo: 2,
        sprite: "escudo_rectangular",
        clase: "veneno",
        calidad: "EPICA",
        tipo: "HABILIDAD",
        enPoolRecompensa: true,
        descripcion: "Aplica 3 de Veneno a un enemigo aleatorio 3 veces.",
        efectos: [
            { tipo: "APLICAR_ESTADO", estadoId: "VENENO", valor: 3, objetivo: "ENEMIGO_ALEATORIO" },
            { tipo: "APLICAR_ESTADO", estadoId: "VENENO", valor: 3, objetivo: "ENEMIGO_ALEATORIO" },
            { tipo: "APLICAR_ESTADO", estadoId: "VENENO", valor: 3, objetivo: "ENEMIGO_ALEATORIO" }
        ],
        mejora: {
            descripcion: "Aplica 3 de Veneno a un enemigo aleatorio 4 veces.",
            efectos: [
                { tipo: "APLICAR_ESTADO", estadoId: "VENENO", valor: 3, objetivo: "ENEMIGO_ALEATORIO" },
                { tipo: "APLICAR_ESTADO", estadoId: "VENENO", valor: 3, objetivo: "ENEMIGO_ALEATORIO" },
                { tipo: "APLICAR_ESTADO", estadoId: "VENENO", valor: 3, objetivo: "ENEMIGO_ALEATORIO" },
                { tipo: "APLICAR_ESTADO", estadoId: "VENENO", valor: 3, objetivo: "ENEMIGO_ALEATORIO" }
            ]
        }
    },
    {
        id: "nube_paralizante",
        nombre: "Nube paralizante",
        costo: 2,
        sprite: "formacion_defensiva_combate",
        clase: "veneno",
        calidad: "EPICA",
        tipo: "HABILIDAD",
        enPoolRecompensa: true,
        agotar: true,
        descripcion: "Aplica 4 de Veneno y 2 de Débil a TODOS los enemigos. Se agota.",
        efectos: [
            { tipo: "APLICAR_ESTADO", estadoId: "VENENO", valor: 4, objetivo: "TODOS_ENEMIGOS" },
            { tipo: "APLICAR_ESTADO", estadoId: "DEBIL", valor: 2, objetivo: "TODOS_ENEMIGOS" }
        ],
        mejora: {
            descripcion: "Aplica 7 de Veneno y 2 de Débil a TODOS los enemigos. Se agota.",
            efectos: [
                { tipo: "APLICAR_ESTADO", estadoId: "VENENO", valor: 7, objetivo: "TODOS_ENEMIGOS" },
                { tipo: "APLICAR_ESTADO", estadoId: "DEBIL", valor: 2, objetivo: "TODOS_ENEMIGOS" }
            ]
        }
    },
    {
        id: "catalizador",
        nombre: "Catalizador",
        costo: 1,
        sprite: "escudo_rectangular",
        clase: "veneno",
        calidad: "EPICA",
        tipo: "HABILIDAD",
        objetivoSeleccion: "ENEMIGO",
        enPoolRecompensa: true,
        agotar: true,
        descripcion: "Duplica el Veneno de un enemigo. Se agota.",
        efectos: [{
                tipo: "APLICAR_ESTADO",
                estadoId: "VENENO",
                valor: { tipo: "LEER_ESTADO", objetivo: "ENEMIGO", estadoId: "VENENO", multiplicador: 1 },
                objetivo: "ENEMIGO"
            }],
        mejora: {
            descripcion: "Triplica el Veneno de un enemigo. Se agota.",
            efectos: [{
                    tipo: "APLICAR_ESTADO",
                    estadoId: "VENENO",
                    valor: { tipo: "LEER_ESTADO", objetivo: "ENEMIGO", estadoId: "VENENO", multiplicador: 2 },
                    objetivo: "ENEMIGO"
                }]
        }
    },
    {
        id: "gases_nocivos",
        nombre: "Gases Nocivos",
        costo: 1,
        sprite: "formacion_defensiva_combate",
        clase: "veneno",
        calidad: "EPICA",
        tipo: "PODER",
        enPoolRecompensa: true,
        descripcion: "Al inicio de tu turno, aplica 2 de Veneno a TODOS los enemigos.",
        efectos: [{ tipo: "APLICAR_ESTADO", estadoId: "GASES_NOCIVOS", valor: 2, objetivo: "PROPIO" }],
        mejora: {
            descripcion: "Al inicio de tu turno, aplica 3 de Veneno a TODOS los enemigos.",
            efectos: [{ tipo: "APLICAR_ESTADO", estadoId: "GASES_NOCIVOS", valor: 3, objetivo: "PROPIO" }]
        }
    }
];
