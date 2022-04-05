import Engine from './Engine';
import Room from '../game_models/rooms/Room';
import Connection from '../sockets/Connection';
import Game from '../game_models/games/Game';

const {ab2str} = require('../utils/utils');

export default class FourEngine extends Engine {
    constructor(roomName: string, connection: Connection) {
        super('fourengine', roomName, connection, false);
        this.setDepth(6);
        this.turn = 'w';
    }
    onBestMove(data) {
        var str = ab2str(data);
        if(str.indexOf("bestmove") !== -1) {
            let score = null, pv = null;
            
            let turn = null;
            
            switch(this.turn) {
                case 'w':
                    turn = 'white';
                    break;
                case 'b':
                    turn = 'black';
                    break;
                case 'g':
                    turn = 'gold';
                    break;
                case 'r':
                    turn = 'red';
                    break;
            }

            // move format: e2-e3
            let moveMatch = str.match(/bestmove ([a-n]\d+\-[a-n]\d+)/i);
            if (moveMatch == null || typeof moveMatch[1] === "undefined")
                return;
            let moveString = moveMatch[1];
            let moveSplit = moveString.split('-');
            let compMove = {
                from: moveSplit[0],
                to: moveSplit[1],
                promotion: 'q'
            };

            // console.log("FourEngine move:", compMove);
            
            let roomName = this.roomName;
            let room: Room = this.connection.getRoomByName(roomName);
            if(!room) {
                return;
            }
            let game: Game = room.game;
            let move = data.move;
            setTimeout(() => {
                room.makeMove(compMove, Date.now());
            }, 400);
            
            
            return;
        }
    }
    
    setPosition(fen) {
        if(this.engine) {
            this.engine.stdin.write(
                "position fen " + fen.split('-')[0] + "\n"
            );
        }
        
    }
    
    setTurn(turnColor) {
        this.turn = turnColor;
        let turn = this.colorToTurnNumber(turnColor);
        if(this.engine) {
            this.engine.stdin.write("turn "+ turn + "\n");
        }
    }
    
    setOut(colorOut) {
        let out = this.colorToTurnNumber(colorOut);
        if(this.engine) {
            this.engine.stdin.write("out " + out + "\n");
        }
        this.numOut += 1;
    }
    
    adjustDepth(timeLeft, level) {
        let depth = this.depth;
        switch(level) {
            case 1:
                depth = 3;
                break;
            case 5:
                depth = 4;
                break;
            case 10:
                depth = 4;
                break;
            case 15:
                depth = 5;
                break;
            case 20:
                depth = 6;
                break;
        }
        if (timeLeft < 1000) { // 1 second
            depth = Math.min(1, depth);
        } else if (timeLeft < 2000) { // 2 seconds
            depth = Math.min(2, depth);
        } else if (timeLeft < 3000) { // 3 seconds
            depth = Math.min(3, depth);
        } else if (timeLeft < 10000) { // 10 seconds
            depth = Math.min(4, depth);
        } else if (timeLeft < 120000) { // 2 mins
            depth = Math.min(5, depth);
        }
		return depth;
    }
    
    go(timeLeft, level) {
        this.timeLeft = timeLeft;
        let depth = this.depth;
        depth = this.adjustDepth(timeLeft, level);
        if(this.mode == 0) {
            // console.log("[FourEngine "+this.roomName+"]", "skill level:", level, "depth:", depth);
            if (this.engine) this.engine.stdin.write("go depth " + depth + "\n");
        } else {
            let goString = "go " + "depth 4" + "\n";
            if(this.engine) this.engine.stdin.write(goString);
        }
        
    }
}
