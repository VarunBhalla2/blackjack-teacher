/* Blackjack Simulator - Vanilla JS
   Features:
   - Standard blackjack rules
   - Split once (into two hands)
   - Double down (single additional card)
   - Blackjack pays 3:2
   - Dealer stands on all 17s (soft and hard)
   - Aces counted as 1 or 11 optimally
   - Smooth dealing animations (~250ms)
   - Card size fixed at 200x200px and no shadows
*/

/* ----- Utility: Deck & Card generation ----- */
const SUITS = ['♠','♥','♦','♣'];
const RANKS = [
  {r:'A', v: [1,11]},
  {r:'2', v:2},{r:'3', v:3},{r:'4', v:4},{r:'5', v:5},
  {r:'6', v:6},{r:'7', v:7},{r:'8', v:8},{r:'9', v:9},
  {r:'10', v:10},{r:'J', v:10},{r:'Q', v:10},{r:'K', v:10}
];

function createDeck(numDecks = 6){
  const deck = [];
  for(let d=0; d<numDecks; d++){
    SUITS.forEach(suit=>{
      RANKS.forEach(rank=>{
        deck.push({
          suit,
          rank: rank.r,
          values: Array.isArray(rank.v) ? rank.v : [rank.v],
          id: `${rank.r}${suit}${d}`
        });
      });
    });
  }
  return shuffle(deck);
}

// Fisher-Yates shuffle
function shuffle(array){
  for(let i=array.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [array[i],array[j]] = [array[j],array[i]];
  }
  return array;
}

/* ----- DOM Elements ----- */
const startingBalanceInput = document.getElementById('starting-balance');
const betAmountInput = document.getElementById('bet-amount');
const restartBtn = document.getElementById('restart-btn');

const dealBtn = document.getElementById('deal-btn');
const hitBtn = document.getElementById('hit-btn');
const standBtn = document.getElementById('stand-btn');
const doubleBtn = document.getElementById('double-btn');
const splitBtn = document.getElementById('split-btn');

const balanceEl = document.getElementById('balance');
const currentBetEl = document.getElementById('current-bet');
const messageEl = document.getElementById('message');

const dealerHandContainer = document.getElementById('dealer-hand');
const dealerValueEl = document.getElementById('dealer-value');
const playerHandsContainer = document.getElementById('player-hands');
const deckEl = document.getElementById('deck');

/* ----- Game State ----- */
let deck = [];
let shoeSize = 6; // number of decks
let balance = 1000;
let baseBet = 50;

// Array of player hands; each hand: {cards:[], bet:number, doubled:boolean, finished:boolean}
let playerHands = [];
let dealerHand = [];
let activeHandIndex = 0;
let roundInProgress = false;

/* ----- Initialize UI ----- */
function init(){
  balance = parseInt(startingBalanceInput.value) || 1000;
  baseBet = parseInt(betAmountInput.value) || 50;
  balanceEl.textContent = balance;
  currentBetEl.textContent = baseBet;
  messageEl.textContent = "Ready — set your bet and press Deal.";
  deck = createDeck(shoeSize);
  clearTableVisuals();
  setButtons({deal:true, hit:false, stand:false, double:false, split:false});
}
init();

/* ----- Helpers: hand evaluation ----- */
// Return best value <=21 if possible, else lowest value (busted)
function bestHandValue(cards){
  // Sum values treating aces optimally
  let total = 0;
  let aces = 0;
  for(const c of cards){
    if(c.rank === 'A'){ aces++; total += 1; }
    else total += c.values[0];
  }
  // try upgrading aces from 1 to 11 as long as <=21
  for(let i=0;i<aces;i++){
    if(total + 10 <= 21) total += 10;
  }
  return total;
}

function isBlackjack(cards){
  return cards.length === 2 && bestHandValue(cards) === 21;
}

function isBusted(cards){
  return bestHandValue(cards) > 21;
}

