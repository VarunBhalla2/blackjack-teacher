const dealerHandEl = document.getElementById("dealer-hand");
const playerHandEl = document.getElementById("player-hand");
const dealBtn = document.getElementById("deal-btn");

const suits = ["♠", "♥", "♦", "♣"];
const values = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

function getRandomCard() {
    const suit = suits[Math.floor(Math.random() * suits.length)];
    const value = values[Math.floor(Math.random() * values.length)];
    return value + suit;
}

function createCardElement(card) {
    const cardEl = document.createElement("div");
    cardEl.classList.add("card");
    cardEl.textContent = card;
    return cardEl;
}

function dealCards() {
    dealerHandEl.innerHTML = "";
    playerHandEl.innerHTML = "";

    // Deal 2 cards to player and dealer
    for (let i = 0; i < 2; i++) {
        setTimeout(() => {
            dealerHandEl.appendChild(createCardElement(getRandomCard()));
        }, i * 250); // 0.25s delay between each card
    }
    for (let i = 0; i < 2; i++) {
        setTimeout(() => {
            playerHandEl.appendChild(createCardElement(getRandomCard()));
        }, (i + 2) * 250);
    }
}

dealBtn.addEventListener("click", dealCards);
