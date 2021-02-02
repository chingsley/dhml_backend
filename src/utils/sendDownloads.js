const fs = require('fs');
const { default: generate_csv } = require('./templates/generateTemplate');
const checkWriteFile = (path, name, dataStr) =>
  new Promise((res, rej) => {
    if (!fs.existsSync(path)) {
      fs.mkdir(path, { recursive: true }, (err, data) => {
        if (err) rej(err);
        fs.writeFile(`${path}/${name}`, dataStr, { flag: 'w' }, (err) => {
          if (err) rej(err);
          res(`${path}/${name}`);
        });
      });
    } else {
      fs.writeFile(`${path}/${name}`, dataStr, { flag: 'w' }, (err) => {
        if (err) rej(err);
        res(`${path}/${name}`);
      });
    }
  });
const delete_file = (path) =>
  new Promise((res, rej) => {
    fs.unlink(path, (err) => {
      if (err) {
        console.log(err, 'DELETE FAILED');
      }
      res();
      //file removed
    });
  });
const downloadFile = async (res, data, documentName) => {
  const file_path = await generate_csv(data, documentName, [
    'SVC Number / Staff Number',
    'ID Number',
    'Member',
    'Family Name',
    'Other Names',
    'Date of Birth',
    'Sex',
  ]);
  // const file_path = await checkWriteFile('.temp_doc', documentName, result);
  return res.download(file_path, documentName, (err) => {
    if (err) throw err;
    delete_file(file_path);
  });
};
export default downloadFile;
