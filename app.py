import React from 'react';
import ReactDOM from 'react-dom';

function App() {
  return (
    <div>
      <h1>Mastery Badges</h1>
      <ul>
        {masteryBadges.map((badge, index) => (
          <li key={index}>
            <img src={badge.image_url} alt={badge.name} />
            <p>{badge.name}</p>
            <p>{badge.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MasteryBadges() {
  const [masteryBadges, setMasteryBadges] = React.useState([]);

  React.useEffect(() => {
    fetch('/api/mastery-badges/')
      .then(response => response.json())
      .then(data => setMasteryBadges(data));
  }, []);

  return (
    <div>
      {masteryBadges.map((badge, index) => (
        <Badge key={index} badge={badge} />
      ))}
    </div>
  );
}

function Badge({ badge }) {
  return (
    <div>
      <img src={badge.image_url} alt={badge.name} />
      <p>{badge.name}</p>
      <p>{badge.description}</p>
    </div>
  );
}

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);