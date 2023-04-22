import axios from "axios";
import cheerio from "cheerio";
import { dateRange } from "../utils/dateUtils";
import { Request, Response } from "express";

interface Team {
  name: string;
  score: string;
}

interface Match {
  team1: Team;
  team2: Team;
}

export const scrapeNBAScores = async (date: string) => {
  try {
    const response = await axios.get(
      `https://www.espn.com/nba/scoreboard/_/date/${date}`
    );

    if (response.status !== 200) {
      console.error("Error: Unable to fetch data from ESPN.");
      return;
    }

    const $ = cheerio.load(response.data);
    const games: Match[] = [];

    $(".ScoreboardScoreCell__Competitors").each((index, element) => {
      const teams: string[] = [];
      const scores: string[] = [];

      $(element)
        .find(".ScoreCell__TeamName")
        .each((i, teamElem) => {
          teams.push($(teamElem).text().trim());
        });

      $(element)
        .find(".ScoreCell__Score")
        .each((i, scoreElem) => {
          scores.push($(scoreElem).text());
        });

      games.push({
        team1: {
          name: teams[0],
          score: scores[0],
        },
        team2: {
          name: teams[1],
          score: scores[1],
        },
      });
    });
    return games;
  } catch (error) {
    console.error("Error: Unable to fetch data from ESPN.", error);
  }
};

const getAllDayScores = async (fromDate: string, toDate: string) => {
  const dateArr = dateRange(fromDate, toDate);
  const allDayScores = await Promise.all(
    dateArr.map(async (date) => {
      const result = await scrapeNBAScores(date);
      return {
        date,
        result: JSON.stringify(result),
      };
    })
  );
  return allDayScores;
};

export const getNbaScores = async (req: Request, res: Response) => {
  const startDate = req.query.startdate;
  const endDate = req.query.enddate;

  if (!startDate || !endDate) {
    return res.status(400).send("Both startDate and endDate are required!");
  }

  try {
    const data = await getAllDayScores(startDate as string, endDate as string);
    res.status(200).send(JSON.stringify(data));
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.log(err);
      return res.status(500).send(`server error: ${err.message}`);
    }
    return res.status(500).send("An unknown error occurred.");
  }
};


export * from "./getNbaScores";
