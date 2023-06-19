const { rejects } = require('assert');
const { resolve } = require('dns');

const sqlite3 = require('sqlite3').verbose()
const DBSOURCE = "efc2023.db"

let db = new sqlite3.Database(DBSOURCE, (err) => {
  if (err) {
    // Cannot open database
    console.error(err.message)
    throw err
  } else {
    console.log('Connected to the SQLite database.')
  }
});

class dbUil {
  getFixtures() {
    var sql = `SELECT Fixture.Id, TimeLocation, HomeTeamId, HomeTeam.Name AS HomeTeamName, 
    AwayTeamId, AwayTeam.Name AS AwayTeamName, Result1, Result2
    FROM "Fixture" 
    JOIN Team AS HomeTeam 
    ON HomeTeam.Id = Fixture.HomeTeamId
    JOIN Team AS AwayTeam 
    ON AwayTeam.Id = Fixture.AwayTeamId
    ORDER BY Fixture.Id`;
    var params = [];
    return new Promise(function (resolve, reject) {
      db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        }
        var checkFinal = rows.indexOf(s => s.TimeLocation == "[Final] 7B, 18:30 Thu Jun 22 2023");
        if (checkFinal == -1) {
          rows.push({
            "Id": 99,
            "TimeLocation": "[Final] 7B, 18:30 Thu Jun 22 2023",
            "HomeTeamId": null,
            "HomeTeamName": "1st Group",
            "AwayTeamId": null,
            "AwayTeamName": "2nd Group",
            "Result1": null,
            "Result2": null
          });
        }
        resolve(rows);
      });
    });

  }

  getSponsors() {
    var sql = `SELECT * FROM Sponsor`;
    var params = []
    return new Promise(function (resolve, reject) {
      db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        }
        resolve(rows);
      });
    });
  }

  getTeamsWithoutPlayer() {
    var sql = `SELECT * FROM Team`;
    var params = []
    return new Promise(function (resolve, reject) {
      db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        }
        resolve(rows);
      });
    });
  }

  getTeams() {
    var sql = `SELECT Player.Id, Player.Name AS PlayerName, TeamId, Team.Name 
    AS TeamName, COALESCE(TotalGoals, 0) as TotalGoals
                  FROM Player
                  JOIN Team
                  ON Player.TeamId = Team.Id
                  LEFT JOIN (
                    SELECT PlayerId, Player.Name, SUM(Goals) AS TotalGoals FROM Scorer
                  JOIN Player ON Player.Id = Scorer.PlayerId
                  GROUP BY PlayerId
                  ORDER BY TotalGoals DESC
                  ) AS TopScorers
                  ON Player.Id = TopScorers.PlayerId
                  ORDER BY TeamId, Player.Name`;
    var params = []
    return new Promise(function (resolve, reject) {
      db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        }
        resolve(rows);
      });
    });
  }

  getScorers() {
    var sql = `SELECT PlayerId, Player.Name, SUM(Goals) AS TotalGoals FROM Scorer
              JOIN Player ON Player.Id = Scorer.PlayerId
              GROUP BY PlayerId
              ORDER BY TotalGoals DESC, Player.Name`;
    var params = []
    return new Promise(function (resolve, reject) {
      db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        }
        resolve(rows);
      });
    });
  }

  getAllScorers() {
    var sql = `SELECT PlayerId, Player.Name, Player.TeamId, Goals, MatchId FROM Scorer
              JOIN Player ON Player.Id = Scorer.PlayerId`;
    var params = []
    return new Promise(function (resolve, reject) {
      db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        }
        resolve(rows);
      });
    });
  }

  getStandings() {
    let getTeamsPromise = this.getTeamsWithoutPlayer();
    let getFixturesPromise = this.getFixtures();
    return new Promise(function (resolve, reject) {
      Promise.all([getTeamsPromise, getFixturesPromise])
        .then((result) => {
          let teams = result[0];
          let fixtures = result[1];
          let items = [];
          for (let team of teams) {
            for (let fixture of fixtures) {
              if (
                !fixture.HomeTeamId ||
                !fixture.AwayTeamId ||
                !fixture.Result1 ||
                !fixture.Result2
              )
                continue;
              if (
                fixture.HomeTeamId == team.Id ||
                fixture.AwayTeamId == team.Id
              ) {
                let standing = {};
                standing.TeamId = team.Id;
                standing.TeamName = team.Name;
                standing.Played = 1;
                standing.Won = 0;
                standing.Drawn = 0;
                standing.Lost = 0;
                standing.GF =
                  fixture.HomeTeamId == team.Id
                    ? fixture.Result1
                    : fixture.Result2;
                standing.GA =
                  fixture.HomeTeamId == team.Id
                    ? fixture.Result2
                    : fixture.Result1;
                if (fixture.Result1 > fixture.Result2) {
                  standing.Won = fixture.HomeTeamId == team.Id ? 1 : 0;
                  standing.Lost = fixture.HomeTeamId == team.Id ? 0 : 1;

                }
                if (fixture.Result1 == fixture.Result2) {
                  standing.Drawn = 1;

                }
                if (fixture.Result1 < fixture.Result2) {
                  standing.Won = fixture.HomeTeamId == team.Id ? 0 : 1;
                  standing.Lost = fixture.HomeTeamId == team.Id ? 1 : 0;

                }

                standing.Points = 3 * standing.Won + 1 * standing.Drawn;
                standing.GD = standing.GF - standing.GA;

                var checkIndex = items.findIndex(
                  s => s.TeamId == standing.TeamId
                );
                if (checkIndex == -1) {
                  items.push(standing);
                } else {
                  items[checkIndex].Played += standing.Played;
                  items[checkIndex].Won += standing.Won;
                  items[checkIndex].Drawn += standing.Drawn;
                  items[checkIndex].Lost += standing.Lost;
                  items[checkIndex].Points += standing.Points;
                  items[checkIndex].GF += standing.GF;
                  items[checkIndex].GA += standing.GA;
                  items[checkIndex].GD += standing.GD;
                }
              }
            }
          }
          if (items.length != teams.length) {
            for (let team of teams) {
              let checkExist = items.findIndex(s => s.TeamId == team.Id);
              if (checkExist > -1) continue;
              let standing = {};
              standing.TeamId = team.Id;
              standing.TeamName = team.Name;
              standing.Played = 0;
              standing.Won = 0;
              standing.Drawn = 0;
              standing.Lost = 0;
              standing.GF = 0;
              standing.GA = 0;
              standing.GD = 0;
              standing.Points = 0;
              items.push(standing);
            }
          }
          //console.log(items);
          items.sort(function (a, b) {
            return (
              b.Points - a.Points ||
              b.GD - a.GD ||
              a.TeamName.localeCompare(b.TeamName)
            );
          });
          resolve(items);
        }, (err) => {
          rejects(err);
        });
    });
  }
}

module.exports = { db, dbUil }