/* ----- UI: Card rendering & animation ----- */
function createCardElement(card){
  const el = document.createElement('div');
  el.className = `card ${['♥','♦'].includes(card.suit) ? 'red' : 'black'}`;
  el.dataset.cardId = card.id;
  // Put small rank in corners and big suit in center
  el.innerHTML = `
    <div class="corner top">${card.rank}<br><span style="font-size:14px">${card.suit}</span></div>
    <div class="center-suit">${card.suit}</div>
    <div class="corner bottom" style="transform:rotate(180deg)">${card.rank}<br><span style="font-size:14px">${card.suit}</span></div>
  `;
  // Set initial style at deck location
  const deckRect = deckEl.getBoundingClientRect();
  const containerRect = document.body.getBoundingClientRect();
  // position absolute relative to document
  el.style.left = (deckRect.left - containerRect.left + (deckRect.width - 200)/2) + 'px';
  el.style.top  = (deckRect.top  - containerRect.top  + (deckRect.height - 200)/2) + 'px';
  el.style.opacity = '0';
  document.body.appendChild(el);
  return el;
}

// Move card element to target slot (x,y within document coords)
function animateCardTo(el, targetX, targetY, faceUp=true, delay=0){
  // small delay support
  requestAnimationFrame(()=>{
    setTimeout(()=>{
      el.style.transition = 'transform 250ms cubic-bezier(.2,.9,.25,1), left 250ms ease, top 250ms ease, opacity 120ms ease';
      el.style.left = targetX + 'px';
      el.style.top  = targetY + 'px';
      el.style.opacity = '1';
      // after animation moves, we keep element at that pos (absolute). No further action.
    }, delay);
  });
}

// Remove card element (for cleanup)
function removeCardElement(el){
  if(el && el.parentNode) el.parentNode.removeChild(el);
}

/* Calculate target positions for a hand slot */
function getHandSlotPosition(slotIndex, cardIndex, isDealer=false, handSide='center', handOffset=0){
  // We'll place cards within slot container(s)
  // Determine container: dealer or a player hand slot
  const containerRect = document.body.getBoundingClientRect();
  let baseLeft = window.innerWidth/2 - 220; // fallback
  let baseTop = window.innerHeight/2 - 160;
  if(isDealer){
    const rect = dealerHandContainer.getBoundingClientRect();
    baseLeft = rect.left - containerRect.left + 8 + cardIndex * 60;
    baseTop  = rect.top  - containerRect.top  + (rect.height - 200);
  } else {
    // player hands: find the specific slot container
    const slots = playerHandsContainer.querySelectorAll('.slot');
    if(slots && slots[slotIndex]){
      const rect = slots[slotIndex].getBoundingClientRect();
      baseLeft = rect.left - containerRect.left + 8 + cardIndex * 60;
      baseTop  = rect.top  - containerRect.top  + (rect.height - 200);
    } else {
      // fallback center-bottom
      const rect = playerHandsContainer.getBoundingClientRect();
      baseLeft = rect.left - containerRect.left + cardIndex * 60;
      baseTop  = rect.top  - containerRect.top  + (rect.height - 200);
    }
  }
  return {x: baseLeft, y: baseTop};
}

/* Visual table clearing */
function clearTableVisuals(){
  // Remove any leftover card elements anchored to body
  document.querySelectorAll('.card').forEach(c => removeCardElement(c));
  // Clear containers
  dealerHandContainer.innerHTML = '';
  playerHandsContainer.innerHTML = '';
  dealerValueEl.textContent = '';
}

/* Render the current hands as static placeholders (we still use absolute card elements for animation) */
function renderHandPlaceholders(){
  playerHandsContainer.innerHTML = '';
  playerHands.forEach((h, idx)=>{
    const handWrap = document.createElement('div');
    handWrap.className = 'player-hand';
    const slot = document.createElement('div');
    slot.className = 'slot';
    // small info above slot
    const info = document.createElement('div');
    info.style.marginBottom = '6px';
    info.style.textAlign = 'center';
    info.innerHTML = `<div style="color:var(--muted); font-weight:700">Hand ${idx+1} — Bet: ${h.bet}${h.doubled ? ' (D)' : ''}</div><div class="hand-value" id="hand-value-${idx}">Value: ${bestHandValue(h.cards)}</div>`;
    handWrap.appendChild(info);
    handWrap.appendChild(slot);
    playerHandsContainer.appendChild(handWrap);
  });
}

