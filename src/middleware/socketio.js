// import createSocketIoMiddleware from 'redux-socket.io';
import io from 'socket.io-client';
import Notifications from 'react-notification-system-redux';
import {production, staging, local} from '../../config/config';

let socket = null;

export function socketIoMiddleware(store) {
    
    return next => action => {
        const result = next(action);
        if(!socket) {
            return;
        }

        switch(action.type) {
            case 'server/connected-user': 
                let profile = store.getState().auth.profile;
                socket.emit('connected-user', profile);
                break;
            case 'server/update-user':
                socket.emit('update-user', action.payload);
                break;
            case 'server/create-room':
                if(action.payload.room && action.payload.room.challengedPlayerUsername) {
                    action.payload.room.challengedPlayerId = store.getState().userSearch.selectedId;
                }
                socket.emit('create-room', action.payload);
                break;
            case 'server/join-room':
                socket.emit('join-room', action.payload);
                break;
            case 'server/leave-room':
                socket.emit('leave-room', action.payload);
                break;
            case 'server/new-message':
                socket.emit('new-message', action.payload);
                break;
            case 'server/sit-down-board':
                socket.emit('sit-down-board', action.payload);
                break;
            case 'server/new-move':
                socket.emit('new-move', action.payload);
                break;
            case 'server/four-new-move':
                socket.emit('four-new-move', action.payload);
                break;
            case 'server/four-resign':
                socket.emit('four-resign', action.payload);
                break;
            case 'server/draw':
                socket.emit('draw', action.payload);
                break;
            case 'server/accept-draw':
                socket.emit('accept-draw', action.payload);
                break;
            case 'server/resign':
                socket.emit('resign', action.payload);
                break;
            case 'server/abort':
                socket.emit('abort', action.payload);
                break;
            case 'server/logout':
                socket.emit('logout', action.payload);
                break;
            case 'server/remove-ai-player':
                socket.emit('remove-ai-player', action.payload);
                break;
            case 'server/kill-ais':
                socket.emit('kill-ais', action.payload);
                break;
            case 'server/pair-me':
                socket.emit('pair-me', action.payload);
                break;
            case 'server/stop-pairing':
                socket.emit('stop-pairing');
                break;
            case 'server/rematch-offer':
                socket.emit('rematch-offer', action.payload);
                break;
            case 'server/rematch-accept':
                socket.emit('rematch-accept', action.payload);
                break;
            case 'server/rematch-cancel':
                socket.emit('rematch-cancel', action.payload);
                break;
        } 
     
        return result;
    }
}

export default function(store) {
    if (process.env.NODE_ENV === "production") {
        socket = io.connect(production);
    } else if (process.env.NODE_ENV === "staging") {
        socket = io.connect(staging);
    } else {
        socket = io.connect(local);
    }

    socket.on('connected-user', data => {
        store.dispatch({type: 'connected-user'});
    });
    
    socket.on('draw-request', data => {
        let notif = {
            title: 'Your opponent has offered a draw',
            position: 'tc',
            autoDismiss: 6,
            action: {
                label: 'Accept',
                callback: () => {
                    socket.emit('accept-draw', {
                        roomName: data.thread
                    });
                }
            }
        };
        store.dispatch(Notifications.info(notif));
    });
    
    socket.on('new-challenge', data => {
        let notif = {
            title: `You have been invited to ${data.roomName} by ${data.opponent}`,
            position: 'tc',
            autoDismiss: 15,
            action: {
                label: 'Accept',
                callback: () => {
                    socket.emit('join-room', {
                        room: {
                            name: data.roomName
                        }
                    });
                }
            }
        };
        store.dispatch(Notifications.info(notif));
    });
    
    //a list of all the rooms has been sent by the server
    socket.on('all-rooms', data => {
        store.dispatch({type: 'all-rooms', payload: data}); 
    });
    
    //User has successfully joined a room
    socket.on('update-room-full', data => {
        store.dispatch({type: 'update-room-full', payload: data}); 
    });
    
    socket.on('sit-down-w', data => {
        store.dispatch({type: 'sit-down-w', payload: data});
    });
    
    socket.on('sit-down-b', data => {
        store.dispatch({type: 'sit-down-b', payload: data});
    });
    
    socket.on('sit-down-g', data => {
        store.dispatch({type: 'sit-down-g', payload: data});
    });
    
    socket.on('sit-down-r', data => {
        store.dispatch({type: 'sit-down-r', payload: data});
    });
    
    socket.on('left-room', data => {
        store.dispatch({type: 'left-room', payload: data});
    });
    
    socket.on('user-room-left', data => {
        store.dispatch({type: 'user-room-left', payload: data});
    });
    
    socket.on('user-room-joined', data => {
        store.dispatch({type: 'user-room-joined', payload: data});
    });
    
    socket.on('disconnect', data => {
        store.dispatch({type: 'disconnect'});
    });
    
    socket.on('reconnect', data => {
        store.dispatch({type: 'reconnect'});
    });
    
    socket.on('pause', data => {
        store.dispatch({type: 'pause', payload: data});
    });
    
    socket.on('game-started', data => {
       store.dispatch({type: 'game-started', payload: data});
    });
    
    socket.on('four-game-started', data => {
       store.dispatch({type: 'four-game-started', payload: data});
    });
    
    socket.on('new-move', data => {
        store.dispatch({type: 'new-move', payload: data});
    });
    
    socket.on('four-new-move', data => {
        store.dispatch({type: 'four-new-move', payload: data});
    });
    
    socket.on('update-user', data => {
        store.dispatch({type: 'update-user', payload: data}); 
    });
    
    socket.on('action', data => {
        store.dispatch(data);
    });
    
    socket.on('duplicate-login', data => {
        store.dispatch({type: 'duplicate-login'})
    });
    
    socket.on('in-queue', data => {
        store.dispatch({type: 'in-queue', payload: data}); 
    });
    
    socket.on('stopped-pairing', data => {
        store.dispatch({type: 'stopped-pairing'}); 
    });
    
    socket.on('matchmaking-complete', data => {
        store.dispatch({type: 'SELECTED_ROOM', payload: data});
        store.dispatch({type: 'stopped-pairing'}); 
    });
}

// let socketIoMiddleware = createSocketIoMiddleware(socket, ['server/']);

// export default socketIoMiddleware;
