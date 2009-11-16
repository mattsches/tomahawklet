PlaygrubLoader = {

    remotes:  [
        ['jQuery', 'http://ajax.googleapis.com/ajax/libs/jquery/1.3.2/jquery.min.js'],
        ['Playgrub', 'http://localhost:8080/js/playgrub.js']
    ],

    init: function() {}
};

PlaygrubLoader.init = function() {

    // setup Playgrub
    Playgrub.Events = {

        // Playgrub init
        init: function() {
            new Playgrub.Playlist();
            new Playgrub.Scraper(); // extends PlaylistSource
            new Playgrub.Client();
            new Playgrub.Bookmarklet();
            // new Playgrub.Content();
            // new Playgrub.RemoteListener();  extends PlaylistSource
        },

        // no scraper found for this domain
        noScraper: function() {
            Playgrub.bookmarklet.set_status("This site is currently not supported by Playgrub");
        },

        // scraper found but there were no songs
        noSongs: function() {
            Playgrub.bookmarklet.set_status(Playgrub.scraper.error);
        },

        // scraper done finding songs
        foundSongs: function() {
            Playgrub.playlist.url = window.location;
            Playgrub.playlist.title = document.title;

            if(typeof(window.postMessage) != undefined) {
                window.frames['playgrub-server-iframe'].postMessage(Playgrub.playlist.to_html(), '*');
            }

            // write to playgrub server
            Playgrub.client.write_playlist(Playgrub.playlist);

        },

        // Playgrub.client is done broadcasting playlist
        clientPlaylistPublished: function() {
            // Post to Twitter
            Playgrub.Util.inject_script(Playgrub.PGHOST+'twitter_post?playlist='+Playgrub.playlist.id);

            Playgrub.bookmarklet.playlist_loaded();
        },

        // Playgrub.client is broadcasting a playlist track
        clientTrackPublished: function() {
            Playgrub.bookmarklet.track_broadcast();
        }
    };

    Playgrub.Events.init();
}

PlaygrubLoader.Util = {


    inject_script: function (script) {
        var script_element = document.createElement('script');
        script_element.type = 'text/javascript';
        script_element.src = script;
        document.getElementsByTagName('head')[0].appendChild(script_element);
    },

    inject_css: function (css) {
        var css_element = document.createElement('link');
        css_element.type = 'text/css';
        css_element.rel = 'stylesheet';
        css_element.href = css;
        document.getElementsByTagName('head')[0].appendChild(css_element);
    },

    load_remotes: function(remotes, callback) {
        var index = 0;
        var remotes_callback = function() {
            if(index == remotes.length){
                callback();
            } else {
                PlaygrubLoader.Util.load_remote(remotes[index][0], remotes[index][1], remotes_callback);
                index++;
            }
        };
        remotes_callback();
    },

    load_remote: function(object_type, remote_url, callback) {
        PlaygrubLoader.Util.inject_script(remote_url);
        var poll = function() { PlaygrubLoader.Util.load_remote_poll(object_type, callback); };
        setTimeout(poll, 5);
    },

    load_remote_poll: function(object_type, callback){
        if (eval('typeof('+object_type+')') == 'undefined') {
            var poll = function() { PlaygrubLoader.Util.load_remote_poll(object_type, callback); };
            setTimeout(poll, 50);
        } else {
            // document set up, start doing stuff
            callback();
        }
    }

};


PlaygrubLoader.Util.load_remotes(PlaygrubLoader.remotes, function() { PlaygrubLoader.init(); });


