const deckEl = document.querySelector('.deck');
const playerHand = document.querySelector('.player-hand');
const dealerHand = document.querySelector('.dealer-hand');
const dealBtn = document.getElementById('deal');

// Preload card images from Kenney CC0 pack or SVGs
const cardBack = 'images/cards/back.png';
function cardImage(rank, suit){
  return `images/cards/card_${suit}_${rank}.png`;
}

const order = ['player','dealer','player','dealer'];

function dealCard(target, rank='A', suit='S'){
  const card = document.createElement('div');
  card.classList.add('card');
  card.style.backgroundImage = `url('${cardBack}')`;

  document.body.appendChild(card);
  // Initial position: on the deck
  const deckRect = deckEl.getBoundingClientRect();
  card.style.left = `${deckRect.left}px`;
  card.style.top = `${deckRect.top}px`;

  requestAnimationFrame(() => {
    const handEl = target === 'player' ? playerHand : dealerHand;
    handEl.appendChild(card);
    const rect = card.getBoundingClientRect();
    card.style.left = `${rect.left}px`;
    card.style.top = `${rect.top}px`;
    card.classList.add('dealt');
    // Finally change to face
    setTimeout(()=>{
      card.style.backgroundImage = `url('${cardImage(rank, suit)}')`;
    }, 400);
  });
}

dealBtn.addEventListener('click', ()=>{
  playerHand.innerHTML = '';
  dealerHand.innerHTML = '';
  order.forEach((rec, i)=>{
    setTimeout(()=>{
      // Random rank/suit for demo
      const ranks = ['A','02','03','04','05','06','07','08','09','10','J','Q','K'];
      const suits = ['spades','hearts','diamonds','clubs'];
      const r = ranks[Math.floor(Math.random()*ranks.length)];
      const s = suits[Math.floor(Math.random()*suits.length)];
      dealCard(rec, r, s);
    }, i * 800);
  });
});