/* Update text values for hand badges and dealer */
function updateHandBadges(){
  playerHands.forEach((h, idx)=>{
    const el = document.getElementById(`hand-value-${idx}`);
    if(el) el.textContent = `Value: ${bestHandValue(h.cards)}`;
  });
  if(dealerHand.length > 0){
    // show dealer visible value (if round not finished hide hole card)
    const showHole = !roundInProgress;
    if(roundInProgress && dealerHand.length >= 2){
      // show only visible card's value roughly (but we show one card visible)
      // For simplicity show "?" while round in progress
      dealerValueEl.textContent = '?';
    } else {
      dealerValueEl.textContent = dealerHand.length ? `Value: ${bestHandValue(dealerHand)}` : '';
    }
  } else {
    dealerValueEl.textContent = '';
  }
}

/* ----- Core: dealing logic ----- */
function drawCard(){
  if(deck.length < 15){ // reshoe when low on cards
    deck = createDeck(shoeSize);
    console.log('Reshuffled shoe');
  }
  return deck.pop();
}

async function dealInitial(){
  // Clear old visuals
  clearTableVisuals();
  playerHands = [];
  dealerHand = [];
  activeHandIndex = 0;
  roundInProgress = true;

  // Validate bet
  baseBet = parseInt(betAmountInput.value) || baseBet;
  if(baseBet <= 0){ messageEl.textContent = 'Set a valid bet.'; return; }
  if(baseBet > balance){ messageEl.textContent = 'Insufficient balance for that bet.'; return; }

  // Setup one starting player hand
  const playerHand = {cards: [], bet: baseBet, doubled:false, finished:false};
  playerHands.push(playerHand);
  balance -= baseBet;
  updateBalanceDisplay();

  // Visual placeholders
  renderHandPlaceholders();
  setButtons({deal:false, hit:false, stand:false, double:false, split:false});
  messageEl.textContent = 'Dealing...';

  // Deal sequence: player, dealer, player, dealer (hole)
  // For smoother UX, animate cards one by one with small delays
  const dealOrder = [
    {to: 'player', handIdx:0},
    {to: 'dealer', handIdx:null},
    {to: 'player', handIdx:0},
    {to: 'dealer', handIdx:null}
  ];

  for(let i=0;i<dealOrder.length;i++){
    const step = dealOrder[i];
    const card = drawCard();
    if(step.to === 'player'){
      playerHands[step.handIdx].cards.push(card);
    } else {
      dealerHand.push(card);
    }
    await animateDeal(card, step.to, step.handIdx, i*80);
  }

  // After dealing initial cards, update UI
  updateHandBadges();

  // Check for blackjacks
  const playerBJ = isBlackjack(playerHands[0].cards);
  const dealerBJ = isBlackjack(dealerHand);

  if(playerBJ || dealerBJ){
    // immediate resolution
    endRoundImmediate(playerBJ, dealerBJ);
    return;
  }

  // Allow actions depending on hand: Hit/Stand always; Double allowed on two cards if enough balance; Split allowed if pair and enough balance
  enablePlayerActionsForActiveHand();
  messageEl.textContent = "Your move.";
}

function enablePlayerActionsForActiveHand(){
  if(!roundInProgress) return;
  const hand = playerHands[activeHandIndex];
  // Hit & Stand allowed if not finished
  setButtons({
    deal:false,
    hit:true,
    stand:true,
    double: (hand.cards.length===2 && balance >= hand.bet && !hand.doubled),
    split: (hand.cards.length===2 && hand.cards[0].rank === hand.cards[1].rank && balance >= hand.bet && playerHands.length===1)
  });
}

