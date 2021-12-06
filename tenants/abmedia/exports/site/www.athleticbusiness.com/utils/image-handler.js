const path = require('path');
const fetch = require('node-fetch');
const fs = require('fs');
const zipFolder = require('zip-folder');
const AWS = require('aws-sdk');
const {
  AWS_ACCESS_KEY,
  AWS_SECRET_ACCESS_KEY,
} = require('../../../../env');

const s3 = new AWS.S3({
  accessKeyId: AWS_ACCESS_KEY,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
});

const downloadImages = async (tmpDir, filePaths) => Promise.all(filePaths.map((url) => {
  // create the directory if it doesn't exists
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }
  const fileName = path.basename(url);
  return fetch(url).then((res) => {
    const dest = fs.createWriteStream(`${tmpDir}/${fileName}`);
    res.body.pipe(dest);
  });
}));

const zipItUp = (tmpDirToZip, tmpDirToPlace, exportName) => new Promise((resolve, reject) => {
  zipFolder(tmpDirToZip, `${tmpDirToPlace}/${exportName}`, (err) => {
    if (err) {
      reject();
    } else {
      resolve();
    }
  });
});

const uploadToS3 = (bucket, keyPrefix, filePath) => {
  const fileName = path.basename(filePath);
  const fileStream = fs.createReadStream(filePath);
  const keyName = path.join(keyPrefix, fileName);
  return new Promise((resolve, reject) => {
    fileStream.once('error', reject);
    s3.upload(
      {
        Bucket: bucket,
        Key: keyName,
        Body: fileStream,
        ContentType: 'application/zip',
      },
    ).promise().then(resolve, reject);
  });
};

module.exports = { downloadImages, zipItUp, uploadToS3 };
