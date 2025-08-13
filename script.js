// script.js — stacked-hand layout with badge & chip; cards snapped into placeholders

const deckEl = document.querySelector('.deck');
const playerHand = document.querySelector('.player-hand');
const dealerHand = document.querySelector('.dealer-hand');
const dealBtn = document.getElementById('deal');

// asset helpers
const cardBack = 'images/cards/back.png';
function cardImage(rank, suit) {
  return `images/cards/card_${suit}_${rank}.png`;
}

const CARD_WIDTH = 120;
const CARD_HEIGHT = 180;
const CARD_SPACING = -48; // negative margin for overlap (matches CSS)
const ANIM_MS = 250; // 0.25s

/* create a card element (faceDown stores face in dataset for later reveal) */
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
  }
  return card;
}

/* animate a card from deck to a viewport (x,y) position and rotation */
function animateCardFromDeckToPos(cardEl, targetX, targetY, finalRotate = 0) {
  const deckRect = deckEl.getBoundingClientRect();
  document.body.appendChild(cardEl);

  // start at deck
  cardEl.style.left = `${deckRect.left}px`;
  cardEl.style.top = `${deckRect.top}px`;
  cardEl.style.opacity = '0.98';
  cardEl.style.transform = `scale(1.06)`; // pickup feel

  requestAnimationFrame(() => {
    // animate to target
    cardEl.style.left = `${targetX}px`;
    cardEl.style.top = `${targetY}px`;
    cardEl.style.transform = `rotate(${finalRotate}deg) scale(1)`;
    cardEl.classList.add('dealt');
  });

  // return a promise that resolves when animation is done
  return new Promise(resolve => {
    setTimeout(() => resolve(), ANIM_MS + 8);
  });
}

/* compute approximate landing position for index'th placeholder in a hand */
function computeHandLandingPosForIndex(handEl, index) {
  // find bounding box of the hand area
  const handRect = handEl.getBoundingClientRect();
  // center horizontally, then offset so placeholders overlap (we use negative margin)
  const visibleCount = 2; // default two visible cards; adjust if you want more
  const totalWidth = CARD_WIDTH + (visibleCount - 1) * (CARD_WIDTH + CARD_SPACING);
  const startX = handRect.left + (handRect.width - totalWidth) / 2;
  const x = startX + index * (CARD_WIDTH + CARD_SPACING);
  const y = handRect.top + (handRect.height - CARD_HEIGHT) / 2;
  return [Math.round(x), Math.round(y)];
}

/* Deal single card and then snap card element into the hand placeholder */
async function dealCard(target, rank, suit, faceDown = false, indexInHand = 0) {
  const cardEl = createCardElement(rank, suit, faceDown);
  const handEl = (target === 'player') ? playerHand : dealerHand;

  // ensure a placeholder exists at this index (if not create)
  while (handEl.children.length <= indexInHand) {
    const ph = document.createElement('div');
    ph.className = 'card-placeholder';
    handEl.appendChild(ph);
  }

  // compute landing position using placeholder index
  const [x, y] = computeHandLandingPosForIndex(handEl, indexInHand);
  const rotation = (target === 'player') ? (indexInHand * 6 - 6) : (indexInHand * 4 - 2);

  // animate from deck to viewport position
  await animateCardFromDeckToPos(cardEl, x, y, rotation);

  // snap into placeholder: put card inside placeholder and set absolute offset 0
  const placeholder = handEl.children[indexInHand];
  // calculate placeholder's viewport position so we can convert to relative coordinates
  const phRect = placeholder.getBoundingClientRect();

  // convert cardEl left/top (viewport) -> relative to placeholder
  const leftRel = 0; // we will set left 0 inside placeholder to keep centered
  const topRel = 0;

  // move cardEl into placeholder and reset coordinates for in-placeholder absolute layout
  placeholder.appendChild(cardEl);
  cardEl.style.left = `${leftRel}px`;
  cardEl.style.top = `${topRel}px`;
  cardEl.style.position = 'absolute';
  cardEl.style.transform = `rotate(${rotation}deg) scale(1)`;
  cardEl.style.opacity = '1';

  return cardEl;
}

