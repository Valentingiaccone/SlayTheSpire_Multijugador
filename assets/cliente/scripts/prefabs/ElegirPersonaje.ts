import { _decorator, Button, Component, Node, Sprite } from 'cc';
import { NetworkManager } from '../network/NetworkManager';
import { PersonajeId } from '../../compartido/GameTypes';
import { SpriteManager } from '../utils/SpriteManager';
const { ccclass, property } = _decorator;

@ccclass('ElegirPersonaje')
export class ElegirPersonaje extends Component {
    
    @property(Button) boton: Button = null
    @property(Sprite) sprite: Sprite = null

    private id: PersonajeId = null

    public setId(id: PersonajeId): void {
        this.id = id
    }

    public setSprite(sprite: string): void {
        SpriteManager.aplicarSprite(this.sprite, "iconos", sprite)
    }

    public onClick(): void {
        NetworkManager.instance?.elegirPersonaje(this.id)
    }
}


