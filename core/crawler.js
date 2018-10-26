let request = require('request');
let rp = require('request-promise');
let cheerio = require('cheerio');
let URL = require('url-parse');
let path = require('path');
let Item = require('../models/Item');

let pagesToVisit ;
let acceptedExts = ['.mp4','.mkv','.avi'];

module.exports = function(sites){
    pagesToVisit = sites;
    crawl();
}


function crawl(){
    let nextPage = pagesToVisit.pop();
    let url = new URL(nextPage);
    var baseUrl = url.href;
    console.log("Crawling ===========>",nextPage);

    let options = {
        uri:nextPage,
        transform:function(body) {
            return cheerio.load(body);
        }
    };

    rp(options)
    .then(function($){
        linkFinder($,baseUrl);
        if(pagesToVisit.length > 0){
            crawl();
        } else {
            console.log("Crawling ended");
        }

    })
    .catch(function(err) {
        console.log(err);
    });

}

function linkFinder($,baseUrl) {
    $('a').each(function(i, elem) {
        let relativeUrl = $(this).attr('href');
        let fullUrl = baseUrl+relativeUrl;
        if(acceptedExts.indexOf(path.extname(relativeUrl)) != -1) {
            //this is file. Insert into database.
            insertIntoDB(fullUrl,getFileName(relativeUrl));
        } else if(relativeUrl != "../" && relativeUrl.charAt(relativeUrl.length-1) == "/"){
            //checking if the url leads to previous page. if not push it into pageToVisit
            console.log("Into array:", fullUrl);
            pagesToVisit.push(fullUrl);
        }
        
    });
}

function getFileName(relativeUrl){
    return relativeUrl.slice(0,relativeUrl.lastIndexOf('.')).replace(/_|\./g,' ');   
}


function insertIntoDB(fullUrl,name){
    let startIndex = name.search(/[s][0-9]+/gi);
    let tags=[];
    
    if( startIndex != -1){
        let season = name.slice(startIndex+1,startIndex+3);
        tags.push("s"+season);
    } 
    
    let newItem = new Item({
        url:fullUrl,
        name:name,
        tags:tags,
    }
    );
    newItem.save().then(function(){}).catch((error)=>{
        console.log(error);
    })
}
