import { Poi } from './poi';
import { AngleOfView } from './angle-of-view';

export class Antenna {
    id: string;
    name: string;
    frequency: number;
    position: number[];
    poiList: Poi[];
    totalPois: number;
    angleOfView: AngleOfView;
    createdAt: any;

    constructor() {
        this.position = [null, null];
        this.poiList = [new Poi()];
        this.angleOfView = new AngleOfView();
        this.createdAt = new Date();
    }
}
