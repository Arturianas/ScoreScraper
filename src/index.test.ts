import axios, { AxiosResponse } from "axios";
import * as getNbaScores from "./controllers/getNbaScores";

jest.mock("axios", () => ({
  get: jest.fn(),
}));

jest.mock("./utils/csvUtils", () => ({
  outputCSV: jest.fn(),
}));

const axiosMock = axios.get as jest.MockedFunction<typeof axios.get>;

const mockHtml = `
  <div class="ScoreboardScoreCell__Competitors">
    <div class="ScoreCell__TeamName">Team A</div>
    <div class="ScoreCell__Score">100</div>
    <div class="ScoreCell__TeamName">Team B</div>
    <div class="ScoreCell__Score">90</div>
  </div>
`;

describe("scrapeNBAScores", () => {
  it("should scrape NBA scores", async () => {
    axiosMock.mockResolvedValue({
      status: 200,
      data: mockHtml,
    } as AxiosResponse);

    const result = await getNbaScores.scrapeNBAScores("20230412");
    const expected = [
      {
        team1: {
          name: "Team A",
          score: "100",
        },
        team2: {
          name: "Team B",
          score: "90",
        },
      },
    ];

    expect(result).toEqual(expected);
  });

  it("should handle error while fetching data", async () => {
    axiosMock.mockRejectedValue(new Error("Network error"));

    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const result = await getNbaScores.scrapeNBAScores("20230412");

    expect(consoleSpy).toHaveBeenCalledWith(
      "Error: Unable to fetch data from ESPN.",
      expect.any(Error)
    );
    expect(result).toBeUndefined();

    consoleSpy.mockRestore();
  });

  it("scrapeNBAScores should be called once", async () => {
    axiosMock.mockResolvedValue({
      status: 200,
      data: mockHtml,
    } as AxiosResponse);

    const spy = jest.spyOn(getNbaScores, "scrapeNBAScores");

    await getNbaScores.scrapeNBAScores("20230412");

    expect(spy).toHaveBeenCalledTimes(1);

    spy.mockRestore();
  });
});
