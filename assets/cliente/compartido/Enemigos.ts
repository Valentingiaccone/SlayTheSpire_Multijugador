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
    guardian_antiguo: {
        id: "guardian_antiguo",
        nombre: "Guardián de Piedra (Jefe)",
        hpBase: 90,
        patron: [
            { tipo: "BLOQUEAR", valor: 12 },
            { tipo: "ATACAR", valor: 15 },
            { tipo: "ATACAR", valor: 20 }
        ]
    }
};

// Los 3 combates lineales de nuestra demo
export const ENCUENTROS_POR_PISO: Record<number, string[]> = {
    1: ["slime_acido", "slime_acido"],
    2: ["cultista", "slime_acido"],
    3: ["guardian_antiguo"]
};