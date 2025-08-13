// script.js — updated for faster 0.25s deal animation and larger cards

const deckEl = document.querySelector('.deck');
const playerHand = document.querySelector('.player-hand');
const dealerHand = document.querySelector('.dealer-hand');
const dealBtn = document.getElementById('deal');

// asset helpers — keep same naming as before
const cardBack = 'images/cards/back.png';
function cardImage(rank, suit) {
  return `images/cards/card_${suit}_${rank}.png`;
}

// sizing constants (must match CSS)
const CARD_WIDTH = 120;
const CARD_HEIGHT = 180;
const CARD_SPACING = 18; // same as CSS margin
const ANIM_MS = 250; // 0.25s animation

const order = ['player', 'dealer', 'player', 'dealer'];

/* --- Create card DOM element --- */
function createCardElement(rank = 'A', suit = 'spades', faceDown = false) {
  const card = document.createElement('div');
  card.className = 'card';
  if (faceDown) {
    card.style.backgroundImage = `url('${cardBack}')`;
    card.classList.add('face-down');
    // store the face so we can reveal later
    card.dataset.face = cardImage(rank, suit);
    card.dataset.rank = rank;
    card.dataset.suit = suit;
  } else {
    card.style.backgroundImage = `url('${cardImage(rank, suit)}')`;
  }
  return card;
}

/* --- animate card from deck to (x,y) --- */
function animateCardFromDeckToPos(cardEl, targetX, targetY, finalRotate = 0) {
  const deckRect = deckEl.getBoundingClientRect();
  // start on deck
  document.body.appendChild(cardEl);
  cardEl.style.left = `${deckRect.left}px`;
  cardEl.style.top = `${deckRect.top}px`;
  // small pick-up effect: slightly scale up before moving
  cardEl.style.transform = `scale(1.06)`;
  cardEl.style.opacity = '0.98';

  // ensure browser applies starting style
  requestAnimationFrame(() => {
    // move to final position; the CSS transition (ANIM_MS) handles the smoothness
    cardEl.style.left = `${targetX}px`;
    cardEl.style.top = `${targetY}px`;
    cardEl.style.transform = `rotate(${finalRotate}deg) scale(1)`; // settle to normal scale
    cardEl.classList.add('dealt');

    // after the animation settle time, ensure it's fully visible/settled
    setTimeout(() => {
      cardEl.style.opacity = '1';
      cardEl.style.transform = `rotate(${finalRotate}deg) scale(1)`;
    }, ANIM_MS + 10);
  });
}

/* --- compute placement coordinates for nth card in hand --- */
function computeHandCardPosition(handEl, index) {
  const handRect = handEl.getBoundingClientRect();
  const totalWidth = CARD_WIDTH * 2 + CARD_SPACING; // we show two cards by default
  const startX = handRect.left + (handRect.width - totalWidth) / 2;
  const x = startX + index * (CARD_WIDTH + CARD_SPACING);
  const y = handRect.top + (handRect.height - CARD_HEIGHT) / 2;
  return [Math.round(x), Math.round(y)];
}

/* --- Deal a single card visual (faceDown option) --- */
function dealCard(target, rank, suit, faceDown = false, indexInHand = 0) {
  const cardEl = createCardElement(rank, suit, faceDown);
  const handEl = (target === 'player') ? playerHand : dealerHand;
  const [x, y] = computeHandCardPosition(handEl, indexInHand);
  // gentle rotation for natural feel
  const rotation = (target === 'player') ? (indexInHand * 6 - 6) : (indexInHand * 4 - 2);
  animateCardFromDeckToPos(cardEl, x, y, rotation);

  // append placeholder into hand so computeHandCardPosition remains correct for additional cards
  const placeholder = document.createElement('div');
  placeholder.className = 'card-placeholder';
  handEl.appendChild(placeholder);
  return cardEl;
}

/* --- reveal dealer hole card (flip from back to face) --- */
function revealDealerHole() {
  const hole = Array.from(document.querySelectorAll('.card.face-down'))[0];
  if (!hole) return;
  // quick flip effect: shrink X to 0, swap background, expand X to 1
  hole.style.transition = `transform ${ANIM_MS / 2}ms ease, opacity ${ANIM_MS / 2}ms ease`;
  hole.style.transform += ' scaleX(0)';
  setTimeout(() => {
    hole.style.backgroundImage = `url('${hole.dataset.face}')`;
    hole.classList.remove('face-down');
    hole.style.transform = hole.style.transform.replace(' scaleX(0)', ' scaleX(1)');
  }, ANIM_MS / 2 + 20);
}

/* --- Main public deal() - deals two to player (both open) and dealer (one open + one face-down) --- */
function deal() {
  playerHand.innerHTML = '';
  dealerHand.innerHTML = '';

  const ranks = ['A', '02', '03', '04', '05', '06', '07', '08', '09', '10', 'J', 'Q', 'K'];
  const suits = ['spades', 'hearts', 'diamonds', 'clubs'];

  const sequence = [
    { target: 'player', faceDown: false },
    { target: 'dealer', faceDown: false },
    { target: 'player', faceDown: false },
    { target: 'dealer', faceDown: true } // dealer hole
  ];

  let playerCount = 0, dealerCount = 0;

  sequence.forEach((step, i) => {
    setTimeout(() => {
      const r = ranks[Math.floor(Math.random() * ranks.length)];
      const s = suits[Math.floor(Math.random() * suits.length)];
      const idx = (step.target === 'player') ? playerCount++ : dealerCount++;
      dealCard(step.target, r, s, step.faceDown, idx);

      // after final card, hide the deal button
      if (i === sequence.length - 1) {
        setTimeout(() => {
          dealBtn.style.transition = 'opacity 180ms ease';
          dealBtn.style.opacity = '0';
          setTimeout(() => (dealBtn.style.display = 'none'), 200);
        }, 180);
      }
    }, i * (ANIM_MS + 60)); // small gap after each 0.25s animation
  });
}

/* wire the button (keeps deal() separate) */
if (dealBtn) {
  dealBtn.addEventListener('click', deal);
}
