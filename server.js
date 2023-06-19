const express = require('express');
var { db, dbUil } = require("./database.js");
var cors = require('cors');
const { request } = require('http');
const app = express();


//app.use('/', express.static('dist/efc2023app'));

app.use(cors());

app.get("/api/sponsors", (req, res, next) => {
  new dbUil().getSponsors().then((rows) => {
    res.json({
      "message": "success",
      "data": rows
    })
  }, (err) => {
    res.status(400).json({ "error": err.message });
    return;
  });
});

app.get("/api/sponsorsCSV", (req, res, next) => {
  new dbUil().getSponsors().then((rows) => {
    let csvData = '';
    rows.forEach((row) => {
      csvData += [row.Name, row.Amount, row.Date].join(",") + "\r\n"
    })
    res
      .set({
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="sponsors.csv"`,
      })
      .send(csvData);
  }, (err) => {
    res.status(400).json({ "error": err.message });
    return;
  });
});

app.get("/api/teamsWithoutPlayer", (req, res, next) => {
  new dbUil().getTeamsWithoutPlayer().then((rows) => {
    res.json({
      "message": "success",
      "data": rows
    })
  }, (err) => {
    res.status(400).json({ "error": err.message });
    return;
  });
});

app.get("/api/teams", (req, res, next) => {
  new dbUil().getTeams().then((rows) => {
    res.json({
      "message": "success",
      "data": rows
    })
  }, (err) => {
    res.status(400).json({ "error": err.message });
    return;
  });
});

app.get("/api/fixtures", (req, res, next) => {
  new dbUil().getFixtures().then((rows) => {
    res.json({
      "message": "success",
      "data": rows
    })
  }, (err) => {
    res.status(400).json({ "error": err.message });
    return;
  });
});



app.get("/api/fixturesCSV", (req, res, next) => {
  new dbUil().getFixtures().then((rows) => {
    let csvData = ["Time Location", "Home Team", "Away Team", "Result"].join(",") + "\r\n"
    rows.forEach((row) => {
      let result = (row.Result1 ?? '') + ' - ' + (row.Result2 ?? '');
      csvData += ["\"" + row.TimeLocation + "\"", row.HomeTeamName, row.AwayTeamName, result].join(",") + "\r\n"
    })
    res
      .set({
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="fixtures.csv"`,
      })
      .send(csvData);
  }, (err) => {
    res.status(400).json({ "error": err.message });
    return;
  });
});

app.get("/api/standings", (req, res, next) => {
  new dbUil().getStandings().then((rows) => {
    res.json({
      "message": "success",
      "data": rows
    })
  }, (err) => {
    res.status(400).json({ "error": err.message });
    return;
  });
});

app.get("/api/standingsCSV", (req, res, next) => {
  new dbUil().getStandings().then((rows) => {
    let csvData = ["Team Name", "Played", "Drawn", "Won", "Lost", "Points", "GF", "GA", "GD"].join(",") + "\r\n"
    rows.forEach((row) => {      
      csvData += [row.TeamName, row.Played, row.Drawn, row.Won, row.Lost, row.Points, row.GF, row.GA, row.GD].join(",") + "\r\n"
    })
    res
      .set({
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="standings.csv"`,
      })
      .send(csvData);
  }, (err) => {
    res.status(400).json({ "error": err.message });
    return;
  });
});


app.get("/api/scorers", (req, res, next) => {
  new dbUil().getScorers().then((rows) => {
    res.json({
      "message": "success",
      "data": rows
    })
  }, (err) => {
    res.status(400).json({ "error": err.message });
    return;
  });
});

app.get("/api/allscorers", (req, res, next) => {
  new dbUil().getAllScorers().then((rows) => {
    res.json({
      "message": "success",
      "data": rows
    })
  }, (err) => {
    res.status(400).json({ "error": err.message });
    return;
  });
});

app.get("/api/scorersCSV", (req, res, next) => {
  new dbUil().getScorers().then((rows) => {
    let csvData = '';
    rows.forEach((row) => {
      csvData += [row.Name, row.TotalGoals].join(",") + "\r\n"
    })
    res
      .set({
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="scorers.csv"`,
      })
      .send(csvData);
  }, (err) => {
    res.status(400).json({ "error": err.message });
    return;
  });

});

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});
