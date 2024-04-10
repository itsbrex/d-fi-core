import axios from 'axios';
import PQueue from 'p-queue';
import SpotifyWebApi from 'spotify-web-api-node';
import type {playlistInfo, trackType} from '../types';
import {isrc2deezer, upc2deezer} from './deezer';

// type spotifyTypes = 'track' | 'episode' | 'album' | 'artist' | 'playlist' | 'show';

type tokensType = {
  clientId: string;
  accessToken: string;
  accessTokenExpirationTimestampMs: number;
  isAnonymous: true;
};

/**
 * Parse offset number
 * @param {String} next next page url
 * @returns {Number}
 */
const getOffset = (next: null | string): number => {
  if (next) {
    const o = next.split('&').find((p) => p.includes('offset='));
    return o ? Number(o.split('=')[1]) : 0;
  }

  return 0;
};

/**
 * Limit process concurrency
 */
const queue = new PQueue({concurrency: 25});

/**
 * Export core spotify module
 */
export const spotifyApi = new SpotifyWebApi();

/**
 * Set spotify tokens anonymously. This is required to bypass api limits.
 * @returns {tokensType}
 */
export const setSpotifyAnonymousToken = async () => {
  const {data} = await axios.get<tokensType>(
    'https://open.spotify.com/get_access_token?reason=transport&productType=embed',
  );
  spotifyApi.setAccessToken(data.accessToken);
  return data;
};

/**
 * Convert spotify episodes to deezer
 * @param {String} id Spotify episode id
 * @returns {trackType}
 */
export const episode2deezer = async (id: string) => {
  const {body} = await spotifyApi.getEpisode(id);
  return await isrc2deezer(body.name, body.uri.split(':')[2]);
};

/**
 * Convert spotify shows to deezer
 * @param {String} id Spotify show id
 * @returns {trackType}
 */
export const show2deezer = async (id: string) => {
  const {body} = await spotifyApi.getShow(id);
  return await isrc2deezer(body.name, body.uri.split(':')[2]);
};

/**
 * Convert spotify search to deezer
 * @param {String} query Spotify search query
 * @returns {trackType}
 */
export const search2deezer = async (query: string) => {
  const {body} = await spotifyApi.search(query, ['track'], {limit: 1});
  if (body.tracks && body.tracks.items.length > 0) {
    const track = body.tracks.items[0];
    return await isrc2deezer(track.name, track.external_ids.isrc);
  }
  throw new Error(`No match on Spotify for query: ${query}`);
};

/**
 * Convert spotify userid to deezer
 * @param {String} id Spotify user id
 * @returns {trackType}
 */
export const user2deezer = async (id: string) => {
  const {body} = await spotifyApi.getUserPlaylists(id);
  if (body.items && body.items.length > 0) {
    const playlist = body.items[0];
    return await playlist2Deezer(playlist.id);
  }
  throw new Error(`No match on Spotify for user: ${id}`);
};

/**
 * Get Spotify user's display name
 * @param {String} id Spotify user id
 * @returns {String}
 */
export const getSpotifyUserName = async (id: string) => {
  const {body} = await spotifyApi.getUser(id);
  return body.display_name;
};

// /**
//  * Convert spotify local to deezer
//  * @param {String} id Spotify local id
//  * @returns {trackType}
//  */
// export const local2deezer = async (id: string) => {
//   const {body} = await spotifyApi.getLocal(id);
//   return await isrc2deezer(body.name, body.external_ids.isrc);
// };

/**
 * Convert spotify songs to deezer
 * @param {String} id Spotify track id
 * @returns {trackType}
 */
export const track2deezer = async (id: string) => {
  const {body} = await spotifyApi.getTrack(id);
  return await isrc2deezer(body.name, body.external_ids.isrc);
};

/**
 * Convert spotify albums to deezer
 * @param {String} id Spotify track id
 */
export const album2deezer = async (id: string) => {
  const {body} = await spotifyApi.getAlbum(id);
  return await upc2deezer(body.name, body.external_ids.upc);
};

/**
 * Convert playlist to deezer
 * @param {String} id Spotify track id
 */
export const playlist2Deezer = async (
  id: string,
  onError?: (item: SpotifyApi.PlaylistTrackObject, index: number, err: Error) => void,
): Promise<[playlistInfo, trackType[]]> => {
  const {body} = await spotifyApi.getPlaylist(id);
  const tracks: trackType[] = [];
  let {items} = body.tracks;
  let offset = getOffset(body.tracks.next);

  while (offset !== 0) {
    const {body} = await spotifyApi.getPlaylistTracks(id, {limit: 100, offset: offset || 0});
    offset = getOffset(body.next);
    items = [...items, ...body.items];
  }

  await queue.addAll(
    items.map((item, index) => {
      return async () => {
        try {
          if (item.track) {
            const track = await isrc2deezer(item.track.name, item.track.external_ids.isrc);
            track.TRACK_POSITION = index + 1;
            tracks.push(track);
          }
        } catch (err: any) {
          if (onError) {
            onError(item, index, err);
          }
        }
      };
    }),
  );

  const dateCreated = new Date().toISOString();
  const playlistInfoData: playlistInfo = {
    PLAYLIST_ID: body.id,
    PARENT_USERNAME: body.owner.id,
    PARENT_USER_ID: body.owner.id,
    PICTURE_TYPE: 'cover',
    PLAYLIST_PICTURE: body.images[0].url,
    TITLE: body.name,
    TYPE: '0',
    STATUS: '0',
    USER_ID: body.owner.id,
    DATE_ADD: dateCreated,
    DATE_MOD: dateCreated,
    DATE_CREATE: dateCreated,
    NB_SONG: body.tracks.total,
    NB_FAN: 0,
    CHECKSUM: body.id,
    HAS_ARTIST_LINKED: false,
    IS_SPONSORED: false,
    IS_EDITO: false,
    __TYPE__: 'playlist',
  };

  return [playlistInfoData, tracks];
};

/**
 * Convert artist songs to deezer. Maxium of 10 tracks.
 * @param {String} id Spotify track id
 */
export const artist2Deezer = async (
  id: string,
  onError?: (item: SpotifyApi.TrackObjectFull, index: number, err: Error) => void,
): Promise<trackType[]> => {
  // Artist tracks are limited to 10 items
  const {body} = await spotifyApi.getArtistTopTracks(id, 'GB');
  const tracks: trackType[] = [];

  await queue.addAll(
    body.tracks.map((item, index) => {
      return async () => {
        try {
          const track = await isrc2deezer(item.name, item.external_ids.isrc);
          tracks.push(track);
        } catch (err: any) {
          if (onError) {
            onError(item, index, err);
          }
        }
      };
    }),
  );

  return tracks;
};
