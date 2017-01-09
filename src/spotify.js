'use strict';

const SpotifyWebApi = require('spotify-web-api-node');
const spotify = new SpotifyWebApi();

const DEFAULT_COUNTRY = 'DE'; // format: ISO 3166-1 alpha-2

function getArtistId(artist) {
    return spotify.searchArtists(artist)
        .then(function(data) {
            const result = data.body.artists;
            const items = result.items;

            if (items) {
                return items[0].id;
            }
            return '';
        })
}

function getArtistTopTrackPreviewUrl(artistId) {
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

function getArtistTopTrackSpotifyUri(artistId) {
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

module.exports = {
    'getArtistId' (artistId) {
        return getArtistId(artistId);
    },
    'getArtistTopTrackPreviewUrl' (artistId) {
        return getArtistTopTrackPreviewUrl(artistId);
    },
    'getArtistTopTrackSpotifyUri' (artistId) {
        return getArtistTopTrackSpotifyUri(artistId);
    }
};
