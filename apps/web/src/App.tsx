import { Box, Container, Typography } from '@mui/material';

function App() {
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 6 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          AMA-MIDI
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Enterprise MIDI Editor &amp; Collaboration Suite
        </Typography>
      </Box>
    </Container>
  );
}

export default App;
