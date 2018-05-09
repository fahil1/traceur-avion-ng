import { Antenna } from './antenna';
import { Poi } from './poi';
import { bearing, distance, bearingToAzimuth, destination,
     lineArc, degreesToRadians, round, sector } from '@turf/turf';

import GeoJSON from 'ol/format/geojson';
import proj from 'ol/proj';

import Map from 'ol/map';
import View from 'ol/view';
import Feature from 'ol/feature';
import Point from 'ol/geom/point';
import LineString from 'ol/geom/linestring';
import Style from 'ol/style/style';
import Text from 'ol/style/text';
import Stroke from 'ol/style/stroke';
import Fill from 'ol/style/fill';
import Icon from 'ol/style/icon';
import Extent from 'ol/extent';

import Vector from 'ol/layer/vector';
import Source from 'ol/source/vector';

import Tile from 'ol/layer/tile';
import BingMaps from 'ol/source/bingmaps';
import Overlay from 'ol/overlay';

export class Utils {
    public maxAzimuth: number;
    public minAzimuth: number;
    public maxDistance: number;
    public alpha: number;       // angle between north and half-bearing *azimuth
    public destination: any; // point between north and half-bearing *point

    hydratePoisByDistanceAndBearing(antenna: Antenna) {
        let isFirstTime = true;

        antenna.poiList.forEach(poi => {
            poi.distance = distance(this.toTurf(antenna), this.toTurf(poi));
            poi.azimuth = bearingToAzimuth(bearing(this.toTurf(antenna), this.toTurf(poi)));
            if (isFirstTime) {
                this.maxAzimuth = poi.azimuth;
                this.minAzimuth = poi.azimuth;
                this.maxDistance = poi.distance;
                isFirstTime = false;
            } else {
                if (poi.azimuth > this.maxAzimuth) {
                    this.maxAzimuth = poi.azimuth;
                }
                if (poi.azimuth < this.minAzimuth) {
                    this.minAzimuth = poi.azimuth;
                }
                if (poi.distance > this.maxDistance) {
                    this.maxDistance = poi.distance;
                }
            }
        });
        const angleHalf = (this.maxAzimuth - this.minAzimuth) / 2;
        this.alpha = this.minAzimuth + angleHalf;
        this.destination = this.toFeature(destination(this.toTurf(antenna), this.maxDistance, this.azimuthToBearing(this.alpha)));
    }

    toTurf(a: Poi | Antenna) {
        const format = new GeoJSON();
        const feature = new Feature({
            geometry: new Point(a.position)
        });
        const json = format.writeFeatureObject(feature, {
            dataProjection: 'EPSG:4326',
        });
        return json;
    }


    toFeature(json: any) {
        const format = new GeoJSON();
        const features = format.readFeatures(json, {
            dataProjection: 'EPSG:4326'
        });
        return features[0];
    }

    showMax() {
        console.log('maxAzimuth: ' + this.azimuthToBearing(this.maxAzimuth));
        console.log('minAzimuth: ' + this.azimuthToBearing(this.minAzimuth));
        console.log('maxDistance: ' + this.maxDistance);
    }

    azimuthToBearing(azimuth: number) {
        if (azimuth > 180) {
            return -(360 - azimuth);
        }
        return azimuth;
    }


    initMap(map: Map, antenna: Antenna) {
        const bing_layer = new Tile({
            source: new BingMaps({
                key: 'Aj_lt5oGlcTzENwKBowFxOxF8JwHR8eaxf66ufX0WfSYs8rGrny5JfIv0Cp1ODT4',
                imagerySet: 'CanvasLight'
            })
        });
        bing_layer.set('name', 'bing');
        map = new Map({
          view: new View({
            projection: 'EPSG:4326'
          }),
          layers: [bing_layer],
          target: 'map'
        });

        this.hydratePoisByDistanceAndBearing(antenna);
        this.renderSector(map, antenna);
        this.renderDestination(map, antenna);
        this.renderNorth(map, antenna);
        this.renderAntenna(map, antenna);
        this.renderAngles(map, antenna);

        this.zoomToExtent(map);

        map.updateSize();
    }

    renderAntenna(map: Map, antenna: Antenna) {
        // Antenna
        const style_antenna = new Style({
            image: new Icon({
                src: 'assets/antenna.png'
            }),
            text: new Text({
                text: antenna.name + ' ' + antenna.frequency + ' MHz',
                fill: new Fill({
                    color: '#00FF00'
                }),
                stroke: new Stroke({
                    color: '#000000',
                    width: 3
                }),
                offsetY: 18,
            })
        });
        const feature = new Feature({
            geometry: new Point(antenna.position)
        });
        feature.setStyle(style_antenna);
        const layer_antenna = new Vector({
            source: new Source({
                features: [feature]
            })
        });
        layer_antenna.set('name', 'antenna');

        // Pois
        const features: Feature[] = [];
        antenna.poiList.forEach(poi => {
            const style_poi = new Style({
                image: new Icon({
                  src: 'assets/poi.png'
                }),
                text: new Text({
                  text: poi.name,
                  fill: new Fill({
                      color: '#00FF00'
                  }),
                  stroke: new Stroke({
                      color: '#000000',
                      width: 3
                  }),
                  offsetY: 18,
              })
              });
              const feature_poi = new Feature({
                geometry: new Point(poi.position),
                name: poi.name,
              });
              feature_poi.setStyle(style_poi);
              features.push(feature_poi);
        });
        const layer_pois = new Vector({
            source: new Source({
                features: features
            })
        });
        layer_pois.set('name', 'pois');

        map.addLayer(layer_antenna);
        map.addLayer(layer_pois);


    }

