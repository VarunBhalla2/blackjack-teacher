// script.js
const deckEl = document.querySelector('.deck');
const playerHand = document.querySelector('.player-hand');
const dealerHand = document.querySelector('.dealer-hand');
const dealBtn = document.getElementById('deal');

// path to assets
const cardBack = 'images/cards/back.png';
function cardImage(rank, suit) {
  // expects files named like card_spades_A.png or card_hearts_02.png
  return `images/cards/card_${suit}_${rank}.png`;
}

// dealing order sequence (we'll override specifics to make hole card)
const order = ['player', 'dealer', 'player', 'dealer'];

/**
 * createCardElement:
 *  - faceDown: if true, the card will display the back and it's flagged as the hole card (dealer)
 *  - returns the created DOM element
 */
function createCardElement(rank = 'A', suit = 'spades', faceDown = false) {
  const card = document.createElement('div');
  card.className = 'card';
  // If faceDown, show back and mark dataset with real face so reveal later is possible
  if (faceDown) {
    card.style.backgroundImage = `url('${cardBack}')`;
    card.classList.add('face-down');
    card.dataset.face = cardImage(rank, suit);
    card.dataset.rank = rank;
    card.dataset.suit = suit;
  } else {
    card.style.backgroundImage = `url('${cardImage(rank, suit)}')`;
  }
  // Initially hidden / off-deck via absolute coords (set by caller)
  return card;
}

/**
 * animateCardFromDeckToPos(cardEl, targetX, targetY, finalRotate = 0)
 *  - positions card at deck, then animates to target X/Y and reveals face if needed
 */
function animateCardFromDeckToPos(cardEl, targetX, targetY, finalRotate = 0, revealAfterMs = 420) {
  // place card at deck coordinates first
  const deckRect = deckEl.getBoundingClientRect();
  // put into body so coordinates are viewport-based
  document.body.appendChild(cardEl);
  cardEl.style.left = `${deckRect.left}px`;
  cardEl.style.top = `${deckRect.top}px`;

  // force style calc
  requestAnimationFrame(() => {
    // move to final position
    cardEl.style.left = `${targetX}px`;
    cardEl.style.top = `${targetY}px`;
    cardEl.style.transform = `rotate(${finalRotate}deg)`;
    cardEl.classList.add('dealt');

    // if it's a face-down card we keep the back; otherwise face already set.
    // revealAfterMs only used for flip animation of face-up cards
    if (!cardEl.classList.contains('face-down')) {
      // no additional action needed (face already visible)
    } else {
      // leave it face-down; if we want to flip later use revealDealerHole()
    }
  });
}

/**
 * compute target position for the nth card in a hand (simple spacing)
 * returns [x, y] in viewport coordinates where the card should land
 */
function computeHandCardPosition(handEl, index) {
  const handRect = handEl.getBoundingClientRect();
  // center the stack horizontally and offset each card
  const cardWidth = 84;
  const spacing = 22;
  const totalWidth = (cardWidth + spacing) * 2; // for typical two-card layout; tune if you expect more
  const startX = handRect.left + (handRect.width - totalWidth) / 2;
  const x = startX + index * (cardWidth + spacing);
  const y = handRect.top + (handRect.height - 120) / 2;
  return [Math.round(x), Math.round(y)];
}

/**
 * dealCard: deals a single card (faceDown option for dealer hole), appends it visually
 * target: 'player' or 'dealer'
 */
function dealCard(target, rank, suit, faceDown = false, indexInHand = 0) {
  const cardEl = createCardElement(rank, suit, faceDown);
  const handEl = (target === 'player') ? playerHand : dealerHand;
  // compute where in viewport coordinates the card should land
  const [x, y] = computeHandCardPosition(handEl, indexInHand);
  // slight rotation for natural look
  const rotation = (target === 'player') ? (indexInHand * 4 - 6) : (indexInHand * 3 - 3);
  animateCardFromDeckToPos(cardEl, x, y, rotation);
  // store card in the hand container for bookkeeping (but leave element in body)
  // We'll append a lightweight placeholder so that computeHandCardPosition works for subsequent cards
  const placeholder = document.createElement('div');
  placeholder.className = 'card-placeholder';
  placeholder.style.width = '84px';
  placeholder.style.height = '120px';
  placeholder.style.margin = '0 12px';
  // allow later retrieval of real card elements by matching dataset or coordinates
  handEl.appendChild(placeholder);
  // return the card element in case caller wants to store reference
  return cardEl;
}

/**
 * revealDealerHole() - flips the dealer hole (face-down) card to reveal the face
 * It finds the first .card with class face-down and replaces its background with stored face.
 */
function revealDealerHole() {
  const hole = Array.from(document.querySelectorAll('.card.face-down'))[0];
  if (!hole) return;
  // simple flip animation: scaleX(0) then change background then scaleX(1)
  hole.style.transition = 'transform 220ms ease, opacity 220ms ease';
  hole.style.transform += ' scaleX(0)';
  setTimeout(() => {
    hole.style.backgroundImage = `url('${hole.dataset.face}')`;
    // remove face-down marker
    hole.classList.remove('face-down');
    // expand back
    hole.style.transform = hole.style.transform.replace(' scaleX(0)', ' scaleX(1)');
  }, 230);
}

/**
 * deal() - public function to perform the first deal:
 * player: two open cards
 * dealer: one open, one face-down (hole)
 * After dealing, hide the Deal button.
 */
function deal() {
  // clear any previous placeholders
  playerHand.innerHTML = '';
  dealerHand.innerHTML = '';

  // simple ranks/suits arrays (format must match your image files)
  const ranks = ['A','02','03','04','05','06','07','08','09','10','J','Q','K'];
  const suits = ['spades','hearts','diamonds','clubs'];

  // dealing sequence: p(open), d(open), p(open), d(hole)
  const sequence = [
    { target: 'player', faceDown: false },
    { target: 'dealer', faceDown: false },
    { target: 'player', faceDown: false },
    { target: 'dealer', faceDown: true } // the hole
  ];

  // keep simple counters for index in hand for spacing
  let playerCount = 0, dealerCount = 0;

  sequence.forEach((step, i) => {
    setTimeout(() => {
      const r = ranks[Math.floor(Math.random() * ranks.length)];
      const s = suits[Math.floor(Math.random() * suits.length)];
      const idx = (step.target === 'player') ? playerCount++ : dealerCount++;
      dealCard(step.target, r, s, step.faceDown, idx);
      // After last card, hide the deal button so it cannot be pressed again
      if (i === sequence.length - 1) {
        setTimeout(() => {
          // hide button (with a small fade)
          dealBtn.style.transition = 'opacity 220ms ease';
          dealBtn.style.opacity = '0';
          setTimeout(() => dealBtn.style.display = 'none', 240);
        }, 300);
      }
    }, i * 520); // spacing between individual card deals
  });
}

// wire the button (keeping deal() separate)
if (dealBtn) {
  dealBtn.addEventListener('click', deal);
}
