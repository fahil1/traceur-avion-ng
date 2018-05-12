import Map from 'ol/map';
import XYZ from 'ol/source/xyz';

import Vector from 'ol/layer/vector';
import Source from 'ol/source/vector';
import Tile from 'ol/layer/tile';


export class UtilsRTP {
    renderBaseMap(map: Map): any {
        const ly = new Tile({
            source: new XYZ({
                url: 'assets/tiles/{z}/{x}/{y}.png'
            })
        });
        ly.set('name', 'offline');
        map.addLayer(ly);
    }
}
