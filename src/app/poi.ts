export class Poi {
    name: string;
    position: number[] ;
    distance: number;
    azimuth: number;
    createdAt: any;

    constructor() {
        this.position = [null, null];
    }
}
