import axios, {AxiosResponse} from 'axios';
import delay from 'delay';
import {getAlbumInfo, getAlbumTracks, getTrackInfo} from '../api';
import type {albumType, trackType} from '../types';

const instance = axios.create({baseURL: 'https://api.deezer.com/', timeout: 15000});

export const isrc2deezer = async (name: string, isrc?: string) => {
  if (!isrc) {
    throw new Error('ISRC code not found for ' + name);
  }

  const {data} = await instance.get<any>('track/isrc:' + isrc);
  if (data.error) {
    throw new Error(`No match on deezer for ${name} (ISRC: ${isrc})`);
  }

  return await getTrackInfo(data.id);
};

export const upc2deezer = async (name: string, upc?: string): Promise<[albumType, trackType[]]> => {
  if (!upc) {
    throw new Error('UPC code not found for ' + name);
  } else if (upc.length > 12 && upc.startsWith('0')) {
    upc = upc.slice(-12);
  }

  const {data} = await instance.get<any>('album/upc:' + upc);
  if (data.error) {
    throw new Error(`No match on deezer for ${name} (UPC: ${upc})`);
  }

  const albumInfo = await getAlbumInfo(data.id);
  const albumTracks = await getAlbumTracks(data.id);
  return [albumInfo, albumTracks.data];
};

// Retry on rate limit error
instance.interceptors.response.use(async (response: AxiosResponse<any>) => {
  if (response.data && response.data.error && response.data.error.code === 4) {
    const delayTime = 1000 + Math.random() * 500; // generates a random delay between 1000 and 1500 milliseconds
    await delay(delayTime);
    return await instance(response.config);
  }

  return response;
});
