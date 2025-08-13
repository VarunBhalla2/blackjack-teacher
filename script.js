/**
 * Blackjack Educational Simulator
 * A complete implementation of blackjack rules for learning purposes
 */

class BlackjackGame {
    constructor() {
        // Game state
        this.deck = [];
        this.playerHand = [];
        this.dealerHand = [];
        this.splitHand = [];
        this.currentHand = 'main'; // 'main' or 'split'
        this.gameInProgress = false;
        this.dealerRevealed = false;
        this.hasSplit = false;
        this.mainHandComplete = false;
        this.splitHandComplete = false;
        
        // Statistics
        this.stats = {
            wins: 0,
            losses: 0,
            draws: 0
        };
        
        // Card configuration
        this.suits = ['♠', '♥', '♦', '♣'];
        this.ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        this.values = {
            'A': 11, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7,
            '8': 8, '9': 9, '10': 10, 'J': 10, 'Q': 10, 'K': 10
        };
        
        // Initialize
        this.loadStats();
        this.createDeck();
    }
    
    /**
     * Creates and shuffles a new deck of cards
     */
    createDeck() {
        this.deck = [];
        for (let suit of this.suits) {
            for (let rank of this.ranks) {
                this.deck.push({
                    suit: suit,
                    rank: rank,
                    value: this.values[rank]
                });
            }
        }
        this.shuffleDeck();
    }
    
