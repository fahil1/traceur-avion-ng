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
import OSM from 'ol/source/osm';
import XYZ from 'ol/source/xyz';


import Vector from 'ol/layer/vector';
import Source from 'ol/source/vector';

import Tile from 'ol/layer/tile';
import BingMaps from 'ol/source/bingmaps';
import Overlay from 'ol/overlay';

export class UtilsImproved {
    public maxAzimuth = 0;
    public minAzimuth = 0;
    public maxDistance = 0;
    public destination: any; // point between north and half-bearing *point
    public coords: number[] = [0, 0];
    public azimuthDepart = 0;
    public azimuthArrivee = 0;

    // LAYERS
    ly_baseMap: Tile;
    ly_sector: Vector;
    ly_destination: Vector;
    ly_north: Vector;
    ly_antenna: Vector;
    ly_angles: Vector;

    renderMap(map: Map, antenna: Antenna, calcAngleCenter: boolean) {
        // this.offlineMap(map);
        this.clear(map);
        this.hydratePoisByDistanceAndBearing(antenna, calcAngleCenter);
        this.renderSector(map, antenna);
        this.renderDestination(map, antenna);
        this.renderNorth(map, antenna);
        this.renderAntenna(map, antenna);
        this.renderAngles(map, antenna);
        if (calcAngleCenter) {
            this.zoomToExtent(map);
        }
        setTimeout(_ => map.updateSize(), 100);
    }

    zoomToExtent(map: Map)  {
        const extent = Extent.createEmpty();
        map.getLayers().forEach(ly => {
            if (ly !== this.ly_baseMap) {
                Extent.extend(extent, ly.getSource().getExtent());
            }
         });
        map.getView().fit(extent);
    }

    renderSector(map: Map, antenna: Antenna): any {
        const b1 = antenna.angleOfView.angleCenter - (antenna.angleOfView.angleRange / 2);
        const b2 = antenna.angleOfView.angleCenter + (antenna.angleOfView.angleRange / 2);
        this.azimuthDepart = b1;
        this.azimuthArrivee = b2;

        const antenna_sector = sector(this.toTurf(antenna), this.maxDistance, this.azimuthToBearing(b1), this.azimuthToBearing(b2));
        if (!this.ly_sector) {
            this.ly_sector = new Vector({
                source: new Source({
                    features: []
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
            map.addLayer(this.ly_sector);
        }
        this.ly_sector.getSource().addFeature(this.toFeature(antenna_sector));
    }

    renderDestination(map: Map, antenna: Antenna) {
        if (!this.ly_destination) {
            this.ly_destination = new Vector({
                source: new Source()
            });
            map.addLayer(this.ly_destination);
        }
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
        this.ly_destination.getSource().addFeature(point);

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
        this.ly_destination.getSource().addFeature(axe);
    }

    renderNorth(map: Map, antenna: Antenna) {
        if (!this.ly_north) {
            this.ly_north = new Vector({
                source: new Source()
            });
            map.addLayer(this.ly_north);
        }
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
        this.ly_north.getSource().addFeature(feature_point);
        this.ly_north.getSource().addFeature(feature_line);
    }

    renderAntenna(map: Map, antenna: Antenna) {
        if (!this.ly_antenna) {
            this.ly_antenna = new Vector({
                source: new Source()
            });
            map.addLayer(this.ly_antenna);
        }
        // Antenna
        const style_antenna = new Style({
            image: new Icon({
                src: 'assets/antenna.png'
            }),
            text: new Text({
                text: antenna.name,
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
        this.ly_antenna.getSource().addFeature(feature);
        this.ly_antenna.getSource().addFeatures(features);
    }

    renderAngles(map: Map, antenna: Antenna) {
        if (!this.ly_angles) {
            this.ly_angles = new Vector({
                source: new Source()
            });
            map.addLayer(this.ly_angles);
        }
        // Arc alpha
        let arc_alpha: Feature;
        const alpha_to_bearing = this.azimuthToBearing(antenna.angleOfView.angleCenter);
        if (alpha_to_bearing >= 0) {
            arc_alpha = this.toFeature(lineArc(this.toTurf(antenna), this.maxDistance,
        0, alpha_to_bearing));
        } else {
            arc_alpha = this.toFeature(lineArc(this.toTurf(antenna), this.maxDistance,
            alpha_to_bearing, 0));
        }
        arc_alpha.setStyle(new Style({
            text: new Text({
                text: Math.abs(round(this.azimuthToBearing(antenna.angleOfView.angleCenter), 2)) + '°',
                scale: 1.2,
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
        const b1 = antenna.angleOfView.angleCenter - (antenna.angleOfView.angleRange / 2);
        const b2 = antenna.angleOfView.angleCenter + (antenna.angleOfView.angleRange / 2);
        const arc_angle_view = this.toFeature(lineArc(this.toTurf(antenna), this.maxDistance * 0.25,
        this.azimuthToBearing(b1), this.azimuthToBearing(b2)));
        arc_angle_view.setStyle(new Style({
            text: new Text({
                text: Math.abs(round(antenna.angleOfView.angleRange, 2)) + '°',
                scale: 1.2,
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
        this.ly_angles.getSource().addFeatures([arc_alpha, arc_angle_view]);
    }

    offlineMap(map: Map) {
        if (!this.ly_baseMap) {
            this.ly_baseMap = new Tile({
                source: new XYZ({
                    url: 'assets/tiles/{z}/{x}/{y}.png'
                })
            });
            map.addLayer(this.ly_baseMap);
        }
    }

    clear(map: Map) {
        map.getLayers().forEach(ly => {
            if (ly !== this.ly_baseMap) {
                ly.getSource().clear();
            }
        });
    }

    hydratePoisByDistanceAndBearing(antenna: Antenna, calcAngleCenter) {
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
                if (poi.azimuth >= this.maxAzimuth) {
                    this.maxAzimuth = poi.azimuth;
                }
                if (poi.azimuth <= this.minAzimuth) {
                    this.minAzimuth = poi.azimuth;
                }
                if (poi.distance >= this.maxDistance) {
                    this.maxDistance = poi.distance;
                }
            }
        });
        const angleHalf = (this.maxAzimuth - this.minAzimuth) / 2;
        if (calcAngleCenter) {
            antenna.angleOfView.angleCenter = this.minAzimuth + angleHalf;
        }
        this.destination = this.toFeature(destination(this.toTurf(antenna), this.maxDistance,
            this.azimuthToBearing(antenna.angleOfView.angleCenter)));
    }

    azimuthToBearing(azimuth: number) {
        if (azimuth > 180) {
            return -(360 - azimuth);
        }
        return azimuth;
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

}
