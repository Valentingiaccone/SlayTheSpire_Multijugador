export type TipoIntencion = "ATACAR" | "BLOQUEAR";

export interface IIntencionPatron {
    tipo: TipoIntencion;
    valor: number;
}

export interface IEnemigoInfo {
    id: string;
    nombre: string;
    hpBase: number;
    patron: IIntencionPatron[];
}

export interface IEncuentroPool {
    id: string;
    pisoMinimo: number;
    enemigos: string[];
}

export const ENEMIGOS_INFO: Record<string, IEnemigoInfo> = {
    slime_acido: {
        id: "slime_acido",
        nombre: "Slime Ácido",
        hpBase: 32,
        patron: [
            { tipo: "ATACAR", valor: 8 },
            { tipo: "BLOQUEAR", valor: 6 },
            { tipo: "ATACAR", valor: 12 }
        ]
    },
    cultista: {
        id: "cultista",
        nombre: "Cultista Oscuro",
        hpBase: 40,
        patron: [
            { tipo: "ATACAR", valor: 6 },
            { tipo: "ATACAR", valor: 10 },
            { tipo: "ATACAR", valor: 14 }
        ]
    },
    // ================= ENEMIGOS DE ÉLITE =================
    verdugo_blindado: {
        id: "verdugo_blindado",
        nombre: "👹 Verdugo Blindado (Élite)",
        hpBase: 65,
        patron: [
            { tipo: "ATACAR", valor: 12 },
            { tipo: "BLOQUEAR", valor: 10 },
            { tipo: "ATACAR", valor: 16 }
        ]
    },
    reina_slime: {
        id: "reina_slime",
        nombre: "👹 Reina Slime (Élite)",
        hpBase: 55,
        patron: [
            { tipo: "ATACAR", valor: 10 },
            { tipo: "ATACAR", valor: 14 }
        ]
    },
    // ================= JEFES =================
    guardian_antiguo: {
        id: "guardian_antiguo",
        nombre: "💀 Guardián de Piedra (Jefe)",
        hpBase: 95,
        patron: [
            { tipo: "BLOQUEAR", valor: 12 },
            { tipo: "ATACAR", valor: 15 },
            { tipo: "ATACAR", valor: 20 }
        ]
    }
};

export const POOL_ENCUENTROS_NORMALES: IEncuentroPool[] = [
    { id: "slimes_dobles", pisoMinimo: 1, enemigos: ["slime_acido", "slime_acido"] },
    { id: "cultista_solitario", pisoMinimo: 1, enemigos: ["cultista"] },
    { id: "cultista_y_slime", pisoMinimo: 2, enemigos: ["cultista", "slime_acido"] }
];

export const POOL_ENCUENTROS_ELITES: IEncuentroPool[] = [
    { id: "elite_verdugo", pisoMinimo: 2, enemigos: ["verdugo_blindado"] },
    { id: "elite_reina_escolta", pisoMinimo: 2, enemigos: ["reina_slime", "slime_acido"] }
];

export const POOL_ENCUENTROS_JEFES: IEncuentroPool[] = [
    { id: "jefe_guardian", pisoMinimo: 1, enemigos: ["guardian_antiguo"] }
];

export function obtenerEncuentroAleatorio(tipoCombate: "COMBATE" | "ELITE" | "JEFE", pisoActual: number): string[] {
    const poolBase =
        tipoCombate === "JEFE"
            ? POOL_ENCUENTROS_JEFES
            : tipoCombate === "ELITE"
            ? POOL_ENCUENTROS_ELITES
            : POOL_ENCUENTROS_NORMALES;

    const candidatos = poolBase.filter((e) => pisoActual >= e.pisoMinimo);
    const listaFinal = candidatos.length > 0 ? candidatos : poolBase;

    const elegido = listaFinal[Math.floor(Math.random() * listaFinal.length)];
    return [...elegido.enemigos];
}