/* Animate dealing single card to target and place a static card in the hand slot */
function animateDeal(card, to, handIdx, delay=0){
  return new Promise((resolve)=>{
    const el = createCardElement(card);
    // decide target coordinates
    const pos = getHandSlotPosition(
      handIdx || 0,
      (to==='dealer' ? dealerHand.length-1 : playerHands[handIdx].cards.length-1),
      to==='dealer'
    );
    // small offset to center
    animateCardTo(el, pos.x, pos.y, true, delay);
    // After animation finishes, we embed a permanent visual inside the slot container (clone)
    setTimeout(()=>{
      // Add a smaller static card inside the slot container for layout clarity (we'll remove body absolute later)
      const slots = to==='dealer' ? dealerHandContainer : playerHandsContainer.querySelectorAll('.slot');
      let targetSlot;
      if(to==='dealer') targetSlot = dealerHandContainer;
      else targetSlot = slots[handIdx];

      // Create static in-slot representation (non-absolute)
      const inSlot = document.createElement('div');
      inSlot.className = `card ${['♥','♦'].includes(card.suit) ? 'red' : 'black'}`;
      inSlot.style.position = 'relative';
      inSlot.style.left = ( (to==='dealer' ? 0 : (playerHands[handIdx].cards.length-1) * 62) ) + 'px';
      inSlot.style.top = '0px';
      inSlot.style.opacity = '1';
      inSlot.style.transform = 'none';
      inSlot.style.marginRight = '6px';
      inSlot.innerHTML = el.innerHTML;
      // attach to slot (dealer: append directly to dealerHandContainer; player: append to the slot)
      if(to==='dealer') dealerHandContainer.appendChild(inSlot);
      else targetSlot.appendChild(inSlot);

      // remove the absolute animated element
      removeCardElement(el);
      updateHandBadges();
      resolve();
    }, delay + 320); // wait slightly longer than animation
  });
}

/* ----- Player actions ----- */
async function playerHit(){
  if(!roundInProgress) return;
  const hand = playerHands[activeHandIndex];
  if(hand.finished) return;
  const card = drawCard();
  hand.cards.push(card);

  await animateDeal(card, 'player', activeHandIndex);
  updateHandBadges();

  if(isBusted(hand.cards)){
    hand.finished = true;
    messageEl.textContent = `Hand ${activeHandIndex+1} busted!`;
    nextPlayerHandOrDealer();
  } else {
    // If doubled previously, stand after the single card
    if(hand.doubled) {
      hand.finished = true;
      nextPlayerHandOrDealer();
    } else {
      enablePlayerActionsForActiveHand();
    }
  }
}

async function playerStand(){
  const hand = playerHands[activeHandIndex];
  hand.finished = true;
  nextPlayerHandOrDealer();
}

async function playerDouble(){
  const hand = playerHands[activeHandIndex];
  if(hand.cards.length !== 2) return;
  if(balance < hand.bet) { messageEl.textContent = 'Not enough balance to double.'; return; }
  // double bet, take one card, mark finished
  balance -= hand.bet;
  hand.bet *= 2;
  hand.doubled = true;
  updateBalanceDisplay();
  setButtons({hit:false, stand:false, double:false, split:false});
  messageEl.textContent = 'Doubling down — one card only.';
  const card = drawCard();
  hand.cards.push(card);
  await animateDeal(card,'player',activeHandIndex);
  updateHandBadges();
  if(isBusted(hand.cards)){
    hand.finished = true;
    messageEl.textContent = `Hand ${activeHandIndex+1} busted after double.`;
  } else {
    hand.finished = true;
  }
  nextPlayerHandOrDealer();
}

