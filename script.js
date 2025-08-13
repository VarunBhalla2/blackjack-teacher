const deckEl = document.querySelector('.deck');
const playerHand = document.querySelector('.player-hand');
const dealerHand = document.querySelector('.dealer-hand');
const dealBtn = document.getElementById('deal');

const cardBack = 'images/cards/back.png';
function cardImage(rank, suit) {
  return `images/cards/card_${suit}_${rank}.png`;
}

const CARD_WIDTH = 120;
const CARD_HEIGHT = 180;
const CARD_SPACING = -48;
const ANIM_MS = 250;

function createCardElement(rank = 'A', suit = 'spades', faceDown = false) {
  const card = document.createElement('div');
  card.className = 'card';
  if (faceDown) {
    card.style.backgroundImage = `url('${cardBack}')`;
    card.classList.add('face-down');
    card.dataset.face = cardImage(rank, suit);
    card.dataset.rank = rank;
    card.dataset.suit = suit;
  } else {
    card.style.backgroundImage = `url('${cardImage(rank, suit)}')`;
    card.dataset.rank = rank;
    card.dataset.suit = suit;
  }
  return card;
}

function animateCardFromDeckToPos(cardEl, targetX, targetY, finalRotate = 0) {
  const deckRect = deckEl.getBoundingClientRect();
  document.body.appendChild(cardEl);
  cardEl.style.position = 'absolute';
  cardEl.style.left = `${deckRect.left}px`;
  cardEl.style.top = `${deckRect.top}px`;
  cardEl.style.transform = `scale(1.06)`;

  requestAnimationFrame(() => {
    cardEl.style.left = `${targetX}px`;
    cardEl.style.top = `${targetY}px`;
    cardEl.style.transform = `rotate(${finalRotate}deg) scale(1)`;
    cardEl.classList.add('dealt');
  });

  return new Promise(resolve => setTimeout(resolve, ANIM_MS + 8));
}

function computeHandLandingPosForIndex(handEl, index) {
  const handRect = handEl.getBoundingClientRect();
  const visibleCount = 2;
  const totalWidth = CARD_WIDTH + (visibleCount - 1) * (CARD_WIDTH + CARD_SPACING);
  const startX = handRect.left + (handRect.width - totalWidth) / 2;
  const x = startX + index * (CARD_WIDTH + CARD_SPACING);
  const y = handRect.top + (handRect.height - CARD_HEIGHT) / 2;
  return [Math.round(x), Math.round(y)];
}

async function dealCard(target, rank, suit, faceDown = false, indexInHand = 0) {
  const cardEl = createCardElement(rank, suit, faceDown);
  const handEl = (target === 'player') ? playerHand : dealerHand;

  while (handEl.children.length <= indexInHand) {
    const ph = document.createElement('div');
    ph.className = 'card-placeholder';
    handEl.appendChild(ph);
  }

  const [x, y] = computeHandLandingPosForIndex(handEl, indexInHand);
  const rotation = (target === 'player') ? (indexInHand * 6 - 6) : (indexInHand * 4 - 2);

  await animateCardFromDeckToPos(cardEl, x, y, rotation);

  const placeholder = handEl.children[indexInHand];
  placeholder.appendChild(cardEl);
  cardEl.style.left = `0px`;
  cardEl.style.top = `0px`;
  cardEl.style.position = 'absolute';
  cardEl.style.transform = `rotate(${rotation}deg) scale(1)`;
}

function updateHandBadge(handEl, total) {
  let badge = handEl.querySelector('.hand-badge');
  if (!badge) {
    badge = document.createElement('div');
    badge.className = 'hand-badge';
    handEl.appendChild(badge);
  }
  badge.textContent = total;
}

function rankToValue(rank) {
  if (rank === 'A') return 11;
  if (['J','Q','K'].includes(rank)) return 10;
  const n = parseInt(rank, 10);
  return Number.isNaN(n) ? 10 : n;
}

function computeHandTotalFromElements(handEl) {
  const cards = Array.from(handEl.querySelectorAll('.card')).map(c => c.dataset.rank || null);
  let total = 0, aces = 0;
  for (const r of cards) {
    if (!r) continue;
    const v = rankToValue(r);
    total += v;
    if (r === 'A') aces++;
  }
  while (total > 21 && aces) {
    total -= 10; aces--;
  }
  return total;
}

function showPlayerChip(amountText = '€1,000.00') {
  let chip = playerHand.querySelector('.chip');
  if (!chip) {
    chip = document.createElement('div');
    chip.className = 'chip';

    const circle = document.createElement('div');
    circle.className = 'chip-circle';
    chip.appendChild(circle);

    const amt = document.createElement('div');
    amt.className = 'chip-amount';
    chip.appendChild(amt);

    playerHand.appendChild(chip);
  }
  chip.querySelector('.chip-amount').textContent = amountText;
}

function deal() {
  playerHand.innerHTML = '';
  dealerHand.innerHTML = '';

  const ranks = ['A', '02', '03', '04', '05', '06', '07', '08', '09', '10', 'J', 'Q', 'K'];
  const suits = ['spades', 'hearts', 'diamonds', 'clubs'];

  const sequence = [
    { target: 'player', faceDown: false },
    { target: 'dealer', faceDown: false },
    { target: 'player', faceDown: false },
    { target: 'dealer', faceDown: true }
  ];

  let playerCount = 0, dealerCount = 0;

  sequence.forEach((step, i) => {
    setTimeout(async () => {
      const r = ranks[Math.floor(Math.random() * ranks.length)];
      const s = suits[Math.floor(Math.random() * suits.length)];
      const idx = (step.target === 'player') ? playerCount++ : dealerCount++;
      await dealCard(step.target, r, s, step.faceDown, idx);

      const pTotal = computeHandTotalFromElements(playerHand);
      const dVisibleTotal = computeHandTotalFromElements(dealerHand);
      updateHandBadge(playerHand, pTotal);
      updateHandBadge(dealerHand, dVisibleTotal);

      if (i === sequence.length - 1) {
        setTimeout(() => {
          dealBtn.style.opacity = '0';
          dealBtn.style.pointerEvents = 'none';
          showPlayerChip('€1,000.00');
        }, 120);
      }
    }, i * (ANIM_MS + 60));
  });
}

dealBtn.addEventListener('click', deal);
