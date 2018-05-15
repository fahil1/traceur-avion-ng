import { Position } from './position';

export class Recording {
    id: string;
    icao: string;
    call_sign: string;
    positions: Position[] = [];
    createdAt: Date;
}
