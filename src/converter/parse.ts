import axios from 'axios';
import PQueue from 'p-queue';
import * as spotifyUri from 'spotify-uri';
import {
  getAlbumInfo,
  getAlbumTracks,
  getArtistInfo,
  getDiscography,
  getPlaylistInfo,
  getPlaylistTracks,
  getTrackInfo,
} from '../';
import type {albumType, artistInfoType, playlistInfo, trackType} from '../types';
import * as spotify from './spotify';
import * as tidal from './tidal';
import * as youtube from './youtube';

type linkType = 'track' | 'album' | 'artist' | 'playlist' | 'episode' | 'show' | 'search' | 'user' | 'local';

export type urlPartsType = {
  id: string;
  type:
    | 'track'
    | 'album'
    | 'audiobook'
    | 'artist'
    | 'playlist'
    | 'spotify-track'
    | 'spotify-album'
    | 'spotify-playlist'
    | 'spotify-artist'
    | 'spotify-episode'
    | 'spotify-show'
    | 'spotify-search'
    | 'spotify-user'
    | 'spotify-local'
    | 'tidal-track'
    | 'tidal-album'
    | 'tidal-playlist'
    | 'tidal-artist'
    | 'youtube-track';
};

const queue = new PQueue({concurrency: 10});

export const getUrlParts = async (url: string, setToken = false): Promise<urlPartsType> => {
  if (url.startsWith('spotify:')) {
    const spotify = url.split(':');
    url = 'https://open.spotify.com/' + spotify[1] + '/' + spotify[2];
  }

  const site = url.match(/deezer|spotify|tidal|youtu\.?be/);
  if (!site) {
    throw new Error('Unknown URL: ' + url);
  }

  switch (site[0]) {
    case 'deezer':
      if (url.includes('page.link')) {
        const {request} = await axios.head(url);
        url = request.res.responseUrl;
      }
      const deezerUrlParts = url.split(/\/(\w+)\/(\d+)/);
      return {type: deezerUrlParts[1] as any, id: deezerUrlParts[2]};

    case 'spotify':
      const spotifyUrlParts = spotifyUri.parse(url);
      if (setToken) {
        await spotify.setSpotifyAnonymousToken();
      }
      return {type: ('spotify-' + spotifyUrlParts.type) as any, id: (spotifyUrlParts as any).id};

    case 'tidal':
      const tidalUrlParts = url.split(/\/(\w+)\/(\d+|\w+-\w+-\w+-\w+-\w+)/);
      return {type: ('tidal-' + tidalUrlParts[1]) as any, id: tidalUrlParts[2]};

    case 'youtube':
      let yotubeId = url.split('v=')[1];
      if (yotubeId.includes('&')) {
        yotubeId = yotubeId.split('&')[0];
      }
      return {type: 'youtube-track', id: yotubeId};

    case 'youtu.be':
      return {type: 'youtube-track', id: url.split('/').pop() as string};

    default:
      throw new Error('Unable to parse URL: ' + url);
  }
};

/**
 * Deezer, Spotify or Tidal links only
 * @param {String} url
 */
export const parseInfo = async (url: string) => {
  const info = await getUrlParts(url, true);
  if (!info.id) {
    throw new Error('Unable to parse id');
  }

  let linktype: linkType = 'track';
  let linkinfo: trackType | albumType | playlistInfo | artistInfoType | Record<string, any> = {};
  let tracks: trackType[] = [];

  switch (info.type) {
    case 'track': {
      tracks.push(await getTrackInfo(info.id));
      break;
    }

    case 'album':
    case 'audiobook':
      linkinfo = await getAlbumInfo(info.id);
      linktype = 'album';
      const albumTracks = await getAlbumTracks(info.id);
      tracks = albumTracks.data;
      break;

    case 'playlist':
      linkinfo = await getPlaylistInfo(info.id);
      linktype = 'playlist';
      const playlistTracks = await getPlaylistTracks(info.id);
      tracks = playlistTracks.data;
      break;

    case 'artist':
      linkinfo = await getArtistInfo(info.id);
      linktype = 'artist';
      const artistAlbums = await getDiscography(info.id);
      await queue.addAll(
        artistAlbums.data.map((album) => {
          return async () => {
            if (album.ARTISTS.find((a) => a.ART_ID === info.id)) {
              const albumTracks = await getAlbumTracks(album.ALB_ID);
              tracks = [...tracks, ...albumTracks.data.filter((t) => t.ART_ID === info.id)];
            }
          };
        }),
      );
      break;

    case 'spotify-track':
      tracks.push(await spotify.track2deezer(info.id));
      break;

    case 'spotify-album':
      const [spotifyAlbumInfo, spotifyTracks] = await spotify.album2deezer(info.id);
      tracks = spotifyTracks;
      linkinfo = spotifyAlbumInfo;
      linktype = 'album';
      break;

    case 'spotify-playlist':
      const [spotifyPlaylistInfo, spotifyPlaylistTracks] = await spotify.playlist2Deezer(info.id);
      tracks = spotifyPlaylistTracks;
      linkinfo = spotifyPlaylistInfo;
      linktype = 'playlist';
      break;

    case 'spotify-artist':
      tracks = await spotify.artist2Deezer(info.id);
      linktype = 'artist';
      break;

    case 'spotify-episode':
      tracks.push(await spotify.episode2deezer(info.id));
      linktype = 'episode';
      break;

    case 'spotify-show':
      tracks.push(await spotify.show2deezer(info.id));
      linktype = 'show';
      break;

    case 'spotify-search':
      tracks.push(await spotify.search2deezer(info.id));
      linktype = 'search';
      break;

    case 'spotify-user':
      const [playlistInfo, trackList] = await spotify.user2deezer(info.id);
      tracks.push(...trackList);
      linktype = 'user';
      break;

    // case 'spotify-local':
    //   tracks.push(await spotify.local2deezer(info.id));
    //   linktype = 'local';
    //   break;

    case 'tidal-track':
      tracks.push(await tidal.track2deezer(info.id));
      break;

    case 'tidal-album':
      const [tidalAlbumInfo, tidalAlbumTracks] = await tidal.album2deezer(info.id);
      tracks = tidalAlbumTracks;
      linkinfo = tidalAlbumInfo;
      linktype = 'album';
      break;

    case 'tidal-playlist':
      const [tidalPlaylistInfo, tidalPlaylistTracks] = await tidal.playlist2Deezer(info.id);
      tracks = tidalPlaylistTracks;
      linkinfo = tidalPlaylistInfo;
      linktype = 'playlist';
      break;

    case 'tidal-artist':
      tracks = await tidal.artist2Deezer(info.id);
      linktype = 'artist';
      break;

    case 'youtube-track':
      tracks.push(await youtube.track2deezer(info.id));
      break;

    default:
      throw new Error('Unknown type: ' + info.type);
  }

  return {
    info,
    linktype,
    linkinfo,
    tracks: tracks.map((t) => {
      if (t.VERSION && !t.SNG_TITLE.includes(t.VERSION)) {
        t.SNG_TITLE += ' ' + t.VERSION;
      }
      return t;
    }),
  };
};
