'use strict';

const config = require("./config/config.json");
const SpotifyWebApi = require('spotify-web-api-node');
const DEFAULT_COUNTRY = 'DE'; // format: ISO 3166-1 alpha-2

const spotify = new SpotifyWebApi();

spotify.setAccessToken(config.spotify.accessToken);
spotify.setRefreshToken(config.spotify.refreshToken);
spotify.setRedirectURI(config.spotify.redirectURI);
spotify.setClientId(config.spotify.clientId);
spotify.setClientSecret(config.spotify.clientSecret);

const getArtistId = (artist) => {
    return spotify.searchArtists(artist)
        .then(function(data) {
            const result = data.body.artists;
            const items = result.items;

            if (items && items[0]) {
                return items[0].id;
            }
            return '';
        })
}

const getArtistTopTrackPreviewUrl = (artistId) => {
    return spotify.getArtistTopTracks(artistId, DEFAULT_COUNTRY)
        .then(function(data) {
            const tracks = data.body.tracks;

            if (tracks) {
                const topTrack = tracks[0];
                return topTrack.preview_url;
            }
            return '';
        })
}

const getArtistTopTrackSpotifyUri = (artistId) => {
    return spotify.getArtistTopTracks(artistId, DEFAULT_COUNTRY)
        .then(function(data) {
            const tracks = data.body.tracks;

            if (tracks) {
                const topTrack = tracks[0];
                return topTrack.uri;
            }
            return '';
        })
}

const getArtistsByGenre = (genres) => {
    return refreshAccessToken()
        .then(() => {
            return spotify.getRecommendations({
                seed_genres: genres
            });
        }).then((data) => {
            return data.body.tracks.map(track => track["artists"][0].name);
        });
}

const refreshAccessToken = () => {
    return spotify.refreshAccessToken()
        .then((data) => {
            spotify.setAccessToken(data.body['access_token']);
        });
}

module.exports = {
    'getArtistId' (artistId) {
        return getArtistId(artistId);
    },
    'getArtistTopTrackPreviewUrl' (artistId) {
        return getArtistTopTrackPreviewUrl(artistId);
    },
    'getArtistTopTrackSpotifyUri' (artistId) {
        return getArtistTopTrackSpotifyUri(artistId);
    },
    'getArtistsByGenre' (genres) {
        return getArtistsByGenre(genres);
    }
};
