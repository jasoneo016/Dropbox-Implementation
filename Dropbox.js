var express = require('express')
var app = express()
var fs = require('fs');
var AWS = require('aws-sdk')

var s3 = new AWS.S3();

var filePath = './dropbox/';
var myBucket = 'zhengjasonzhangbucket';


//CORS
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

AWS.config.update({region:'us-west-1'});
app.use(express.static(__dirname + '/'));


//Adds message.txt to dropbox folder
// fs.appendFile(filePath, fileData, function (err) {
//     console.log(filePath + ' added.');
// });

//Updates whenever file is added
fs.watch('./dropbox', function (event, filename) {
    console.log('event is: ' + event);

    if (filename) {
        fs.stat('./dropbox/' + filename, function (err, stat) {
            if (err == null) {
                console.log('File added');
                uploadFileToS3(filePath + filename, filename);
            } else if (err.code == 'ENOENT') {
                // file does not exist
                console.log('File deleted');
                deleteFileFromS3(filePath + filename, filename);
            } else {
                console.log('Some other error: ', err.code);
            }
        });
    }
});

app.get('/list', function(req, res){
    var params = {
        Bucket: myBucket
    };
    s3.listObjects(params, 	function(err, data){
        for(var i = 0; i < data.Contents.length; i++) {
            data.Contents[i].Url = 'https://s3-us-west-1.amazonaws.com/' + data.Name + '/' + data.Contents[i].Key;
        }
        res.send(data.Contents);
    })
})

function uploadFileToS3(filePath, fileData) {

    fs.readFile(filePath, function (err, data) {
        params = {Bucket: myBucket, Key: fileData, Body: data, ACL: "public-read"};
        s3.putObject(params, function(err, data) {
            if (err) {
                console.log(err)
            } else {
                console.log("Successfully uploaded data to " + myBucket, data);
            }
        });
    });
}

function deleteFileFromS3(filePath, fileName) {
    fs.readFile(filePath, function (err, data) {
        params = {Bucket: myBucket, Key: fileName};
        s3.deleteObject(params, function (err, data) {
            if (err) {
                console.log(err);
            }
            else {
                console.log("Successfully deleted data from " + myBucket, data);
            }
        });
    });
}

app.listen(3300, function () {
    console.log('Example app listening on port 3300!')
})