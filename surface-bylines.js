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

//get data
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
        let yoastObj = JSON.parse(yoastClassObj.innerHTML);

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
        //if Article detected and everyhing worked normally
        } else {
            yoastData.found.pubDate = articleObj[0].datePublished;
            yoastData.found.modDate = articleObj[0].dateModified;
            yoastData.found.authorName = articleObj[0].author.name;
        }
    }

    return yoastData;

}

let yoastData = getYoastData($('.yoast-schema-graph'));

//parse date format
const veloDate = { year: 'numeric', month: 'long', day: 'numeric' }
formatedDate = new Date(Date.parse(yoastData.found.pubDate)).toLocaleDateString('en-us', veloDate);

//slugify author name
authorSlug = slugify(yoastData.found.authorName);

//create elements
let containerDiv = document.createElement('div');
let timeStamp =  document.createElement('time');
let authorLink =  document.createElement('a');

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

//insert
//look for the normal meta div by class
if ($('.c-article-meta')) {
    $('.c-article-meta').prepend(containerDiv);
} else {
    yoastData.warn.push("No metadata container detected");
    //push raw data into error messages
    for (found in yoastData.found) {
        yoastData.warn.push(found + ":" + yoastData.found[found]);
    }
}

//report errors
if (yoastData.warn) {
    yoastData.warn.reverse();
    for (warn of yoastData.warn) {
        let div = document.createElement('div');
        div.innerText = warn;
        document.body.prepend(div);
    }
}
