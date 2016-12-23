const getEvents = (location) => {
    // TODO Implement Songkick API
    return [{
        "artist": {
            "name": "Vampire Weekend",
            "id": 288696,
            "picture": "http://images.sk-static.com/images/media/profile_images/artists/288696/large_avatar"
        },
        "name": "Vampire Weekend with Fan Death at O2 Academy Brixton (February 16, 2010)",
        "date": "2010-02-16T19:30:00+0000",
        "venue": {
            "lat": 51.4650846,
            "lng": -0.1150322,
            "name": "O2 Academy Brixton",
            "street": "211 Stockwell Road",
            "city": "London"
        },
        "uri": "http://www.songkick.com/concerts/3037536-vampire-weekend-at-o2-academy-brixton?utm_source=PARTNER_ID&utm_medium=partner"
    }];
}

module.exports = {
    'getEvents' (location) {
        return getEvents(location);
    }
};
