require(['dojo/topic'], function(topic) {
  /*
   * Custom Javascript to be executed while the application is initializing goes here
   */

  // function to get the query params from the URL
  const getQueryStringValue = (key) => {
    return decodeURIComponent(window.location.search.replace(new RegExp('^(?:.*[&\\?]' + encodeURIComponent(key).replace(/[\.\+\*]/g, '\\$&') + '(?:\\=([^&]*))?)?.*$', 'i'), '$1'));
  };

  // function to update the query params in the URL address bar
  const updateQueryStringParameter = (uri, key, value) => {
    let re = new RegExp('([?&])' + key + '=.*?(&|$)', 'i');
    let separator = uri.indexOf('?') !== -1 ? '&' : '?';
    if (uri.match(re)) {
      return uri.replace(re, '$1' + key + '=' + value + '$2');
    } else {
      return uri + separator + key + '=' + value;
    }
  };

  // function to remove a query parameter from the URL address bar
  const removeQueryParam = (sourceURL, key) => {
    let rtn = sourceURL.split('?')[0];
    let param;
    let params_arr = [];
    const queryString = (sourceURL.indexOf('?') !== -1) ? sourceURL.split('?')[1] : '';
    
    if (queryString !== '') {
      params_arr = queryString.split('&');
      for (var i = params_arr.length - 1; i >= 0; i -= 1) {
        param = params_arr[i].split('=')[0];
        if (param === key) {
          params_arr.splice(i, 1);
        }
      }
      rtn = rtn + '?' + params_arr.join('&');
    }
    return rtn;
  };
  
   // The application is ready
  topic.subscribe('tpl-ready', function() {
    /*
     * Custom Javascript to be executed when the application is ready goes here
     */

    // console.log('Cascade is ready');

    // function to get a bookmark object by name
    const getBookmarkByName = (name) => {
      const bookmarks = app.Controller.getBookmarks();
      return bookmarks.filter(bm => bm.title === name)[0];
    };

    // check for incoming URL params to go right to a bookmark or section index number
    const bookmark = getQueryStringValue('bookmark');
    const sectionIndex = getQueryStringValue('sectionIndex');
    // check for a bookmark name first
    if (bookmark) {
      const sectionObject = getBookmarkByName(bookmark);
      if (sectionObject) {
        const index = sectionObject.index;
        app.Controller.navigateToSection({
          index: index,
          animate: true
        });
      }
    } else if (sectionIndex) {
      // if there is no bookmark name in the URL, check for a section index number
      app.Controller.navigateToSection({
        index: sectionIndex,
        animate: true
      });
    }

    // This is the function that will be called when one of our `inlink` links is clicked
    const linkToSection = (eventData) => {
      // prevent the default click event
      eventData.preventDefault();

      // set the index, assume it's the section index number
      let index = eventData.data.section;

      // set URL bar to your new section. now you can copy/paste/share easily!
      const currentUrl = window.location.href;
      let newUrl = currentUrl;

      if (eventData.data.sectionType === 'bookmark') {
        // if we are dealing with a bookmark name, get the proper index
        const bookmarkObject = getBookmarkByName(eventData.data.section);
        index = bookmarkObject.index;

        // set the URL address bar
        newUrl = updateQueryStringParameter(currentUrl, 'bookmark', eventData.data.section);
        newUrl = removeQueryParam(newUrl, 'sectionIndex');
      } else {
        // set the URL address bar
        newUrl = updateQueryStringParameter(currentUrl, 'sectionIndex', eventData.data.section);
        newUrl = removeQueryParam(newUrl, 'bookmark');
      }

      // this actually refreshes the URL address bar
      window.history.pushState({}, '', newUrl);

      // scroll to the section (finally!)
      app.Controller.navigateToSection({
        index: index,
        animate: true
      });
    };

    // scan the entire story map and get all the `inlink-*` links
    const els = document.querySelectorAll('a[href^=\'inlink-\']');

    // loop through each link element we have and make some adjustments
    els.forEach((linkElement) => {
      // split up the href value; examples values are:
      // `inlink-bookmark-Learn` ==> navigate to the bookmark titled "Learn"
      // `inlink-index-9` ==> navigate to the 9th element in your story 
      const linkIdentifier = linkElement.href.substr(linkElement.href.indexOf('inlink-'), linkElement.href.length);
      const splits = linkIdentifier.split('-');
      // get section type; either `bookmark` (name) or `index` (number)
      const sectionType = splits[1];
      // grab the section index
      const section = splits[2];
      // reset the `href`
      linkElement.href = '#';
      // set the onlick event (with jQuery's help) to the function above
      $(linkElement).click({
        section: section,
        sectionType: sectionType
      }, linkToSection);
    });
  });

  /*
   * Custom Javascript to be executed when a section becomes active
   */
  topic.subscribe('story-navigated-section', function(cfg) {
    // console.log('The section', cfg, 'is now active');

    // as we scroll through the story, we can set the URL address bar with a shareable link directly to the section we want
    // const url = new URL(window.location.href);
    const currentUrl = window.location.href;
    const incomingIndex = getQueryStringValue('sectionIndex');
    let newUrl = currentUrl;

    // if we are at the Cover page, remove all the parameters and update the URL address bar
    // but if we have an incoming bookmark or sectionIndex param, we want to make sure that gets passed in
    let shouldRemoveUrlParams = false;
    if (cfg.index === 0 && incomingIndex === '') {
      shouldRemoveUrlParams = true;
    }

    if (shouldRemoveUrlParams) {
      newUrl = removeQueryParam(currentUrl, 'bookmark');
      newUrl = removeQueryParam(newUrl, 'sectionIndex');

      window.history.pushState({}, '', newUrl);
      return;
    }

    // get the bookmark object for the current section and update the URL address bar with it
    const bookmarkObject = app.Controller.getBookmarks().filter(bm => bm.index === cfg.index)[0];
    if (bookmarkObject) {
      const bookmarkName = bookmarkObject.title;

      newUrl = updateQueryStringParameter(currentUrl, 'bookmark', bookmarkName);
      newUrl = removeQueryParam(newUrl, 'sectionIndex');

      window.history.pushState({}, '', newUrl);
    }

  });

});