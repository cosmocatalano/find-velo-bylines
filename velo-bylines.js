// ==Bookmarklet==
// @name Velo Bylines
// @author Cosmo Catalano
// @script https://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js
// ==/Bookmarklet==

$ = jQuery.noConflict(true);

//quick slugify function via https://jasonwatmore.com/vanilla-js-slugify-a-string-in-javascript
function slugify(input) {
    if (!input)
        return '';
    var slug = input.toLowerCase().trim();
    slug = slug.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    slug = slug.replace(/[^a-z0-9\s-]/g, ' ').trim();
    slug = slug.replace(/[\s-]+/g, '-');
    return slug;
}

//this gets data from Yoast
function getYoastData(yoastClassObj) {
    let yoastData = [];
    let fallbackObj = [];
    yoastData.warn = [];
    yoastData.found = [];
    //check for yoastData
    if (!yoastClassObj) {
        yoastData.fatal = "Yoast Schema Graph not found";
    } else {
        //parse contents into object
        let yoastObj = JSON.parse(yoastClassObj.text());

        //looking for article values
        let articleObj = yoastObj["@graph"].filter(child => child["@type"] === "Article");

        //if no article
        if (!articleObj.length) {
            yoastData.warn.push("URL has not been categorized as an article");

            //looking for any published date
            fallbackObj = yoastObj["@graph"].filter(child => child.hasOwnProperty("datePublished"));

            // if no datePublished
            if (!fallbackObj.length) {
                yoastData.found.pubDate = "";
                yoastData.warn.push("No published date detected");
            } else {
                yoastData.found.pubDate = fallbackObj[0].datePublished;
            }

            //looking for any modified date
            fallbackObj = yoastObj["@graph"].filter(child => child.hasOwnProperty("dateModified"));
            
           // if no dateModified
            if (!fallbackObj.length) {
                yoastData.found.modDate = "";
                yoastData.warn.push("No modified date detected");
            } else {
                yoastData.found.modDate = fallbackObj[0].dateModified;
            }

            //looking for any author string
            fallbackObj = yoastObj["@graph"].filter(child => child.hasOwnProperty("author"));

            if (!fallbackObj.length) {
                yoastData.found.authorName = "";
                yoastData.warn.push("No author name detected");
            } else {
                //assumes name is child of author 
                yoastData.found.authorName =  fallbackObj[0].author.name;
            }

        //if Article detected and everything worked normally
        } else {
            yoastData.found.pubDate = articleObj[0].datePublished;
            yoastData.found.modDate = articleObj[0].dateModified;
            yoastData.found.authorName = articleObj[0].author.name;
        }
    }
    return yoastData;
}

let surfaceDateAndByline = true;
//we trust the existance of *either* any stamp or byline as a correctly attributed/dated article (for now)
if ($('header time').length || $('header [rel="author"]').length) {
    surfaceDateAndByline = false;
    
} 

//error flag
let errorReporting = true;

if (surfaceDateAndByline) {
    let yoastData = getYoastData($('.yoast-schema-graph'));

    //parse date format
    //preferred display settings
    const veloDate = { year: 'numeric', month: 'long', day: 'numeric' }
    
    //suffix for modified date
    let isModDate = '';

    //test for pubDate
    let tryDate = yoastData.found.pubDate

    //if no/invalid pubDate
    if (!Date.parse(tryDate)) {
        yoastData.warn.push("Invalid pubDate, failing back to modDate");
        tryDate = yoastData.found.modDate
        isModDate = ' (last modified)';
        //what if no/invalid modDate tho?
    }

    formatedDate = new Date(Date.parse(tryDate)).toLocaleDateString('en-us', veloDate) + isModDate;

    //slugify author name
    authorSlug = slugify(yoastData.found.authorName);
    //mapping bad slugs to good if known
    const veloNames = {ahood: "andrew-hood"}
    if (veloNames[authorSlug]) {
        authorSlug = veloNames[authorSlug];
    }

    //create elements
    let containerDiv = document.createElement('div');
    let timeStamp =  document.createElement('time');
    let authorLink =  document.createElement('a');
    
    //style
    document.head.insertAdjacentHTML("beforeend", `<style>
    @keyframes error {
        0%   { background: rgba(255, 0, 0, 0.8); }
        100% { background: rgba(255, 0, 0, 0.2); }
    }
    @keyframes byline {
        0%   { background: rgba(0, 255, 0, 0.8); }
        100% { background: transparent; }
    }
    .error {
        background: rgba(255, 0, 0, 0.2);
        animation: error 3s ease-in;
        text-align: center;
        font-weight: bold;
    }
    .byline {
      background: transparent;
      animation: byline 3s ease-in;
    }
    </style>`);


    //add classes 
    containerDiv.classList.add("o-post-meta", "u-spacing--quarter");
    timeStamp.classList.add("o-timestamp", "u-text-transform--upper", "u-color--gray--dark", "u-display--block", "u-font--xs", "u-letter-spacing--1");
    authorLink.classList.add("o-byline", "u-text-transform--upper", "u-display--inline-block", "u-font--xs", "u-letter-spacing--1");

    //add attributes
    let authorUrl = "https://velo.outsideonline.com/byline/" + authorSlug;
    authorLink.setAttribute("rel", "author");
    authorLink.setAttribute("href",  authorUrl );

    //wrap it in a <strong> -- bet this was Lance feature request…
    dateStrong = document.createElement('strong');
    authorStrong = document.createElement('strong');
    dateStrong.innerHTML = formatedDate;
    authorStrong.innerHTML = yoastData.found.authorName;

    //assemble
    timeStamp.prepend(dateStrong);
    authorLink.prepend(authorStrong);
    containerDiv.prepend(authorLink);
    containerDiv.prepend(timeStamp);
    containerDiv.classList.add("byline");

    //insert
    //look for the normal meta div by class
    if ($('.c-article-meta').length) {
        $('.c-article-meta').prepend(containerDiv);
    } else {
        yoastData.warn.push("No metadata container detected");
        //push raw data into error messages
        for (found in yoastData.found) {
            yoastData.warn.push(found + ":" + yoastData.found[found]);
        }
    }

    //report errors
    if (yoastData.warn && errorReporting) {
        yoastData.warn.reverse();
        for (warn of yoastData.warn) {
            let warnDiv = document.createElement('div');
            warnDiv.innerText = warn;
            warnDiv.classList.add("error")
            document.body.prepend(warnDiv);
        }
    }
}
