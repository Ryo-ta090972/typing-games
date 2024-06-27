export class GameScreen {
  #earnedPoint;
  #stagePoint;
  #endingTime;
  #targets;
  #hittingWord;

  constructor(earnedPoint, stagePoint, endingTime, targets, hittingWord) {
    this.#earnedPoint = earnedPoint;
    this.#stagePoint = stagePoint;
    this.#endingTime = endingTime;
    this.#targets = targets;
    this.#hittingWord = hittingWord;
  }

  buildPlayScreen() {
    const playScreen = [];
    const header = this.#buildHeader();
    const body = this.#buildBody();

    playScreen.push(header, body);
    return playScreen.join("\n");
  }

  #buildHeader() {
    const header = [];
    header.push(
      `ステージクリアまであと ${this.#remainingPoint()} ポイント必要です。`,
      `獲得ポイント：${this.#earnedPoint}`,
      `残り時間：${this.#remainingTime()}`,
      ""
    );

    return header.join("\n");
  }

  #buildBody() {
    const body = [];

    this.#targets.forEach((target) => {
      const regex = new RegExp(`^${this.#hittingWord}`);
      const remainingWord = target.word.replace(regex, "");
      const word = target.indent + remainingWord;
      body.push(word);
      body.push("");
    });

    return body.join("\n");
  }

  #remainingPoint() {
    const remainingPoint = this.#stagePoint - this.#earnedPoint;

    if (remainingPoint > 0) {
      return remainingPoint;
    } else {
      return 0;
    }
  }

  #remainingTime() {
    const remainingTime = Math.floor((this.#endingTime - Date.now()) / 1000);

    if (remainingTime > 0) {
      return remainingTime;
    } else {
      return 0;
    }
  }
}
