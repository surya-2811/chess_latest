import Player from '../game_models/players/Player';
import Room from '../game_models/rooms/Room';
import {User} from '../models/user';
//Game Rules
import FourGame from '../game_models/games/FourGame';
import Standard from '../game_models/games/Standard';
import CrazyHouse from '../game_models/games/CrazyHouse';
import SChess from '../game_models/games/SChess';
import FullhouseChess from '../game_models/games/FullhouseChess';
import QueueItem from './../game_models/matchmaking/QueueItem';

export default class Connection {
    private players: Player[];
    private rooms: Room[];
    private _queue: QueueItem[] = [];
    
    constructor(private io) {
        this.players = [];
        this.rooms = [];
        // create Global room on startup
        let global = this.createNewRoom(
            'Global',
            'four-player',
            {'value': 5, 'increment': 5},
            {'name': 'Global', 'private': false, 'voiceChat': false,
             'maxPlayers': 10000, 'roomMode': 'open-table', 'allowedPlayerIDs': []},
            null
        );
    }
    
    createNewRoom(roomName: string, gameType: string, time: any, roomObj: any, host: any): Room {
        let newRoomName;
        let roomCopyCounter = 1;
        let room: Room = this.getRoomByName(roomName);
        while (room) {
            // if a room with this name already exists,
            // add a (1) to the end of the name, then try (2), etc.
            if (roomCopyCounter > 1) {
                roomName = roomName.slice(0, -4);
            }
            newRoomName = `${roomName} (${roomCopyCounter++})`;
            roomName = newRoomName;
            room = this.getRoomByName(newRoomName);
        }
        roomObj.name = roomName;
        switch(gameType) {
            case 'standard':
                room = new Room(this.io, new Standard(this.io, roomName, time, this));
                break;
            case 'schess':
                room= new Room(this.io, new SChess(this.io, roomName, time, this));
                break;
            case 'four-player':
                room = new Room(this.io, new FourGame(this.io, roomName, time, this));
                break;
            case 'crazyhouse':
                room = new Room(this.io, new CrazyHouse(this.io, roomName, time, false, this));
                break;
            case 'crazyhouse960':
                room = new Room(this.io, new CrazyHouse(this.io, roomName, time, true, this));
                break;
            case 'fullhouse-chess':
                room = new Room(this.io, new FullhouseChess(this.io, roomName, time, this));
                break;
        }
        if (time) {
            room.time = time;
        }
        if (roomObj.roomMode === "match") {
            if (host) {
                room.addAllowedPlayerID(host._id);
            }
            if (roomObj.challengedPlayerUsername && roomObj.challengedPlayerId) {
                this.setChallengedPlayer(roomObj.challengedPlayerId, room);
            }
            
            let invitedPlayer: Player = this.getPlayerByPlayerId(roomObj.challengedPlayerId);
            let challenger: Player = this.getPlayerByPlayerId(host._id);
            
            //Check to see if the invitedPlayer is online
            if( invitedPlayer && invitedPlayer.socket &&
                challenger && challenger.username) {
                //Send the invitedPlayer an invitation to join the room
                invitedPlayer.socket.emit('new-challenge', {
                    roomName,
                    opponent: challenger.username,
                });
            }
        }
        room.setRoomAttributes(roomObj);
        this.addRoom(room);
        return room;
    }
    
    setChallengedPlayer(playerId, room): any {
        room.addAllowedPlayerID(playerId);
    }
    
    addRoom(roomObj: Room): void {
        this.rooms.push(roomObj);
    }
    
    getRoomById(id: number) {
        return this.rooms.find(room => room.id === id);
    }
    
    getRoomByName(roomName: string): Room {
        if(!roomName) {
            return null;
        }
        return this.rooms.find(room => room.name === roomName);
    }
    
    removeRoomByName(roomName: string): boolean {
        if(!roomName) {
            return false;
        }
        let roomRemoved = false;
        this.rooms = this.rooms.filter((room) => {
            if(room.name !== roomName) {
                return room;
            } else {
                
                room.clearTimer();
                if(room.game) {
                    room.game.killEngineInstance();
                }
                roomRemoved = true;
            }
        });
        
        return roomRemoved;
    }
    
    emitAllRooms() {
        //send a list of rooms to all members
        this.io.emit('all-rooms', this.getAllRooms());
    }
    
    getAllRooms() {
        if(!this.rooms) {
            return null;
        }
        let allRooms = this.rooms.map(room => room.getRoomCondensed());
        return allRooms;
    }
    
    getPlayerRoomsByPlayer(player: Player): Room[]{
        return this.rooms.filter(room => room.isPlayerInRoom(player));
    }
    
    addPlayer(player: Player):void {
        this.players.push(player);
        
        player.socket.emit('connected-user');
    }
    
    getPlayerBySocket(socket: any) : Player{
        if(!socket || !this.players) {
            return null;
        }
        return this.players.find(player => player.socket.id === socket.id);
    }
    
    getPlayerByPlayerId(userId: string) : Player {
        if(!userId) {
            return null;
        }
        return this.players.find(player => player.playerId === userId);
    }
    
    duplicateUser(playerId: string, ipaddress) {
        if(!this.players) {
            return false;
        }
        if (process.env.NODE_ENV !== "production") {
            // allow duplicate logins on dev servers for testing purposes
            return false;
        }
        return this.players.some(player => (player.playerId === playerId) );
    }
    
    updatePlayer(data) {
        //check to see if the player is in the player list
        this.players.map((player) => {
            if(player.playerId === data._id || player.playerId === data.playerId) {
                let status = player.username = data.username;
                player.standard_ratings = data.standard_ratings;
                player.fourplayer_ratings = data.fourplayer_ratings;
                player.crazyhouse_ratings = data.crazyhouse_ratings;
                player.crazyhouse960_ratings = data.crazyhouse960_ratings;
                player.fullhouse_ratings = data.fullhouse_ratings;
                return status;
            } 
        });
        
        this.rooms.map(room => {
            room.updatePlayer(data);
        });
    }
    
    
    //Remove a player from the room;
    removePlayer(playerId) {
        if(!playerId) {
            return false;
        }
        let foundPlayer = false;
        this.players = this.players.filter((player) => {
            if(player.playerId !== playerId) {
                return player;
            } else {
                foundPlayer = true;
            }
        })
        
        return foundPlayer;
    }
    
    //remove a player by their socket obj
    removePlayerBySocket(playerSocket) {
        if(!playerSocket) {
            return false;
        }
        let foundPlayer = false;
        this.players = this.players.filter((player) => {
            if(player.socket._id !== playerSocket.id) {
                return player;
            } else {
                foundPlayer = true;
            }
        })
        
        return foundPlayer;
    }
    
    getPlayers() {
        return this.players;
    }
    
    getNumberOfPlayers() {
        return this.players.length;
    }
    
    addQueueItem(entry: QueueItem) {
        this._queue.push(entry);
    }
    
    removeQueueEntryAtIndex(i: number) {
        this._queue.splice(i, 1);
    }
    
    removePlayerFromQueue(player: Player) {
        
        let index: number = null;
        
        this._queue.map( (entry: QueueItem, i: number) => {
            if(entry.player.playerId === player.playerId) {
                index = i;
            } 
        });
        
        if(index !== null) {
            this.removeQueueEntryAtIndex(index);
        }
    }
    
    printQueue(): void {
        if(this._queue.length === 0) {
            console.log('empty queue');
        }
        
        this._queue.map( (entry: QueueItem, i: number) => {
            console.log(entry.print());
        });
        
        console.log();
    }
    
    get queue() : QueueItem[] {
        return this._queue;
    }
}