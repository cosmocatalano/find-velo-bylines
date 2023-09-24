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
let yoastObj = JSON.parse($('.yoast-schema-graph').innerHTML);
let articleObj = yoastObj["@graph"].filter(child => child["@type"] === "Article");
let rawDate = articleObj[0].datePublished;
let authorName = articleObj[0].author.name;

//parse date format
const veloDate = { year: 'numeric', month: 'long', day: 'numeric' }
let formatedDate = new Date(Date.parse(rawDate)).toLocaleDateString('en-us', veloDate);

//slugify author name
authorSlug = slugify(authorName);

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

//wrap it in a strong -- bet this was Lance feature request…
dateStrong = document.createElement('strong');
authorStrong = document.createElement('strong');
dateStrong.innerHTML = formatedDate;
authorStrong.innerHTML = authorName;

//assemble
timeStamp.prepend(dateStrong);
authorLink.prepend(authorStrong);
containerDiv.prepend(authorLink);
containerDiv.prepend(timeStamp);

//insert
$('.c-article-meta').prepend(containerDiv);
