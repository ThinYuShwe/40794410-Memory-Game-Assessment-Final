(function () {
  var params = new URLSearchParams(window.location.search);
  // this reads the URL query parameters (the part after ? in a URL)
  var theme = params.get("theme") || "numbers";
  // this tried to get the theme from the URL and if there is no theme, it defaults to "numbers"
  var numPlayers = Math.max(
    1,
    Math.min(4, parseInt(params.get("players"), 10) || 1),
  );
  // params.get('players') tries to get the number of players from the URL, parseInt converts it to a number, and then Math.max and Math.min ensure it's between 1 and 4. If there is no 'players' parameter, it defaults to 1.

  var gridSize = params.get("grid") === "6x6" ? 6 : 4;
  // this checks if the 'grid' parameter in the URL is set to "6x6". If it is, gridSize is set to 6; otherwise, it defaults to 4 (for a 4x4 grid).
  var pairsCount = gridSize === 6 ? 18 : 8;
  // this sets the number of pairs based on the grid size. A 6x6 grid has 18 pairs, while a 4x4 grid has 8 pairs.
  var numbers = [];
  for (var i = 1; i <= pairsCount; i++) numbers.push(i);
  // Image paths for "icons" theme: F1, flower, P2–P18
  var iconPool = [
    "assets/game/F1.png",
    "assets/game/flower.png",
    "assets/game/P2.png",
    "assets/game/P3.png",
    "assets/game/P4.png",
    "assets/game/P5.png",
    "assets/game/P6.png",
    "assets/game/P7.png",
    "assets/game/P8.png",
    "assets/game/P9.png",
    "assets/game/P10.png",
    "assets/game/P11.png",
    "assets/game/P12.png",
    "assets/game/P13.png",
    "assets/game/P14.png",
    "assets/game/P15.png",
    "assets/game/P16.png",
    "assets/game/P17.png",
    "assets/game/P18.png",
  ];
  var iconImages = iconPool.slice(0, pairsCount);

  function buildDeck() {
    var values = theme === "icons" ? iconImages.slice() : numbers.slice();
    // if the theme is "icons", it uses the emojis array; otherwise, it uses the numbers array. The .slice() creates a copy of the array.
    var deck = values.concat(values);
    // this duplicates all cards to make pairs (e.g., if values is [1, 2, 3], deck will be [1, 2, 3, 1, 2, 3])
    for (var i = deck.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = deck[i];
      deck[i] = deck[j];
      deck[j] = t;
    }

    // this is the Fisher-Yates shuffle algorithm, which randomly shuffles the deck array in place.
    return deck;
  }

  var state = {
    deck: [],
    flipped: [],
    matched: 0,
    moves: 0,
    currentPlayer: 0,
    scores: [],
    playerMoves: [],
    startTime: null,
    timerId: null,
  };

  // deck holds all the cards in the game,
  // flipped holds the currently flipped cards,
  // matched counts how many pairs have been found,
  // moves counts the total moves made,
  // currentPlayer tracks whose turn it is,
  // scores and playerMoves track each player's score and moves,
  // startTime is when the game started, and
  // timerId is used for the timer interval.

  var gridEl = document.getElementById("memory-grid");
  var statTime = document.getElementById("stat-time");
  var statMoves = document.getElementById("stat-moves");
  var playersBar = document.getElementById("players-bar");
  var winModal = document.getElementById("win-modal");
  var winTitle = document.getElementById("win-title");
  var winWinner = document.getElementById("win-winner");
  var winStats = document.getElementById("win-stats");

  var flipSound = new Audio("assets/game/sounds/flippedSound.mp3");
  var winSound = new Audio("assets/game/sounds/winning.mp3");

  var soundEnabled = true;
  // sounds is on
  try {
    var saved = localStorage.getItem("memoryGameSound");

    if (saved !== null) {
      if (saved === "1") {
        soundEnabled = true; // Sound ON
      } else {
        soundEnabled = false; // Sound OFF
      }
    }
  } catch (error) {
    // If something goes wrong, do nothing
  }

  // localStroage is for saving sound setting.
  // local stronge is like a small memory in the browser that saves data even after refresh
  // if something was saved, if save is not null, this means the user has a saved preference for sound,
  // and we set soundEnabled based on that value (true if "1", false if "0").
  // if the saved value is 1, soundEnabled will be true;
  // if it's 0, soundEnabled will be false.
  // if it is null, it means there is no saved preference,
  // and soundEnabled remains true by default.
  function updateSoundButton() {
    // This function updates the sound button's appearance
    // based on whether sound is enabled or not.

    var btn = document.getElementById("btn-sound");

    if (btn) {
      if (soundEnabled === false) {
        btn.classList.add("sound-off"); // add class when sound is OFF
      } else {
        btn.classList.remove("sound-off"); // remove class when sound is ON
      }
    }
  }

  function setGridClass() {
    // This function sets the CSS class for the grid
    // depending on the grid size.

    if (gridSize === 6) {
      gridEl.className = "memory-grid size-6";
    } else {
      gridEl.className = "memory-grid size-4";
    }
  }

  function renderPlayers() {
    // Create arrays for scores and moves
    state.scores = [];
    state.playerMoves = [];

    // Set all players' scores and moves to 0
    for (var i = 0; i < numPlayers; i++) {
      state.scores[i] = 0;
      state.playerMoves[i] = 0;
    }

    // Clear the players bar
    playersBar.innerHTML = "";

    // Create player badges
    for (var p = 0; p < numPlayers; p++) {
      // Create a div for the player
      var badge = document.createElement("div");
      badge.className = "player-badge";

      // Make first player active
      if (p === 0) {
        badge.className = "player-badge active";
      }

      badge.id = "player-" + p;

      // Add player name (P1, P2, etc.)
      var nameText = document.createTextNode("P" + (p + 1) + " ");
      badge.appendChild(nameText);

      // Create score span
      var scoreSpan = document.createElement("span");
      scoreSpan.className = "score";
      scoreSpan.textContent = "0";
      badge.appendChild(scoreSpan);

      // Add text between score and moves
      var middleText = document.createTextNode(" pts · ");
      badge.appendChild(middleText);

      // Create moves span
      var movesSpan = document.createElement("span");
      movesSpan.className = "player-moves";
      movesSpan.textContent = "0 moves";
      badge.appendChild(movesSpan);

      // Add badge to players bar
      playersBar.appendChild(badge);
    }
  }

  function updatePlayerHighlight() {
    for (var p = 0; p < numPlayers; p++) {
      // Get the player badge
      var el = document.getElementById("player-" + p);

      if (el) {
        // Highlight the current player
        if (p === state.currentPlayer) {
          el.classList.add("active");
        } else {
          el.classList.remove("active");
        }

        // Update score
        var scoreSpan = el.querySelector(".score");
        if (scoreSpan) {
          scoreSpan.textContent = state.scores[p];
        }

        // Update moves
        var movesSpan = el.querySelector(".player-moves");
        if (movesSpan) {
          movesSpan.textContent = state.playerMoves[p] + " moves";
        }
      }
    }
  }

  function formatTime(sec) {
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    return m + ":" + (s < 10 ? "0" : "") + s;
  }

  function tickTimer() {
    if (!state.startTime) return;
    var sec = Math.floor((Date.now() - state.startTime) / 1000);
    statTime.textContent = "TIME: " + formatTime(sec);
  }

  function startTimer() {
    if (state.timerId) return;
    state.startTime = Date.now();
    tickTimer();
    state.timerId = setInterval(tickTimer, 1000);
  }

  function stopTimer() {
    if (state.timerId) {
      clearInterval(state.timerId);
      state.timerId = null;
    }
  }

  function getElapsedSeconds() {
    if (!state.startTime) return 0;
    return Math.floor((Date.now() - state.startTime) / 1000);
  }

  function showWinModal() {
    stopTimer();
    var elapsed = getElapsedSeconds();
    var winnerMoves;

    if (numPlayers === 1) {
      winnerMoves = state.playerMoves[0] || 0;
      winStats.textContent =
        "Time: " + formatTime(elapsed) + "  •  Your moves: " + winnerMoves;
      winTitle.textContent = "YOU WIN!";
      winWinner.textContent = "All pairs found!";
    } else {
      var best = -1;
      var winners = [];
      for (var p = 0; p < numPlayers; p++) {
        if (state.scores[p] > best) {
          best = state.scores[p];
          winners = [p];
        } else if (state.scores[p] === best) {
          winners.push(p);
        }
      }
      winnerMoves = state.playerMoves[winners[0]] || 0;
      winStats.textContent =
        "Time: " + formatTime(elapsed) + "  •  Moves: " + winnerMoves;
      if (winners.length === 1) {
        winTitle.textContent = "PLAYER " + (winners[0] + 1) + " WINS!";
        winWinner.textContent = "Score: " + state.scores[winners[0]];
      } else {
        winTitle.textContent = "IT'S A TIE!";
        winWinner.textContent =
          "Players " +
          winners
            .map(function (w) {
              return w + 1;
            })
            .join(", ") +
          " – Score: " +
          best;
      }
    }

    winModal.classList.remove("hidden");
  }

  function hideWinModal() {
    winModal.classList.add("hidden");
  }

  function handleMatch() {
    state.matched++;
    state.scores[state.currentPlayer]++;
    updatePlayerHighlight();
    if (state.matched === pairsCount) {
      setTimeout(showWinModal, 400);
    } else {
      state.currentPlayer = (state.currentPlayer + 1) % numPlayers;
      updatePlayerHighlight();
    }
  }

  function flipBack() {
    var a = state.flipped[0];
    var b = state.flipped[1];
    a.el.classList.remove("flipped");
    b.el.classList.remove("flipped");
    state.flipped = [];
    state.currentPlayer = (state.currentPlayer + 1) % numPlayers;
    updatePlayerHighlight();
  }

  function onCardClick(index) {
    // 1. Do nothing if 2 cards are already flipped
    if (state.flipped.length >= 2) {
      return;
    }

    // 2. Get the clicked card
    var card = state.deck[index];

    // 3. Ignore click if card does not exist, or is already flipped or matched
    if (!card) {
      return;
    }

    if (
      card.el.classList.contains("flipped") ||
      card.el.classList.contains("matched")
    ) {
      return;
    }

    // 4. Start the timer if game just started
    if (!state.startTime) {
      startTimer();
    }

    // 5. Flip the card visually
    card.el.classList.add("flipped");

    // 6. Add card to the flipped list
    state.flipped.push(card);

    // 7. Increase total moves
    state.moves++;
    statMoves.textContent = "MOVE: " + state.moves;

    // 8. Play flip sound if enabled
    if (soundEnabled) {
      flipSound.currentTime = 0;
      flipSound.play().catch(function () {});
    }

    // 9. Check if two cards are flipped
    if (state.flipped.length === 2) {
      // Increase moves for the current player
      state.playerMoves[state.currentPlayer]++;
      updatePlayerHighlight();

      var firstCard = state.flipped[0];
      var secondCard = state.flipped[1];

      // 10. Check if the two cards match
      if (firstCard.value === secondCard.value) {
        firstCard.el.classList.add("matched");
        secondCard.el.classList.add("matched");

        // Clear flipped list
        state.flipped = [];

        // Play win sound if enabled
        if (soundEnabled) {
          winSound.currentTime = 0;
          winSound.play().catch(function () {});
        }

        // Handle matched pair (score & next player)
        handleMatch();
      } else {
        // If not matched, play error sound after 250ms
        if (soundEnabled) {
          setTimeout(function () {
            var err = new Audio("assets/game/sounds/error.mp3");
            err.volume = 1;
            err.play().catch(function () {});
          }, 250);
        }

        // Flip cards back after 700ms
        setTimeout(flipBack, 700);
      }
    }
  }

  function renderGrid() {
    gridEl.innerHTML = "";
    state.deck.forEach(function (card, index) {
      var div = document.createElement("button");
      div.type = "button";
      div.className = "card";
      div.setAttribute("data-index", index);
      var frontContent =
        theme === "icons"
          ? '<img src="' + card.value + '" alt="" class="card-front-img">'
          : card.value;
      div.innerHTML =
        '<div class="card-inner"><span class="card-back">?</span><span class="card-front">' +
        frontContent +
        "</span></div>";
      div.addEventListener("click", function () {
        onCardClick(index);
      });
      card.el = div;
      gridEl.appendChild(div);
    });
  }

  function init() {
    state.deck = buildDeck().map(function (value) {
      return { value: value, el: null };
    });
    state.flipped = [];
    state.matched = 0;
    state.moves = 0;
    state.currentPlayer = 0;
    state.startTime = null;
    state.timerId = null;
    statTime.textContent = "TIME: 0:00";
    statMoves.textContent = "MOVE: 0";
    setGridClass();
    renderPlayers();
    state.scores = new Array(numPlayers).fill(0);
    updatePlayerHighlight();
    renderGrid();
    updateSoundButton();
  }

  var soundBtn = document.getElementById("btn-sound");
  if (soundBtn) {
    soundBtn.addEventListener("click", function () {
      soundEnabled = !soundEnabled;
      try {
        localStorage.setItem("memoryGameSound", soundEnabled ? "1" : "0");
      } catch (e) {}
      updateSoundButton();
    });
  }

  document.getElementById("btn-restart").addEventListener("click", function () {
    stopTimer();
    hideWinModal();
    init();
  });

  document
    .getElementById("btn-play-again")
    .addEventListener("click", function () {
      hideWinModal();
      init();
    });

  init();
})();
