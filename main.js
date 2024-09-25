async function sendRequest(url, method, data) {
    url = `https://tg-api.tehnikum.school/tehnikum_course/minesweeper/${url}`
    
    if(method == "POST") {
        let response = await fetch(url, {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
    
        response = await response.json()
        return response
    } else if(method == "GET") {
        url = url+"?"+ new URLSearchParams(data)
        let response = await fetch(url, {
            method: "GET",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
        response = await response.json()
        return response
    }
}


let username
let balance
let points = 1000

checkUser()

let authorizationForm = document.getElementById("authorization")
authorizationForm.addEventListener("submit", authorization)
async function authorization() {
    event.preventDefault()
    const formData = new FormData(event.target);
    username = formData.get ('username');
    let response = await sendRequest("user", "GET", {username})
    console.log(response);
    if (response.error) {
        //Пользователь не найден нужно его зарегистрировать 
        let regResponse = await sendRequest("user", "POST", {username})
            if (regResponse.error) {
                //Возникла ошибка при регистрации 
                alert(regResponse.message)
            }else {
                //Успешная регистрация 
                balance = regResponse.balance
                showUser()

            }       
    }else{
        //Пользователь найден
        balance = response.balance
        showUser()
    }
}

function showUser(){
let popUpSection = document.querySelector('section')
popUpSection.style.display = "none"
let userInfo = document.querySelector("header span")
userInfo.innerHTML = `[${username}, ${balance}]`
localStorage.setItem("username", username)

if (localStorage.getItem("game_id")){
    gameButton.setAttribute("data-game", "stop")
 } else {
    gameButton.setAttribute("data-game", "start")
 }
}

document.querySelector('.exit').addEventListener("click", exit)

function exit(){
    let popUpSection = document.querySelector('section')
    popUpSection.style.display = "flex"

    let userInfo = document.querySelector("header span")
    userInfo.innerHTML = `[]`

    localStorage.removeItem("username")
}

async function checkUser() {
    if (localStorage.getItem("username")) {
        // Если пользователь уже сохранён в LS
        username = localStorage.getItem("username");
        let response = await sendRequest("user", "GET", {username});
        if (response.error) {
            alert(response.message);
        } else {
            balance = response.balance;
            showUser();
        }
    } else {
        // Пользователь зашел впервые 
        let popUpSection = document.querySelector('section');
        popUpSection.style.display = "flex";
    }
}

let pointBtns = document.getElementsByName("point");
pointBtns.forEach((elem)=> {
    elem.addEventListener('input', setPoints)

})
function setPoints(){
let checkedBtn = document.querySelector("input:checked")
points = +checkedBtn.value
}

let gameButton = document.getElementById("gameButton")
gameButton.addEventListener("click", startOrStopGame)


function startOrStopGame(){
    let option = gameButton.getAttribute("data-game")
    if(option == "start") {
        //Начать игру
        if (points>0) {
            startGame()
        }
    } else if (option == "stop") {
        //Закончить игру
    }
}


async function startGame(){
    let response = await sendRequest("new_game", "POST", {username,points})
    if (response.error){
        alert(response.message)
    }else{
        //Игра успешно начата
        console.log(response);
    }
}