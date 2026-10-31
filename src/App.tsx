import { useEffect, useState } from 'react';
import { Editor } from './components/Editor';
import { Output } from './components/Output';

type Route = 'editor' | 'output';

function getRoute(): Route {
  return window.location.hash.replace(/^#\/?/, '') === 'output'
    ? 'output'
    : 'editor';
}

export default function App() {
  const [route, setRoute] = useState<Route>(getRoute);

  useEffect(() => {
    const onHashChange = () => setRoute(getRoute());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  return route === 'output' ? <Output /> : <Editor />;
}
