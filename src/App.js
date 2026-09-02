import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import CssBaseline from '@mui/material/CssBaseline';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import './App.css';
import PFVisualizer from './PFVisualizer';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#5b8cff' },
    background: { default: '#0f1420', paper: '#161c2b' },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className='App'>
        <PFVisualizer></PFVisualizer>
      </div>
    </ThemeProvider>
  );
}

export default App;
