var express = require('express');
var bodyparser = require('body-parser');
var mongodb = require('mongodb');
var cors = require('cors');
var app = express();
var uri = process.env.MongoDB_URI;
var db;


app.use(bodyparser.json());
app.use(cors());
app.listen(process.env.PORT || 5000);

mongodb.MongoClient.connect(uri, function (error, database) {
  if (error)
    console.error(error);
  else
    db = database;
});


app.get("/", function (req, res) {
  res.send("Works :)");
});

app.post("/nearbyParkingSpots", function (req, res) {
  var data = req.body;
  console.log(data);

  db.collection('parkingspots').find(
    {
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: data.coordinates
          },
          $maxDistance: data.distance || 900
        }
      }
    }).toArray(function (error, data) {
    if (error) {
      console.log(error);
    } else {
      res.send(data);
    }
  })
});

app.post("/parkingSpot", function (req, res) {
  var parkingSpot = req.body;
  console.log("arrived parkingSpot: ", parkingSpot);

  db.collection("parkingspots").insert(parkingSpot, function (error, data) {
    if (error) {
      console.error(error);
    } else {
      res.sendStatus(200);
    }
  })
});