/* Split into two hands (only supports splitting once) */
async function playerSplit(){
  const hand = playerHands[activeHandIndex];
  if(hand.cards.length !== 2) return;
  if(hand.cards[0].rank !== hand.cards[1].rank) return;
  if(balance < hand.bet) { messageEl.textContent = 'Not enough balance to split.'; return; }
  // create two hands, each gets one of the cards
  const card1 = hand.cards[0];
  const card2 = hand.cards[1];
  const bet = hand.bet;
  // replace playerHands with two hands
  playerHands = [
    {cards: [card1], bet: bet, doubled:false, finished:false},
    {cards: [card2], bet: bet, doubled:false, finished:false}
  ];
  balance -= bet; // pay for second bet
  updateBalanceDisplay();
  // Visuals: clear player area and re-render placeholders
  clearTableVisuals();
  renderHandPlaceholders();
  // Need to animate new card to each hand (draw one card for each to finish initial deal)
  // Draw one card to first hand and one to second
  const cA = drawCard(); playerHands[0].cards.push(cA); await animateDeal(cA,'player',0,0);
  const cB = drawCard(); playerHands[1].cards.push(cB); await animateDeal(cB,'player',1,80);
  updateHandBadges();
  enablePlayerActionsForActiveHand();
  messageEl.textContent = 'Split — play Hand 1.';
}

/* Proceed to next player hand or run dealer actions */
async function nextPlayerHandOrDealer(){
  // find next unfinished hand
  const nextIndex = playerHands.findIndex((h, idx)=> !h.finished && idx > activeHandIndex);
  if(nextIndex !== -1){
    activeHandIndex = nextIndex;
    messageEl.textContent = `Now playing Hand ${activeHandIndex+1}`;
    enablePlayerActionsForActiveHand();
    return;
  }
  // check earlier hands before current (in case index >0)
  const earlier = playerHands.findIndex((h, idx)=> !h.finished && idx < activeHandIndex);
  if(earlier !== -1){
    activeHandIndex = earlier;
    messageEl.textContent = `Now playing Hand ${activeHandIndex+1}`;
    enablePlayerActionsForActiveHand();
    return;
  }

  // All player hands finished -> dealer plays
  setButtons({deal:false, hit:false, stand:false, double:false, split:false});
  await dealerPlay();
  resolveRound();
}

/* Dealer behavior: reveal hole card and hit until 17 or more. Dealer stands on soft 17. */
async function dealerPlay(){
  messageEl.textContent = 'Dealer\'s turn...';
  // reveal hole card visually (we already placed two dealer cards as static)
  // Dealer draws until bestHandValue >= 17, standing on all 17s
  await wait(600);
  while(true){
    const val = bestHandValue(dealerHand);
    if(val >= 17) break;
    // hit
    const card = drawCard();
    dealerHand.push(card);
    await animateDeal(card,'dealer',null,0);
    await wait(240);
  }
  updateHandBadges();
}

/* End-of-round resolution when player or dealer has initial blackjack */
function endRoundImmediate(playerBJ, dealerBJ){
  // Payout rules:
  // - If both have blackjack -> push (bet returned)
  // - Player BJ only -> payout 3:2
  // - Dealer BJ only -> player loses
  clearTableVisuals();
  // re-render static slots for clarity
  renderHandPlaceholders();
  // Put back dealt cards visually
  dealerHand.forEach((c, idx) => {
    const el = createCardElement(c);
    const pos = getHandSlotPosition(0, idx, true);
    animateCardTo(el, pos.x, pos.y, true, idx*80);
    setTimeout(()=>{ removeCardElement(el); const inSlot=document.createElement('div'); inSlot.className='card'; inSlot.innerHTML=c.rank+'<br>'+c.suit; dealerHandContainer.appendChild(inSlot); }, 360+idx*80);
  });
  playerHands[0].cards.forEach((c,idx)=>{
    const el=createCardElement(c);
    const pos=getHandSlotPosition(0, idx, false);
    animateCardTo(el,pos.x,pos.y,true,idx*80);
    setTimeout(()=>{ removeCardElement(el); const slots = playerHandsContainer.querySelectorAll('.slot'); if(slots[0]){ const inSlot=document.createElement('div'); inSlot.className='card'; inSlot.innerHTML=c.rank+'<br>'+c.suit; slots[0].appendChild(inSlot); } }, 360+idx*80);
  });

  setTimeout(()=>{
    if(playerBJ && dealerBJ){
      balance += playerHands[0].bet; // push, return bet
      messageEl.textContent = 'Both have Blackjack → Push.';
    } else if(playerBJ){
      // pays 3:2
      balance += Math.floor(playerHands[0].bet * 2.5); // return bet + 1.5x profit
      messageEl.textContent = 'Blackjack! You win 3:2.';
    } else {
      messageEl.textContent = 'Dealer has Blackjack. You lose.';
      // bet already deducted
    }
    updateBalanceDisplay();
    roundInProgress = false;
    setButtons({deal:true, hit:false, stand:false, double:false, split:false});
  }, 900);
}

