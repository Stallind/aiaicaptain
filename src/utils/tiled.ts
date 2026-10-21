/**
 * The subset of the Tiled JSON map format (https://doc.mapeditor.org/en/stable/reference/json-map-format/)
 * that the game produces and reads. Maps exported from the Tiled editor match this shape.
 */
export interface TiledObject {
  readonly id: number;
  readonly name: string;
  readonly type: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly rotation: number;
  readonly visible: boolean;
  readonly point: boolean;
}

export interface TiledTileLayer {
  readonly type: 'tilelayer';
  readonly id: number;
  readonly name: string;
  readonly width: number;
  readonly height: number;
  readonly x: number;
  readonly y: number;
  readonly opacity: number;
  readonly visible: boolean;
  /** Global tile ids, row-major; 0 is empty. */
  readonly data: readonly number[];
}

export interface TiledObjectLayer {
  readonly type: 'objectgroup';
  readonly id: number;
  readonly name: string;
  readonly x: number;
  readonly y: number;
  readonly opacity: number;
  readonly visible: boolean;
  readonly draworder: 'topdown';
  readonly objects: readonly TiledObject[];
}

export interface TiledTileset {
  readonly firstgid: number;
  readonly name: string;
  readonly tilewidth: number;
  readonly tileheight: number;
  readonly tilecount: number;
  readonly columns: number;
  readonly image: string;
  readonly imagewidth: number;
  readonly imageheight: number;
  readonly margin: number;
  readonly spacing: number;
}

export interface TiledMap {
  readonly type: 'map';
  readonly version: string;
  readonly orientation: 'orthogonal';
  readonly renderorder: 'right-down';
  readonly infinite: false;
  readonly width: number;
  readonly height: number;
  readonly tilewidth: number;
  readonly tileheight: number;
  readonly nextlayerid: number;
  readonly nextobjectid: number;
  readonly layers: readonly (TiledTileLayer | TiledObjectLayer)[];
  readonly tilesets: readonly TiledTileset[];
}
