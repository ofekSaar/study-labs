import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import SyllabusNavigator from './ai_syllabus_navigator';

ReactDOM.render(
  <BrowserRouter>
    <Switch>
      <Route path="/" component={SyllabusNavigator} />
    </Switch>
  </BrowserRouter>,
  document.getElementById('root')
);