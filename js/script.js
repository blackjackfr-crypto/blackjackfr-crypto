document.addEventListener('DOMContentLoaded', () => {
// --- Setup ---
const suits = ['♠','♥','♦','♣'];
const ranks = [
{ name:'A', value:1 },
{ name:'2', value:2 },
{ name:'3', value:3 },
{ name:'4', value:4 },
{ name:'5', value:5 },
{ name:'6', value:6 },
{ name:'7', value:7 },
{ name:'8', value:8 },
{ name:'9', value:9 },
{ name:'10', value:10 },
{ name:'J', value:10 },
{ name:'Q', value:10 },
{ name:'K', value:10 }
];

let shoe = [], runningCount = 0;
const stats = { rounds:0, wins:0, busts:0 };

let dealerHand = [], playerHands = [], currentHand = 0;
let canDouble, canSplit;

// --- DOM refs ---
const dealerDiv = document.getElementById('dealer-cards');
const playerDiv = document.getElementById('player-cards');
const hitBtn = document.getElementById('hit-btn');
const standBtn = document.getElementById('stand-btn');
const dblBtn = document.getElementById('double-btn');
const splitBtn = document.getElementById('split-btn');
const msgDiv = document.getElementById('message');
const roundsEl = document.getElementById('rounds');
const winsEl = document.getElementById('wins');
const bustsEl = document.getElementById('busts');
const winRateEl = document.getElementById('win-rate');
const bustRateEl = document.getElementById('bust-rate');
const resetBtn = document.getElementById('reset-stats');
const toggleBtn = document.getElementById('toggle-count');
const countEl = document.getElementById('count-display');
const runCount = document.getElementById('running-count');
const shoeCountEl = document.getElementById('shoe-count');

// --- Build & shuffle shoe of 5 decks ---
function buildShoe() {
shoe = [];
for (let d=0; d<5; d++) {
for (const s of suits) {
for (const r of ranks) {
shoe.push({ suit: s, rank: r.name, value: r.value });
}
}
}
shuffle(shoe);
updateShoeDisplay();
}

function shuffle(a) {
for (let i = a.length - 1; i > 0; i--) {
const j = Math.floor(Math.random() * (i + 1));
[a[i], a[j]] = [a[j], a[i]];
}
}

// --- Shoe display ---
function updateShoeDisplay() {
shoeCountEl.textContent = shoe.length;
}

// --- Draw & count ---
function drawCard() {
if (shoe.length === 0) {
buildShoe();
runningCount = 0;
}
const c = shoe.pop();
updateShoeDisplay();

// Hi-Lo counting
if (c.value >= 2 && c.value <= 6) runningCount++;
else if (c.value === 10 || c.rank === 'A') runningCount--;
runCount.textContent = runningCount;

return c;
}

// --- Hand utilities ---
function handValue(hand) {
let sum = 0, aces = 0;
for (const c of hand) {
sum += c.value;
if (c.rank === 'A') aces++;
}
while (aces > 0 && sum + 10 <= 21) {
sum += 10;
aces--;
}
return sum;
}

function isBlackjack(hand) {
return hand.length === 2 && handValue(hand) === 21;
}

// --- Render a hand into a container ---
function renderHand(container, hand, hideFirst = false) {
container.innerHTML = '';
hand.forEach((c, i) => {
const cd = document.createElement('div');
cd.classList.add('card');
// back‐side?
if (i === 0 && hideFirst) {
cd.classList.add('back');
} else {
// suit class for coloring
if (c.suit === '♥' || c.suit === '♦') {
cd.classList.add('hearts');
} else {
cd.classList.add('spades');
}
// corners
const top = document.createElement('span');
top.className = 'corner top';
top.textContent = c.rank + c.suit;
const bottom = document.createElement('span');
bottom.className = 'corner bottom';
bottom.textContent = c.rank + c.suit;
const suitMid = document.createElement('span');
suitMid.className = 'suit';
suitMid.textContent = c.suit;
cd.append(top, bottom, suitMid);
}
container.appendChild(cd);
});
}

// --- Stats UI ---
function updateStats() {
const r = stats.rounds, w = stats.wins, b = stats.busts;
roundsEl.textContent = r;
winsEl.textContent = w;
bustsEl.textContent = b;
winRateEl.textContent = r ? ((w / r) * 100).toFixed(1) + '%' : '0%';
bustRateEl.textContent = r ? ((b / r) * 100).toFixed(1) + '%' : '0%';
}

function resetStats() {
stats.rounds = stats.wins = stats.busts = 0;
updateStats();
}

// --- Deal a new round ---
function startRound() {
msgDiv.textContent = '';
if (shoe.length === 0) buildShoe();

dealerHand = [];
playerHands = [[]];
currentHand = 0;
canDouble = true;
canSplit = true;

// initial two‐card deal
dealerHand.push(drawCard());
playerHands[0].push(drawCard());
dealerHand.push(drawCard());
playerHands[0].push(drawCard());

render();
checkAutoEnd();
updateControls();
}

function render() {
const hideDealer = !playerHandsFinished() && playerHands[currentHand].length <= 2;
renderHand(dealerDiv, dealerHand, hideDealer);

// multiple split hands?
if (playerHands.length === 1) {
playerDiv.innerHTML = '';
renderHand(playerDiv, playerHands[0]);
} else {
playerDiv.innerHTML = '';
playerHands.forEach((h, idx) => {
const sub = document.createElement('div');
sub.className = 'cards';
if (idx === currentHand) sub.style.border = '2px solid #d4af37';
renderHand(sub, h, false);
playerDiv.appendChild(sub);
});
}
}

function updateControls() {
const hand = playerHands[currentHand];
const val = handValue(hand);
hitBtn.disabled = val >= 21;
standBtn.disabled = false;
dblBtn.disabled = !canDouble;
splitBtn.disabled = !(canSplit && hand.length === 2 && hand[0].value === hand[1].value);
}

function checkAutoEnd() {
const hand = playerHands[currentHand];
const val = handValue(hand);
if (isBlackjack(hand) || val > 21) {
setTimeout(stand, 300);
}
}

// --- Player actions ---
function hit() {
playerHands[currentHand].push(drawCard());
canDouble = false;
canSplit = false;
render();
const val = handValue(playerHands[currentHand]);
if (val > 21) {
stats.busts++;
stand();
} else {
updateControls();
}
}

function stand() {
currentHand++;
canDouble = false;
canSplit = false;
if (currentHand < playerHands.length) {
render();
updateControls();
} else {
dealerTurn();
}
}

function doubleDown() {
if (!canDouble) return;
playerHands[currentHand].push(drawCard());
if (handValue(playerHands[currentHand]) > 21) stats.busts++;
render();
stand();
}

function split() {
if (!canSplit) return;
const h = playerHands[0];
playerHands = [[h[0]], [h[1]]];
playerHands.forEach(hand => hand.push(drawCard()));
canSplit = false;
render();
updateControls();
}

// --- Dealer & resolution ---
function dealerTurn() {
render();
while (handValue(dealerHand) < 17) {
dealerHand.push(drawCard());
render();
}

const dVal = handValue(dealerHand);
playerHands.forEach(h => {
const pVal = handValue(h);
let won = false;
if (pVal > 21) won = false;
else if (dVal > 21) won = true;
else if (pVal > dVal) won = true;
if (won) stats.wins++;
});
stats.rounds++;
updateStats();

msgDiv.innerHTML = playerHands
.map((h,i) => {
const pVal = handValue(h);
if (pVal > 21) return `Hand ${i+1}: bust`;
if (dVal > 21) return `Hand ${i+1}: win`;
if (pVal > dVal) return `Hand ${i+1}: win`;
if (pVal === dVal) return `Hand ${i+1}: push`;
return `Hand ${i+1}: lose`;
})
.join(' &nbsp;|&nbsp; ');

setTimeout(startRound, 1500);
}

function playerHandsFinished() {
return currentHand >= playerHands.length;
}

// --- Event wiring ---
hitBtn.addEventListener('click', hit);
standBtn.addEventListener('click', stand);
dblBtn.addEventListener('click', doubleDown);
splitBtn.addEventListener('click', split);
toggleBtn.addEventListener('click', () => {
countEl.style.display = countEl.style.display === 'none' ? 'block' : 'none';
});
resetBtn.addEventListener('click', resetStats);

// --- Init ---
buildShoe();
startRound();
});
