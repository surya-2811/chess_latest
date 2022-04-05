import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import MessageListItem from './message_list_item';
import {mapObject} from '../../utils'
import {ListGroup} from 'react-bootstrap';

export default class MessageList extends Component {

    constructor(props) {
        super(props);
    }

    scrollToBottom() {
        this.refs.msgList.scrollTop = 99999;
    }
    
    componentDidUpdate(prevProps) {
        function lastMessageTime(props) {
            return (new Date(_.last(props.messages).time)).getTime();
        }
        if (prevProps.messages.length !== this.props.messages.length ||
            prevProps.thread != this.props.thread ||
            lastMessageTime(prevProps) !== lastMessageTime(this.props)) {
            this.scrollToBottom();
        }
    }
    
    componentDidMount() {
        this.scrollToBottom();
    }

    renderChatListItem(index, message) {
        return (
            <MessageListItem
                key={index}
                text={message.msg}
                user={message.user}
                picture={message.picture}
                uid={message.playerId}
                event_type={message.event_type}
                time={message.time}
                anonymous={message.anonymous}
            />
        );
    }

    render() {
        const { messages } = this.props;

        return (
            <div ref="msgList" className="chatbox-message-list">
                <ListGroup>
                    {mapObject(messages, this.renderChatListItem)}
                </ListGroup>
            </div>
        );
    }
}
