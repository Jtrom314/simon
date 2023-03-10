// Event messages
const GameEndEvent = 'gameEnd';
const GameStartEvent = 'gameStart';

class Button {
  constructor(soundUrl, el) {
    this.el = el;
    this.sound = loadSound(soundUrl);

    this.press = async function (delayMs = 500, playSound = true) {
      el.style.filter = 'brightness(100%)';
      if (playSound) {
        this.sound.play();
      }
      await delay(delayMs);
      el.style.filter = 'brightness(50%)';
      await delay(100);
    };
  }
}

class Game {
  #buttons;
  #allowPlayer;
  #sequence;
  #playerPlaybackPos;
  #mistakeSound;
  #socket;

  constructor() {
    this.#buttons = new Map();
    this.#allowPlayer = false;
    this.#sequence = [];
    this.#playerPlaybackPos = 0;
    this.#mistakeSound = loadSound('error.mp3');

    const sounds = ['sound1.mp3', 'sound2.mp3', 'sound3.mp3', 'sound4.mp3'];
    document.querySelectorAll('.game-button').forEach((el, i) => {
      if (i < sounds.length) {
        this.#buttons.set(el.id, new Button(sounds[i], el));
        el.style.filter = 'brightness(50%)';
      }
    });

    const playerNameEl = document.querySelector('.player-name');
    playerNameEl.textContent = this.#getPlayerName();

    this.#configureWebSocket();
  }

  async pressButton(button) {
    if (this.#allowPlayer) {
      this.#allowPlayer = false;
      await this.#buttons.get(button.id).press();

      if (this.#sequence[this.#playerPlaybackPos].el.id === button.id) {
        this.#playerPlaybackPos++;
        if (this.#playerPlaybackPos === this.#sequence.length) {
          this.#playerPlaybackPos = 0;
          this.#addNote();
          this.#updateScore(this.#sequence.length - 1);
          await this.#playSequence(500);
        }
        this.#allowPlayer = true;
      } else {
        this.#saveScore(this.#sequence.length - 1);
        this.#mistakeSound.play();
        await this.#buttonDance();
      }
    }
  }

  async reset() {
    this.#allowPlayer = false;
    this.#playerPlaybackPos = 0;
    this.#sequence = [];
    this.#updateScore('00');
    await this.#buttonDance(1);
    this.#addNote();
    await this.#playSequence(1000);
    this.#allowPlayer = true;

    // Let other players know a new game has started
    this.#broadcastEvent(this.#getPlayerName(), GameStartEvent, {});
  }

  async #playSequence(delayMs = 0) {
    if (delayMs > 0) {
      await delay(delayMs);
    }
    for (const btn of this.#sequence) {
      await btn.press();
    }
  }

  #getPlayerName() {
    return localStorage.getItem('userName') ?? 'Mystery player';
  }

  #addNote() {
    const btn = this.#getRandomButton();
    this.#sequence.push(btn);
  }

  #updateScore(score) {
    const scoreEl = document.querySelector('#score');
    scoreEl.textContent = score;
  }

  async #buttonDance(laps = 5) {
    for (let step = 0; step < laps; step++) {
      for (const btn of this.#buttons.values()) {
        await btn.press(100, false);
      }
    }
  }

  #getRandomButton() {
    let buttons = Array.from(this.#buttons.values());
    return buttons[Math.floor(Math.random() * this.#buttons.size)];
  }

  async #saveScore(score) {
    const userName = this.#getPlayerName();
    const date = new Date().toLocaleDateString();
    const newScore = { name: userName, score: score, date: date };

    try {
      const response = await fetch('/api/score', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(newScore),
      });

      // Let other players know the game has concluded
      this.#broadcastEvent(userName, GameEndEvent, newScore);

      // Store what the service gave us as the high scores
      const scores = await response.json();
      localStorage.setItem('scores', JSON.stringify(scores));
    } catch {
      // If there was an error then just track scores locally
      this.#updateScoresLocal(newScore);
    }
  }

  #updateScoresLocal(newScore) {
    let scores = [];
    const scoresText = localStorage.getItem('scores');
    if (scoresText) {
      scores = JSON.parse(scoresText);
    }

    let found = false;
    for (const [i, prevScore] of scores.entries()) {
      if (newScore > prevScore.score) {
        scores.splice(i, 0, newScore);
        found = true;
        break;
      }
    }

    if (!found) {
      scores.push(newScore);
    }

    if (scores.length > 10) {
      scores.length = 10;
    }

    localStorage.setItem('scores', JSON.stringify(scores));
  }

  // Functionality for peer communication using WebSocket

  #configureWebSocket() {
    const protocol = window.location.protocol === 'http:' ? 'ws' : 'wss';
    this.#socket = new WebSocket(`${protocol}://${window.location.host}/ws`);
    this.#socket.onopen = (event) => {
      this.#displayMsg('system', 'game', 'connected');
    };
    this.#socket.onclose = (event) => {
      this.#displayMsg('system', 'game', 'disconnected');
    };
    this.#socket.onmessage = async (event) => {
      const msg = JSON.parse(await event.data.text());
      if (msg.type === GameEndEvent) {
        this.#displayMsg('player', msg.from, `scored ${msg.value.score}`);
      } else if (msg.type === GameStartEvent) {
        this.#displayMsg('player', msg.from, `started a new game`);
      }
    };
  }

  #displayMsg(cls, from, msg) {
    const chatText = document.querySelector('#player-messages');
    chatText.innerHTML =
      `<div class="event"><span class="${cls}-event">${from}</span> ${msg}</div>` +
      chatText.innerHTML;
  }

  #broadcastEvent(from, type, value) {
    const event = {
      from: from,
      type: type,
      value: value,
    };
    this.#socket.send(JSON.stringify(event));
  }
}

const game = new Game();

function delay(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function loadSound(filename) {
  return new Audio('assets/' + filename);
}