    /**
     * Shuffles the deck using Fisher-Yates algorithm
     */
    shuffleDeck() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }
    
    /**
     * Calculates the value of a hand, properly handling Aces
     * @param {Array} hand - Array of card objects
     * @returns {number} - The best value of the hand
     */
    calculateHandValue(hand) {
        let value = 0;
        let aces = 0;
        
        // Sum up card values and count aces
        for (let card of hand) {
            value += card.value;
            if (card.rank === 'A') aces++;
        }
        
        // Adjust for aces (convert from 11 to 1 if needed)
        while (value > 21 && aces > 0) {
            value -= 10;
            aces--;
        }
        
        return value;
    }
    
    /**
     * Checks if a hand is a blackjack (21 with 2 cards)
     * @param {Array} hand - Array of card objects
     * @returns {boolean}
     */
    isBlackjack(hand) {
        return hand.length === 2 && this.calculateHandValue(hand) === 21;
    }
    
    /**
     * Creates a card element for display
     * @param {Object} card - Card object with suit, rank, value
     * @param {boolean} faceDown - Whether the card should be face down
     * @returns {HTMLElement} - The card DOM element
     */
    createCardElement(card, faceDown = false) {
        const cardDiv = document.createElement('div');
        
        if (faceDown) {
            cardDiv.className = 'card face-down';
            return cardDiv;
        }
        
        const isRed = card.suit === '♥' || card.suit === '♦';
        cardDiv.className = `card ${isRed ? 'red' : 'black'}`;
        
        // Add corner ranks
        const topLeft = document.createElement('div');
        topLeft.className = 'corner-rank top-left';
        topLeft.textContent = card.rank + card.suit;
        
        const bottomRight = document.createElement('div');
        bottomRight.className = 'corner-rank bottom-right';
        bottomRight.textContent = card.rank + card.suit;
        
        // Add center rank and suit
        const rankDiv = document.createElement('div');
        rankDiv.className = 'card-rank';
        rankDiv.textContent = card.rank;
        
        const suitDiv = document.createElement('div');
        suitDiv.className = 'card-suit';
        suitDiv.textContent = card.suit;
        
        cardDiv.appendChild(topLeft);
        cardDiv.appendChild(bottomRight);
        cardDiv.appendChild(rankDiv);
        cardDiv.appendChild(suitDiv);
        
        return cardDiv;
    }
    
    /**
     * Updates the display of all cards and values
     */
    updateDisplay() {
        // Clear card areas
        document.getElementById('playerCards').innerHTML = '';
        document.getElementById('dealerCards').innerHTML = '';
        document.getElementById('splitCards').innerHTML = '';
        
        // Display player's main hand
        this.playerHand.forEach(card => {
            document.getElementById('playerCards').appendChild(
                this.createCardElement(card)
            );
        });
        
        // Display dealer's hand
        this.dealerHand.forEach((card, index) => {
            const shouldHide = index === 1 && !this.dealerRevealed;
            document.getElementById('dealerCards').appendChild(
                this.createCardElement(card, shouldHide)
            );
        });
        
        // Display split hand if exists
        if (this.hasSplit) {
            document.getElementById('splitSection').classList.remove('hidden');
            this.splitHand.forEach(card => {
                document.getElementById('splitCards').appendChild(
                    this.createCardElement(card)
                );
            });
        } else {
            document.getElementById('splitSection').classList.add('hidden');
        }
        
        // Update hand values
        this.updateHandValues();
    }
    
    /**
     * Updates the displayed hand values
     */
    updateHandValues() {
        // Player main hand value
        if (this.playerHand.length > 0) {
            const value = this.calculateHandValue(this.playerHand);
            const isBust = value > 21;
            const isBlackjack = this.isBlackjack(this.playerHand);
            
            let displayValue = value;
            if (isBlackjack) displayValue = 'Blackjack!';
            else if (isBust) displayValue = `${value} (Bust)`;
            
            document.getElementById('playerValue').textContent = displayValue;
        } else {
            document.getElementById('playerValue').textContent = '-';
        }
        
        // Split hand value
        if (this.hasSplit && this.splitHand.length > 0) {
            const value = this.calculateHandValue(this.splitHand);
            const isBust = value > 21;
            
            let displayValue = value;
            if (isBust) displayValue = `${value} (Bust)`;
            
            document.getElementById('splitValue').textContent = displayValue;
        }
        
        // Dealer hand value
        if (this.dealerHand.length > 0) {
            if (this.dealerRevealed) {
                const value = this.calculateHandValue(this.dealerHand);
                const isBust = value > 21;
                const isBlackjack = this.isBlackjack(this.dealerHand);
                
                let displayValue = value;
                if (isBlackjack) displayValue = 'Blackjack!';
                else if (isBust) displayValue = `${value} (Bust)`;
                
                document.getElementById('dealerValue').textContent = displayValue;
            } else {
                // Show only visible card value
                document.getElementById('dealerValue').textContent = this.dealerHand[0].value;
            }
        } else {
            document.getElementById('dealerValue').textContent = '-';
        }
    }
    
    /**
     * Deals initial cards to start a new round
     */
    dealInitialCards() {
        // Reset game state
        this.playerHand = [];
        this.dealerHand = [];
        this.splitHand = [];
        this.currentHand = 'main';
        this.gameInProgress = true;
        this.dealerRevealed = false;
        this.hasSplit = false;
        this.mainHandComplete = false;
        this.splitHandComplete = false;
        
        // Check if deck needs reshuffling
        if (this.deck.length < 15) {
            this.createDeck();
        }
        
        // Deal cards (player-dealer-player-dealer)
        this.playerHand.push(this.deck.pop());
        this.dealerHand.push(this.deck.pop());
        this.playerHand.push(this.deck.pop());
        this.dealerHand.push(this.deck.pop());
        
        // Update display
        this.updateDisplay();
        
        // Check for blackjacks
        const playerBJ = this.isBlackjack(this.playerHand);
        const dealerBJ = this.isBlackjack(this.dealerHand);
        
        if (playerBJ || dealerBJ) {
            this.dealerRevealed = true;
            this.updateDisplay();
            
            if (playerBJ && dealerBJ) {
                this.endGame('draw', 'Both have Blackjack!');
            } else if (playerBJ) {
                this.endGame('blackjack', 'BLACKJACK!');
            } else {
                this.endGame('lose', 'Dealer Blackjack!');
            }
            return;
        }
        
        // Enable appropriate buttons
        this.updateButtons();
    }
    
    /**
     * Player hits (takes another card)
     */
    hit() {
        if (!this.gameInProgress) return;
        
        // Add card to current hand
        if (this.currentHand === 'main' && !this.mainHandComplete) {
            this.playerHand.push(this.deck.pop());
        } else if (this.currentHand === 'split' && !this.splitHandComplete) {
            this.splitHand.push(this.deck.pop());
        }
        
        this.updateDisplay();
        
        // Check for bust
        const currentHandCards = this.currentHand === 'main' ? this.playerHand : this.splitHand;
        const value = this.calculateHandValue(currentHandCards);
        
        if (value > 21) {
            if (this.hasSplit) {
                if (this.currentHand === 'main') {
                    this.mainHandComplete = true;
                    this.showMessage('Main hand bust!', 'lose');
                    
                    // Move to split hand if not complete
                    if (!this.splitHandComplete) {
                        this.currentHand = 'split';
                        setTimeout(() => this.hideMessage(), 2000);
                    } else {
                        this.checkSplitResults();
                    }
                } else {
                    this.splitHandComplete = true;
                    this.showMessage('Split hand bust!', 'lose');
                    setTimeout(() => this.checkSplitResults(), 2000);
                }
            } else {
                this.dealerRevealed = true;
                this.updateDisplay();
                this.endGame('lose', 'BUST! You Lose!');
            }
        } else if (value === 21) {
            // Auto-stand on 21
            this.stand();
        }
        
        this.updateButtons();
    }
    
    /**
     * Player stands (keeps current hand)
     */
    stand() {
        if (!this.gameInProgress) return;
        
        if (this.hasSplit) {
            if (this.currentHand === 'main') {
                this.mainHandComplete = true;
                
                // Move to split hand if not complete
                if (!this.splitHandComplete) {
                    this.currentHand = 'split';
                    this.showMessage('Playing split hand...', 'info');
                    setTimeout(() => this.hideMessage(), 1500);
                } else {
                    this.dealerPlay();
                }
            } else {
                this.splitHandComplete = true;
                this.dealerPlay();
            }
        } else {
            this.dealerPlay();
        }
        
        this.updateButtons();
    }
    
    /**
     * Player doubles down (double bet, take one card, and stand)
     */
    doubleDown() {
        if (!this.gameInProgress) return;
        
        // Take one card
        if (this.currentHand === 'main') {
            this.playerHand.push(this.deck.pop());
        } else {
            this.splitHand.push(this.deck.pop());
        }
        
        this.updateDisplay();
        
        // Check for bust
        const currentHandCards = this.currentHand === 'main' ? this.playerHand : this.splitHand;
        const value = this.calculateHandValue(currentHandCards);
        
        if (value > 21) {
            if (this.hasSplit) {
                if (this.currentHand === 'main') {
                    this.mainHandComplete = true;
                    this.showMessage('Main hand bust!', 'lose');
                    
                    if (!this.splitHandComplete) {
                        this.currentHand = 'split';
                        setTimeout(() => this.hideMessage(), 2000);
                    } else {
                        this.checkSplitResults();
                    }
                } else {
                    this.splitHandComplete = true;
                    this.showMessage('Split hand bust!', 'lose');
                    setTimeout(() => this.checkSplitResults(), 2000);
                }
            } else {
                this.dealerRevealed = true;
                this.updateDisplay();
                this.endGame('lose', 'BUST! You Lose!');
            }
        } else {
            // Auto-stand after double down
            this.stand();
        }
    }
    
    /**
     * Player splits their hand (when having two cards of same rank)
     */
    split() {
        if (!this.gameInProgress || this.playerHand.length !== 2) return;
        
        // Move second card to split hand
        this.splitHand = [this.playerHand.pop()];
        this.hasSplit = true;
        
        // Deal one card to each hand
        this.playerHand.push(this.deck.pop());
        this.splitHand.push(this.deck.pop());
        
        // Check for aces - if splitting aces, typically only one card per hand
        const isAces = this.playerHand[0].rank === 'A';
        if (isAces) {
            this.mainHandComplete = true;
            this.splitHandComplete = true;
            this.dealerPlay();
        }
        
        this.updateDisplay();
        this.updateButtons();
    }
    
    /**
     * Dealer plays their hand according to standard rules
     */
    dealerPlay() {
        this.dealerRevealed = true;
        this.updateDisplay();
        
        const playDealer = () => {
            const dealerValue = this.calculateHandValue(this.dealerHand);
            
            // Dealer must hit on 16 and below, stand on 17 and above
            if (dealerValue < 17) {
                this.dealerHand.push(this.deck.pop());
                this.updateDisplay();
                
                // Continue dealing with animation delay
                setTimeout(playDealer, 600);
            } else {
                // Dealer is done, determine winner
                if (this.hasSplit) {
                    this.checkSplitResults();
                } else {
                    this.determineWinner();
                }
            }
        };
        
        setTimeout(playDealer, 600);
    }
    
    /**
     * Checks results for split hands
     */
    checkSplitResults() {
        const dealerValue = this.calculateHandValue(this.dealerHand);
        const mainValue = this.calculateHandValue(this.playerHand);
        const splitValue = this.calculateHandValue(this.splitHand);
        
        let mainResult = '';
        let splitResult = '';
        let totalWins = 0;
        let totalLosses = 0;
        let totalDraws = 0;
        
        // Check main hand
        if (mainValue > 21) {
            mainResult = 'Bust';
            totalLosses++;
        } else if (dealerValue > 21) {
            mainResult = 'Win';
            totalWins++;
        } else if (mainValue > dealerValue) {
            mainResult = 'Win';
            totalWins++;
        } else if (mainValue < dealerValue) {
            mainResult = 'Lose';
            totalLosses++;
        } else {
            mainResult = 'Draw';
            totalDraws++;
        }
        
        // Check split hand
        if (splitValue > 21) {
            splitResult = 'Bust';
            totalLosses++;
        } else if (dealerValue > 21) {
            splitResult = 'Win';
            totalWins++;
        } else if (splitValue > dealerValue) {
            splitResult = 'Win';
            totalWins++;
        } else if (splitValue < dealerValue) {
            splitResult = 'Lose';
            totalLosses++;
        } else {
            splitResult = 'Draw';
            totalDraws++;
        }
        
        // Update stats
        this.stats.wins += totalWins;
        this.stats.losses += totalLosses;
        this.stats.draws += totalDraws;
        this.saveStats();
        this.updateStatsDisplay();
        
        // Show results
        const message = `Main: ${mainResult} | Split: ${splitResult}`;
        let messageType = 'draw';
        if (totalWins > totalLosses) messageType = 'win';
        else if (totalLosses > totalWins) messageType = 'lose';
        
        this.endGame(messageType, message);
    }
    
    /**
     * Determines the winner of the round
     */
    determineWinner() {
        const playerValue = this.calculateHandValue(this.playerHand);
        const dealerValue = this.calculateHandValue(this.dealerHand);
        
        if (dealerValue > 21) {
            this.endGame('win', 'Dealer Bust! You Win!');
        } else if (playerValue > dealerValue) {
            this.endGame('win', 'You Win!');
        } else if (dealerValue > playerValue) {
            this.endGame('lose', 'You Lose!');
        } else {
            this.endGame('draw', 'Push! It\'s a Draw!');
        }
    }
    
    /**
     * Ends the game and displays result
     * @param {string} result - 'win', 'lose', 'draw', or 'blackjack'
     * @param {string} message - Message to display
     */
    endGame(result, message) {
        this.gameInProgress = false;
        
        // Update statistics (except for split hands which are handled separately)
        if (!this.hasSplit) {
            if (result === 'win' || result === 'blackjack') {
                this.stats.wins++;
            } else if (result === 'lose') {
                this.stats.losses++;
            } else if (result === 'draw') {
                this.stats.draws++;
            }
            this.saveStats();
            this.updateStatsDisplay();
        }
        
        // Show message
        this.showMessage(message, result);
        
        // Update buttons
        this.updateButtons();
        
        // Auto-hide message after delay
        setTimeout(() => this.hideMessage(), 3000);
    }
    
    /**
     * Shows a message on screen
     * @param {string} text - Message text
     * @param {string} type - Message type for styling
     */
    showMessage(text, type) {
        const messageDiv = document.getElementById('gameMessage');
        messageDiv.textContent = text;
        messageDiv.className = `game-message ${type}`;
    }
    
    /**
     * Hides the message
     */
    hideMessage() {
        document.getElementById('gameMessage').classList.add('hidden');
    }
    
    /**
     * Updates button states based on game state
     */
    updateButtons() {
        const dealBtn = document.getElementById('dealBtn');
        const hitBtn = document.getElementById('hitBtn');
        const standBtn = document.getElementById('standBtn');
        const doubleBtn = document.getElementById('doubleBtn');
        const splitBtn = document.getElementById('splitBtn');
        
        if (this.gameInProgress) {
            dealBtn.disabled = true;
            
            // Check current hand status
            const isCurrentHandActive = (this.currentHand === 'main' && !this.mainHandComplete) ||
                                       (this.currentHand === 'split' && !this.splitHandComplete);
            
            hitBtn.disabled = !isCurrentHandActive;
            standBtn.disabled = !isCurrentHandActive;
            
            // Double down only on first two cards
            const currentHandCards = this.currentHand === 'main' ? this.playerHand : this.splitHand;
            doubleBtn.disabled = !isCurrentHandActive || currentHandCards.length !== 2;
            
            // Split only on initial hand with matching ranks
            splitBtn.disabled = true;
            if (!this.hasSplit && this.playerHand.length === 2 && 
                this.playerHand[0].rank === this.playerHand[1].rank) {
                splitBtn.disabled = false;
            }
        } else {
            dealBtn.disabled = false;
            hitBtn.disabled = true;
            standBtn.disabled = true;
            doubleBtn.disabled = true;
            splitBtn.disabled = true;
        }
    }
    
    /**
     * Resets the entire game
     */
    resetGame() {
        this.stats = { wins: 0, losses: 0, draws: 0 };
        this.saveStats();
        this.updateStatsDisplay();
        
        this.playerHand = [];
        this.dealerHand = [];
        this.splitHand = [];
        this.gameInProgress = false;
        this.hasSplit = false;
        
        this.updateDisplay();
        this.updateButtons();
        this.hideMessage();
        
        this.createDeck();
    }
    
    /**
     * Saves statistics to localStorage
     */
    saveStats() {
        localStorage.setItem('blackjackStats', JSON.stringify(this.stats));
    }
    
    /**
     * Loads statistics from localStorage
     */
    loadStats() {
        const saved = localStorage.getItem('blackjackStats');
        if (saved) {
            this.stats = JSON.parse(saved);
            this.updateStatsDisplay();
        }
    }
    
    /**
     * Updates the statistics display
     */
    updateStatsDisplay() {
        document.getElementById('wins').textContent = this.stats.wins;
        document.getElementById('losses').textContent = this.stats.losses;
        document.getElementById('draws').textContent = this.stats.draws;
    }
}

// Initialize game when page loads
let game;
document.addEventListener('DOMContentLoaded', () => {
    game = new BlackjackGame();
});