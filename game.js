import { createRequire } from "module";
import { TargetsFactory } from "./targets_factory.js";
import { GameState } from "./game_state.js";
import { Judgment } from "./judgment.js";
import { TimeManager } from "./time_manager.js";
import { GameScreen } from "./game_screen.js";

export class Game {
  #targetsFactory;
  #gameState;
  #soundPlayer;

  constructor(level) {
    this.#targetsFactory = new TargetsFactory(level);
    const targets = this.#targetsFactory.generate();
    this.#gameState = new GameState(level, targets);
    const require = createRequire(import.meta.url);
    this.#soundPlayer = require("play-sound")();
  }

  async play() {
    await this.#startTyping();
    this.#winGameIfScoreOver();
    return this.#gameState;
  }

  async #startTyping() {
    try {
      await Promise.all([
        this.#updateTargetsAndOutputPlayScreen(),
        this.#acceptUserInputAndToScore(),
      ]);
    } catch (error) {
      if (error instanceof Error) {
        console.error(error.message);
      } else {
        throw error;
      }
    }
  }

  #updateTargetsAndOutputPlayScreen() {
    const delay = 50;

    return new Promise((resolve) => {
      const interval = setInterval(() => {
        this.#updateTargets();
        this.#outputPlayScreen();
        this.#endIntervalIfTimeOver(interval, resolve);
      }, delay);
    });
  }

  #updateTargets() {
    this.#gameState.targets = this.#targetsFactory.update(
      this.#gameState.targets,
      this.#gameState.hitWords,
    );
  }

  #outputPlayScreen() {
    const gameScreen = new GameScreen(this.#gameState);
    const playScreen = gameScreen.buildPlayScreen();
    console.clear();
    console.log(playScreen);
  }

  #endIntervalIfTimeOver(interval, resolve) {
    const timeManager = new TimeManager(this.#gameState.endTime);

    if (timeManager.isTimeOver()) {
      clearInterval(interval);
      resolve();
    }
  }

  #acceptUserInputAndToScore() {
    process.stdin.setRawMode(true);
    process.stdin.setEncoding("utf8");
    process.stdin.resume();

    return new Promise((resolve, reject) => {
      this.#endUserInputIfTimeOut(resolve);

      process.stdin.on("data", (char) => {
        if (char === "\u0003") {
          process.exit();
        } else {
          this.#toScoreAndPlaySoundAndUpdateGameState(char);
        }
      });

      process.stdin.on("error", () => {
        reject(new Error("入力中にエラーが発生しました。"));
        process.stdin.pause();
      });
    });
  }

  #endUserInputIfTimeOut(resolve) {
    setTimeout(() => {
      process.stdin.pause();
      resolve();
    }, this.#gameState.playTime);
  }

  #toScoreAndPlaySoundAndUpdateGameState(char) {
    const hitCheckString = this.#gameState.hitString.concat(char);
    const judgment = new Judgment(this.#gameState.targetWords);
    const isHitWord = judgment.isHitWord(hitCheckString);
    const isHitString = judgment.isHitString(
      hitCheckString,
      this.#gameState.consecutiveHitCount,
    );

    if (isHitWord) {
      this.#handleHitWord(hitCheckString);
    } else if (isHitString) {
      this.#handleHitString(char);
    } else {
      this.#handleMiss();
    }
  }

  #handleHitWord(word) {
    this.#gameState.addBonusPoint(word);
    this.#soundPlayer.play("hit.mp3");
    this.#gameState.addHitWords(word);
    this.#resetHitCountAndHitChars();
  }

  #handleHitString(char) {
    this.#gameState.addNormalPoint();
    this.#soundPlayer.play("hit.mp3");
    this.#addHitCountAndHitChars(char);
  }

  #handleMiss() {
    this.#soundPlayer.play("miss.mp3");
    this.#resetHitCountAndHitChars();
  }

  #resetHitCountAndHitChars() {
    this.#gameState.resetConsecutiveHitCount();
    this.#gameState.resetConsecutiveHitChars();
  }

  #addHitCountAndHitChars(char) {
    this.#gameState.addConsecutiveHitCount();
    this.#gameState.addConsecutiveHitChars(char);
  }

  #winGameIfScoreOver() {
    if (this.#gameState.score > this.#gameState.scoreNeededToWin) {
      this.#gameState.winGame();
    }
  }
}
