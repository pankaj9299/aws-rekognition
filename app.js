var AWS = require('aws-sdk');
const express = require('express');
const multer  = require('multer')
const path = require('path');
const app = express();
const port = process.env.PORT || 3000

app.use(express.static('public'));

AWS.config.update({
  accessKeyId: process.env.accessKey,
  secretAccessKey: process.env.secretAccess,
  region: process.env.region
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); 
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); 
  }
});

const upload = multer({ storage: storage })

// Define a route to serve the index page
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// File upload route
app.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  const photo = path.join(__dirname, req.file.destination, req.file.originalname);
  const client = new AWS.Rekognition();
  const params = {
    Image: {
      Bytes: require('fs').readFileSync(photo), // Read the image file as bytes
    },
    MaxLabels: 10,
  };
  let labelObj = [];
  client.detectLabels(params, function (err, response) {
      
    if (err) {
      console.log(err, err.stack); // if an error occurred
    } else {
      // console.log(`Detected labels for: ${photo}`);
      response.Labels.forEach((label) => {
          labelObj.push({
              'label': label.Name,
              'confidence': label.Confidence
          });
        // console.log(`Label:      ${label.Name}`);
        // console.log(`Confidence: ${label.Confidence}`);
      }); 
      
      // let htmlWrap = '';
      // labelObj.forEach((item) => {
      //     htmlWrap += '<div class="card"><div class="card-header">Rekognition Findings</div><div class="card-body"><h5 class="card-title">'+item.label+'</h5><p class="card-text">'+item.confidence+'</p></div></div>';
      // });
      // var mlHandler = document.querySelector('#ml-handling');
      // if (mlHandler) {
      //     mlHandler.innerHTML = htmlWrap;
      // }
      console.log(labelObj);
      res.json(labelObj); 
    }
  });
  
  // Access the uploaded file using req.file
  //console.log('File uploaded:', req.file.originalname);

  // Process the file as needed

  
  //res.sendFile(__dirname + '/public/upload.html');
});

// Start the server
app.listen(port, "0.0.0.0", function() {
  console.log('Server is running on port: ' + port);
});
