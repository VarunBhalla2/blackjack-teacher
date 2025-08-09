const DEAL_ORDER = ['player', 'dealer', 'player', 'dealer'];
const playerHand = document.querySelector('.player-hand');
const dealerHand = document.querySelector('.dealer-hand');
const dealBtn = document.getElementById('deal');

const CARD_IMAGES = {
  placeholder: 'https://via.placeholder.com/80x120?text=Card'
};

function dealCard(toHand) {
  const card = document.createElement('div');
  card.classList.add('card');
  card.style.backgroundImage = `url(${CARD_IMAGES.placeholder})`;
  
  const targetHand = toHand === 'player' ? playerHand : dealerHand;
  targetHand.appendChild(card);
  
  requestAnimationFrame(() => {
    card.classList.add('dealt');
  });
}

dealBtn.addEventListener('click', () => {
  playerHand.innerHTML = '';
  dealerHand.innerHTML = '';
  
  DEAL_ORDER.forEach((recipient, idx) => {
    setTimeout(() => dealCard(recipient), idx * 600);
  });
});