/* create/position badge showing hand total */
function updateHandBadge(handEl, total) {
  let badge = handEl.querySelector('.hand-badge');
  if (!badge) {
    badge = document.createElement('div');
    badge.className = 'hand-badge';
    handEl.appendChild(badge);
  }
  badge.textContent = total;
  // position badge relative to hand — fine-tuned with CSS left/top declared earlier
}

/* add chip & bet label under player hand */
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

/* reveal dealer hole card (flip) */
function revealDealerHole() {
  const hole = Array.from(document.querySelectorAll('.card.face-down'))[0];
  if (!hole) return;
  hole.style.transition = `transform ${ANIM_MS/2}ms ease, opacity ${ANIM_MS/2}ms ease`;
  hole.style.transform += ' scaleX(0)';
  setTimeout(() => {
    hole.style.backgroundImage = `url('${hole.dataset.face}')`;
    hole.classList.remove('face-down');
    hole.style.transform = hole.style.transform.replace(' scaleX(0)', ' scaleX(1)');
  }, ANIM_MS/2 + 10);
}

/* compute an integer hand total from card ranks (infinite-deck rules; simple conversion for the badge) */
function rankToValue(rank) {
  if (rank === 'A') return 11;
  if (['J','Q','K'].includes(rank)) return 10;
  // ranks use '02','03' etc. convert
  const n = parseInt(rank, 10);
  return Number.isNaN(n) ? 10 : n;
}
function computeHandTotalFromElements(handEl) {
  // sum up dataset.rank values on card elements inside placeholders
  const cards = Array.from(handEl.querySelectorAll('.card')).map(c => c.dataset.rank || null);
  let total = 0, aces = 0;
  for (const r of cards) {
    if (!r) continue;
    const v = rankToValue(r);
    total += v;
    if (r === 'A') aces++;
  }
  // adjust aces
  while (total > 21 && aces) {
    total -= 10; aces--;
  }
  return total;
}

/* --- Main deal() --- */
function deal() {
  // clear previous
  playerHand.innerHTML = '';
  dealerHand.innerHTML = '';

  const ranks = ['A', '02', '03', '04', '05', '06', '07', '08', '09', '10', 'J', 'Q', 'K'];
  const suits = ['spades', 'hearts', 'diamonds', 'clubs'];

  const sequence = [
    { target: 'player', faceDown: false },
    { target: 'dealer', faceDown: false },
    { target: 'player', faceDown: false },
    { target: 'dealer', faceDown: true } // dealer hole card
  ];

  let playerCount = 0, dealerCount = 0;
  const dealtCards = []; // store to compute totals & show badges

  sequence.forEach((step, i) => {
    setTimeout(async () => {
      const r = ranks[Math.floor(Math.random() * ranks.length)];
      const s = suits[Math.floor(Math.random() * suits.length)];
      const idx = (step.target === 'player') ? playerCount++ : dealerCount++;
      const cardEl = await dealCard(step.target, r, s, step.faceDown, idx);

      // store dataset rank (if face-down, dataset already set)
      if (!cardEl.dataset.rank) cardEl.dataset.rank = r;
      if (!cardEl.dataset.suit) cardEl.dataset.suit = s;

      // update badges after each deal
      const pTotal = computeHandTotalFromElements(playerHand);
      const dVisibleTotal = computeHandTotalFromElements(dealerHand); // note: hole card may be dataset'd but face-down
      updateHandBadge(playerHand, pTotal);
      updateHandBadge(dealerHand, dVisibleTotal);

      // After last card hide deal button and show a chip
      if (i === sequence.length - 1) {
        setTimeout(() => {
          dealBtn.style.transition = 'opacity 180ms ease';
          dealBtn.style.opacity = '0';
          setTimeout(() => (dealBtn.style.display = 'none'), 200);
          // show sample chip under player
          showPlayerChip('€1,000.00');
        }, 120);
      }
    }, i * (ANIM_MS + 60));
  });
}

/* wire button */
if (dealBtn) dealBtn.addEventListener('click', deal);
