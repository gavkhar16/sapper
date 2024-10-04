async function sendRequest(url, method, data) {
  url = `https://tg-api.tehnikum.school/tehnikum_course/minesweeper/${url}`;

  if (method === "POST") {
    let response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    response = await response.json();
    return response;
  } else if (method === "GET") {
    url = url + "?" + new URLSearchParams(data);
    let response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });
    response = await response.json();
    return response;
  }
}

let username;
let balance;
let points = 1000;
let game_id;

checkUser();

let authorizationForm = document.getElementById("authorization");
authorizationForm.addEventListener("submit", function (event) {
  authorization(event);
});

async function authorization(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  username = formData.get("username");
  let response = await sendRequest("user", "GET", { username });
  console.log(response);
  if (response.error) {
    // Пользователь не найден, нужно его зарегистрировать
    let regResponse = await sendRequest("user", "POST", { username });
    if (regResponse.error) {
      // Возникла ошибка при регистрации
      alert(regResponse.message);
    } else {
      // Успешная регистрация
      balance = regResponse.balance;
      showUser();
    }
  } else {
    // Пользователь найден
    balance = response.balance;
    showUser();
  }
}

function showUser() {
  let popUpSection = document.querySelector("section");
  popUpSection.style.display = "none";
  let userInfo = document.querySelector("header span");
  userInfo.innerHTML = `[${username}, ${balance}]`;
  localStorage.setItem("username", username);

  gameButton.setAttribute("data-game", "start");
  // if (localStorage.getItem("game_id")) {
  //     gameButton.setAttribute("data-game", "stop");
  // } else {
  //     gameButton.setAttribute("data-game", "start");
  // }
}

document.querySelector(".exit").addEventListener("click", exit);

function exit() {
  let popUpSection = document.querySelector("section");
  popUpSection.style.display = "flex";

  let userInfo = document.querySelector("header span");
  userInfo.innerHTML = `[]`;

  localStorage.removeItem("username");
  localStorage.removeItem("game_id");
}

async function checkUser() {
  if (localStorage.getItem("username")) {
    // Если пользователь уже сохранён в LS
    username = localStorage.getItem("username");
    let response = await sendRequest("user", "GET", { username });
    if (response.error) {
      alert(response.message);
    } else {
      balance = response.balance;
      showUser();
    }
  } else {
    // Пользователь зашел впервые
    let popUpSection = document.querySelector("section");
    popUpSection.style.display = "flex";
  }
}

let pointBtns = document.getElementsByName("point");
pointBtns.forEach((elem) => {
  elem.addEventListener("input", setPoints);
});

function setPoints() {
  let checkedBtn = document.querySelector("input:checked");
  points = +checkedBtn.value;
}

let gameButton = document.getElementById("gameButton");
gameButton.addEventListener("click", startOrStopGame);

function startOrStopGame() {
  let option = gameButton.getAttribute("data-game");
  if (option === "start") {
    // Начать игру
    if (points > 0) {
      startGame();
    }
  } else if (option === "stop") {
    // Закончить игру
    stopGame();
  }
}

async function startGame() {
  let response = await sendRequest("new_game", "POST", { username, points });
  if (response.error) {
    alert(response.message);
  } else {
    // Игра успешно начата
    console.log(response);
    game_id = response.game_id;
    localStorage.setItem("game_id", game_id);
    gameButton.setAttribute("data-game", "stop");
    gameButton.innerHTML = "Завершить игру";
    // Активировать пользователь
    activeArea();
  }
}

function activeArea() {
  let cell = document.querySelectorAll(".cell");
  let rows = 8;
  let columns = 10;
  cell.forEach((cell, i) => {
    setTimeout(() => {
      let row = Math.floor(i / columns);
      let column = i - row * columns;

      cell.setAttribute("data-row", row);
      cell.setAttribute("data-column", column);

      cell.classList.add("active");
      cell.addEventListener("contextmenu", setFlag);
      cell.addEventListener("click", makeStep);
    }, 30 * i);
  });
}

function setFlag() {
  event.preventDefault();
  let cell = event.target;
  cell.classList.toggle("flag");
}

async function makeStep() {
  let cell = event.target;
  let row = +cell.getAttribute("data-row");
  let column = +cell.getAttribute("data-column");

  let response = await sendRequest("game_step", "POST", {
    game_id,
    row,
    column,
  });
  if (response.error) {
    alert(response.message);
  } else {
    // Получен успешный ответ
    if (response.status == "Won") {
      //Выиграл
      updateArea(response.table);

      balance = response.balance;
      showUser();
      alert("Ты выиграл!");
      clearArea();
      gameButton.setAttribute("data-game", "start");
      gameButton.innerHTML = "Играть";
    } else if (response.status == "Failed") {
      //Проиграл

      updateArea(response.table);
      balance = response.balance;
      showUser();
      alert("Ты проиграл!");
      clearArea();
      gameButton.setAttribute("data-game", "start");
      gameButton.innerHTML = "Играть";
    } else if (response.status == "Ok") {
      // Играем дальше

      updateArea(response.table);
    }
  }

  console.log(cell, row, column);
}

function updateArea(table) {
  let cells = document.querySelectorAll(".cell");
  let j = 0;
  for (let row = 0; row < table.length; row++) {
    for (let column = 0; column < table[row].length; column++) {
      let value = table[row][column];
      if (value === 0) {
        cells[j].classList.remove("active");
        cells[j].classList.remove("flag");
      } else if (value >= 1) {
        cells[j].classList.remove("active");
        cells[j].classList.remove("flag");
        cells[j].innerHTML = value;
      } else if (value == "BOMB") {
        cells[j].classList.remove("active");
        cells[j].classList.remove("flag");
        cells[j].classList.remove("bomb");
      }
      j++;
    }
  }
}

async function stopGame() {
  let response = await sendRequest("stop_game", "POST", { username, game_id });
  if (response.error) {
    alert(response.message);
  } else {
    // Игра успешно закончена
    console.log(response);
    balance = response.balance;
    showUser();
    game_id = "";
    localStorage.removeItem("game_id");
    gameButton.setAttribute("data-game", "start");
    gameButton.innerHTML = "Играть";
    // Очистить игру
    clearArea();
  }
}

function clearArea() {
  let area = document.querySelector(".area");
  area.innerHTML = "";
  let cells = "";
  for (let i = 0; i < 80; i++) {
    cells += `<div class="cell"></div>`;
  }
  area.innerHTML = cells;
}
