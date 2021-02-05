const fs = require('fs');
const { default: generate_csv } = require('./templates/generateTemplate');
const { log } = console;

const delete_file = (path) =>
  new Promise((res, rej) => {
    fs.unlink(path, (err) => {
      if (err) {
        log(err, 'DELETE FAILED');
      }
      res();
      //file removed
    });
  });

const makeTempDir = () =>
  new Promise((res, rej) => {
    const folderName = '.temp_doc';
    if (!fs.existsSync(folderName)) {
      fs.mkdir(folderName, { recursive: true }, (err, data) => {
        if (err) {
          log(err);
        }
        res(data);
      });
    } else res();
  });

const downloadFile = async (res, data, documentName) => {
  await makeTempDir();
  const file_path = await generate_csv(data, documentName, [
    'SVC Number / Staff Number',
    'ID Number',
    'Member',
    'Family Name',
    'Other Names',
    'Date of Birth',
    'Sex',
  ]);
  return res.download(file_path, documentName, (err) => {
    if (err)
      return res.status(500).json({
        errors: [
          'Failed to download document, please try again shortly; or contact the technical support team if the error persists',
        ],
      });
    delete_file(file_path);
  });
};
export default downloadFile;
