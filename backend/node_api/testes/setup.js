import dotenv from 'dotenv';


dotenv.config({ path: '.env.test' });


const originalConsoleError = console.error;
console.error = (...args) => {
  if (args[0]?.includes?.('Warning: ReactDOM.render is no longer supported')) {
    return;
  }
  originalConsoleError(...args);
};