/* Resolve round after both sides played */
function resolveRound(){
  // For each player hand determine outcome against dealer
  const dealerVal = bestHandValue(dealerHand);
  const dealerBusted = dealerVal > 21;
  playerHands.forEach(h=>{
    const hv = bestHandValue(h.cards);
    if(isBlackjack(h.cards) && !isBlackjack(dealerHand)){
      // blackjack scenario (only possible if split created blackjack? rare) - pay 3:2
      const payout = Math.floor(h.bet * 2.5);
      balance += payout;
      h.result = 'BLACKJACK';
    } else if(hv > 21){
      h.result = 'LOSE';
      // no payout
    } else if(dealerBusted){
      // player wins
      balance += h.bet * 2;
      h.result = 'WIN';
    } else {
      if(hv > dealerVal){
        balance += h.bet * 2;
        h.result = 'WIN';
      } else if(hv === dealerVal){
        // push
        balance += h.bet;
        h.result = 'PUSH';
      } else {
        h.result = 'LOSE';
      }
    }
  });

  // Update visuals and message summarizing results
  updateBalanceDisplay();
  let summary = playerHands.map((h, idx)=>`Hand ${idx+1}: ${h.result}`).join(' | ');
  messageEl.textContent = `Round over. ${summary}`;
  roundInProgress = false;
  setButtons({deal:true, hit:false, stand:false, double:false, split:false});
}

/* Utility wait */
function wait(ms){ return new Promise(res => setTimeout(res, ms)); }

/* ----- UI helpers ----- */
function updateBalanceDisplay(){
  balanceEl.textContent = balance;
  currentBetEl.textContent = baseBet;
}

/* Enable/Disable buttons quickly */
function setButtons({deal, hit, stand, double, split}){
  dealBtn.disabled = !deal;
  hitBtn.disabled = !hit;
  standBtn.disabled = !stand;
  doubleBtn.disabled = !double;
  splitBtn.disabled = !split;
}

/* Restart */
function restartGame(){
  balance = parseInt(startingBalanceInput.value) || 1000;
  baseBet = parseInt(betAmountInput.value) || 50;
  deck = createDeck(shoeSize);
  playerHands = [];
  dealerHand = [];
  activeHandIndex = 0;
  roundInProgress = false;
  updateBalanceDisplay();
  clearTableVisuals();
  messageEl.textContent = 'Game reset. Set bet and press Deal.';
  setButtons({deal:true, hit:false, stand:false, double:false, split:false});
}

/* Button bindings */
dealBtn.addEventListener('click', ()=> dealInitial());
hitBtn.addEventListener('click', ()=> playerHit());
standBtn.addEventListener('click', ()=> playerStand());
doubleBtn.addEventListener('click', ()=> playerDouble());
splitBtn.addEventListener('click', ()=> playerSplit());
restartBtn.addEventListener('click', ()=> restartGame());

/* Keep inputs synced */
startingBalanceInput.addEventListener('change', ()=>{
  const v = parseInt(startingBalanceInput.value) || 1000;
  balance = v;
  updateBalanceDisplay();
});
betAmountInput.addEventListener('change', ()=>{
  baseBet = parseInt(betAmountInput.value) || baseBet;
  currentBetEl.textContent = baseBet;
});

/* Start with init */
init();
