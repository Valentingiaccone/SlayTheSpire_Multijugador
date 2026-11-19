import { resources, SpriteFrame, Sprite, Texture2D } from "cc";

export type TipoCarpeta = "iconos" | "cartas" | "reliquias" | "entidades" | "estados" | "intenciones";

export class SpriteManager {
    private static cacheSprites: Map<string, SpriteFrame> = new Map();
    private static cargasSpriteEnCurso: Map<string, Promise<SpriteFrame | null>> = new Map();

    private static cacheTexturas: Map<string, Texture2D> = new Map();
    private static cargasTexturaEnCurso: Map<string, Promise<Texture2D | null>> = new Map();

    public static async obtenerSprite(
        carpeta: TipoCarpeta,
        nombre: string,
        fallbackNombre?: string
    ): Promise<SpriteFrame | null> {
        const frame = await this.cargarSpriteFrameDirecto(carpeta, nombre);
        if (frame) return frame;

        if (fallbackNombre && fallbackNombre !== nombre) {
            return this.cargarSpriteFrameDirecto(carpeta, fallbackNombre);
        }
        return null;
    }

    private static cargarSpriteFrameDirecto(carpeta: TipoCarpeta, nombre: string): Promise<SpriteFrame | null> {
        const carpetaLimpia = carpeta.replace(/^\/+|\/+$/g, "");
        const rutaBase = carpetaLimpia ? `${carpetaLimpia}/${nombre}` : nombre;

        if (this.cacheSprites.has(rutaBase)) {
            return Promise.resolve(this.cacheSprites.get(rutaBase)!);
        }

        if (this.cargasSpriteEnCurso.has(rutaBase)) {
            return this.cargasSpriteEnCurso.get(rutaBase)!;
        }

        const promesa = new Promise<SpriteFrame | null>((resolve) => {
            resources.load(`${rutaBase}/spriteFrame`, SpriteFrame, (err, spriteFrame) => {
                this.cargasSpriteEnCurso.delete(rutaBase);

                if (err || !spriteFrame) {
                    resolve(null);
                    return;
                }

                spriteFrame.packable = false;
                this.cacheSprites.set(rutaBase, spriteFrame);
                resolve(spriteFrame);
            });
        });

        this.cargasSpriteEnCurso.set(rutaBase, promesa);
        return promesa;
    }

    public static async obtenerTextura(
        carpeta: TipoCarpeta,
        nombre: string,
        pixelArt: boolean = true
    ): Promise<Texture2D | null> {
        const carpetaLimpia = carpeta.replace(/^\/+|\/+$/g, "");
        const rutaBase = carpetaLimpia ? `${carpetaLimpia}/${nombre}` : nombre;

        if (this.cacheTexturas.has(rutaBase)) {
            return this.cacheTexturas.get(rutaBase)!;
        }

        if (this.cargasTexturaEnCurso.has(rutaBase)) {
            return this.cargasTexturaEnCurso.get(rutaBase)!;
        }

        const promesa = new Promise<Texture2D | null>((resolve) => {
            resources.load(`${rutaBase}/texture`, Texture2D, (err, textura) => {
                this.cargasTexturaEnCurso.delete(rutaBase);

                if (err || !textura) {
                    resolve(null);
                    return;
                }

                if (pixelArt) {
                    textura.setFilters(Texture2D.Filter.NEAREST, Texture2D.Filter.NEAREST);
                }
                this.cacheTexturas.set(rutaBase, textura);
                resolve(textura);
            });
        });

        this.cargasTexturaEnCurso.set(rutaBase, promesa);
        return promesa;
    }

    public static async aplicarSprite(
        spriteComp: Sprite | null,
        carpeta: TipoCarpeta,
        nombre: string,
        fallbackNombre?: string
    ): Promise<boolean> {
        if (!spriteComp || !spriteComp.isValid) return false;

        const frame = await this.obtenerSprite(carpeta, nombre, fallbackNombre);
        if (frame && spriteComp.isValid) {
            spriteComp.spriteFrame = frame;
            return true;
        }
        return false;
    }

    public static precargarCarpeta(carpeta: TipoCarpeta): Promise<void> {
        const carpetaLimpia = carpeta.replace(/^\/+|\/+$/g, "");
        return new Promise((resolve) => {
            resources.loadDir(carpetaLimpia, SpriteFrame, (err, assets) => {
                if (!err && assets) {
                    assets.forEach((frame) => {
                        frame.packable = false;
                        const clave = carpetaLimpia ? `${carpetaLimpia}/${frame.name}` : frame.name;
                        this.cacheSprites.set(clave, frame);
                    });
                }
                resolve();
            });
        });
    }
}