    renderNorth(map: Map, antenna: Antenna) {
        const north_point = this.toFeature(destination(this.toTurf(antenna), this.maxDistance, 0));
        const lineString = new LineString();

        lineString.appendCoordinate(antenna.position);
        lineString.appendCoordinate(north_point.getGeometry().getCoordinates());
        const feature_line = new Feature({
            geometry: lineString
        });
        feature_line.setStyle(new Style({
            stroke: new Stroke({
                color: '#ff0000',
                width: 1
              })
        }));

        const feature_point = new Feature({
            geometry: new Point(north_point.getGeometry().getCoordinates())
        });
        feature_point.setStyle(new Style({
            image: new Icon({
                src: 'assets/north.png'
            }),
            text: new Text({
                text: 'Nord',
                offsetY: -10,
                fill: new Fill({
                    color: '#FF0000'
                })
            })
        }));
        const north_line_layer = new Vector({
            source: new Source({
                features: [feature_line, feature_point]
            })
        });
        north_line_layer.set('name', 'north');
        map.addLayer(north_line_layer);
    }

    renderDestination(map: Map, antenna: Antenna) {
        // Point
        const style_point = new Style({
            image: new Icon({
                src: 'assets/half.png'
            })
        });
        const point = new Feature({
            geometry: new Point(this.destination.getGeometry().getCoordinates())
        });
        point.setStyle(style_point);

        // Axe
        const lineString = new LineString();

        lineString.appendCoordinate(antenna.position);
        lineString.appendCoordinate(this.destination.getGeometry().getCoordinates());

        const axe = new Feature({
            geometry: lineString
        });
        axe.setStyle(new Style({
            stroke: new Stroke({
                lineDash:  [20, 3],
                color: '#0000FF'
            })
        }));

        const layer_destination =  new Vector({
            source: new Source({
                features: [point , axe]
            })
        });
        layer_destination.set('name', 'destination');
        map.addLayer(layer_destination);

    }

    renderSector(map: Map, antenna: Antenna) {
        const b1 = this.alpha - (antenna.angleOfView.angle / 2);
        const b2 = this.alpha + (antenna.angleOfView.angle / 2);

        const antenna_sector = sector(this.toTurf(antenna), this.maxDistance, this.azimuthToBearing(b1), this.azimuthToBearing(b2));

        const layer = new Vector({
            source: new Source({
                features: [this.toFeature(antenna_sector)]
            }),
            style: new Style({
                fill: new Fill({
                    color: '#9b59b6'
                }),
                stroke: new Stroke({
                    color: '#8e44ad',
                    width: 2
                })
            }),
            opacity: 0.3
        });
        layer.set('name', 'sector');
        map.addLayer(layer);
    }

    renderAngles(map: Map, antenna: Antenna) {

        // Arc alpha
        let arc_alpha: Feature;
        const alpha_to_bearing = this.azimuthToBearing(this.alpha);
        if (alpha_to_bearing >= 0) {
            arc_alpha = this.toFeature(lineArc(this.toTurf(antenna), this.maxDistance,
        0, alpha_to_bearing));
        } else {
            arc_alpha = this.toFeature(lineArc(this.toTurf(antenna), this.maxDistance,
            alpha_to_bearing, 0));
        }
        arc_alpha.setStyle(new Style({
            text: new Text({
                text: Math.abs(round(this.azimuthToBearing(this.alpha), 2)) + '°',
                scale: 1.2,
                rotation:  this.alpha,
                fill: new Fill({
                    color: '#f1c40f'
                }),
                stroke: new Stroke({
                    color: '#000000',
                    width: 3
                })
            }),
            stroke: new Stroke({
                color: '#f39c12',
                width: 2
            })
        }));

        // arc angle of view
        const b1 = this.alpha - (antenna.angleOfView.angle / 2);
        const b2 = this.alpha + (antenna.angleOfView.angle / 2);
        const arc_angle_view = this.toFeature(lineArc(this.toTurf(antenna), this.maxDistance * 0.25,
        this.azimuthToBearing(b1), this.azimuthToBearing(b2)));
        arc_angle_view.setStyle(new Style({
            text: new Text({
                text: Math.abs(round(this.azimuthToBearing(antenna.angleOfView.angle), 2)) + '°',
                scale: 1.2,
                rotation:  this.alpha,
                fill: new Fill({
                    color: '#f1c40f'
                }),
                stroke: new Stroke({
                    color: '#000000',
                    width: 3
                })
            }),
            stroke: new Stroke({
                color: '#f39c12',
                width: 2
            })
        }));
        const layer =  new Vector({
            source: new Source({
                features: [arc_alpha , arc_angle_view]
            })
        });
        layer.set('name', 'angles');
        map.addLayer(layer);
    }

    zoomToExtent(map: Map)  {
        // Zoom to extent
        const extent = Extent.createEmpty();
        map.getLayers().forEach(ly => {
            if (ly.get('name') !== 'bing') {
                Extent.extend(extent, ly.getSource().getExtent());
                console.log(ly.get('name'));
            }
         });
        map.getView().fit(extent);
    }
}
