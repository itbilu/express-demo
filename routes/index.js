'use strict'
var express = require('express');
var router = express.Router();
const fs = require('fs');
const path = require('path');
var util = require('util');
var formidable = require('formidable');

/* GET home page. */
router.get('/', function(req, res) {	
  res.writeHead(200, {'content-type': 'text/html'});
  res.end(
    '<form action="/upload" enctype="multipart/form-data" method="post">'+
      '<input type="text" name="field1" /> '+
      '<input type="text" name="field2" /> '+
      '<input type="file" name="file1" multiple="multiple" /> '+
      '<input type="file" name="file2" multiple="multiple" /> '+
      '<input type="submit" value="Upload" />'+
    '</form>'
  );
});

router.post('/upload', function(req, res, next){
  var form = new formidable.IncomingForm();
  form.uploadDir = '/tmp';   //文件保存在系统临时目录
  form.maxFieldsSize = 1 * 1024 * 1024;  //上传文件大小限制为最大1M  
  form.keepExtensions = true;        //使用文件的原扩展名

  var targetDir = path.join(__dirname, '../public/upload');
  // 检查目标目录，不存在则创建
  fs.access(targetDir, function(err){
    if(err){
      fs.mkdirSync(targetDir);
    }
    _fileParse();
  });
  
  // 文件解析与保存
  function _fileParse() {
    form.parse(req, function (err, fields, files) {
      if (err) throw err;
  	  var filesUrl = [];
  	  var errCount = 0;
  	  var keys = Object.keys(files);
      keys.forEach(function(key){
        var filePath = files[key].path;
        var fileExt = filePath.substring(filePath.lastIndexOf('.'));
        if (('.jpg.jpeg.png.gif').indexOf(fileExt.toLowerCase()) === -1) {
        	errCount += 1;
        } else {
        	//以当前时间戳对上传文件进行重命名
            var fileName = new Date().getTime() + fileExt;
            var targetFile = path.join(targetDir, fileName);
            //移动文件
            fs.renameSync(filePath, targetFile);
            // 文件的Url（相对路径）
            filesUrl.push('/upload/'+fileName)
        }
      });

      // 返回上传信息
      res.json({filesUrl:filesUrl, success:keys.length-errCount, error:errCount});
    }); 
  }
});

router.get('/files', function(req, res, next) {
  // 显示服务器文件 
  // 文件目录
  var filePath = path.join(__dirname, './');
  fs.readdir(filePath, function(err, results){
  	if(err) throw err;
  	if(results.length>0) {
  	  var files = [];
  	  results.forEach(function(file){
  	  	if(fs.statSync(path.join(filePath, file)).isFile()){
          files.push(file);
  	  	}
  	  })
  	  res.render('files', {files:files});
  	} else {
  	  res.end('当前目录下没有文件');
  	}
  });
});
router.get('/file/:fileName', function(req, res, next) {
  // 实现文件下载 
  var fileName = req.params.fileName;
  var filePath = path.join(__dirname, fileName);
  var stats = fs.statSync(filePath); 
  if(stats.isFile()){
  	res.set({
  	  'Content-Type': 'application/octet-stream',
  	  'Content-Disposition': 'attachment; filename='+fileName,
  	  'Content-Length': stats.size
    });
    fs.createReadStream(filePath).pipe(res);
  } else {
  	res.end(404);
  }
});

module.exports = router;
