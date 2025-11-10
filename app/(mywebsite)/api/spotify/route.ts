interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface SpotifyArtist {
  name: string;
}

interface SpotifyAlbum {
  name: string;
  artists: SpotifyArtist[];
  images: { url: string }[];
}

interface SpotifyTrack {
  name: string;
  album: SpotifyAlbum;
  external_urls: {
    spotify: string;
  };
}

interface SpotifyNowPlayingResponse {
  is_playing: boolean;
  currently_playing_type: string;
  item: SpotifyTrack;
}

interface NowPlayingData {
  isPlaying: boolean;
  title?: string;
  album?: string;
  artist?: string;
  albumImageUrl?: string;
  songUrl?: string;
}

const client_id = process.env.SPOTIFY_CLIENT_ID!;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET!;
const refresh_token = process.env.SPOTIFY_REFRESH_TOKEN!;

const basic = Buffer.from(`${client_id}:${client_secret}`).toString('base64');
const NOW_PLAYING_ENDPOINT = `https://api.spotify.com/v1/me/player/currently-playing`;
const TOKEN_ENDPOINT = `https://accounts.spotify.com/api/token`;
 
const getAccessToken = async (): Promise<SpotifyTokenResponse> => {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token,
  });

  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });
 
  return response.json();
};
 
const getNowPlaying = async (): Promise<Response> => {
  const { access_token } = await getAccessToken();
 
  return fetch(NOW_PLAYING_ENDPOINT, {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });
};
 
export async function GET(): Promise<Response> {
  try {
    const response = await getNowPlaying();
 
    if (response.status === 204 || response.status > 400) {
      return Response.json({ isPlaying: false });
    }

    const data: SpotifyNowPlayingResponse = await response.json();

    if (data.currently_playing_type !== 'track') {
      return Response.json({ isPlaying: false });
    }
 
    const nowPlayingData: NowPlayingData = {
      isPlaying: data.is_playing,
      title: data.item.name,
      album: data.item.album.name,
      artist: data.item.album.artists
        .map((artist) => artist.name)
        .join(', '),
      albumImageUrl: data.item.album.images[0]?.url,
      songUrl: data.item.external_urls.spotify,
    };
 
    return Response.json(nowPlayingData);
  } catch (error) {
    console.error('Error fetching Spotify data:', error);
    return Response.json({ isPlaying: false }, { status: 500 });
  }
}