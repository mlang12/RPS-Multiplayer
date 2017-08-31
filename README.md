# Online Multiplayer Rock Paper Scissors (using Firebase)

This is the classic rock paper scissors game with a random person on the internet. There is chat functionality as well as a scoreboard and results for each round.

## Design Notes:
1. The user is automatically paired with another player (if there is open player) upon joining the game
2. The player will be deleted upon leaving the game, but the game results and chat histories persist after they disconnect
3. Chat rows are colored based on where the chat was generated (usr, opponent, system)
4. If user plays a hand will indicate the other player's status (waiting on ...)
5. If opponent plays a hand will indicate to user that it is their turn and other player has played
6. Starting a new round is done by clicking on which hand to play next - this automatically triggers reset of UI items
7. To disconnect from the current game the user must either refresh page or close page (at the moment)
8. A unique session ID is created when two players pair - this ID is used to listen for updates from the other player and allows for more than 2 people to play at a time on the web.
9. There is basic input validations on the username as well as the chat (to see if there is a recipient)




### Tech Used:
HTML, CSS, JavaScript, jQuery, Bootstrap, moment.js, Google Firebase, also utilized some Google fonts and a bootstrap theme.

### Live!
You can find a live deployed version here: [mindbrier.com/rps](https://mindbrier.com/rps)

