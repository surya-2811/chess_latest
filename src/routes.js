import React from 'react';
import {Route, IndexRoute} from 'react-router';

import App from './containers/app';
import Login from './components/auth/login';
import Live from './containers/live';
import Profile from './containers/user/profile';
import RequireAuth from './components/auth/require_auth';
import Leaderboard from './containers/user/leaderboard';
import TosPrivacy from './components/terms_of_service_privacy';
import PlayerList from './containers/user/player_list';

export default (
    <Route path="/" component={App} >
        <IndexRoute to="/" component={Login} />
        <Route path="/live" component={RequireAuth(Live)} />
        <Route path="/profile/:id" component={Profile}  />
        <Route path="/leaderboard" component={Leaderboard} />
        <Route path="/tosandprivacy" component={TosPrivacy} />
        <Route path="/players" component={PlayerList} />
    </Route>
);
