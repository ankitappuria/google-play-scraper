var Promise = require('bluebird');
var request = require('request-promise');
var cheerio = require('cheerio');

var h = require('./helpers');


function app(id, lang) {
    lang = lang || 'en';

    return new Promise(function (resolve, reject) {
        var url = 'https://play.google.com/store/apps/details?id=' + id + '&hl=' + lang;
        request(url)
            .then(cheerio.load, h.requestError)
            .then(parseFields)
            .then(function(app) {
                app.url = url;
                app.appId = id;
                resolve(app);
            })
            .catch(reject);
    });
}

function parseFields($) {
    var detailsInfo = $('.details-info');
    var title = detailsInfo.find('div.document-title').text().trim();
    var developer = detailsInfo.find('span[itemprop="name"]').text();
    var genre = detailsInfo.find('span[itemprop="genre"]').text();
    var price = detailsInfo.find('meta[itemprop=price]').attr('content');
    var icon = detailsInfo.find('img.cover-image').attr('src');

    var ratingBox = $('.rating-box');
    var reviews = cleanInt(ratingBox.find('span.reviews-num').text());
    //for other languages
    var score = parseFloat(ratingBox.find('div.score').text().replace(',', '.')) || 0;

    var installs = $('.metadata div.content[itemprop="numDownloads"]').text().trim();
    var minInstalls = cleanInt(installs.split(' - ')[0]);
    var maxInstalls = cleanInt(installs.split(' - ')[1]) || undefined;

    var video = $('.screenshots span.preview-overlay-container[data-video-url]').attr('data-video-url');
    if (video) {
        video = video.split('?')[0];
    }

    var description = $('.description div.id-app-orig-desc');
    
    //added by @Ankita
    var $screenshotImageHtml = $(".thumbnails img.screenshot");
    var screenshotImageUrl = [];
    $screenshotImageHtml.each(function() {
        screenshotImageUrl.push($(this).attr("src"));
    });

    var $allReviews = $(".single-review");
    var reviewArray = [];
    $allReviews.each(function() {
        var rating = $(".review-info-star-rating > div", $(this)).attr("aria-label");
        var review = {
            "author": $(".author-name", $(this)).text(),
            "date": $(".review-date", $(this)).text(),
            "rating": rating.match(/([12345]){1}/)[0],
            "comment": $(".review-body", $(this)).text()
        }
        reviewArray.push(review);
    });

    return {
        title: title,
        icon: icon,
        minInstalls: minInstalls,
        maxInstalls: maxInstalls,
        score: score,
        reviews: reviews,
        description: description.text(),
        descriptionHTML: description.html(),
        developer: developer,
        genre: genre,
        price: price,
        free: price === '0',
        video: video,
        screenshots:screenshotImageUrl,
        reviewDescription:reviewArray,
    };
}

function cleanInt(number) {
    number = number || '0';
    //removes thousands separator
    number = number.replace(/,/g, '').replace(/\./g, '');
    return parseInt(number);
}

module.exports = app;
