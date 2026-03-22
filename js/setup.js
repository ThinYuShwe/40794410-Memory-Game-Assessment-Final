// Game setup: store choices and build gamepage URL
(function () {
  // Default settings
  var theme = "numbers";
  var players = "2";
  var grid = "4x4";

  var link = document.getElementById("start-game-link");

  if (link) {
    // Function to update the link
    function updateLink() {
      var url =
        "gamepage.html?theme=" +
        theme +
        "&players=" +
        players +
        "&grid=" +
        grid;

      link.href = url;
    }

    // Get all option buttons
    var buttons = document.querySelectorAll(".option-btn");

    // Add click event to each button
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener("click", function () {
        var option = this.getAttribute("data-option");
        var value = this.getAttribute("data-value");

        if (option && value) {
          // Save selected value
          if (option === "theme") {
            theme = value;
          } else if (option === "players") {
            players = value;
          } else if (option === "grid") {
            grid = value;
          }

          // Remove "selected" class from buttons of same type
          var sameButtons = document.querySelectorAll(
            '.option-btn[data-option="' + option + '"]',
          );

          for (var j = 0; j < sameButtons.length; j++) {
            sameButtons[j].classList.remove("selected");
          }

          // Add "selected" to clicked button
          this.classList.add("selected");

          // Update the link
          updateLink();
        }
      });
    }

    // Set initial link
    updateLink();
  }
})();
