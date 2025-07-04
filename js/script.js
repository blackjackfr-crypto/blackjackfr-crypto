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
const bustRateEl= document.getElementById('bust-rate');
const toggleBtn = document.getElementById('toggle-count');
const countEl = document.getElementById('count-display');
const runCount = document.getElementById('running-count');

// --- Build & shuffle shoe of 5 decks ---
function buildShoe() {
shoe = [];
for(let d=0; d<5; d++){
for(const s of suits){
for(const r of ranks){
shoe.push({suit:s, rank:r.name, value:r.value});
}
}
}
shuffle(shoe);
}

function shuffle(a) {
for(let i=a.length-1;i>0;i--){
const j=Math.floor(Math.random()*(i+1));
[a[i],a[j]]=[a[j],a[i]];
}
}

// --- Draw & count ---
function drawCard(){
if(shoe.length===0){
buildShoe();
runningCount = 0;
}
const c = shoe.pop();
// Hi-Lo count
if(c.value>=2 && c.value<=6) runningCount++;
else if(c.value===10 || c.rank==='A') runningCount--;
runCount.textContent = runningCount;
return c;
}

// --- Hand utilities ---
function handValue(hand){
let sum=0, aces=0;
for(const c of hand){
sum+=c.value;
if(c.rank==='A') aces++;
}
while(aces>0 && sum+10<=21){
sum+=10;
aces--;
}
return sum;
}

function isBlackjack(hand){
return hand.length===2 && handValue(hand)===21;
}

function renderHand(container, hand, hideFirst=false){
container.innerHTML='';
hand.forEach((c,i)=>{
const cd = document.createElement('div');
cd.className='card';
cd.textContent = (i===0 && hideFirst)? '❓' : c.rank + c.suit;
container.appendChild(cd);
});
}

// --- Stats UI ---
function updateStats(){
const r = stats.rounds;
const w = stats.wins;
const b = stats.busts;
roundsEl.textContent = r;
winsEl.textContent = w;
bustsEl.textContent = b;
winRateEl.textContent = r? ((w/r)*100).toFixed(1) + '%' : '0%';
bustRateEl.textContent= r? ((b/r)*100).toFixed(1) + '%' : '0%';
}

// --- Deal a new round ---
function startRound(){
msgDiv.textContent = '';
if(shoe.length===0) buildShoe();
dealerHand = [];
playerHands = [[]];
currentHand = 0;
canDouble = true;
canSplit = true;

// Initial deal
dealerHand.push(drawCard());
playerHands[0].push(drawCard());
dealerHand.push(drawCard());
playerHands[0].push(drawCard());

render();
checkAutoEnd();
updateControls();
}

// --- Render both hands to UI ---
function render(){
// Dealer: hide hole if player turn
const hide = (playerHands[currentHand].length<=2 && !playerHandsFinished());
renderHand(dealerDiv, dealerHand, hide);

// Player area: support split
if(playerHands.length===1){
playerDiv.innerHTML = '';
renderHand(playerDiv, playerHands[0]);
} else {
// two hands side by side
playerDiv.innerHTML = '';
playerHands.forEach((h,i)=>{
const sub = document.createElement('div');
sub.className = 'cards';
if(i===currentHand) sub.style.border = '2px solid #d4af37';
h.forEach(c=>{
const cd = document.createElement('div');
cd.className='card';
cd.textContent = c.rank + c.suit;
sub.appendChild(cd);
});
playerDiv.appendChild(sub);
});
}
}

// --- Button logic ---
function updateControls(){
const hand = playerHands[currentHand];
const val = handValue(hand);
hitBtn.disabled = val>=21;
standBtn.disabled = false;
dblBtn.disabled = !canDouble;
splitBtn.disabled=!(canSplit && hand.length===2 && hand[0].value===hand[1].value);
}

// --- Check if auto-stand/auto-bust ---
function checkAutoEnd(){
const hand = playerHands[currentHand];
const val = handValue(hand);
if(isBlackjack(hand) || val>21){
setTimeout(stand, 500);
}
}

// --- Player actions ---
function hit(){
playerHands[currentHand].push(drawCard());
canDouble = false;
canSplit = false;
render();
const val = handValue(playerHands[currentHand]);
if(val>21){
stats.busts++;
stand();
} else {
updateControls();
}
}

function stand(){
// finish current hand
currentHand++;
canDouble = false;
canSplit = false;
if(currentHand < playerHands.length){
render();
updateControls();
} else {
dealerTurn();
}
}

function doubleDown(){
if(!canDouble) return;
playerHands[currentHand].push(drawCard());
stats.busts += handValue(playerHands[currentHand])>21 ? 1:0;
render();
stand();
}

function split(){
if(!canSplit) return;
const hand = playerHands[0];
playerHands = [[hand[0]],[hand[1]]];
// draw one to each
playerHands.forEach(h=>h.push(drawCard()));
canSplit = false;
render();
updateControls();
}

// --- Dealer logic & outcome ---
function dealerTurn(){
render();
// reveal and draw for dealer
while(handValue(dealerHand) < 17){
dealerHand.push(drawCard());
render();
}
// resolve all hands
const dVal = handValue(dealerHand);
playerHands.forEach(h=>{
const pVal = handValue(h);
let won = false;
if(pVal>21) won = false;
else if(dVal>21) won = true;
else if(pVal> dVal) won = true;
else won = false;
if(won) stats.wins++;
});
stats.rounds++;
updateStats();

// message
msgDiv.innerHTML = playerHands.map((h,i)=>{
const pVal = handValue(h);
let res = '';
if(pVal>21) res='Hand '+(i+1)+' bust';
else if(dVal>21) res='Hand '+(i+1)+' wins';
else if(pVal> dVal) res='Hand '+(i+1)+' wins';
else if(pVal===dVal) res='Hand '+(i+1)+' push';
else res='Hand '+(i+1)+' loses';
return res;
}).join(' | ');

// auto new round
setTimeout(startRound, 2000);
}

// --- Hand finished check ---
function playerHandsFinished(){
return currentHand >= playerHands.length;
}

// --- Events ---
hitBtn.addEventListener('click', hit);
standBtn.addEventListener('click', stand);
dblBtn.addEventListener('click', doubleDown);
splitBtn.addEventListener('click', split);
toggleBtn.addEventListener('click', ()=>{
countEl.style.display = countEl.style.display==='none'? 'block':'none';
});

// --- Init ---
buildShoe();
startRound();
